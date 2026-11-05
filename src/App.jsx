import React, { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Instagram, Facebook, MessageCircle, Plus, Trash2, Pencil, LogOut, ImagePlus, ExternalLink, Music2, Volume2, VolumeX, Sparkles, Heart, X, Save, Upload, Eye, EyeOff } from 'lucide-react';

const starter = {
  name: 'ellith', tagline: 'a little place of magic', bio: 'welcome to my little corner ♡', theme: 'pink',
  avatar_url: '', cover_url: '', background_url: '', music_url: ''
};
const demoLinks = [
  { id: 'demo-ig', label: 'Instagram', url: 'https://instagram.com/', icon: 'instagram', note: 'follow my little world' },
  { id: 'demo-fb', label: 'Facebook', url: 'https://facebook.com/', icon: 'facebook', note: 'let’s keep in touch' },
  { id: 'demo-dc', label: 'Discord', url: 'https://discord.com/', icon: 'discord', note: 'come say hello' }
];
const iconFor = (name) => name === 'Instagram' ? <Instagram /> : name === 'Facebook' ? <Facebook /> : <MessageCircle />;
const emptyLink = { label: '', url: '', icon: 'link', note: '' };

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
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (siteRes.data) setSite({ ...starter, ...siteRes.data });
    if (linksRes.data?.length) setLinks(linksRes.data);
    else if (!linksRes.error) setLinks([]);
    if (assetsRes.data) setAssets(assetsRes.data);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, [session]);

  const configured = isSupabaseConfigured;
  const publicLinks = useMemo(() => links.filter(link => link.is_active !== false), [links]);

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
    const payload = { id: 1, name: site.name, tagline: site.tagline, bio: site.bio, theme: site.theme, avatar_url: site.avatar_url, cover_url: site.cover_url, background_url: site.background_url, music_url: site.music_url, updated_at: new Date().toISOString() };
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
    const file = e.target.files?.[0]; if (!file || !supabase) return;
    if (!file.type.startsWith('image/')) { setNotice('กรุณาเลือกไฟล์รูปภาพ'); return; }
    const ext = file.name.split('.').pop();
    const path = 'ellith/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
    const { error } = await supabase.storage.from('ellith-media').upload(path, file, { upsert: false });
    if (error) { setNotice(error.message); return; }
    const { data } = supabase.storage.from('ellith-media').getPublicUrl(path);
    setSite(s => ({ ...s, [field]: data.publicUrl }));
    await supabase.from('media_assets').insert({ name: file.name, path, url: data.publicUrl, kind: field });
    await refresh(); setNotice('อัปโหลดรูปภาพแล้ว อย่าลืมกดบันทึกเว็บไซต์');
  }
  async function uploadMusic(e) {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    if (!['audio/mpeg', 'audio/mp3'].includes(file.type) && !file.name.toLowerCase().endsWith('.mp3')) {
      setNotice('กรุณาเลือกไฟล์เพลง MP3 เท่านั้น');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice('ไฟล์เพลงต้องมีขนาดไม่เกิน 10 MB');
      e.target.value = '';
      return;
    }
    const path = 'ellith/music-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.mp3';
    const { error } = await supabase.storage.from('ellith-media').upload(path, file, { upsert: false, contentType: 'audio/mpeg' });
    if (error) {
      setNotice('อัปโหลดเพลงไม่สำเร็จ: ' + error.message);
      e.target.value = '';
      return;
    }
    const { data } = supabase.storage.from('ellith-media').getPublicUrl(path);
    setSite(s => ({ ...s, music_url: data.publicUrl }));
    const { error: assetError } = await supabase.from('media_assets').insert({ name: file.name, path, url: data.publicUrl, kind: 'music' });
    if (assetError) setNotice('อัปโหลดเพลงแล้ว แต่บันทึกคลังไฟล์ไม่สำเร็จ: ' + assetError.message);
    else setNotice('อัปโหลดเพลงสำเร็จ ♡ กด “บันทึกการเปลี่ยนแปลง” เพื่อใช้งาน');
    e.target.value = '';
  }
  async function deleteAsset(asset) {
    if (!confirm('ลบรูปภาพนี้ออกจากคลังหรือไม่?')) return;
    const { error } = await supabase.storage.from('ellith-media').remove([asset.path]);
    if (error) { setNotice(error.message); return; }
    await supabase.from('media_assets').delete().eq('id', asset.id);
    await refresh();
  }

  if (page === 'admin') {
    return <main className="admin-shell">
      <header className="admin-top"><a className="wordmark" href="#" onClick={() => { location.hash = ''; setPage('home'); }}>ellith<span>♡</span></a><span className="admin-label">STUDIO / ADMIN</span><a className="back-link" href="#">ดูหน้าเว็บไซต์ ↗</a></header>
      {!session ? <section className="login-wrap"><div className="login-card"><div className="tiny-flower">✿</div><p className="eyebrow">A LITTLE MAGIC INSIDE</p><h1>Welcome back</h1><p className="muted">เข้าสู่ระบบเพื่อจัดการเว็บไซต์ ellith</p>
        {!configured && <p className="warning">ยังไม่ได้ตั้งค่า Supabase — ดูวิธีตั้งค่าใน README.md</p>}
        <form onSubmit={login} className="login-form"><label>Username / Email<input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin@example.com" type="email" required /></label><label>Password<div className="password-wrap"><input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="รหัสผ่าน" required /><button type="button" className="icon-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>{loginError && <p className="error">{loginError}</p>}<button className="primary-btn full" disabled={!configured}>เข้าสู่ระบบ <span>♡</span></button></form><p className="tiny-note">บัญชีผู้ดูแลสร้างจาก Supabase Authentication</p></div></section> :
      <div className="dashboard"><aside className="sidebar"><p className="eyebrow">WORKSPACE</p>{[['general','♡','ข้อมูลเว็บไซต์'],['links','↗','ช่องทางติดต่อ'],['images','✿','คลังรูปภาพ']].map(([id,ico,label])=><button key={id} className={'side-item '+(tab===id?'selected':'')} onClick={() => setTab(id)}><span>{ico}</span>{label}</button>)}<button className="side-item logout" onClick={logout}><LogOut />ออกจากระบบ</button></aside><section className="dash-content"><div className="dash-heading"><div><p className="eyebrow">HELLO, CREATOR</p><h1>จัดการเว็บไซต์ <em>ellith</em></h1><p className="muted">ทุกการเปลี่ยนแปลงอยู่ในมือคุณ ♡</p></div><span className="live-pill">● CONNECTED</span></div>
      {notice && <div className="notice">{notice}</div>}
      {tab === 'general' && <form className="panel form-grid" onSubmit={saveSite}><div className="panel-title"><Sparkles /><div><h2>ข้อมูลเว็บไซต์</h2><p>ปรับแต่งหน้าตาและข้อความหน้าแรก</p></div></div><label>ชื่อเว็บไซต์<input value={site.name} onChange={e=>setSite({...site,name:e.target.value})}/></label><label>ข้อความใต้ชื่อ<input value={site.tagline||''} onChange={e=>setSite({...site,tagline:e.target.value})}/></label><label className="wide">ข้อความแนะนำ<textarea rows="3" value={site.bio||''} onChange={e=>setSite({...site,bio:e.target.value})}/></label><label>โทนสี<select value={site.theme||'pink'} onChange={e=>setSite({...site,theme:e.target.value})}><option value="pink">Pink & White</option><option value="lavender">Lavender</option><option value="cream">Cream</option></select></label>{[['avatar_url','รูปโปรไฟล์'],['cover_url','ภาพปก'],['background_url','ภาพพื้นหลัง']].map(([field,label])=><label key={field}>{label}<div className="upload-row"><input value={site[field]||''} onChange={e=>setSite({...site,[field]:e.target.value})} placeholder="URL หรืออัปโหลดไฟล์"/><label className="upload-btn"><Upload/><input type="file" accept="image/*" onChange={e=>uploadImage(e,field)} hidden/></label></div></label>)}<label className="wide">เพลงพื้นหลัง (MP3)<div className="upload-row"><input value={site.music_url||''} onChange={e=>setSite({...site,music_url:e.target.value})} placeholder="วาง URL เพลง หรือเลือกไฟล์ MP3"/><label className="upload-btn" title="เลือกไฟล์เพลง MP3"><Music2/><input type="file" accept=".mp3,audio/mpeg,audio/mp3" onChange={uploadMusic} hidden/></label></div><small className="muted">รองรับไฟล์ MP3 ขนาดไม่เกิน 10 MB หรือวางลิงก์เพลงโดยตรง</small></label><div className="wide"><button className="primary-btn" disabled={saving}><Save/> {saving?'กำลังบันทึก…':'บันทึกการเปลี่ยนแปลง'}</button></div></form>}
      {tab === 'links' && <div className="panel"><div className="panel-title"><Heart/><div><h2>ช่องทางการติดต่อ</h2><p>เพิ่มและแก้ไขลิงก์ที่แสดงบนหน้าเว็บไซต์</p></div></div><form className="link-editor" onSubmit={saveLink}><input required placeholder="ชื่อช่องทาง เช่น Instagram" value={linkForm.label} onChange={e=>setLinkForm({...linkForm,label:e.target.value})}/><input required type="url" placeholder="https://..." value={linkForm.url} onChange={e=>setLinkForm({...linkForm,url:e.target.value})}/><input placeholder="ข้อความสั้น ๆ (ไม่บังคับ)" value={linkForm.note} onChange={e=>setLinkForm({...linkForm,note:e.target.value})}/><div className="editor-actions"><button className="primary-btn"><Plus/> {editing?'บันทึกการแก้ไข':'เพิ่มช่องทาง'}</button>{editing&&<button type="button" className="soft-btn" onClick={()=>{setEditing(null);setLinkForm(emptyLink)}}>ยกเลิก</button>}</div></form><div className="managed-list">{links.map(link=><div className="managed-row" key={link.id}><div className="managed-icon">{iconFor(link.label)}</div><div className="managed-info"><b>{link.label}</b><small>{link.url}</small></div><button className="icon-btn" onClick={()=>{setEditing(link);setLinkForm({label:link.label,url:link.url,note:link.note||'',icon:link.icon||'link'})}}><Pencil/></button><button className="icon-btn danger" onClick={()=>deleteLink(link.id)}><Trash2/></button></div>)}</div></div>}
      {tab === 'images' && <div className="panel"><div className="panel-title"><ImagePlus/><div><h2>คลังรูปภาพ</h2><p>รูปภาพที่อัปโหลดไว้ในเว็บไซต์</p></div></div><div className="asset-grid">{assets.map(asset=><div className="asset-card" key={asset.id}><img src={asset.url} alt={asset.name}/><div><span>{asset.name}</span><button className="icon-btn danger" onClick={()=>deleteAsset(asset)}><Trash2/></button></div></div>)}</div>{!assets.length&&<p className="muted">ยังไม่มีรูปภาพในคลัง ลองอัปโหลดจากหน้าข้อมูลเว็บไซต์</p>}</div>}
      </section></div>}
    </main>;
  }

  return <><main className={'site-shell theme-'+(site.theme||'pink')} style={site.background_url?{backgroundImage:'linear-gradient(#fff8f3bb,#fff8f3bb),url('+site.background_url+')'}:{}}>
    <div className="admin-shortcut"><a href="#admin" aria-label="เปิดหน้า Admin"><Heart size={17} fill="currentColor"/> <span>ADMIN</span></a></div>
    <div className="sparkle s1">✧</div><div className="sparkle s2">✦</div><div className="sparkle s3">✧</div>
    <section className="profile-card">
      <div className="cover-frame" aria-label="ภาพปกตกแต่งกรอบลายวินเทจ">
        {site.cover_url ? <img className="cover-photo" src={site.cover_url} alt="ภาพปกเว็บไซต์" /> : <div className="cover-empty">your little memory ♡</div>}
        <svg className="cover-ornament" viewBox="0 0 600 900" preserveAspectRatio="none" aria-hidden="true">
          <defs><filter id="softEmboss"><feGaussianBlur stdDeviation="1.1" /></filter></defs>
          <g fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="17" y="17" width="566" height="866" rx="18" opacity=".42"/>
            <path d="M28 180 C28 135 47 115 79 104 C43 89 39 53 72 32 C96 16 126 29 137 56 C150 27 180 25 198 45 C215 65 198 89 173 94 C207 105 225 91 248 76 M35 145 C64 148 78 132 82 111 C99 130 120 134 139 116 C155 100 147 79 131 70 C115 61 96 68 92 84 C89 101 104 111 117 103 M43 177 C65 170 74 155 72 138 M101 34 C91 52 94 65 107 78 M156 37 C145 52 149 68 165 77"/>
            <path d="M572 180 C572 135 553 115 521 104 C557 89 561 53 528 32 C504 16 474 29 463 56 C450 27 420 25 402 45 C385 65 402 89 427 94 C393 105 375 91 352 76 M565 145 C536 148 522 132 518 111 C501 130 480 134 461 116 C445 100 453 79 469 70 C485 61 504 68 508 84 C511 101 496 111 483 103 M557 177 C535 170 526 155 528 138 M499 34 C509 52 506 65 493 78 M444 37 C455 52 451 68 435 77"/>
            <path d="M28 720 C28 765 47 785 79 796 C43 811 39 847 72 868 C96 884 126 871 137 844 C150 873 180 875 198 855 C215 835 198 811 173 806 C207 795 225 809 248 824 M35 755 C64 752 78 768 82 789 C99 770 120 766 139 784 C155 800 147 821 131 830 C115 839 96 832 92 816 C89 799 104 789 117 797 M43 723 C65 730 74 745 72 762 M101 866 C91 848 94 835 107 822 M156 863 C145 848 149 832 165 823"/>
            <path d="M572 720 C572 765 553 785 521 796 C557 811 561 847 528 868 C504 884 474 871 463 844 C450 873 420 875 402 855 C385 835 402 811 427 806 C393 795 375 809 352 824 M565 755 C536 752 522 768 518 789 C501 770 480 766 461 784 C445 800 453 821 469 830 C485 839 504 832 508 816 C511 799 496 789 483 797 M557 723 C535 730 526 745 528 762 M499 866 C509 848 506 835 493 822 M444 863 C455 848 451 832 435 823"/>
            <path d="M300 430 C267 389 214 393 202 434 C190 477 245 520 300 562 C355 520 410 477 398 434 C386 393 333 389 300 430Z" opacity=".72"/>
            <path d="M202 436 C166 411 130 392 91 389 C132 421 153 452 175 484 C137 466 108 463 72 468 C119 493 149 526 183 562 C145 551 117 556 89 570 C141 584 176 616 211 655 C185 614 168 575 158 538 C191 567 220 592 249 607 M398 436 C434 411 470 392 509 389 C468 421 447 452 425 484 C463 466 492 463 528 468 C481 493 451 526 417 562 C455 551 483 556 511 570 C459 584 424 616 389 655 C415 614 432 575 442 538 C409 567 380 592 351 607" opacity=".7"/>
            <path d="M189 440 C165 432 143 415 127 396 M177 462 C147 451 125 439 104 420 M166 491 C137 481 114 471 91 452 M183 526 C152 515 130 502 109 485 M204 563 C174 551 153 537 132 520 M411 440 C435 432 457 415 473 396 M423 462 C453 451 475 439 496 420 M434 491 C463 481 486 471 509 452 M417 526 C448 515 470 502 491 485 M396 563 C426 551 447 537 468 520" opacity=".48"/>
          </g>
        </svg>
      </div>
      <div className="top-ornament">୨୧　✧　୨୧</div>
      <div className="avatar-frame">{site.avatar_url?<img src={site.avatar_url} alt={site.name}/>:<div className="avatar-placeholder">♡</div>}<span className="avatar-star">✦</span></div>
      <p className="eyebrow">WELCOME TO MY LITTLE WORLD</p><h1>{site.name || 'ellith'}</h1><p className="tagline">{site.tagline || 'a little place of magic'}</p><div className="divider-ornament"><span>✧</span><i></i><span>♡</span><i></i><span>✧</span></div><p className="bio">{site.bio || 'welcome to my little corner ♡'}</p>
      <div className="contact-list">{publicLinks.map((link,i)=><a className="contact-link" href={link.url} target="_blank" rel="noreferrer" key={link.id}><span className="contact-icon">{iconFor(link.label)}</span><span className="contact-copy"><b>{link.label}</b><small>{link.note || 'connect with me'}</small></span><ExternalLink className="external-icon"/><span className="link-number">0{i+1}</span></a>)}</div>
      {!publicLinks.length&&<p className="muted">ช่องทางการติดต่อจะปรากฏที่นี่ ♡</p>}
      <div className="music-control">{site.music_url&&<audio id="bg-music" src={site.music_url} loop/>}<button onClick={()=>{const audio=document.getElementById('bg-music');if(!audio)return;if(musicOn){audio.pause();setMusicOn(false)}else{audio.play().then(()=>setMusicOn(true)).catch(()=>setNotice('ไม่สามารถเล่นเพลงได้'))}}}><span>{musicOn?<Volume2/>:<VolumeX/>}</span>{musicOn?'MUSIC ON':'MUSIC OFF'}</button><span className="music-note">♪ ♫ ♪</span></div>
      <footer>made with <Heart size={12} fill="currentColor"/> & a little magic <span>✧</span></footer>
      <p className="bottom-note">♡ thank you for visiting ♡</p>
    </section>
  </main></>;
}
