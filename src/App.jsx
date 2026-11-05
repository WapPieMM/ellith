import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Instagram, Facebook, MessageCircle, Plus, Trash2, Pencil, LogOut, ImagePlus, ExternalLink, Music2, Volume2, VolumeX, Sparkles, Heart, X, Save, Upload, Eye, EyeOff } from 'lucide-react';

const defaultFrameUrl = '/assets/aistudio/IMG_0355_f5a957cf.png';
const defaultMusicUrl = '/assets/aistudio/dreamy_lullaby.mp3';
const starter = {
  name: 'ellith', tagline: 'a little place of magic', bio: 'welcome to my little corner ♡', theme: 'pink',
  avatar_url: '', frame_url: defaultFrameUrl, background_url: '', music_url: defaultMusicUrl
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
  try {
    const clean = decodeURIComponent(url.split('?')[0]);
    const name = clean.split('/').pop();
    return name || 'อัปโหลดไฟล์แล้ว';
  } catch {
    return 'อัปโหลดไฟล์แล้ว';
  }
};

export default function App() {
  const [page, setPage] = useState(location.hash === '#admin' ? 'admin' : 'home');
  const [site, setSite] = useState(starter);
  const [links, setLinks] = useState(demoLinks);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('general');
  const [editing, setEditing] = useState(null);
  const [linkForm, setLinkForm] = useState(emptyLink);
  const [notice, setNotice] = useState('');
  const [musicOn, setMusicOn] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const [musicProgress, setMusicProgress] = useState(38);
  const [musicTime, setMusicTime] = useState('1:38');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bottomSlideIndex, setBottomSlideIndex] = useState(0);
  const [stampIndex, setStampIndex] = useState(0);
  const audioRef = useRef(null);
  const userPausedRef = useRef(false);

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
      setSite({
        ...starter,
        ...siteRes.data,
        frame_url: siteRes.data.frame_url || defaultFrameUrl,
        music_url: siteRes.data.music_url || defaultMusicUrl
      });
    }
    if (linksRes.data?.length) setLinks(linksRes.data);
    else if (!linksRes.error) setLinks([]);
    if (assetsRes.data) setAssets(assetsRes.data);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, [session]);

  const configured = isSupabaseConfigured;
  const publicLinks = useMemo(() => links.filter(link => link.is_active !== false), [links]);
  const customColors = readTheme(site.theme);
  const isCustomTheme = typeof site.theme === 'string' && site.theme.startsWith('custom|');
  const updateCustomColor = (key, value) => setSite(current => ({ ...current, theme: writeTheme({ ...readTheme(current.theme), [key]: value }) }));
  const activeMusicSrc = site.music_url || defaultMusicUrl;

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
      audio.play().then(() => {
        setMusicOn(true);
      }).catch(() => {});
    };

    tryAutoPlay();

    const onFirstInteraction = (e) => {
      if (userPausedRef.current) return;
      if (e.target?.closest?.('.mp3-wheel')) return;
      if (audio.paused) {
        audio.play().then(() => {
          setMusicOn(true);
        }).catch(() => {});
      }
    };

    document.addEventListener('pointerdown', onFirstInteraction, { passive: true });
    document.addEventListener('keydown', onFirstInteraction, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onFirstInteraction);
      document.removeEventListener('keydown', onFirstInteraction);
    };
  }, [activeMusicSrc]);

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
    if (!supabase) { setLoginError('เชื่อมต่อ Supabase ก่อนจึงจะเข้าสู่ระบบหลังบ้านได้'); return; }
    const email = username.trim();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
  }
  async function logout() { await supabase?.auth.signOut(); setPage('home'); location.hash = ''; }

  async function saveSite(e) {
    e?.preventDefault(); if (!supabase) return; setSaving(true);
    const payload = { id: 1, name: site.name, tagline: site.tagline, bio: site.bio, theme: site.theme, avatar_url: site.avatar_url, frame_url: site.frame_url, background_url: site.background_url, music_url: site.music_url, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('site_content').upsert(payload);
    setSaving(false); setNotice(error ? error.message : 'บันทึกข้อมูลเว็บไซต์แล้ว ♡'); setTimeout(() => setNotice(''), 3000);
  }

  async function saveLink(e) {
    e.preventDefault(); if (!supabase) return;
    const payload = { label: linkForm.label.trim(), url: linkForm.url.trim(), icon: linkForm.icon || 'link', note: linkForm.note || '', sort_order: editing?.sort_order ?? links.length, is_active: true };
    const result = editing ? await supabase.from('contact_links').update(payload).eq('id', editing.id) : await supabase.from('contact_links').insert(payload);
    if (result.error) { setNotice(result.error.message); return; }
    setEditing(null); setLinkForm(emptyLink); await refresh(); setNotice('บันทึกช่องทางติดต่อแล้ว ♡');
  }
  async function deleteLink(id) {
    if (!confirm('ลบช่องทางติดต่อนี้ใช่ไหม?')) return;
    const { error } = await supabase.from('contact_links').delete().eq('id', id);
    if (error) setNotice(error.message); else { await refresh(); setNotice('ลบช่องทางแล้ว'); }
  }
  async function uploadImage(e, field) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice('รูปภาพต้องมีขนาดไม่เกิน 10 MB');
      e.target.value = '';
      return;
    }
    if (!supabase) {
      const localUrl = URL.createObjectURL(file);
      setSite(s => ({ ...s, [field]: localUrl }));
      setNotice('อัปโหลดไฟล์รูปภาพเรียบร้อยแล้ว ♡');
      e.target.value = '';
      return;
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = 'ellith/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
    const { error: uploadError } = await supabase.storage.from('ellith-media').upload(path, file, { upsert: false });
    if (uploadError) {
      setNotice('อัปโหลดรูปภาพไม่สำเร็จ: ' + uploadError.message);
      e.target.value = '';
      return;
    }

    const { data } = supabase.storage.from('ellith-media').getPublicUrl(path);
    const nextSite = { ...site, [field]: data.publicUrl };
    const payload = {
      id: 1,
      name: nextSite.name,
      tagline: nextSite.tagline,
      bio: nextSite.bio,
      theme: nextSite.theme,
      avatar_url: nextSite.avatar_url,
      frame_url: nextSite.frame_url,
      background_url: nextSite.background_url,
      music_url: nextSite.music_url,
      updated_at: new Date().toISOString()
    };

    const { error: saveError } = await supabase.from('site_content').upsert(payload);
    if (saveError) {
      await supabase.storage.from('ellith-media').remove([path]);
      setNotice('อัปโหลดไฟล์แล้ว แต่บันทึกเว็บไซต์ไม่สำเร็จ: ' + saveError.message);
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
      setNotice('บันทึกรูปภาพบนเว็บไซต์แล้ว แต่มีปัญหาในการอัปเดตคลังรูปภาพ');
    } else {
      setNotice('อัปโหลดและบันทึกรูปภาพเรียบร้อยแล้ว หน้าเว็บไซต์จะแสดงรูปใหม่นี้ทันที ♡');
    }
    e.target.value = '';
  }

  async function clearUploadedField(field) {
    const fallbackValue = field === 'frame_url' ? defaultFrameUrl : field === 'music_url' ? defaultMusicUrl : '';
    const nextSite = { ...site, [field]: fallbackValue };
    setSite(nextSite);
    if (!supabase) return;
    const payload = {
      id: 1,
      name: nextSite.name,
      tagline: nextSite.tagline,
      bio: nextSite.bio,
      theme: nextSite.theme,
      avatar_url: nextSite.avatar_url,
      frame_url: nextSite.frame_url,
      background_url: nextSite.background_url,
      music_url: nextSite.music_url,
      updated_at: new Date().toISOString()
    };
    await supabase.from('site_content').upsert(payload);
    setNotice('รีเซ็ตไฟล์เรียบร้อยแล้ว ♡');
  }

  async function applyAsset(asset, field) {
    if (!['avatar_url', 'frame_url', 'background_url', 'music_url'].includes(field)) return;
    const nextSite = { ...site, [field]: asset.url };
    const payload = {
      id: 1,
      name: nextSite.name,
      tagline: nextSite.tagline,
      bio: nextSite.bio,
      theme: nextSite.theme,
      avatar_url: nextSite.avatar_url,
      frame_url: nextSite.frame_url,
      background_url: nextSite.background_url,
      music_url: nextSite.music_url,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('site_content').upsert(payload);
    if (error) {
      setNotice('นำไฟล์ไปใช้ไม่สำเร็จ: ' + error.message);
      return;
    }
    setSite(nextSite);
    setNotice('นำไฟล์ไปใช้บนเว็บไซต์เรียบร้อยแล้ว ♡');
  }

  async function uploadMusic(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    const isAudio = file.type.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].some(ext => lowerName.endsWith(ext));
    if (!isAudio) {
      setNotice('กรุณาเลือกไฟล์เพลง (เช่น MP3) เท่านั้น');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice('ไฟล์เพลงต้องมีขนาดไม่เกิน 10 MB');
      e.target.value = '';
      return;
    }
    if (!supabase) {
      const localUrl = URL.createObjectURL(file);
      setSite(s => ({ ...s, music_url: localUrl }));
      setNotice('อัปโหลดไฟล์เพลงสำเร็จ ♡');
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
      setNotice('อัปโหลดเพลงไม่สำเร็จ: ' + error.message);
      e.target.value = '';
      return;
    }
    const { data } = supabase.storage.from('ellith-media').getPublicUrl(path);
    const nextSite = { ...site, music_url: data.publicUrl };
    const payload = {
      id: 1,
      name: nextSite.name,
      tagline: nextSite.tagline,
      bio: nextSite.bio,
      theme: nextSite.theme,
      avatar_url: nextSite.avatar_url,
      frame_url: nextSite.frame_url,
      background_url: nextSite.background_url,
      music_url: nextSite.music_url,
      updated_at: new Date().toISOString()
    };
    const { error: saveError } = await supabase.from('site_content').upsert(payload);
    if (saveError) {
      await supabase.storage.from('ellith-media').remove([path]);
      setNotice('อัปโหลดเพลงแล้ว แต่บันทึกเว็บไซต์ไม่สำเร็จ: ' + saveError.message);
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

    if (assetError) setNotice('อัปโหลดและบันทึกเพลงบนเว็บไซต์แล้ว แต่บันทึกคลังไฟล์ไม่สำเร็จ: ' + assetError.message);
    else setNotice('อัปโหลดและบันทึกเพลงเรียบร้อยแล้ว หน้าเว็บไซต์พร้อมเล่นเพลงใหม่ทันที ♡');
    e.target.value = '';
  }
  async function deleteAsset(asset) {
    if (!confirm('ลบไฟล์นี้ออกจากคลังหรือไม่?')) return;
    const { error } = await supabase.storage.from('ellith-media').remove([asset.path]);
    if (error) { setNotice(error.message); return; }
    await supabase.from('media_assets').delete().eq('id', asset.id);
    await refresh();
  }

  const customTrackTitle = useMemo(() => {
    if (!site.music_url || site.music_url === defaultMusicUrl) return 'In hallo';
    const raw = fileLabelFor(site.music_url, 'In hallo').replace(/\.[a-z0-9]+$/i, '');
    const cleaned = raw.replace(/^music-\d+-[a-z0-9]+$/i, 'ellith melody');
    return cleaned.slice(0, 18) || 'In hallo';
  }, [site.music_url]);

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
    />
    {page === 'admin' ? (
      <main className="admin-shell">
        <header className="admin-top"><a className="wordmark" href="#" onClick={() => { location.hash = ''; setPage('home'); }}>ellith<span>♡</span></a><span className="admin-label">STUDIO / ADMIN</span><a className="back-link" href="#">ดูหน้าเว็บไซต์ ↗</a></header>
        {!session ? <section className="login-wrap"><div className="login-card"><div className="tiny-flower">✿</div><p className="eyebrow">A LITTLE MAGIC INSIDE</p><h1>Welcome back</h1><p className="muted">เข้าสู่ระบบเพื่อจัดการเว็บไซต์ ellith</p>
          {!configured && <p className="warning">ยังไม่ได้ตั้งค่า Supabase — ดูวิธีตั้งค่าใน README.md</p>}
          <form onSubmit={login} className="login-form"><label>Username / Email<input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin@example.com" type="email" required /></label><label>Password<div className="password-wrap"><input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="รหัสผ่าน" required /><button type="button" className="icon-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>{loginError && <p className="error">{loginError}</p>}<button className="primary-btn full" disabled={!configured}>เข้าสู่ระบบ <span>♡</span></button></form><p className="tiny-note">บัญชีผู้ดูแลสร้างจาก Supabase Authentication</p></div></section> :
        <div className="dashboard"><aside className="sidebar"><p className="eyebrow">WORKSPACE</p>{[['general','♡','ข้อมูลเว็บไซต์'],['links','↗','ช่องทางติดต่อ'],['images','✿','คลังรูปภาพ']].map(([id,ico,label])=><button key={id} className={'side-item '+(tab===id?'selected':'')} onClick={() => setTab(id)}><span>{ico}</span>{label}</button>)}<button className="side-item logout" onClick={logout}><LogOut />ออกจากระบบ</button></aside><section className="dash-content"><div className="dash-heading"><div><p className="eyebrow">HELLO, CREATOR</p><h1>จัดการเว็บไซต์ <em>ellith</em></h1><p className="muted">ทุกการเปลี่ยนแปลงอยู่ในมือคุณ ♡</p></div><span className="live-pill">● CONNECTED</span></div>
        {notice && <div className="notice">{notice}</div>}
        {tab === 'general' && <form className="panel form-grid" onSubmit={saveSite}><div className="panel-title"><Sparkles /><div><h2>ข้อมูลเว็บไซต์</h2><p>ปรับแต่งหน้าตาและข้อความหน้าแรก</p></div></div><label>ชื่อเว็บไซต์<input value={site.name} onChange={e=>setSite({...site,name:e.target.value})}/></label><label>ข้อความใต้ชื่อ<input value={site.tagline||''} onChange={e=>setSite({...site,tagline:e.target.value})}/></label><label className="wide">ข้อความแนะนำ<textarea rows="3" value={site.bio||''} onChange={e=>setSite({...site,bio:e.target.value})}/></label><label>โทนสี<select value={isCustomTheme ? 'custom' : (site.theme||'pink')} onChange={e=>setSite({...site,theme:e.target.value==='custom'?writeTheme(customColors):e.target.value})}><option value="pink">Pink & White</option><option value="lavender">Lavender</option><option value="cream">Soft Pink (เดิม)</option><option value="custom">กำหนดสีเอง</option></select></label>{isCustomTheme&&<div className="wide color-customizer"><p className="color-help">เลือกสีได้อย่างอิสระ แล้วกดบันทึกการเปลี่ยนแปลงเพื่อใช้บนหน้าเว็บ</p><label>สีพื้นหลัง <input className="color-input" type="color" value={customColors.background} onChange={e=>updateCustomColor('background',e.target.value)}/><code>{customColors.background}</code></label><label>สีหลัก / สีตกแต่ง <input className="color-input" type="color" value={customColors.accent} onChange={e=>updateCustomColor('accent',e.target.value)}/><code>{customColors.accent}</code></label><label>สีข้อความ <input className="color-input" type="color" value={customColors.text} onChange={e=>updateCustomColor('text',e.target.value)}/><code>{customColors.text}</code></label></div>}{[['avatar_url','รูปโปรไฟล์'],['frame_url','กรอบรูปโปรไฟล์'],['background_url','ภาพพื้นหลัง']].map(([field,label])=><div className="file-upload-field" key={field}><span className="field-label">{label}</span><div className="upload-only-box">{site[field] && <img className="upload-thumb" src={site[field]} alt={label} />}<span className="upload-filename" title={fileLabelFor(site[field], 'ยังไม่ได้เลือกไฟล์')}>{fileLabelFor(site[field], 'ยังไม่ได้เลือกไฟล์')}</span><label className="file-pick-btn" title="อัปโหลดไฟล์รูปภาพ"><Upload/><span>เลือกไฟล์รูป</span><input type="file" accept="image/*" onChange={e=>uploadImage(e,field)} hidden/></label>{site[field] && site[field] !== (field === 'frame_url' ? defaultFrameUrl : '') && <button type="button" className="icon-btn danger" onClick={()=>clearUploadedField(field)} title="ล้างไฟล์"><X/></button>}</div>{field==='frame_url'&&<small className="muted">แนะนำไฟล์กรอบรูป PNG พื้นหลังโปร่งใส เพื่อให้เห็นรูปโปรไฟล์ด้านใน</small>}</div>)}<div className="file-upload-field wide"><span className="field-label">เพลงพื้นหลัง (ไฟล์ MP3)</span><div className="upload-only-box"><span className="music-badge"><Music2/></span><span className="upload-filename" title={fileLabelFor(site.music_url, 'เพลงเริ่มต้นของเว็บไซต์')}>{site.music_url && site.music_url !== defaultMusicUrl ? fileLabelFor(site.music_url, 'อัปโหลดเพลงแล้ว') : 'เพลงกล่องดนตรีเริ่มต้น (พร้อมใช้งาน)'}</span><label className="file-pick-btn" title="อัปโหลดไฟล์เพลง MP3"><Upload/><span>เลือกไฟล์เพลง</span><input type="file" accept=".mp3,audio/mpeg,audio/mp3,audio/*" onChange={uploadMusic} hidden/></label>{site.music_url && site.music_url !== defaultMusicUrl && <button type="button" className="icon-btn danger" onClick={()=>clearUploadedField('music_url')} title="กลับไปใช้เพลงเริ่มต้น"><X/></button>}</div><small className="muted">อัปโหลดได้เฉพาะไฟล์เพลงจากเครื่อง (MP3 ขนาดไม่เกิน 10 MB)</small></div><div className="wide"><button className="primary-btn" disabled={saving}><Save/> {saving?'กำลังบันทึก…':'บันทึกการเปลี่ยนแปลง'}</button></div></form>}
        {tab === 'links' && <div className="panel"><div className="panel-title"><Heart/><div><h2>ช่องทางการติดต่อ</h2><p>เพิ่มและแก้ไขลิงก์ที่แสดงบนหน้าเว็บไซต์</p></div></div><form className="link-editor" onSubmit={saveLink}><input required placeholder="ชื่อช่องทาง เช่น Instagram" value={linkForm.label} onChange={e=>setLinkForm({...linkForm,label:e.target.value})}/><input required type="url" placeholder="https://..." value={linkForm.url} onChange={e=>setLinkForm({...linkForm,url:e.target.value})}/><input placeholder="ข้อความสั้น ๆ (ไม่บังคับ)" value={linkForm.note} onChange={e=>setLinkForm({...linkForm,note:e.target.value})}/><div className="editor-actions"><button className="primary-btn"><Plus/> {editing?'บันทึกการแก้ไข':'เพิ่มช่องทาง'}</button>{editing&&<button type="button" className="soft-btn" onClick={()=>{setEditing(null);setLinkForm(emptyLink)}}>ยกเลิก</button>}</div></form><div className="managed-list">{links.map(link=><div className="managed-row" key={link.id}><div className="managed-icon">{iconFor(link.label)}</div><div className="managed-info"><b>{link.label}</b><small>{link.url}</small></div><button className="icon-btn" onClick={()=>{setEditing(link);setLinkForm({label:link.label,url:link.url,note:link.note||'',icon:link.icon||'link'})}}><Pencil/></button><button className="icon-btn danger" onClick={()=>deleteLink(link.id)}><Trash2/></button></div>)}</div></div>}
        {tab === 'images' && <div className="panel"><div className="panel-title"><ImagePlus/><div><h2>คลังรูปภาพและไฟล์</h2><p>ไฟล์ที่อัปโหลดไว้ในเว็บไซต์</p></div></div><div className="asset-grid">{assets.map(asset=><div className="asset-card" key={asset.id}>{asset.kind==='music'?<div className="asset-music-preview"><Music2/></div>:<img src={asset.url} alt={asset.name}/>}<div className="asset-caption"><span>{asset.name}</span><button className="icon-btn danger" onClick={()=>deleteAsset(asset)} title="ลบไฟล์"><Trash2/></button></div><div className="asset-actions">{asset.kind==='music'?<button type="button" onClick={()=>applyAsset(asset,'music_url')}>ใช้เป็นเพลงพื้นหลัง</button>:<> <button type="button" onClick={()=>applyAsset(asset,'avatar_url')}>ใช้เป็นโลโก้</button><button type="button" onClick={()=>applyAsset(asset,'frame_url')}>ใช้เป็นกรอบโปรไฟล์</button><button type="button" onClick={()=>applyAsset(asset,'background_url')}>ใช้เป็นพื้นหลัง</button></>}</div></div>)}</div>{!assets.length&&<p className="muted">ยังไม่มีไฟล์ในคลัง ลองอัปโหลดจากหน้าข้อมูลเว็บไซต์</p>}</div>}
        </section></div>}
      </main>
    ) : (
      <main className={'site-shell '+(isCustomTheme?'theme-custom':'theme-'+(site.theme||'pink'))} style={{...(site.background_url?{backgroundImage:`linear-gradient(${customColors.background}dd,${customColors.background}dd),url(${site.background_url})`}:{}),...(isCustomTheme?{'--custom-bg':customColors.background,'--custom-accent':customColors.accent,'--custom-text':customColors.text}:{})}}>
        <div className="screen-lace screen-lace-top" aria-hidden="true" />
        <div className="screen-lace screen-lace-bottom" aria-hidden="true" />
        <div className="admin-shortcut"><a href="#admin" aria-label="เปิดหน้า Admin"><Heart size={17} fill="currentColor"/> <span>ADMIN</span></a></div>
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
          <p className="eyebrow">WELCOME TO MY LITTLE WORLD</p><h1>{site.name || 'ellith'}</h1><p className="tagline">{site.tagline || 'a little place of magic'}</p><div className="divider-ornament"><span>✧</span><i></i><span>♡</span><i></i><span>✧</span></div><p className="bio">{site.bio || 'welcome to my little corner ♡'}</p>
          <div className="music-control">
            <button
              type="button"
              className={'mp3-wheel ' + (musicOn ? 'playing' : '')}
              onClick={toggleMusic}
              aria-label={musicOn ? 'Pause music' : 'Play music'}
              title={musicOn ? 'หยุดเพลงชั่วคราว' : 'เล่นเพลง'}
            >
              <svg className="wheel-icon wheel-top" viewBox="0 0 20 18" aria-hidden="true">
                <path d="M10 16.2 C9.4 15.7 2 10.6 2 5.7 C2 3.1 4.1 1.2 6.6 1.2 C8.1 1.2 9.4 2 10 3.1 C10.6 2 11.9 1.2 13.4 1.2 C15.9 1.2 18 3.1 18 5.7 C18 10.6 10.6 15.7 10 16.2 Z" fill="#f7b3cc" stroke="#b5748e" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
              <span className="wheel-hit wheel-hit-left" onClick={e => adjustVolume(-0.1, e)} title="ลดเสียงเพลง (-)">
                <svg className="wheel-icon wheel-left" viewBox="0 0 22 14" aria-hidden="true">
                  <path d="M10.2 2 L3 7 L10.2 12 Z M19.2 2 L12 7 L19.2 12 Z" fill="#f7b3cc" stroke="#b5748e" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="wheel-center">
                {musicOn ? (
                  <svg className="center-glyph" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="6" y="4.5" width="4.4" height="15" rx="2" fill="#f5a9c6" stroke="#c37f99" strokeWidth="1.1" />
                    <rect x="13.6" y="4.5" width="4.4" height="15" rx="2" fill="#f5a9c6" stroke="#c37f99" strokeWidth="1.1" />
                  </svg>
                ) : (
                  <svg className="center-glyph" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5.2 C8 4.2 9.1 3.7 9.9 4.2 L18.4 10.2 C19.1 10.7 19.1 11.7 18.4 12.2 L9.9 18.2 C9.1 18.7 8 18.2 8 17.2 Z" fill="#f5a9c6" stroke="#c37f99" strokeWidth="1.1" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="wheel-hit wheel-hit-right" onClick={e => adjustVolume(0.1, e)} title="เพิ่มเสียงเพลง (+)">
                <svg className="wheel-icon wheel-right" viewBox="0 0 22 14" aria-hidden="true">
                  <path d="M2.8 2 L10 7 L2.8 12 Z M11.8 2 L19 7 L11.8 12 Z" fill="#f7b3cc" stroke="#b5748e" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </span>
              <svg className="wheel-icon wheel-bottom" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 1.8 L12.3 6.8 L17.8 7.5 L13.7 11.3 L14.8 16.8 L10 14.1 L5.2 16.8 L6.3 11.3 L2.2 7.5 L7.7 6.8 Z" fill="#f7b3cc" stroke="#b5748e" strokeWidth="1.25" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="music-note mp3-screen" onClick={toggleMusic} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMusic(); } }}>
              <span className="mp3-title-row">
                <span className="mp3-sparkles-left" aria-hidden="true">✦</span>
                <svg className="mp3-bow" viewBox="0 0 32 24" aria-hidden="true">
                  <path d="M14 11 C8 4, 2 6, 3 12 C4 17, 10 16, 14 13 Z" fill="#f9bdd4" stroke="#b6718c" strokeWidth="1.3" strokeLinejoin="round" />
                  <path d="M18 11 C24 4, 30 6, 29 12 C28 17, 22 16, 18 13 Z" fill="#f9bdd4" stroke="#b6718c" strokeWidth="1.3" strokeLinejoin="round" />
                  <path d="M13.5 14 L9 21.5 L12.5 22 L15.2 15 Z" fill="#f7b0cb" stroke="#b6718c" strokeWidth="1.2" strokeLinejoin="round" />
                  <path d="M18.5 14 L23 21.5 L19.5 22 L16.8 15 Z" fill="#f7b0cb" stroke="#b6718c" strokeWidth="1.2" strokeLinejoin="round" />
                  <ellipse cx="16" cy="12.2" rx="2.6" ry="2.8" fill="#fcd1e2" stroke="#b6718c" strokeWidth="1.3" />
                </svg>
                <strong className="mp3-track-name">{customTrackTitle}</strong>
                <svg className="mp3-heart" viewBox="0 0 22 20" aria-hidden="true">
                  <path d="M10.5 17 C9.8 16.4 3 11.8 3.2 6.8 C3.4 4.1 5.6 2.3 8 2.5 C9.4 2.6 10.6 3.5 11.2 4.6 C12 3.6 13.4 2.9 14.8 3.1 C17.2 3.4 19 5.5 18.6 8.1 C17.9 12.8 11.2 16.5 10.5 17 Z" fill="#f9bfd6" stroke="#b6718c" strokeWidth="1.3" strokeLinejoin="round" />
                </svg>
                <span className="mp3-sparkles-right" aria-hidden="true">✦</span>
              </span>
              <span className="mp3-artist">{musicOn ? '(playing ♡)' : '(feat.aespa)'}</span>
              <span className="mp3-progress-wrap" onClick={handleSeek} title="คลิกเพื่อเลื่อนช่วงเพลง">
                <span className="mp3-progress-fill" style={{ width: `${musicProgress}%` }} />
                <span className="mp3-progress-knob" style={{ left: `${musicProgress}%` }} />
              </span>
              <span className="mp3-bottom-row">
                <span
                  role="button"
                  tabIndex={0}
                  className="mp3-vol-btn"
                  onClick={e => adjustVolume(-0.1, e)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); adjustVolume(-0.1, e); } }}
                  title="ลดเสียงเพลง"
                  aria-label="ลดเสียงเพลง"
                >
                  <VolumeX size={11} />
                  <b>−</b>
                </span>
                <span className="mp3-time">{musicTime} <small className="mp3-vol-pct">· {Math.round(volume * 100)}%</small></span>
                <span
                  role="button"
                  tabIndex={0}
                  className="mp3-vol-btn"
                  onClick={e => adjustVolume(0.1, e)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); adjustVolume(0.1, e); } }}
                  title="เพิ่มเสียงเพลง"
                  aria-label="เพิ่มเสียงเพลง"
                >
                  <b>+</b>
                  <Volume2 size={11} />
                </span>
              </span>
            </span>
          </div>
          <div className="contact-list">{publicLinks.map((link,i)=><a className="contact-link" href={link.url} target="_blank" rel="noreferrer" key={link.id}><span className="contact-icon">{iconFor(link.label)}</span><span className="contact-copy"><b>{link.label}</b><small>{link.note || 'connect with me'}</small></span><ExternalLink className="external-icon"/><span className="link-number">0{i+1}</span></a>)}</div>
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
