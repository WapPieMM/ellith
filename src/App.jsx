import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Instagram, Facebook, MessageCircle, Plus, Trash2, Pencil, LogOut, ImagePlus, ExternalLink, Music2, Volume2, VolumeX, Sparkles, Heart, X, Save, Upload, Eye, EyeOff } from 'lucide-react';

const defaultFrameUrl = '/assets/aistudio/IMG_0355_f5a957cf.png';
const defaultMusicUrl = '/assets/aistudio/dreamy_lullaby.mp3';
const defaultMusicCoverUrl = '/assets/aistudio/vinyl_label_art.png';
const defaultMusicTitle = 'love.';
const defaultMusicArtist = 'wave to earth';
const starter = {
  name: 'ellith', tagline: 'a little place of magic', bio: 'welcome to my little corner ♡', theme: 'pink',
  avatar_url: '', frame_url: defaultFrameUrl, background_url: '', music_url: defaultMusicUrl,
  music_cover_url: defaultMusicCoverUrl, music_title: defaultMusicTitle, music_artist: defaultMusicArtist
};
const demoLinks = [
  { id: 'demo-ig', label: 'Instagram', url: 'https://instagram.com/', icon: 'instagram', note: 'follow my little world' },
  { id: 'demo-fb', label: 'Facebook', url: 'https://facebook.com/', icon: 'facebook', note: 'let’s keep in touch' },
  { id: 'demo-dc', label: 'Discord', url: 'https://discord.com/', icon: 'discord', note: 'come say hello' }
];
const iconFor = (name) => name === 'Instagram' ? <Instagram /> : name === 'Facebook' ? <Facebook /> : <MessageCircle />;
const emptyLink = { label: '', url: '', icon: 'link', note: '' };
const defaultCustomColors = { background: '#fff8fb', accent: '#d69bb5', text: '#705563' };
const readTheme = (value) => {
  if (typeof value === 'string' && value.startsWith('custom|')) {
    const [, background, accent, text] = value.split('|');
    return { background: /^#[0-9a-f]{6}$/i.test(background) ? background : defaultCustomColors.background, accent: /^#[0-9a-f]{6}$/i.test(accent) ? accent : defaultCustomColors.accent, text: /^#[0-9a-f]{6}$/i.test(text) ? text : defaultCustomColors.text };
  }
  return defaultCustomColors;
};
const writeTheme = (colors) => `custom|${colors.background}|${colors.accent}|${colors.text}`;
const fileLabelFor = (url, fallbackText) => {
  if (!url) return fallbackText;
  if (typeof url === 'string' && url.startsWith('data:')) return 'อัปโหลดรูปภาพแล้ว ♡';
  try {
    const clean = decodeURIComponent(url.split('#')[0].split('?')[0]);
    const name = clean.split('/').pop();
    return name || 'อัปโหลดไฟล์แล้ว';
  } catch {
    return 'อัปโหลดไฟล์แล้ว';
  }
};

const packMusicField = (s) => {
  const base = String(s.music_url || defaultMusicUrl).split('#ellith_meta=')[0];
  const meta = {
    t: s.music_title ?? defaultMusicTitle,
    a: s.music_artist ?? defaultMusicArtist,
    c: s.music_cover_url && !String(s.music_cover_url).startsWith('blob:') ? s.music_cover_url : defaultMusicCoverUrl
  };
  return `${base}#ellith_meta=${encodeURIComponent(JSON.stringify(meta))}`;
};

const unpackMusicField = (rawUrl, fallbackSite = {}) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      music_url: defaultMusicUrl,
      music_title: fallbackSite.music_title ?? defaultMusicTitle,
      music_artist: fallbackSite.music_artist ?? defaultMusicArtist,
      music_cover_url: fallbackSite.music_cover_url || defaultMusicCoverUrl
    };
  }
  const [base, hashPart] = rawUrl.split('#ellith_meta=');
  if (!hashPart) {
    return {
      music_url: base || defaultMusicUrl,
      music_title: fallbackSite.music_title ?? defaultMusicTitle,
      music_artist: fallbackSite.music_artist ?? defaultMusicArtist,
      music_cover_url: fallbackSite.music_cover_url || defaultMusicCoverUrl
    };
  }
  try {
    const parsed = JSON.parse(decodeURIComponent(hashPart));
    return {
      music_url: base || defaultMusicUrl,
      music_title: parsed.t ?? fallbackSite.music_title ?? defaultMusicTitle,
      music_artist: parsed.a ?? fallbackSite.music_artist ?? defaultMusicArtist,
      music_cover_url: parsed.c || fallbackSite.music_cover_url || defaultMusicCoverUrl
    };
  } catch {
    return {
      music_url: base || defaultMusicUrl,
      music_title: fallbackSite.music_title ?? defaultMusicTitle,
      music_artist: fallbackSite.music_artist ?? defaultMusicArtist,
      music_cover_url: fallbackSite.music_cover_url || defaultMusicCoverUrl
    };
  }
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : URL.createObjectURL(file));
    reader.onerror = () => resolve(URL.createObjectURL(file));
    reader.readAsDataURL(file);
  });

const loadLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const saveLocal = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore storage quota errors
  }
};

const linkPresets = [
  { label: 'Instagram', url: 'https://instagram.com/', note: 'follow my little world' },
  { label: 'Facebook', url: 'https://facebook.com/', note: 'let’s keep in touch' },
  { label: 'Discord', url: 'https://discord.gg/', note: 'come say hello' },
  { label: 'TikTok', url: 'https://tiktok.com/@', note: 'watch my little moments' },
  { label: 'Line', url: 'https://line.me/ti/p/', note: 'chat with me' },
  { label: 'YouTube', url: 'https://youtube.com/@', note: 'my dreamy vlog' },
];

const themeOptions = [
  { id: 'pink', name: 'Pink & White', desc: 'ชมพูพาสเทลละมุนคลาสสิก', swatches: ['#fff8fb', '#f6dce8', '#986d80'] },
  { id: 'lavender', name: 'Lavender Dream', desc: 'ม่วงลาเวนเดอร์ชวนฝัน', swatches: ['#fbf8ff', '#eadff8', '#8c6f9a'] },
  { id: 'cream', name: 'Soft Rose Cream', desc: 'ครีมกุหลาบนุ่มนวลอบอุ่น', swatches: ['#fffaf7', '#f7e1ea', '#9c6d83'] },
  { id: 'custom', name: 'กำหนดสีเอง', desc: 'ปรับแต่งโทนสีพื้นหลังและสีหลักอิสระ', swatches: ['#fff0f6', '#d69bb5', '#705563'] },
];

export default function App() {
  const [page, setPage] = useState(location.hash === '#admin' ? 'admin' : 'home');
  const [site, setSite] = useState(() => {
    const saved = loadLocal('ellith_site_v1', starter);
    const cleanUrl = (u, fallback) => (typeof u === 'string' && u.startsWith('blob:') ? fallback : (u || fallback));
    const unpacked = unpackMusicField(saved.music_url, saved);
    return {
      ...starter,
      ...saved,
      avatar_url: cleanUrl(saved.avatar_url, ''),
      frame_url: cleanUrl(saved.frame_url, defaultFrameUrl),
      background_url: cleanUrl(saved.background_url, ''),
      music_url: cleanUrl(unpacked.music_url, defaultMusicUrl),
      music_cover_url: cleanUrl(saved.music_cover_url || unpacked.music_cover_url, defaultMusicCoverUrl),
      music_title: saved.music_title ?? unpacked.music_title ?? defaultMusicTitle,
      music_artist: saved.music_artist ?? unpacked.music_artist ?? defaultMusicArtist
    };
  });
  const [links, setLinks] = useState(() => loadLocal('ellith_links_v1', demoLinks));
  const [assets, setAssets] = useState(() => loadLocal('ellith_assets_v1', []).filter(a => !String(a?.url || '').startsWith('blob:')));
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [localStudioMode, setLocalStudioMode] = useState(!isSupabaseConfigured);
  const [assetFilter, setAssetFilter] = useState('all');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('general');
  const [editing, setEditing] = useState(null);
  const [linkForm, setLinkForm] = useState(emptyLink);
  const [notice, setNotice] = useState('');
  const [musicOn, setMusicOn] = useState(false);
  const [volume, setVolume] = useState(0.18);
  const [musicProgress, setMusicProgress] = useState(38);
  const [musicTime, setMusicTime] = useState('1:38');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bottomSlideIndex, setBottomSlideIndex] = useState(0);
  const [stampIndex, setStampIndex] = useState(0);
  const [preloaderProgress, setPreloaderProgress] = useState(0);
  const [preloaderFading, setPreloaderFading] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const audioRef = useRef(null);
  const userPausedRef = useRef(false);

  useEffect(() => {
    const duration = 2500;
    const start = performance.now();
    let rafId = 0;
    let fadeTimer = 0;
    let doneTimer = 0;

    const tick = (now) => {
      const elapsed = Math.max(0, now - start);
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 2.4);
      const nextPct = Math.min(100, Math.round(eased * 100));
      setPreloaderProgress(nextPct);
      if (t < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setPreloaderProgress(100);
        fadeTimer = window.setTimeout(() => {
          setPreloaderFading(true);
          doneTimer = window.setTimeout(() => {
            setPreloaderDone(true);
          }, 560);
        }, 180);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  const showToast = (msg) => {
    setNotice(msg);
    window.clearTimeout(window.__ellithNoticeTimer);
    window.__ellithNoticeTimer = window.setTimeout(() => setNotice(''), 3400);
  };

  const bottomSlides = [
    { type: 'text', text: '♡ thank you for visiting ♡' },
    { type: 'gif', src: '/assets/aistudio/coquette_ribbon.gif', alt: 'Coquette ribbon & pearl heart', caption: '୨୧ sweet dreams ୨୧' },
    { type: 'text', text: '♡ thank you for visiting ♡' },
    { type: 'gif', src: '/assets/aistudio/dreamy_wings.gif', alt: 'Dreamy angel wings heart', caption: '✧ stay magical ✧' },
    { type: 'text', text: '♡ thank you for visiting ♡' },
    { type: 'gif', src: '/assets/aistudio/coquette_bunny.gif', alt: 'Coquette bunny & floating hearts', caption: '♡ see you again ♡' },
  ];

  const coquetteStamps = [
    { id: 'cameo', label: 'cameo locket', code: '01', style: 'postage' },
    { id: 'strawberry', label: 'berry sweet', code: '02', style: 'sticker' },
    { id: 'swan', label: 'swan wax seal', code: '03', style: 'seal' },
    { id: 'letter', label: 'love letter', code: '04', style: 'postage' },
    { id: 'key', label: 'angel key', code: '05', style: 'sticker' },
    { id: 'ballet', label: 'satin ballet', code: '06', style: 'postage' },
  ];

  const cycleStamp = (event) => {
    if (event) event.stopPropagation();
    setStampIndex((prev) => (prev + 1) % coquetteStamps.length);
  };

  const renderStampArtwork = (id) => {
    switch (id) {
      case 'cameo':
        return (
          <svg viewBox="0 0 36 36" className="stamp-svg" aria-hidden="true">
            <rect x="4" y="4" width="28" height="28" rx="4" fill="#fff6fa" stroke="#d89eb7" strokeWidth="1.2" strokeDasharray="2 1.6" />
            <ellipse cx="18" cy="18.5" rx="8.5" ry="10.2" fill="#f7c5da" stroke="#b97894" strokeWidth="1.2" />
            <ellipse cx="18" cy="18.5" rx="6.6" ry="8.2" fill="#fff9fc" stroke="#e5b2c8" strokeWidth="0.9" />
            <path d="M18 22.8 C17.4 22.3 13.2 19.3 13.2 16.4 C13.2 14.8 14.5 13.7 16 13.7 C16.9 13.7 17.6 14.2 18 14.9 C18.4 14.2 19.1 13.7 20 13.7 C21.5 13.7 22.8 14.8 22.8 16.4 C22.8 19.3 18.6 22.3 18 22.8 Z" fill="#f2a7c5" stroke="#b97894" strokeWidth="1" />
            <path d="M14.5 8.5 C12 6, 9.5 7, 10.5 9.5 C11.2 11, 13.5 10.5 15.2 9.5 Z M21.5 8.5 C24 6, 26.5 7, 25.5 9.5 C24.8 11, 22.5 10.5 20.8 9.5 Z" fill="#f5b3ce" stroke="#b97894" strokeWidth="1" />
            <circle cx="18" cy="9" r="1.5" fill="#fff" stroke="#b97894" strokeWidth="1" />
          </svg>
        );
      case 'strawberry':
        return (
          <svg viewBox="0 0 36 36" className="stamp-svg" aria-hidden="true">
            <circle cx="18" cy="18" r="14" fill="#fff7fa" stroke="#e4b0c7" strokeWidth="1.3" />
            <path d="M18 28.5 C12.5 28.5 9.8 21.5 11.2 15.5 C12.2 11.8 15 11 18 11 C21 11 23.8 11.8 24.8 15.5 C26.2 21.5 23.5 28.5 18 28.5 Z" fill="#f7a8c4" stroke="#b86f8c" strokeWidth="1.2" />
            <path d="M14 11.2 C14.5 8.5 16.5 8.5 18 10.8 C19.5 8.5 21.5 8.5 22 11.2" fill="none" stroke="#b86f8c" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M15.2 12 C12.5 9.8 10.5 11 11.5 13.2 C12.5 14.8 14.5 14 16.2 12.8 Z M20.8 12 C23.5 9.8 25.5 11 24.5 13.2 C23.5 14.8 21.5 14 19.8 12.8 Z" fill="#fce0ec" stroke="#b86f8c" strokeWidth="1" />
            <circle cx="15.5" cy="17.5" r="0.9" fill="#fff7fa" />
            <circle cx="20.5" cy="17.5" r="0.9" fill="#fff7fa" />
            <circle cx="18" cy="21" r="0.9" fill="#fff7fa" />
            <circle cx="15.2" cy="23.5" r="0.8" fill="#fff7fa" />
            <circle cx="20.8" cy="23.5" r="0.8" fill="#fff7fa" />
          </svg>
        );
      case 'swan':
        return (
          <svg viewBox="0 0 36 36" className="stamp-svg" aria-hidden="true">
            <circle cx="18" cy="18" r="14.2" fill="#f7bfd6" stroke="#b97591" strokeWidth="1.2" strokeDasharray="3 1.4" />
            <circle cx="18" cy="18" r="11.2" fill="#fdebf3" stroke="#d596b0" strokeWidth="1" />
            <path d="M15.5 14 C15.5 11.2 18.8 10.8 18.8 13.2 C18.8 15 16.5 16.8 16.5 18.8 L23.5 18.8 C24.2 22.5 21.2 24.8 16.8 24.8 C13.2 24.8 11.2 22.8 11.8 20 C12.5 19.2 14.5 19 16.2 19" fill="#fff" stroke="#b5708d" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16.4 10.6 L17.3 8.8 L18.2 10.4 L19.2 8.8 L19.8 10.6 Z" fill="#f7c873" stroke="#b5708d" strokeWidth="0.8" strokeLinejoin="round" />
            <path d="M14.2 13.4 L12.8 14 L14.3 14.4 Z" fill="#f29bb8" stroke="#b5708d" strokeWidth="0.8" />
          </svg>
        );
      case 'letter':
        return (
          <svg viewBox="0 0 36 36" className="stamp-svg" aria-hidden="true">
            <rect x="4" y="5" width="28" height="26" rx="3.5" fill="#fff8fb" stroke="#d89eb7" strokeWidth="1.2" strokeDasharray="2.2 1.5" />
            <rect x="7.5" y="10.5" width="21" height="15" rx="2" fill="#fde6f0" stroke="#b97894" strokeWidth="1.2" />
            <path d="M8 11.2 L18 19.2 L28 11.2" fill="#fff5f9" stroke="#b97894" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M18 21.4 C17.5 21 14.5 18.7 14.5 16.6 C14.5 15.4 15.5 14.5 16.6 14.5 C17.3 14.5 17.8 14.9 18 15.4 C18.2 14.9 18.7 14.5 19.4 14.5 C20.5 14.5 21.5 15.4 21.5 16.6 C21.5 18.7 18.5 21 18 21.4 Z" fill="#f09ab9" stroke="#b36b88" strokeWidth="1" />
          </svg>
        );
      case 'key':
        return (
          <svg viewBox="0 0 36 36" className="stamp-svg" aria-hidden="true">
            <circle cx="18" cy="18" r="14" fill="#fff7fa" stroke="#e4b0c7" strokeWidth="1.2" />
            <path d="M14 15 C10 12.5 8 14 9.5 16.8 C10.8 18.6 13 18 14.8 16.8 Z M22 15 C26 12.5 28 14 26.5 16.8 C25.2 18.6 23 18 21.2 16.8 Z" fill="#fff" stroke="#c3849f" strokeWidth="1.1" />
            <path d="M18 17.5 C17.5 17.1 13.8 14.4 13.8 11.9 C13.8 10.4 15 9.4 16.4 9.4 C17.2 9.4 17.7 9.8 18 10.4 C18.3 9.8 18.8 9.4 19.6 9.4 C21 9.4 22.2 10.4 22.2 11.9 C22.2 14.4 18.5 17.1 18 17.5 Z" fill="#f7b2cc" stroke="#b6708d" strokeWidth="1.2" />
            <path d="M18 17.5 L18 27.5 M18 23.5 L21.5 23.5 M18 26.2 L22.2 26.2" stroke="#b6708d" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );
      case 'ballet':
      default:
        return (
          <svg viewBox="0 0 36 36" className="stamp-svg" aria-hidden="true">
            <rect x="4" y="4" width="28" height="28" rx="4" fill="#fff6fa" stroke="#d89eb7" strokeWidth="1.2" strokeDasharray="2 1.6" />
            <path d="M13 9.5 L21 18 M23 9.5 L15 18" stroke="#d692ae" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M12.5 17.5 C11 21 11.2 25.5 14.2 26.5 C16.8 27.2 17.8 24 16.8 19.5 Z" fill="#f9bed5" stroke="#b6708d" strokeWidth="1.15" strokeLinejoin="round" />
            <path d="M23.5 17.5 C25 21 24.8 25.5 21.8 26.5 C19.2 27.2 18.2 24 19.2 19.5 Z" fill="#f9bed5" stroke="#b6708d" strokeWidth="1.15" strokeLinejoin="round" />
            <circle cx="18" cy="11.5" r="1.6" fill="#fff" stroke="#b6708d" strokeWidth="1" />
          </svg>
        );
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBottomSlideIndex((prev) => (prev + 1) % 6);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  // Strong, visible sparkle burst for mouse clicks and touchscreen taps.
  useEffect(() => {
    const symbols = ['♡', '✧', '୨୧', '✦', '♥', '✿', '♡', '✧'];
    const onClick = (event) => {
      const x = event.clientX ?? (event.changedTouches?.[0]?.clientX);
      const y = event.clientY ?? (event.changedTouches?.[0]?.clientY);
      if (typeof x !== 'number' || typeof y !== 'number') return;
      const burst = document.createElement('span');
      burst.className = 'tap-burst';
      burst.setAttribute('aria-hidden', 'true');
      burst.style.left = x + 'px';
      burst.style.top = y + 'px';
      symbols.forEach((symbol, index) => {
        const particle = document.createElement('i');
        const angle = (Math.PI * 2 * index) / symbols.length;
        const distance = index % 2 ? 58 : 76;
        particle.textContent = symbol;
        particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
        particle.style.setProperty('--delay', (index * 22) + 'ms');
        burst.appendChild(particle);
      });
      document.body.appendChild(burst);
      window.setTimeout(() => burst.remove(), 1100);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    const onHash = () => setPage(location.hash === '#admin' ? 'admin' : 'home');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function refresh() {
    if (!supabase) { setLoading(false); return; }
    const [siteRes, linksRes, assetsRes] = await Promise.all([
      supabase.from('site_content').select('*').eq('id', 1).maybeSingle(),
      supabase.from('contact_links').select('*').order('sort_order'),
      supabase.from('media_assets').select('*').order('created_at', { ascending: false })
    ]);
    if (siteRes.data) {
      const localSaved = loadLocal('ellith_site_v1', starter);
      const unpacked = unpackMusicField(siteRes.data.music_url, localSaved);
      const merged = {
        ...starter,
        ...siteRes.data,
        frame_url: siteRes.data.frame_url || defaultFrameUrl,
        music_url: unpacked.music_url || defaultMusicUrl,
        music_cover_url: unpacked.music_cover_url || localSaved.music_cover_url || defaultMusicCoverUrl,
        music_title: unpacked.music_title ?? localSaved.music_title ?? defaultMusicTitle,
        music_artist: unpacked.music_artist ?? localSaved.music_artist ?? defaultMusicArtist
      };
      setSite(merged);
      saveLocal('ellith_site_v1', merged);
    }
    if (linksRes.data?.length) setLinks(linksRes.data);
    else if (!linksRes.error) setLinks([]);
    if (assetsRes.data) setAssets(assetsRes.data);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, [session]);

  useEffect(() => {
    saveLocal('ellith_site_v1', site);
  }, [site]);

  const configured = isSupabaseConfigured;
  const publicLinks = useMemo(() => links.filter(link => link.is_active !== false), [links]);
  const customColors = readTheme(site.theme);
  const isCustomTheme = typeof site.theme === 'string' && site.theme.startsWith('custom|');
  const updateCustomColor = (key, value) => setSite(current => ({ ...current, theme: writeTheme({ ...readTheme(current.theme), [key]: value }) }));
  const activeMusicSrc = String(site.music_url || defaultMusicUrl).split('#')[0];

  const buildSitePayload = (nextSite) => ({
    id: 1,
    name: nextSite.name,
    tagline: nextSite.tagline,
    bio: nextSite.bio,
    theme: nextSite.theme,
    avatar_url: nextSite.avatar_url,
    frame_url: nextSite.frame_url,
    background_url: nextSite.background_url,
    music_url: packMusicField(nextSite),
    updated_at: new Date().toISOString()
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;

    const tryAutoPlay = () => {
      if (userPausedRef.current || !audio.paused) return;
      audio.volume = volume;
      audio.play().then(() => {
        setMusicOn(true);
      }).catch(() => {});
    };

    tryAutoPlay();

    const onFirstInteraction = (e) => {
      if (userPausedRef.current) return;
      if (e.target?.closest?.('.music-control') || e.target?.closest?.('.preview-mp3-mini')) return;
      if (audio.paused) {
        audio.volume = volume;
        audio.play().then(() => {
          setMusicOn(true);
        }).catch(() => {
          if (audio.src !== location.origin + defaultMusicUrl) {
            audio.src = defaultMusicUrl;
            audio.play().then(() => setMusicOn(true)).catch(() => {});
          }
        });
      }
    };

    const events = ['click', 'touchend', 'mousedown', 'pointerdown', 'keydown'];
    events.forEach(evt => document.addEventListener(evt, onFirstInteraction, { capture: true, passive: true }));
    return () => {
      events.forEach(evt => document.removeEventListener(evt, onFirstInteraction, { capture: true }));
    };
  }, [activeMusicSrc, volume]);

  function adjustVolume(delta, e) {
    e?.stopPropagation();
    const audio = audioRef.current;
    const next = Math.round(Math.min(1, Math.max(0, volume + delta)) * 100) / 100;
    setVolume(next);
    if (audio) {
      audio.volume = next;
      if (next > 0 && audio.paused && !userPausedRef.current) {
        audio.play().then(() => setMusicOn(true)).catch(() => {});
      }
    }
  }

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicOn && !audio.paused) {
      userPausedRef.current = true;
      audio.pause();
      setMusicOn(false);
      return;
    }
    userPausedRef.current = false;
    try {
      audio.volume = volume;
      await audio.play();
      setMusicOn(true);
    } catch {
      if (audio.src !== location.origin + defaultMusicUrl) {
        audio.src = defaultMusicUrl;
        try {
          await audio.play();
          setMusicOn(true);
          return;
        } catch {
          // ignore
        }
      }
      setMusicOn(false);
      setNotice('ไม่สามารถเล่นเพลงได้ กรุณาลองกดอีกครั้ง');
    }
  }

  async function login(e) {
    e.preventDefault(); setLoginError('');
    if (!supabase) {
      setLoginError('ระบบเข้าสู่ระบบยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลเว็บไซต์');
      return;
    }
    const email = username.trim();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
  }
  async function logout() {
    await supabase?.auth.signOut();
    setLocalStudioMode(false);
    setPage('home');
    location.hash = '';
  }

  async function saveSite(e) {
    e?.preventDefault();
    setSaving(true);
    saveLocal('ellith_site_v1', site);
    if (!supabase || !session) {
      setSaving(false);
      showToast('บันทึกข้อมูลเว็บไซต์เรียบร้อยแล้ว หน้าเว็บอัปเดตทันที ♡');
      return;
    }
    const payload = buildSitePayload(site);
    const { error } = await supabase.from('site_content').upsert(payload);
    setSaving(false);
    showToast(error ? error.message : 'บันทึกข้อมูลเว็บไซต์เรียบร้อยแล้ว ♡');
  }

  async function saveLink(e) {
    e.preventDefault();
    const payload = {
      label: linkForm.label.trim(),
      url: linkForm.url.trim(),
      icon: linkForm.icon || 'link',
      note: linkForm.note || '',
      sort_order: editing?.sort_order ?? links.length,
      is_active: editing ? editing.is_active !== false : true
    };
    if (!supabase || !session) {
      const nextLinks = editing
        ? links.map(item => (item.id === editing.id ? { ...item, ...payload } : item))
        : [...links, { ...payload, id: 'local-' + Date.now() }];
      setLinks(nextLinks);
      saveLocal('ellith_links_v1', nextLinks);
      setEditing(null);
      setLinkForm(emptyLink);
      showToast(editing ? 'อัปเดตช่องทางติดต่อเรียบร้อยแล้ว ♡' : 'เพิ่มช่องทางติดต่อใหม่แล้ว ♡');
      return;
    }
    const result = editing ? await supabase.from('contact_links').update(payload).eq('id', editing.id) : await supabase.from('contact_links').insert(payload);
    if (result.error) { showToast(result.error.message); return; }
    setEditing(null); setLinkForm(emptyLink); await refresh(); showToast('บันทึกช่องทางติดต่อแล้ว ♡');
  }

  async function deleteLink(id) {
    if (!supabase || !session) {
      const nextLinks = links.filter(item => item.id !== id);
      setLinks(nextLinks);
      saveLocal('ellith_links_v1', nextLinks);
      if (editing?.id === id) { setEditing(null); setLinkForm(emptyLink); }
      showToast('ลบช่องทางติดต่อเรียบร้อยแล้ว');
      return;
    }
    const { error } = await supabase.from('contact_links').delete().eq('id', id);
    if (error) showToast(error.message); else { await refresh(); showToast('ลบช่องทางแล้ว'); }
  }

  async function toggleLinkActive(link) {
    const nextActive = link.is_active === false;
    const nextLinks = links.map(item => (item.id === link.id ? { ...item, is_active: nextActive } : item));
    setLinks(nextLinks);
    saveLocal('ellith_links_v1', nextLinks);
    if (supabase && session) {
      await supabase.from('contact_links').update({ is_active: nextActive }).eq('id', link.id);
    }
    showToast(nextActive ? `แสดงช่องทาง ${link.label} บนหน้าเว็บแล้ว ♡` : `ซ่อนช่องทาง ${link.label} ชั่วคราวแล้ว`);
  }

  async function moveLink(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= links.length) return;
    const nextLinks = [...links];
    const [moved] = nextLinks.splice(index, 1);
    nextLinks.splice(targetIndex, 0, moved);
    const reordered = nextLinks.map((item, idx) => ({ ...item, sort_order: idx }));
    setLinks(reordered);
    saveLocal('ellith_links_v1', reordered);
    if (supabase && session) {
      await Promise.all(reordered.map(item => supabase.from('contact_links').update({ sort_order: item.sort_order }).eq('id', item.id)));
    }
    showToast('จัดลำดับช่องทางติดต่อเรียบร้อยแล้ว ♡');
  }

  async function uploadImage(e, field) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('รูปภาพต้องมีขนาดไม่เกิน 10 MB');
      e.target.value = '';
      return;
    }
    if (!supabase || !session) {
      const localUrl = await readFileAsDataUrl(file);
      const nextSite = { ...site, [field]: localUrl };
      setSite(nextSite);
      saveLocal('ellith_site_v1', nextSite);
      const newAsset = { id: 'asset-' + Date.now(), name: file.name, path: localUrl, url: localUrl, kind: field };
      const nextAssets = [newAsset, ...assets];
      setAssets(nextAssets);
      saveLocal('ellith_assets_v1', nextAssets);
      showToast('อัปโหลดและเปลี่ยนรูปภาพเรียบร้อยแล้ว ♡');
      e.target.value = '';
      return;
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = 'ellith/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
    const { error: uploadError } = await supabase.storage.from('ellith-media').upload(path, file, { upsert: false });
    if (uploadError) {
      showToast('อัปโหลดรูปภาพไม่สำเร็จ: ' + uploadError.message);
      e.target.value = '';
      return;
    }

    const { data } = supabase.storage.from('ellith-media').getPublicUrl(path);
    const nextSite = { ...site, [field]: data.publicUrl };
    saveLocal('ellith_site_v1', nextSite);
    const payload = buildSitePayload(nextSite);

    const { error: saveError } = await supabase.from('site_content').upsert(payload);
    if (saveError) {
      await supabase.storage.from('ellith-media').remove([path]);
      showToast('อัปโหลดไฟล์แล้ว แต่บันทึกเว็บไซต์ไม่สำเร็จ: ' + saveError.message);
      e.target.value = '';
      return;
    }

    setSite(nextSite);
    const { error: assetError } = await supabase.from('media_assets').insert({
      name: file.name,
      path,
      url: data.publicUrl,
      kind: field
    });
    const { data: assetRows, error: assetsError } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false });
    if (assetRows) setAssets(assetRows);

    if (assetError || assetsError) {
      showToast('บันทึกรูปภาพบนเว็บไซต์แล้ว แต่มีปัญหาในการอัปเดตคลังรูปภาพ');
    } else {
      showToast('อัปโหลดและบันทึกรูปภาพเรียบร้อยแล้ว หน้าเว็บไซต์จะแสดงรูปใหม่นี้ทันที ♡');
    }
    e.target.value = '';
  }

  async function clearUploadedField(field) {
    const fallbackValue =
      field === 'frame_url'
        ? defaultFrameUrl
        : field === 'music_url'
        ? defaultMusicUrl
        : field === 'music_cover_url'
        ? defaultMusicCoverUrl
        : '';
    const nextSite = { ...site, [field]: fallbackValue };
    setSite(nextSite);
    saveLocal('ellith_site_v1', nextSite);
    if (!supabase || !session) {
      showToast('รีเซ็ตไฟล์กลับเป็นค่าเริ่มต้นเรียบร้อยแล้ว ♡');
      return;
    }
    const payload = buildSitePayload(nextSite);
    await supabase.from('site_content').upsert(payload);
    showToast('รีเซ็ตไฟล์เรียบร้อยแล้ว ♡');
  }

  async function applyAsset(asset, field) {
    if (!['avatar_url', 'frame_url', 'background_url', 'music_cover_url', 'music_url'].includes(field)) return;
    const nextSite = { ...site, [field]: asset.url };
    setSite(nextSite);
    saveLocal('ellith_site_v1', nextSite);
    if (!supabase || !session) {
      showToast('นำไฟล์ไปใช้บนเว็บไซต์เรียบร้อยแล้ว ♡');
      return;
    }
    const payload = buildSitePayload(nextSite);
    const { error } = await supabase.from('site_content').upsert(payload);
    if (error) {
      showToast('นำไฟล์ไปใช้ไม่สำเร็จ: ' + error.message);
      return;
    }
    showToast('นำไฟล์ไปใช้บนเว็บไซต์เรียบร้อยแล้ว ♡');
  }

  async function uploadMusic(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    const isAudio = file.type.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].some(ext => lowerName.endsWith(ext));
    if (!isAudio) {
      showToast('กรุณาเลือกไฟล์เพลง (เช่น MP3) เท่านั้น');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('ไฟล์เพลงต้องมีขนาดไม่เกิน 10 MB');
      e.target.value = '';
      return;
    }
    if (!supabase || !session) {
      const localUrl = URL.createObjectURL(file);
      const nextSite = { ...site, music_url: localUrl };
      setSite(nextSite);
      saveLocal('ellith_site_v1', nextSite);
      const newAsset = { id: 'asset-' + Date.now(), name: file.name, path: localUrl, url: localUrl, kind: 'music' };
      const nextAssets = [newAsset, ...assets];
      setAssets(nextAssets);
      saveLocal('ellith_assets_v1', nextAssets);
      showToast('อัปโหลดไฟล์เพลงสำเร็จ พร้อมเล่นทันที ♡');
      e.target.value = '';
      return;
    }

    const ext = (file.name.split('.').pop() || 'mp3').toLowerCase();
    const path = 'ellith/music-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
    const { error } = await supabase.storage.from('ellith-media').upload(path, file, {
      upsert: false,
      contentType: file.type || 'audio/mpeg'
    });
    if (error) {
      showToast('อัปโหลดเพลงไม่สำเร็จ: ' + error.message);
      e.target.value = '';
      return;
    }
    const { data } = supabase.storage.from('ellith-media').getPublicUrl(path);
    const nextSite = { ...site, music_url: data.publicUrl };
    saveLocal('ellith_site_v1', nextSite);
    const payload = buildSitePayload(nextSite);
    const { error: saveError } = await supabase.from('site_content').upsert(payload);
    if (saveError) {
      await supabase.storage.from('ellith-media').remove([path]);
      showToast('อัปโหลดเพลงแล้ว แต่บันทึกเว็บไซต์ไม่สำเร็จ: ' + saveError.message);
      e.target.value = '';
      return;
    }

    setSite(nextSite);
    const { error: assetError } = await supabase.from('media_assets').insert({ name: file.name, path, url: data.publicUrl, kind: 'music' });
    const { data: assetRows } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false });
    if (assetRows) setAssets(assetRows);

    if (assetError) showToast('อัปโหลดและบันทึกเพลงบนเว็บไซต์แล้ว แต่บันทึกคลังไฟล์ไม่สำเร็จ: ' + assetError.message);
    else showToast('อัปโหลดและบันทึกเพลงเรียบร้อยแล้ว หน้าเว็บไซต์พร้อมเล่นเพลงใหม่ทันที ♡');
    e.target.value = '';
  }

  async function deleteAsset(asset) {
    if (!supabase || !session) {
      const nextAssets = assets.filter(item => item.id !== asset.id);
      setAssets(nextAssets);
      saveLocal('ellith_assets_v1', nextAssets);
      showToast('ลบไฟล์ออกจากคลังเรียบร้อยแล้ว');
      return;
    }
    const { error } = await supabase.storage.from('ellith-media').remove([asset.path]);
    if (error) { showToast(error.message); return; }
    await supabase.from('media_assets').delete().eq('id', asset.id);
    await refresh();
    showToast('ลบไฟล์ออกจากคลังเรียบร้อยแล้ว');
  }

  const customTrackTitle = useMemo(() => {
    const manualTitle = (site.music_title ?? '').trim();
    if (manualTitle) return manualTitle;
    if (!site.music_url || site.music_url === defaultMusicUrl) return defaultMusicTitle;
    const raw = fileLabelFor(site.music_url, defaultMusicTitle).replace(/\.[a-z0-9]+$/i, '');
    const cleaned = raw.replace(/^music-\d+-[a-z0-9]+$/i, defaultMusicTitle);
    return cleaned.slice(0, 24) || defaultMusicTitle;
  }, [site.music_title, site.music_url]);

  const customTrackArtist = useMemo(() => {
    const manualArtist = (site.music_artist ?? '').trim();
    return manualArtist || defaultMusicArtist;
  }, [site.music_artist]);

  const activeMusicCoverUrl = site.music_cover_url || defaultMusicCoverUrl;

  const filteredAssets = useMemo(() => {
    if (assetFilter === 'all') return assets;
    if (assetFilter === 'music') return assets.filter(a => a.kind === 'music');
    return assets.filter(a => a.kind !== 'music');
  }, [assets, assetFilter]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || !isFinite(audio.duration)) return;
    const pct = Math.min(96, Math.max(4, (audio.currentTime / audio.duration) * 100));
    setMusicProgress(pct);
    const sec = Math.floor(audio.currentTime);
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, '0');
    setMusicTime(`${m}:${s}`);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !audio.duration || !isFinite(audio.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    handleTimeUpdate();
  };

  const isAdminUnlocked = Boolean(session || localStudioMode);

  return <>
    <audio
      id="bg-music"
      ref={audioRef}
      src={activeMusicSrc}
      autoPlay
      loop
      preload="auto"
      onCanPlay={() => {
        const audio = audioRef.current;
        if (audio && audio.paused && !userPausedRef.current) {
          audio.volume = volume;
          audio.play().then(() => setMusicOn(true)).catch(() => {});
        }
      }}
      onPlay={() => setMusicOn(true)}
      onPause={() => setMusicOn(false)}
      onTimeUpdate={handleTimeUpdate}
      onError={(e) => {
        const audio = e.currentTarget;
        if (audio && audio.src !== location.origin + defaultMusicUrl) {
          audio.src = defaultMusicUrl;
          if (!userPausedRef.current) {
            audio.play().then(() => setMusicOn(true)).catch(() => {});
          }
        }
      }}
    />
    {!preloaderDone && page !== 'admin' && (
      <div
        className={'carousel-preloader ' + (preloaderFading ? 'is-fading ' : '') + (isCustomTheme ? 'theme-custom' : 'theme-' + (site.theme || 'pink'))}
        style={isCustomTheme ? { '--custom-bg': customColors.background, '--custom-accent': customColors.accent, '--custom-text': customColors.text } : undefined}
        onClick={() => {
          if (!preloaderFading) {
            setPreloaderProgress(100);
            setPreloaderFading(true);
            window.setTimeout(() => setPreloaderDone(true), 480);
          }
        }}
        role="status"
        aria-live="polite"
        aria-label="กำลังโหลดเข้าสู่เว็บไซต์"
      >
        <div className="screen-lace screen-lace-top" aria-hidden="true" />
        <div className="screen-lace screen-lace-bottom" aria-hidden="true" />

        <div className="carousel-preloader-inner">
          <div className="carousel-stage-wrap" aria-hidden="true">
            <div className="carousel-ambient-glow" />
            <div className="carousel-pedestal-ring" />

            <div className="carousel-stage-3d">
              <div className="carousel-rotor-3d">
                {[-10, -7, -4, -1.5, 0, 1.5, 4, 7, 10].map((z, idx) => (
                  <img
                    key={`layer-${idx}`}
                    src="/assets/aistudio/carousel_cutout.png"
                    alt=""
                    draggable="false"
                    className={
                      'carousel-layer-img ' +
                      (z === 10 ? 'is-front-face' : z === -10 ? 'is-back-face' : 'is-depth-slice')
                    }
                    style={{
                      '--slice-z': `${z}px`,
                      '--slice-scale-x': z < 0 ? -1 : 1
                    }}
                  />
                ))}

                {[
                  { angle: 0, symbol: '✧', y: '-18%' },
                  { angle: 60, symbol: '♡', y: '8%' },
                  { angle: 120, symbol: '✦', y: '-10%' },
                  { angle: 180, symbol: '୨୧', y: '14%' },
                  { angle: 240, symbol: '♡', y: '-14%' },
                  { angle: 300, symbol: '✧', y: '6%' }
                ].map((orb, idx) => (
                  <span
                    key={`orb-${idx}`}
                    className="carousel-orbit-sparkle"
                    style={{
                      '--orb-angle': `${orb.angle}deg`,
                      '--orb-y': orb.y
                    }}
                  >
                    <i>{orb.symbol}</i>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="carousel-loader-box">
            <div className="carousel-loader-header">
              <span className="carousel-loader-label">
                <i aria-hidden="true">୨୧</i> กำลังโหลด...
              </span>
              <span className="carousel-loader-pct">{preloaderProgress}%</span>
            </div>

            <div className="carousel-progress-track" aria-hidden="true">
              <div
                className="carousel-progress-fill"
                style={{ width: `${ Math.max(6, preloaderProgress) }%` }}
              >
                <span className="carousel-progress-shimmer" />
                <span className="carousel-progress-glider">♡</span>
              </div>
            </div>

            <p className="carousel-loader-sub">
              <span>✧</span> welcome to {site.name || 'ellith'}’s little world <span>✧</span>
            </p>
          </div>
        </div>
      </div>
    )}
    {page === 'admin' ? (
      <main className="admin-shell">
        <header className="admin-top">
          <a className="wordmark" href="#" onClick={() => { location.hash = ''; setPage('home'); }}>ellith<span>♡</span></a>
          {isAdminUnlocked && (
            <nav className="admin-top-nav" aria-label="เมนูจัดการเว็บไซต์">
              <button type="button" className={'admin-nav-link ' + (tab === 'general' ? 'active' : '')} onClick={() => setTab('general')}>ข้อมูลและอัปโหลดไฟล์</button>
              <button type="button" className={'admin-nav-link ' + (tab === 'links' ? 'active' : '')} onClick={() => setTab('links')}>ช่องทางการติดต่อ ({links.length})</button>
              <button type="button" className={'admin-nav-link ' + (tab === 'images' ? 'active' : '')} onClick={() => setTab('images')}>คลังไฟล์มีเดีย ({assets.length})</button>
            </nav>
          )}
          <a className="back-link" href="#" onClick={() => { location.hash = ''; setPage('home'); }}>ดูหน้าเว็บไซต์จริง ↗</a>
        </header>

        {!isAdminUnlocked ? (
          <section className="login-wrap">
            <div className="login-card">
              <div className="tiny-flower" aria-hidden="true">୨୧</div>
              <p className="eyebrow">ELLITH STUDIO</p>
              <h1>เข้าสู่ระบบจัดการเว็บไซต์</h1>
              <p className="muted">ปรับแต่งโปรไฟล์ รูปภาพ เพลง และช่องทางการติดต่อของคุณ</p>
              <form onSubmit={login} className="login-form">
                <label>อีเมลผู้ดูแลระบบ
                  <input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin@example.com" type="email" required />
                </label>
                <label>รหัสผ่าน
                  <div className="password-wrap">
                    <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="รหัสผ่านของคุณ" required />
                    <button type="button" className="icon-btn" onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </label>
                {loginError && <p className="error">{loginError}</p>}
                <button className="primary-btn full" type="submit">เข้าสู่ระบบด้วยบัญชีผู้ดูแล <span>♡</span></button>
              </form>
            </div>
          </section>
        ) : (
          <div className="dashboard">
            <aside className="sidebar">
              <div className="sidebar-group">
                <p className="eyebrow">เมนูจัดการ</p>
                {[
                  ['general', <Sparkles size={16} />, 'ข้อมูลเว็บ & อัปโหลด', 'โปรไฟล์ ธีม รูป และเพลง'],
                  ['links', <Heart size={16} />, 'ช่องทางการติดต่อ', `${publicLinks.length} รายการที่แสดง`],
                  ['images', <ImagePlus size={16} />, 'คลังรูปภาพและไฟล์', `${assets.length} ไฟล์ในคลัง`]
                ].map(([id, ico, label, sub]) => (
                  <button
                    key={id}
                    type="button"
                    className={'side-item ' + (tab === id ? 'selected' : '')}
                    onClick={() => setTab(id)}
                  >
                    <span className="side-item-icon">{ico}</span>
                    <span className="side-item-copy">
                      <strong>{label}</strong>
                      <small>{sub}</small>
                    </span>
                  </button>
                ))}
              </div>

              <div className="sidebar-footer">
                <button
                  type="button"
                  className="side-item reset-default-btn"
                  onClick={() => {
                    setSite(starter);
                    saveLocal('ellith_site_v1', starter);
                    showToast('คืนค่าเริ่มต้นของโปรไฟล์เรียบร้อยแล้ว ♡');
                  }}
                >
                  <X size={15} /> คืนค่าเริ่มต้นโปรไฟล์
                </button>
                {session && (
                  <button type="button" className="side-item logout" onClick={logout}>
                    <LogOut size={15} /> ออกจากระบบ
                  </button>
                )}
              </div>
            </aside>

            <section className="dash-content">
              <div className="dash-heading">
                <div>
                  <p className="eyebrow">COQUETTE STUDIO EDITOR</p>
                  <h1>จัดการหน้าโปรไฟล์ <em>{site.name || 'ellith'}</em></h1>
                  <p className="muted">แก้ไขข้อมูล อัปโหลดไฟล์รูปและเพลงจากเครื่อง พร้อมดูตัวอย่างหน้าเว็บจริงด้านข้างได้ทันที</p>
                </div>
                <div className="dash-heading-actions">
                  <button type="button" className="primary-btn" onClick={saveSite} disabled={saving}>
                    <Save size={15} /> {saving ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง'}
                  </button>
                </div>
              </div>

              {notice && (
                <div className="notice" role="status">
                  <Sparkles size={15} />
                  <span>{notice}</span>
                </div>
              )}

              <div className="admin-workspace-grid">
                <div className="admin-main-column">
                  {tab === 'general' && (
                    <form className="admin-sections-stack" onSubmit={saveSite}>
                      <div className="panel">
                        <div className="panel-title">
                          <Sparkles />
                          <div>
                            <h2>ข้อความและข้อมูลหน้าโปรไฟล์</h2>
                            <p>กำหนดชื่อ คำโปรย และข้อความต้อนรับบนหน้าแรก</p>
                          </div>
                        </div>
                        <div className="form-grid">
                          <label>
                            <span>ชื่อโปรไฟล์ / ชื่อเว็บไซต์</span>
                            <input
                              value={site.name}
                              placeholder="เช่น ellith"
                              onChange={e => setSite({ ...site, name: e.target.value })}
                            />
                          </label>
                          <label>
                            <span>ข้อความใต้ชื่อ (Tagline)</span>
                            <input
                              value={site.tagline || ''}
                              placeholder="เช่น a little place of magic"
                              onChange={e => setSite({ ...site, tagline: e.target.value })}
                            />
                          </label>
                          <label className="wide">
                            <span className="label-row">
                              <span>ข้อความแนะนำตัว (Bio)</span>
                              <small className="char-counter">{(site.bio || '').length} ตัวอักษร</small>
                            </span>
                            <textarea
                              rows="3"
                              placeholder="เขียนข้อความต้อนรับน่ารักๆ..."
                              value={site.bio || ''}
                              onChange={e => setSite({ ...site, bio: e.target.value })}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="panel">
                        <div className="panel-title">
                          <Heart />
                          <div>
                            <h2>โทนสีและบรรยากาศ (Theme)</h2>
                            <p>เลือกชุดสีพาสเทลที่ต้องการ หรือปรับแต่งสีด้วยตัวเอง</p>
                          </div>
                        </div>
                        <div className="theme-cards-grid">
                          {themeOptions.map(opt => {
                            const active = opt.id === 'custom' ? isCustomTheme : (!isCustomTheme && (site.theme || 'pink') === opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                className={'theme-choice-card ' + (active ? 'active' : '')}
                                onClick={() => setSite({ ...site, theme: opt.id === 'custom' ? writeTheme(customColors) : opt.id })}
                              >
                                <div className="theme-swatches">
                                  {opt.swatches.map((hex, i) => (
                                    <span key={i} className="theme-swatch-dot" style={{ backgroundColor: hex }} />
                                  ))}
                                </div>
                                <div className="theme-choice-copy">
                                  <strong>{opt.name}</strong>
                                  <small>{opt.desc}</small>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {isCustomTheme && (
                          <div className="color-customizer">
                            <p className="color-help">คลิกที่ช่องสีเพื่อเลือกเฉดสีที่ต้องการ หน้าตัวอย่างด้านขวาจะเปลี่ยนตามทันที</p>
                            <label>
                              <span>สีพื้นหลัง</span>
                              <div className="color-picker-row">
                                <input className="color-input" type="color" value={customColors.background} onChange={e => updateCustomColor('background', e.target.value)} />
                                <code>{customColors.background}</code>
                              </div>
                            </label>
                            <label>
                              <span>สีหลัก / สีโบว์และหัวใจ</span>
                              <div className="color-picker-row">
                                <input className="color-input" type="color" value={customColors.accent} onChange={e => updateCustomColor('accent', e.target.value)} />
                                <code>{customColors.accent}</code>
                              </div>
                            </label>
                            <label>
                              <span>สีข้อความ</span>
                              <div className="color-picker-row">
                                <input className="color-input" type="color" value={customColors.text} onChange={e => updateCustomColor('text', e.target.value)} />
                                <code>{customColors.text}</code>
                              </div>
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="panel">
                        <div className="panel-title">
                          <Music2 />
                          <div>
                            <h2>ตั้งค่าเครื่องเล่นแผ่นเสียง (Vinyl Music Player)</h2>
                            <p>ปรับแต่งชื่อเพลง ชื่อศิลปิน รูปตรงกลางแผ่นเสียง และไฟล์เพลง MP3 ได้ตามต้องการ</p>
                          </div>
                        </div>

                        <div className="form-grid" style={{ marginBottom: '18px' }}>
                          <label>
                            <span>ชื่อเพลง (Song Title)</span>
                            <input
                              value={site.music_title ?? ''}
                              placeholder="เช่น love."
                              onChange={e => setSite({ ...site, music_title: e.target.value })}
                            />
                          </label>
                          <label>
                            <span>ชื่อศิลปิน (Artist Name)</span>
                            <input
                              value={site.music_artist ?? ''}
                              placeholder="เช่น wave to earth"
                              onChange={e => setSite({ ...site, music_artist: e.target.value })}
                            />
                          </label>
                        </div>

                        <div className="upload-cards-grid">
                          <div className="upload-card">
                            <div className="upload-card-preview vinyl-cover-preview">
                              <div className="vinyl-mini-disc">
                                <img src={activeMusicCoverUrl} alt="รูปแผ่นเพลง" />
                              </div>
                            </div>
                            <div className="upload-card-body">
                              <strong>รูปตรงแผ่นเพลง (Vinyl Cover)</strong>
                              <small className="upload-card-hint">รูปวงกลมตรงกลางแผ่นเสียงไวนิลที่จะหมุนขณะเล่นเพลง</small>
                              <span className="upload-filename" title={fileLabelFor(site.music_cover_url, 'รูปปกแผ่นเสียงเริ่มต้น')}>
                                {!site.music_cover_url || site.music_cover_url === defaultMusicCoverUrl
                                  ? 'รูปปกแผ่นเสียงเริ่มต้น (wave to earth)'
                                  : fileLabelFor(site.music_cover_url, 'อัปโหลดรูปแผ่นเพลงแล้ว')}
                              </span>
                              <div className="upload-card-actions">
                                <label className="file-pick-btn">
                                  <Upload size={14} />
                                  <span>เปลี่ยนรูปแผ่นเพลง</span>
                                  <input type="file" accept="image/*" onChange={e => uploadImage(e, 'music_cover_url')} hidden />
                                </label>
                                {site.music_cover_url && site.music_cover_url !== defaultMusicCoverUrl && (
                                  <button
                                    type="button"
                                    className="soft-btn danger-soft"
                                    onClick={() => clearUploadedField('music_cover_url')}
                                    title="ใช้รูปแผ่นเสียงเริ่มต้น"
                                  >
                                    <X size={14} /> รูปเริ่มต้น
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="upload-card upload-card-music">
                            <div className="upload-card-preview music-preview-box">
                              <Music2 size={26} />
                            </div>
                            <div className="upload-card-body">
                              <strong>ไฟล์เพลงพื้นหลัง (MP3 / Audio)</strong>
                              <small className="upload-card-hint">เล่นอัตโนมัติบนเครื่องเล่นแผ่นเสียงหน้าแรก (ไม่เกิน 10 MB)</small>
                              <span className="upload-filename" title={fileLabelFor(site.music_url, 'เพลงเริ่มต้นของเว็บไซต์')}>
                                {site.music_url && site.music_url !== defaultMusicUrl
                                  ? `ไฟล์ปัจจุบัน: ${fileLabelFor(site.music_url, 'อัปโหลดเพลงแล้ว')}`
                                  : 'เพลงปัจจุบัน: เพลงเริ่มต้นของเว็บไซต์'}
                              </span>
                              <div className="upload-card-actions">
                                <label className="file-pick-btn">
                                  <Upload size={14} />
                                  <span>เลือกไฟล์เพลง MP3</span>
                                  <input type="file" accept=".mp3,audio/mpeg,audio/mp3,audio/*" onChange={uploadMusic} hidden />
                                </label>
                                <button
                                  type="button"
                                  className="soft-btn"
                                  onClick={toggleMusic}
                                >
                                  {musicOn ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                  <span>{musicOn ? 'หยุดฟังตัวอย่าง' : 'ทดลองฟังเพลง'}</span>
                                </button>
                                {site.music_url && site.music_url !== defaultMusicUrl && (
                                  <button
                                    type="button"
                                    className="soft-btn danger-soft"
                                    onClick={() => clearUploadedField('music_url')}
                                  >
                                    <X size={14} /> ใช้เพลงเริ่มต้น
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="panel">
                        <div className="panel-title">
                          <Upload />
                          <div>
                            <h2>อัปโหลดรูปภาพโปรไฟล์และพื้นหลัง</h2>
                            <p>เลือกรูปโปรไฟล์ กรอบรูป และภาพพื้นหลังจากอุปกรณ์ของคุณโดยตรง</p>
                          </div>
                        </div>

                        <div className="upload-cards-grid">
                          {[
                            ['avatar_url', 'รูปโปรไฟล์ (Avatar)', 'รูปที่จะแสดงอยู่ในกรอบหัวใจตรงกลาง'],
                            ['frame_url', 'กรอบรูปโปรไฟล์ (PNG)', 'แนะนำไฟล์ PNG พื้นหลังโปร่งใส'],
                            ['background_url', 'ภาพพื้นหลังเว็บไซต์', 'ภาพพื้นหลังเต็มหน้าจอแบบละมุน']
                          ].map(([field, label, hint]) => {
                            const hasValue = Boolean(site[field]);
                            const isDefaultFrame = field === 'frame_url' && site[field] === defaultFrameUrl;
                            return (
                              <div className="upload-card" key={field}>
                                <div className="upload-card-preview">
                                  {hasValue ? (
                                    <img src={site[field]} alt={label} />
                                  ) : (
                                    <div className="upload-card-empty">♡</div>
                                  )}
                                </div>
                                <div className="upload-card-body">
                                  <strong>{label}</strong>
                                  <small className="upload-card-hint">{hint}</small>
                                  <span className="upload-filename" title={fileLabelFor(site[field], 'ยังไม่ได้เลือกไฟล์')}>
                                    {isDefaultFrame ? 'กรอบหัวใจวินเทจเริ่มต้น' : fileLabelFor(site[field], 'ยังไม่ได้อัปโหลดไฟล์')}
                                  </span>
                                  <div className="upload-card-actions">
                                    <label className="file-pick-btn">
                                      <Upload size={14} />
                                      <span>อัปโหลดไฟล์รูป</span>
                                      <input type="file" accept="image/*" onChange={e => uploadImage(e, field)} hidden />
                                    </label>
                                    {hasValue && !isDefaultFrame && (
                                      <button
                                        type="button"
                                        className="soft-btn danger-soft"
                                        onClick={() => clearUploadedField(field)}
                                        title="รีเซ็ตไฟล์"
                                      >
                                        <X size={14} /> ล้างไฟล์
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="panel-footer-bar">
                          <button type="submit" className="primary-btn" disabled={saving}>
                            <Save size={15} /> {saving ? 'กำลังบันทึก…' : 'บันทึกข้อมูลเว็บไซต์ทั้งหมด'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {tab === 'links' && (
                    <div className="admin-sections-stack">
                      <div className="panel">
                        <div className="panel-title">
                          <Plus />
                          <div>
                            <h2>{editing ? 'แก้ไขช่องทางการติดต่อ' : 'เพิ่มช่องทางการติดต่อใหม่'}</h2>
                            <p>คลิกปุ่มลัดด้านล่างเพื่อกรอกชื่อโซเชียลยอดนิยมอัตโนมัติ หรือพิมพ์เองได้เลย</p>
                          </div>
                        </div>

                        <div className="preset-chips-row">
                          <span className="preset-chips-label">เลือกด่วน:</span>
                          {linkPresets.map(preset => (
                            <button
                              key={preset.label}
                              type="button"
                              className={'preset-chip-btn ' + (linkForm.label === preset.label ? 'active' : '')}
                              onClick={() => setLinkForm({
                                ...linkForm,
                                label: preset.label,
                                url: linkForm.url || preset.url,
                                note: linkForm.note || preset.note
                              })}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        <form className="link-editor" onSubmit={saveLink}>
                          <label>
                            <span>ชื่อช่องทางติดต่อ</span>
                            <input
                              required
                              placeholder="เช่น Instagram, Discord, TikTok"
                              value={linkForm.label}
                              onChange={e => setLinkForm({ ...linkForm, label: e.target.value })}
                            />
                          </label>
                          <label>
                            <span>ลิงก์ URL ปลายทาง</span>
                            <input
                              required
                              type="url"
                              placeholder="https://..."
                              value={linkForm.url}
                              onChange={e => setLinkForm({ ...linkForm, url: e.target.value })}
                            />
                          </label>
                          <label className="wide">
                            <span>ข้อความบรรยายใต้ชื่อปุ่ม (ไม่บังคับ)</span>
                            <input
                              placeholder="เช่น follow my little world ♡"
                              value={linkForm.note}
                              onChange={e => setLinkForm({ ...linkForm, note: e.target.value })}
                            />
                          </label>
                          <div className="editor-actions wide">
                            <button type="submit" className="primary-btn">
                              <Plus size={15} /> {editing ? 'บันทึกการแก้ไขช่องทาง' : 'เพิ่มช่องทางติดต่อ'}
                            </button>
                            {editing && (
                              <button
                                type="button"
                                className="soft-btn"
                                onClick={() => { setEditing(null); setLinkForm(emptyLink); }}
                              >
                                ยกเลิกการแก้ไข
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      <div className="panel">
                        <div className="panel-title">
                          <Heart />
                          <div>
                            <h2>รายการช่องทางการติดต่อทั้งหมด ({links.length})</h2>
                            <p>จัดลำดับขึ้น-ลง เปิด/ปิดการแสดงผล หรือแก้ไขรายละเอียดได้ทันที</p>
                          </div>
                        </div>

                        <div className="managed-list">
                          {links.map((link, idx) => {
                            const active = link.is_active !== false;
                            return (
                              <div className={'managed-row ' + (!active ? 'is-muted' : '')} key={link.id}>
                                <span className="managed-order">0{idx + 1}</span>
                                <div className="managed-icon">{iconFor(link.label)}</div>
                                <div className="managed-info">
                                  <div className="managed-title-line">
                                    <b>{link.label}</b>
                                    <span className="managed-note-text">· {link.note || 'connect with me'}</span>
                                  </div>
                                  <small>{link.url}</small>
                                </div>
                                <div className="managed-actions">
                                  <button
                                    type="button"
                                    className="soft-action-btn"
                                    disabled={idx === 0}
                                    onClick={() => moveLink(idx, -1)}
                                    title="เลื่อนขึ้น"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    className="soft-action-btn"
                                    disabled={idx === links.length - 1}
                                    onClick={() => moveLink(idx, 1)}
                                    title="เลื่อนลง"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    className="soft-action-btn"
                                    onClick={() => toggleLinkActive(link)}
                                    title={active ? 'ซ่อนชั่วคราว' : 'แสดงบนหน้าเว็บ'}
                                  >
                                    {active ? <Eye size={14} /> : <EyeOff size={14} />}
                                  </button>
                                  <button
                                    type="button"
                                    className="soft-action-btn"
                                    onClick={() => {
                                      setEditing(link);
                                      setLinkForm({ label: link.label, url: link.url, note: link.note || '', icon: link.icon || 'link' });
                                    }}
                                    title="แก้ไข"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="soft-action-btn danger"
                                    onClick={() => deleteLink(link.id)}
                                    title="ลบช่องทาง"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {!links.length && (
                            <div className="empty-state-box">
                              <p>ยังไม่มีช่องทางการติดต่อ ลองเลือกปุ่มลัดด้านบนเพื่อเพิ่มลิงก์แรกของคุณ ♡</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === 'images' && (
                    <div className="panel">
                      <div className="panel-title-bar">
                        <div className="panel-title">
                          <ImagePlus />
                          <div>
                            <h2>คลังรูปภาพและไฟล์เพลง ({filteredAssets.length})</h2>
                            <p>เลือกนำไฟล์ที่เคยอัปโหลดไว้กลับมาใช้เป็นรูปโปรไฟล์ กรอบรูป พื้นหลัง หรือเพลงได้ทันที</p>
                          </div>
                        </div>
                        <div className="segmented-filter">
                          {[
                            ['all', `ทั้งหมด (${assets.length})`],
                            ['image', `รูปภาพ (${assets.filter(a => a.kind !== 'music').length})`],
                            ['music', `เพลง (${assets.filter(a => a.kind === 'music').length})`]
                          ].map(([id, label]) => (
                            <button
                              key={id}
                              type="button"
                              className={'seg-btn ' + (assetFilter === id ? 'active' : '')}
                              onClick={() => setAssetFilter(id)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {filteredAssets.length > 0 ? (
                        <div className="asset-grid">
                          {filteredAssets.map(asset => (
                            <div className="asset-card" key={asset.id}>
                              {asset.kind === 'music' ? (
                                <div className="asset-music-preview">
                                  <Music2 />
                                  <small>MP3 Audio</small>
                                </div>
                              ) : (
                                <img src={asset.url} alt={asset.name} />
                              )}
                              <div className="asset-caption">
                                <span title={asset.name}>{asset.name}</span>
                                <button type="button" className="icon-btn danger" onClick={() => deleteAsset(asset)} title="ลบไฟล์">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <div className="asset-actions">
                                {asset.kind === 'music' ? (
                                  <button type="button" onClick={() => applyAsset(asset, 'music_url')}>ใช้เป็นเพลงพื้นหลัง</button>
                                ) : (
                                  <>
                                    <button type="button" onClick={() => applyAsset(asset, 'avatar_url')}>ใช้เป็นรูปโปรไฟล์</button>
                                    <button type="button" onClick={() => applyAsset(asset, 'music_cover_url')}>ใช้เป็นรูปแผ่นเพลง</button>
                                    <button type="button" onClick={() => applyAsset(asset, 'frame_url')}>ใช้เป็นกรอบโปรไฟล์</button>
                                    <button type="button" onClick={() => applyAsset(asset, 'background_url')}>ใช้เป็นภาพพื้นหลัง</button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state-box">
                          <p>ยังไม่มีไฟล์ในหมวดหมู่นี้ สามารถอัปโหลดรูปภาพและเพลงใหม่ได้จากแท็บ "ข้อมูลเว็บ & อัปโหลด"</p>
                          <button type="button" className="soft-btn" onClick={() => setTab('general')}>
                            ไปหน้าอัปโหลดไฟล์ ↗
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <aside className="admin-live-preview" aria-label="ตัวอย่างหน้าเว็บไซต์แบบเรียลไทม์">
                  <div className="preview-header-bar">
                    <div>
                      <strong>ตัวอย่างหน้าเว็บไซต์จริง</strong>
                      <small>อัปเดตตามการแก้ไขแบบเรียลไทม์</small>
                    </div>
                    <a
                      href="#"
                      className="preview-open-link"
                      onClick={() => { location.hash = ''; setPage('home'); }}
                    >
                      เปิดเต็มจอ ↗
                    </a>
                  </div>

                  <div
                    className={'preview-phone-frame ' + (isCustomTheme ? 'theme-custom' : 'theme-' + (site.theme || 'pink'))}
                    style={{
                      ...(site.background_url ? { backgroundImage: `linear-gradient(${customColors.background}dd,${customColors.background}dd),url(${site.background_url})` } : {}),
                      ...(isCustomTheme ? { '--custom-bg': customColors.background, '--custom-accent': customColors.accent, '--custom-text': customColors.text } : {})
                    }}
                  >
                    <div className="preview-lace preview-lace-top" aria-hidden="true" />
                    <div className="preview-card-inner">
                      <div className="preview-ornament">୨୧　✧　୨୧</div>
                      <div className="preview-avatar-stage">
                        <div className="preview-avatar-circle">
                          {site.avatar_url ? <img src={site.avatar_url} alt={site.name} /> : <span>♡</span>}
                        </div>
                        {site.frame_url && <img className="preview-frame-img" src={site.frame_url} alt="" />}
                      </div>
                      <p className="preview-eyebrow">WELCOME TO MY LITTLE WORLD</p>
                      <h3 className="preview-name">{site.name || 'ellith'}</h3>
                      <p className="preview-tagline">{site.tagline || 'a little place of magic'}</p>
                      <p className="preview-bio">{site.bio || 'welcome to my little corner ♡'}</p>

                      <button type="button" className="preview-mp3-mini" onClick={toggleMusic}>
                        <span className={'preview-vinyl-disc ' + (musicOn ? 'is-playing' : '')}>
                          <img src={activeMusicCoverUrl} alt="" />
                        </span>
                        <span className="preview-mp3-info">
                          <strong>{customTrackTitle}</strong>
                          <small>{customTrackArtist}</small>
                        </span>
                        <span className="preview-vinyl-btn">{musicOn ? '❚❚' : '▶'}</span>
                      </button>

                      <div className="preview-links-stack">
                        {publicLinks.slice(0, 4).map(l => (
                          <div className="preview-link-pill" key={l.id}>
                            <strong>{l.label}</strong>
                            <small>{l.note || 'connect with me'}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="preview-lace preview-lace-bottom" aria-hidden="true" />
                  </div>
                </aside>
              </div>
            </section>
          </div>
        )}
      </main>
    ) : (
      <main className={'site-shell '+(isCustomTheme?'theme-custom':'theme-'+(site.theme||'pink'))} style={{...(site.background_url?{backgroundImage:`linear-gradient(${customColors.background}dd,${customColors.background}dd),url(${site.background_url})`}:{}),...(isCustomTheme?{'--custom-bg':customColors.background,'--custom-accent':customColors.accent,'--custom-text':customColors.text}:{})}}>
        <div className="screen-lace screen-lace-top" aria-hidden="true" />
        <div className="screen-lace screen-lace-bottom" aria-hidden="true" />
        <div className="admin-shortcut"><a href="#admin" aria-label="เปิดหน้า Admin"><img className="admin-heart-charm" src="/assets/aistudio/IMG_0363_aa669c23.png" alt="" aria-hidden="true" /> <span>ADMIN</span></a></div>
        <div className="floating-hearts" aria-hidden="true">
          {[
            { left: '10%', size: 16, duration: '14s', delay: '0s', sway: '18px' },
            { left: '24%', size: 12, duration: '17s', delay: '-4s', sway: '-14px' },
            { left: '38%', size: 18, duration: '19s', delay: '-9s', sway: '20px' },
            { left: '54%', size: 13, duration: '15s', delay: '-2s', sway: '-16px' },
            { left: '68%', size: 17, duration: '18s', delay: '-7s', sway: '15px' },
            { left: '82%', size: 14, duration: '16s', delay: '-11s', sway: '-18px' },
            { left: '91%', size: 11, duration: '20s', delay: '-5s', sway: '12px' }
          ].map((h, idx) => (
            <span
              key={idx}
              className="floating-heart"
              style={{
                '--heart-left': h.left,
                '--heart-duration': h.duration,
                '--heart-delay': h.delay,
                '--heart-sway': h.sway
              }}
            >
              <Heart size={h.size} fill="currentColor" />
            </span>
          ))}
        </div>
        <div className="sparkle s1">✧</div><div className="sparkle s2">✦</div><div className="sparkle s3">✧</div>
        <section className="profile-card">
          <div className="top-ornament">୨୧　✧　୨୧</div>
          <div className="avatar-frame-stage">
            <div className="avatar-frame">{site.avatar_url?<img src={site.avatar_url} alt={site.name}/>:<div className="avatar-placeholder">♡</div>}</div>
            {site.frame_url && <img className="avatar-frame-overlay" src={site.frame_url} alt="" aria-hidden="true" />}
          </div>
          <p className="eyebrow">WELCOME TO MY LITTLE WORLD</p><h1>{site.name || 'ellith'}</h1><p className="tagline">{site.tagline || 'a little place of magic'}</p><div className="divider-ornament"><span>✧</span><i></i><span>♡</span><i></i><span>✧</span></div>
          <p className="bio">
            <span className="bio-text-content">{site.bio || 'welcome to my little corner ♡'}</span>
            <span className="bio-garland" aria-hidden="true">
              <img src="/assets/aistudio/IMG_0362_fe6bb9b8.png" alt="" />
            </span>
          </p>
          <div className="music-control">
            <div
              className={'vinyl-turntable ' + (musicOn ? 'is-playing' : 'is-paused')}
              onClick={toggleMusic}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMusic(); } }}
              aria-label={musicOn ? 'Pause music' : 'Play music'}
              title={musicOn ? 'คลิกเพื่อหยุดเพลงชั่วคราว' : 'คลิกเพื่อเล่นเพลง'}
            >
              <div className="vinyl-disc">
                <div className="vinyl-grooves" />
                <div className="vinyl-label-ring">
                  <img
                    className={'vinyl-center-art ' + (activeMusicCoverUrl === defaultMusicCoverUrl ? 'is-default-art' : '')}
                    src={activeMusicCoverUrl}
                    alt=""
                    draggable="false"
                  />
                </div>
              </div>
              <svg className="vinyl-tonearm" viewBox="0 0 70 155" aria-hidden="true">
                <defs>
                  <radialGradient id="tonearmBaseOuter" cx="45%" cy="38%" r="58%">
                    <stop offset="0%" stopColor="#9aa0a6" />
                    <stop offset="55%" stopColor="#52575d" />
                    <stop offset="100%" stopColor="#2f3337" />
                  </radialGradient>
                  <radialGradient id="tonearmBaseInner" cx="38%" cy="32%" r="62%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#d9dde2" />
                    <stop offset="100%" stopColor="#8d939a" />
                  </radialGradient>
                  <linearGradient id="tonearmRod" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#b0b5bc" />
                    <stop offset="45%" stopColor="#f7f9fb" />
                    <stop offset="100%" stopColor="#7d838b" />
                  </linearGradient>
                </defs>
                {/* Top counterweight stub */}
                <rect x="17.5" y="3" width="7" height="7" rx="1.8" fill="url(#tonearmRod)" stroke="#7c8289" strokeWidth="0.6" />
                <rect x="15.5" y="6.5" width="11" height="3.2" rx="1.2" fill="#d8dce1" stroke="#7c8289" strokeWidth="0.5" />
                {/* Circular pivot base */}
                <circle cx="21" cy="24" r="14.5" fill="url(#tonearmBaseOuter)" />
                <circle cx="21" cy="24" r="9.2" fill="url(#tonearmBaseInner)" stroke="#595e64" strokeWidth="0.8" />
                <circle cx="21" cy="24" r="3.2" fill="#b7bcc4" />
                {/* Tonearm shaft */}
                <path
                  d="M21 24 L21 97 Q21 108 26.5 118 L34.5 132"
                  fill="none"
                  stroke="url(#tonearmRod)"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                />
                {/* White slotted headshell */}
                <g transform="translate(35.5, 133.5) rotate(-29)">
                  <rect x="-5.8" y="-2" width="11.6" height="16.5" rx="2.2" fill="#f7f8fa" stroke="#adb3ba" strokeWidth="0.8" />
                  <rect x="-3.1" y="2.2" width="2" height="8.5" rx="0.8" fill="#43484e" />
                  <rect x="1.1" y="2.2" width="2" height="8.5" rx="0.8" fill="#43484e" />
                </g>
              </svg>
            </div>

            <div className="vinyl-player-right">
              <div className="vinyl-meta" onClick={toggleMusic} title="คลิกเพื่อเล่น/หยุดเพลง">
                <strong className="vinyl-title">{customTrackTitle}</strong>
                <span className="vinyl-artist">{customTrackArtist}</span>
              </div>

              <div className="vinyl-controls-row">
                <button
                  type="button"
                  className="vinyl-ctrl-btn"
                  onClick={e => adjustVolume(-0.06, e)}
                  title={`ลดเสียงเพลง (${Math.round(volume * 100)}%)`}
                  aria-label="ลดเสียงเพลง"
                >
                  <svg className="vinyl-ctrl-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="5.2" y="6" width="2.6" height="12" rx="0.9" fill="currentColor" />
                    <path d="M18.2 6.3 C18.2 5.6 17.4 5.2 16.8 5.6 L8.8 11.1 C8.2 11.5 8.2 12.5 8.8 12.9 L16.8 18.4 C17.4 18.8 18.2 18.4 18.2 17.7 Z" fill="currentColor" />
                  </svg>
                </button>

                <button
                  type="button"
                  className={'vinyl-ctrl-btn vinyl-play-btn ' + (musicOn ? 'playing' : '')}
                  onClick={toggleMusic}
                  title={musicOn ? 'หยุดเพลงชั่วคราว' : 'เล่นเพลง'}
                  aria-label={musicOn ? 'Pause music' : 'Play music'}
                >
                  {musicOn ? (
                    <svg className="vinyl-ctrl-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="7.2" y="5.8" width="3.4" height="12.4" rx="1" fill="currentColor" />
                      <rect x="13.4" y="5.8" width="3.4" height="12.4" rx="1" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg className="vinyl-ctrl-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.5 6.1 C8.5 5.3 9.4 4.9 10.1 5.3 L18.2 11 C18.8 11.4 18.8 12.4 18.2 12.8 L10.1 18.5 C9.4 18.9 8.5 18.5 8.5 17.7 Z" fill="currentColor" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  className="vinyl-ctrl-btn"
                  onClick={e => adjustVolume(0.06, e)}
                  title={`เพิ่มเสียงเพลง (${Math.round(volume * 100)}%)`}
                  aria-label="เพิ่มเสียงเพลง"
                >
                  <svg className="vinyl-ctrl-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5.8 6.3 C5.8 5.6 6.6 5.2 7.2 5.6 L15.2 11.1 C15.8 11.5 15.8 12.5 15.2 12.9 L7.2 18.4 C6.6 18.8 5.8 18.4 5.8 17.7 Z" fill="currentColor" />
                    <rect x="16.2" y="6" width="2.6" height="12" rx="0.9" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="contact-list">{publicLinks.map((link,i)=><a className="contact-link" href={link.url} target="_blank" rel="noreferrer" key={link.id}><span className="contact-pearl-trim" aria-hidden="true" /><span className="contact-icon">{iconFor(link.label)}</span><span className="contact-copy"><b>{link.label}</b><small>{link.note || 'connect with me'}</small></span><ExternalLink className="external-icon"/><span className="link-number">0{i+1}</span></a>)}</div>
          {!publicLinks.length&&<p className="muted">ช่องทางการติดต่อจะปรากฏที่นี่ ♡</p>}
          <footer>made with <Heart size={12} fill="currentColor"/> & a little magic <span>✧</span></footer>
          <p
            className="bottom-note"
            onClick={() => setBottomSlideIndex((prev) => (prev + 1) % bottomSlides.length)}
            title="คลิกที่ป้ายเพื่อสลับ GIF · คลิกที่แสตมป์เพื่อเปลี่ยนสติกเกอร์ Coquette ♡"
          >
            <span
              key={`stamp-${coquetteStamps[stampIndex].id}`}
              className={`coquette-stamp-badge stamp-style-${coquetteStamps[stampIndex].style}`}
              role="button"
              tabIndex={0}
              onClick={cycleStamp}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  cycleStamp(e);
                }
              }}
              title={`สติกเกอร์/แสตมป์: ${coquetteStamps[stampIndex].label} (คลิกเพื่อเปลี่ยน)`}
              aria-label={`เปลี่ยนแสตมป์ ${coquetteStamps[stampIndex].label}`}
            >
              <span className="stamp-art-wrap">
                {renderStampArtwork(coquetteStamps[stampIndex].id)}
              </span>
              <span className="stamp-postmark">#{coquetteStamps[stampIndex].code}</span>
            </span>

            <span className="bottom-note-center">
              {bottomSlides[bottomSlideIndex].type === 'text' ? (
                <span key={`slide-${bottomSlideIndex}`} className="bottom-note-slide bottom-note-text">
                  {bottomSlides[bottomSlideIndex].text}
                </span>
              ) : (
                <span key={`slide-${bottomSlideIndex}`} className="bottom-note-slide bottom-note-gif-wrap">
                  <img
                    className="bottom-note-gif"
                    src={bottomSlides[bottomSlideIndex].src}
                    alt={bottomSlides[bottomSlideIndex].alt}
                  />
                  <span className="bottom-note-caption">{bottomSlides[bottomSlideIndex].caption}</span>
                </span>
              )}
            </span>

            <span
              className="stamp-toggle-pill"
              role="button"
              tabIndex={0}
              onClick={cycleStamp}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  cycleStamp(e);
                }
              }}
              title={`คลิกเพื่อสลับสติกเกอร์/แสตมป์ (${coquetteStamps[stampIndex].label})`}
              aria-label="สลับสติกเกอร์หรือแสตมป์ Coquette"
            >
              <span className="stamp-toggle-bow" aria-hidden="true">୨୧</span>
              <span className="stamp-toggle-name">{coquetteStamps[stampIndex].label}</span>
              <span className="stamp-toggle-count">{stampIndex + 1}/{coquetteStamps.length}</span>
            </span>
          </p>
        </section>
      </main>
    )}
  </>;
}
