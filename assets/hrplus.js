/* ===== HR+ ENHANCEMENTS (self-contained module) ===== */
(function(){
'use strict';
try {
const F = [];
const TOOLS = {}, CHEATS = {}, PLAN = {}, LISTS = {}, CALCS = {}, FORMS = {}, STUDY = {}, DRILLS = {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const store = {
  get(k, d){ try { const v = localStorage.getItem('hrp:' + k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem('hrp:' + k, JSON.stringify(v)); } catch(e){} },
  del(k){ try { localStorage.removeItem('hrp:' + k); } catch(e){} }
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function feat(name, fn){ try { fn(); F.push(name); } catch(e){ console.warn('[HR+] feature failed:', name, e); } }
function toast(msg, type, icon){ if (window.showToast) window.showToast(msg, type || 'info', icon || 'ℹ️'); }
async function copy(t, quiet){
  try { await navigator.clipboard.writeText(t); }
  catch(e){ const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch(_){} a.remove(); }
  if (!quiet) toast('Copied to clipboard', 'success', '📋');
}
function download(name, text, mime){
  const b = new Blob([text], { type: mime || 'text/plain' });
  const u = URL.createObjectURL(b); const a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1500);
}
function el(tag, attrs, html){
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
  if (html != null) e.innerHTML = html;
  return e;
}
const pad = n => String(n).padStart(2, '0');
const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
const pick = arr => arr[rnd(arr.length)];
const csvCell = v => { v = String(v ?? ''); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const toCSV = rows => rows.map(r => r.map(csvCell).join(',')).join('\n');
const isTyping = t => t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

/* ---------- settings ---------- */
const S = Object.assign({ fs: 1, contrast: false, dys: false, motion: false, links: false, accent: '#7c5cff', hi: false },
  store.get('settings', {}));
if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && store.get('settings', null) === null) S.motion = true;
const saveS = () => store.set('settings', S);
function applySettings(){
  const r = document.documentElement;
  r.style.setProperty('--fs', S.fs);
  r.classList.toggle('hrp-contrast', !!S.contrast);
  r.classList.toggle('hrp-dyslexia', !!S.dys);
  r.classList.toggle('hrp-nomotion', !!S.motion);
  r.classList.toggle('hrp-links', !!S.links);
  r.style.setProperty('--violet', S.accent);
  const tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.setAttribute('content', S.accent);
}
applySettings();

/* ---------- gamification core ---------- */
const BADGES = {
  early:['🐣','Early Bird','Opened the site'], explorer:['🧭','Explorer','Scrolled the whole page'],
  tools3:['🛠️','Toolsmith','Used 3 different tools'], faq3:['📚','Curious Mind','Opened 3 FAQs'],
  night:['🦉','Night Owl','Visited between 12am and 5am'], konami:['🎮','Konami Master','Found the secret code'],
  streak3:['🔥','On Fire','3-day visit streak'], notes:['📝','Note Taker','Saved a note'],
  planner:['🗓️','Planner','Generated a 36-hour plan'], star:['⭐','Bookmarker','Bookmarked a problem statement'],
  share:['📣','Ambassador','Shared the site'], check5:['✅','Checklist Pro','Ticked 5 checklist items'],
  theme:['🎨','Stylist','Changed the accent colour'], lang:['🇮🇳','Bilingual','Switched to Hindi'],
  pitch:['🎤','Pitch Ready','Ran the pitch timer'], focus:['🍅','Deep Focus','Finished a focus session']
};
const G = { xp: store.get('xp', 0), badges: store.get('badges', {}), used: store.get('used', {}), days: store.get('days', []) };
function addXP(n){ G.xp += n; store.set('xp', G.xp); }
const level = () => Math.floor(Math.sqrt(G.xp / 25)) + 1;
function award(id){
  if (G.badges[id] || !BADGES[id]) return;
  G.badges[id] = Date.now(); store.set('badges', G.badges); addXP(50);
  toast('Badge unlocked: ' + BADGES[id][1], 'success', BADGES[id][0]); confetti(28);
}
function useTool(n){
  if (G.used[n]) return; G.used[n] = 1; store.set('used', G.used); addXP(5);
  if (Object.keys(G.used).length >= 3) award('tools3');
}
function streak(){
  const set = new Set(G.days); let n = 0; const d = new Date();
  while (set.has(ymd(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ---------- confetti ---------- */
function confetti(n){
  if (S.motion) return;
  const cols = ['#7c5cff','#22d3ee','#ff4d9d','#3ddc84','#ff9f43','#fbbf24'];
  const cnt = Math.min(n || 60, matchMedia('(max-width:700px)').matches ? 24 : 60); for (let i = 0; i < cnt; i++) {
    const c = el('i', { class: 'hrp-conf' });
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = cols[i % cols.length];
    c.style.animationDuration = (2 + Math.random() * 2.5) + 's'; c.style.animationDelay = Math.random() * .6 + 's';
    document.body.appendChild(c); setTimeout(() => c.remove(), 5500);
  }
}

/* ============ FEATURES: accessibility & display ============ */
feat('Skip-to-content link', () => {
  const m = $('main'); if (m) { m.id = m.id || 'main-content'; m.setAttribute('tabindex', '-1'); }
  const a = el('a', { class: 'hrp-skip', href: '#' + (m ? m.id : 'themes') }, 'Skip to content');
  document.body.prepend(a);
});
feat('Working A- / A / A+ text size buttons', () => {
  const box = $$('.govt-bar .right a').find(a => /A-/.test(a.textContent)); if (!box) return;
  const wrap = el('span', { style: 'display:inline-flex;gap:6px;align-items:center' },
    '<button type="button" data-fs="-1" aria-label="Decrease text size" class="hrp-mini" style="padding:1px 8px">A-</button>' +
    '<button type="button" data-fs="0" aria-label="Reset text size" class="hrp-mini" style="padding:1px 8px">A</button>' +
    '<button type="button" data-fs="1" aria-label="Increase text size" class="hrp-mini" style="padding:1px 8px">A+</button>');
  box.replaceWith(wrap);
  wrap.addEventListener('click', e => {
    const b = e.target.closest('[data-fs]'); if (!b) return;
    const d = +b.dataset.fs; S.fs = d === 0 ? 1 : Math.min(1.3, Math.max(.85, +(S.fs + d * .05).toFixed(2)));
    saveS(); applySettings();
  });
});
feat('Text size persists across visits', () => {});
feat('High-contrast mode', () => {});
feat('Dyslexia-friendly text mode', () => {});
feat('Reduce-motion mode (auto-detects OS setting)', () => {});
feat('Underline-all-links mode', () => {});
feat('Accent colour picker (5 palettes)', () => {});
feat('Keyboard focus outlines', () => {});
feat('Print-friendly stylesheet', () => {});
feat('Scroll offset for sticky header', () => {
  const st = el('style', null, 'section[id],h2[id]{scroll-margin-top:96px}');
  document.head.appendChild(st);
});

/* ---------- Hindi / English ---------- */
const I18N = [
  ['#navLinks a:nth-child(1)','Home','होम'],['#navLinks a:nth-child(2)','Themes','थीम्स'],
  ['#navLinks a:nth-child(3)','Problem Statements','समस्या कथन'],['#navLinks a:nth-child(4)','Code Lab','कोड लैब'],
  ['#navLinks a:nth-child(5)','Code Arena','कोड एरीना'],['#navLinks a:nth-child(6)','Register','पंजीकरण'],
  ['#navLinks a:nth-child(7)','Contact','संपर्क'],
  ['.hero-sub',null,'हैकाथॉन राइवल्स कॉलेजों, मंत्रालयों और समस्या-समाधानकर्ताओं को 36 घंटे के ग्रैंड फिनाले के लिए एक साथ लाता है। टीम बनाइए, समस्या चुनिए और ऐसे समाधान बनाइए जो मायने रखते हैं।'],
  ['.hero-actions a:nth-child(1)',null,'अपनी टीम रजिस्टर करें →'],['.hero-actions a:nth-child(2)',null,'समस्या कथन देखें'],
  ['.hero-note',null,'🎓 सभी कॉलेजों के लिए खुला · निःशुल्क पंजीकरण'],
  ['.countdown-info h2',null,'36 घंटे। एक मौका। नींद नहीं।'],
  ['#problems .sec-head h2',null,'अपनी चुनौती चुनिए'],['#faq .sec-head h2',null,'अक्सर पूछे जाने वाले प्रश्न'],
  ['.cta-box h2',null,'अपने प्रतिद्वंद्वियों का सामना करने को तैयार?']
];
feat('Hindi ⇄ English switch for main labels', () => {
  const link = $$('.govt-bar .right a').find(a => /हिंदी|English/.test(a.textContent)); if (!link) return;
  function apply(){
    I18N.forEach(([sel, en, hi]) => { const e = $(sel); if (!e) return;
      if (e.dataset.hrpEn == null) e.dataset.hrpEn = e.textContent;
      e.textContent = S.hi ? hi : e.dataset.hrpEn; });
    link.textContent = S.hi ? 'English' : 'हिंदी';
    document.documentElement.lang = S.hi ? 'hi' : 'en';
  }
  link.addEventListener('click', e => { e.preventDefault(); S.hi = !S.hi; saveS(); apply(); if (S.hi) award('lang'); });
  if (S.hi) apply();
  window.__hrpLang = apply;
});

/* ============ FEATURES: navigation ============ */
feat('Scroll-progress bar', () => {
  const b = el('div', { id: 'hrpProgress', 'aria-hidden': 'true' }); document.body.appendChild(b);
  let queued = false, won = false;
  const paint = () => { queued = false; const d = document.documentElement, max = d.scrollHeight - d.clientHeight, y = window.scrollY; b.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')'; if (!won && max > 0 && y / max > .97) { won = true; award('explorer'); } };
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
  window.addEventListener('resize', paint); paint();
});
feat('Back-to-top button', () => {
  const b = el('button', { class: 'hrp-fab', id: 'hrpTopBtn', 'aria-label': 'Back to top', type: 'button' }, '↑');
  document.body.appendChild(b);
  b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: S.motion ? 'auto' : 'smooth' }));
  window.addEventListener('scroll', () => b.classList.toggle('show', window.scrollY > 700), { passive: true });
});
feat('Heading anchor links (copy section URL)', () => {
  $$('section[id] h2').forEach(h => {
    const sec = h.closest('section[id]'); const a = el('span', { class: 'hrp-anchor', role: 'button', tabindex: '0', title: 'Copy link to this section' }, '🔗');
    const go = () => copy(location.origin + location.pathname + '#' + sec.id);
    a.addEventListener('click', go); a.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    h.appendChild(a);
  });
});
feat('Sticky mini countdown pill', () => {
  const p = el('div', { id: 'hrpStick', role: 'button', tabindex: '0' }, ''); document.body.appendChild(p);
  let lastHdr = -1, lastTxt = null, lastShow = null, queued = false;
  const upd = () => {
    queued = false; const t = window.__hrpHackPill ? window.__hrpHackPill() : null;
    const hd = document.querySelector('header'); if (hd) { const v = Math.round(hd.getBoundingClientRect().bottom + 8); if (v !== lastHdr) { lastHdr = v; document.documentElement.style.setProperty('--hrp-hdr', v + 'px'); } }
    if (t !== lastTxt) { lastTxt = t; p.textContent = t || ''; }
    const show = !!t && window.scrollY > 800; if (show !== lastShow) { lastShow = show; p.classList.toggle('show', show); }
  };
  setInterval(upd, 1000); window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  p.addEventListener('click', () => { const r = $('#hackathon') || $('#register'); if (r) r.scrollIntoView({ behavior: 'smooth' }); });
});
feat('Page title follows current section', () => {
  const base = document.title; const secs = $$('section[id]:not(#admin)');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { const h = $('h2', e.target); document.title = (h ? h.textContent.replace('🔗', '').trim() + ' · ' : '') + 'Hackathon Rivals'; }
  }), { rootMargin: '-40% 0px -50% 0px' });
  secs.forEach(s => io.observe(s));
  window.addEventListener('scroll', () => { if (window.scrollY < 300) document.title = base; }, { passive: true });
});
feat('"Come back" tab title when the tab is hidden', () => {
  let keep = document.title;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { keep = document.title; document.title = '👋 Come back — Hackathon Rivals'; } else document.title = keep;
  });
});
feat('Online / offline banner', () => {
  const b = el('div', { id: 'hrpBanner', role: 'status' }, ''); document.body.appendChild(b);
  const show = (t, ok) => { b.textContent = t; b.style.background = ok ? 'var(--green)' : 'var(--orange)'; b.classList.add('show'); if (ok) setTimeout(() => b.classList.remove('show'), 2500); };
  window.addEventListener('offline', () => show('📡 You are offline — some features may not work', false));
  window.addEventListener('online', () => show('✅ Back online', true));
  if (!navigator.onLine) show('📡 You are offline — some features may not work', false);
});
feat('Toast: click to dismiss + max 4 stacked + notification log', () => {
  const wrap = $('#toastWrap'); if (!wrap) return;
  wrap.addEventListener('click', e => { const t = e.target.closest('.toast'); if (t) t.remove(); });
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (!(n instanceof HTMLElement) || !n.classList.contains('toast')) return;
    while (wrap.children.length > 4) wrap.firstChild.remove();
    const txt = n.textContent.trim(); const log = store.get('notif', []);
    log.unshift({ t: Date.now(), m: txt.replace(/^\W+/, '') }); store.set('notif', log.slice(0, 30));
    const d = $('#hrpDot'); if (d) d.classList.add('on');
    if (/Registration submitted successfully/i.test(txt)) confetti(90);
  }))).observe(wrap, { childList: true });
});
feat('Confetti on successful registration', () => {});
feat('Konami-code easter egg 🎮', () => {
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']; let i = 0;
  document.addEventListener('keydown', e => {
    if (!e.key) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    i = (k === seq[i]) ? i + 1 : (k === seq[0] ? 1 : 0);
    if (i === seq.length) { i = 0; confetti(120); toast('Cheat code activated: +100 XP', 'success', '🎮'); addXP(100); award('konami'); }
  });
});

/* ============ HUB MODAL ============ */
const TABS = [];   // [id, label, render]
let hubEl, hubTab = store.get('lastTab', 'home');
function openHub(tab){
  if (!hubEl) return;
  if (tab) hubTab = tab;
  hubEl.classList.add('open'); const d = $('#hrpDot'); if (d && hubTab === 'home') d.classList.remove('on');
  renderHub();
}
function closeAll(){ $$('.hrp-bg.open').forEach(b => { if (!b.dataset.noesc) b.classList.remove('open'); }); }
function renderHub(){
  const tabs = $('.hrp-tabs', hubEl);
  const oldBody = $('.hrp-body', hubEl), body = oldBody.cloneNode(false); oldBody.replaceWith(body); // fresh node = no stale listeners from earlier tabs
  tabs.innerHTML = '';
  const vis = TABS.filter(x => !x[3] || x[3]()); if (!vis.some(x => x[0] === hubTab)) hubTab = vis[0][0];
  vis.forEach(([id, label]) => {
    const b = el('button', { class: 'hrp-tab' + (id === hubTab ? ' active' : ''), type: 'button' }, label);
    b.addEventListener('click', () => { hubTab = id; store.set('lastTab', id); renderHub(); });
    tabs.appendChild(b);
  });
  body.innerHTML = '';
  const t = vis.find(x => x[0] === hubTab) || vis[0];
  try { t[2](body); } catch(e){ body.textContent = 'Something went wrong loading this tab.'; console.warn(e); }
  body.scrollTop = 0;
}
function multi(c, registry, key){
  const names = Object.keys(registry);
  const sel = el('select', { class: 'hrp-sel', 'aria-label': 'Choose' }, names.map(n => `<option>${esc(n)}</option>`).join(''));
  const saved = store.get(key, names[0]); if (names.includes(saved)) sel.value = saved;
  let sub = el('div', { style: 'margin-top:14px' });
  c.append(sel, sub);
  const go = () => { store.set(key, sel.value); const fresh = el('div', { style: 'margin-top:14px' }); sub.replaceWith(fresh); sub = fresh; try { registry[sel.value](sub); } catch(e){ sub.textContent = 'Error: ' + e.message; } };
  sel.addEventListener('change', go); go();
}
function reg(cat, name, fn){
  const map = { tools: TOOLS, cheats: CHEATS, plan: PLAN, lists: LISTS, calc: CALCS, forms: FORMS, study: STUDY, drills: DRILLS }[cat];
  feat(({ tools: 'Tool', cheats: 'Cheat sheet', plan: 'Planner', lists: 'List', calc: 'Calculator', forms: 'Formula sheet', study: 'Study tool', drills: 'Drill' }[cat]) + ': ' + name, () => { map[name] = c => { useTool(name); fn(c); }; });
}

feat('HR+ Hub (floating button + tabbed panel)', () => {
  hubEl = el('div', { class: 'hrp-bg', id: 'hrpHub', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'HR+ Hub' },
    '<div class="hrp-modal"><div class="hrp-head"><h3>⚡ HR+ Hub</h3><button class="hrp-x" type="button" aria-label="Close">✕</button></div><div class="hrp-tabs"></div><div class="hrp-body"></div></div>');
  document.body.appendChild(hubEl);
  hubEl.addEventListener('click', e => { if (e.target === hubEl || e.target.closest('.hrp-x')) hubEl.classList.remove('open'); });
  const fab = el('button', { class: 'hrp-fab', id: 'hrpHubBtn', type: 'button', 'aria-label': 'Open HR+ Hub', title: 'HR+ Hub (Ctrl+K for commands)' }, '⚡<span class="hrp-dot" id="hrpDot"></span>');
  fab.style.position = 'fixed'; document.body.appendChild(fab);
  fab.addEventListener('click', () => openHub());
});

/* ============ COMMAND PALETTE ============ */
feat('Command palette (Ctrl/⌘ + K)', () => {
  const go = id => () => { const t = id ? document.getElementById(id) : null; if (t) t.scrollIntoView({ behavior: S.motion ? 'auto' : 'smooth' }); else window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const click = sel => () => { const e = $(sel); if (e) e.click(); };
  const CMDS = [
    ['🏠 Go to Home', 'g h', go(null)], ['🧩 Go to Themes', 'g t', go('themes')], ['📋 Go to Problem Statements', 'g p', go('problems')],
    ['💻 Go to Code Lab', 'g l', go('playground')], ['⚔️ Go to Code Arena', 'g a', go('arena')], ['📝 Go to Register', 'g r', go('register')],
    ['🏆 Go to Leaderboard', 'g b', go('leaderboard')], ['🏅 Go to Hall of Fame', '', go('fame')], ['✉️ Go to Contact', 'g c', go('contact')], ['❓ Go to FAQ', 'g f', go('faq')],
    ['🌓 Toggle dark / light theme', 't', click('#themeToggle')], ['🤖 Open AI assistant', '', click('#aiFab')], ['🔐 Log in / Sign up', '', click('#loginBtn')],
    ['🛠️ Open developer tools', '', () => openHub('tools')], ['📚 Open cheat sheets', '', () => openHub('cheats')], ['🗓️ Open planner & timers', '', () => openHub('plan')],
    ['✅ Open checklists, notes & to-do', '', () => openHub('lists')], ['🏅 Open badges & XP', '', () => openHub('badges')], ['📣 Share Hackathon Rivals', '', () => openHub('share')],
    ['⚙️ Open settings', '', () => openHub('settings')], ['❔ Keyboard shortcuts & help', '?', () => openHub('help')],
    ['🎲 Random problem statement', '', () => window.__hrpRandomPS && window.__hrpRandomPS()], ['🔗 Copy page link', '', () => copy(location.href)],
    ['🖨️ Print this page', '', () => window.print()], ['⬆️ Scroll to top', 'u', go(null)],
    ['🎤 Open pitch timer', '', () => { store.set('planSel', 'Pitch timer'); openHub('plan'); }]
  ];
  window.__hrpCmds = CMDS;
  const bg = el('div', { class: 'hrp-bg', id: 'hrpPalette', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Command palette' },
    '<div class="hrp-modal"><div style="padding:12px"><input class="hrp-in" placeholder="Type a command…  (↑ ↓ Enter, Esc to close)" aria-label="Search commands"></div><div class="hrp-list" style="max-height:52vh;overflow:auto"></div></div>');
  document.body.appendChild(bg);
  const inp = $('input', bg), list = $('.hrp-list', bg); let sel = 0, shown = [];
  function draw(){
    const q = inp.value.trim().toLowerCase();
    shown = CMDS.filter(c => !q || c[0].toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = shown.map((c, i) => `<div class="hrp-pi${i === sel ? ' sel' : ''}" data-i="${i}">${esc(c[0])}<small>${esc(c[1])}</small></div>`).join('') || '<div class="hrp-pi">No matches</div>';
  }
  function run(i){ const c = shown[i]; if (!c) return; bg.classList.remove('open'); setTimeout(c[2], 30); }
  inp.addEventListener('input', () => { sel = 0; draw(); });
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
    else if (e.key === 'Enter') { run(sel); }
  });
  list.addEventListener('click', e => { const p = e.target.closest('.hrp-pi[data-i]'); if (p) run(+p.dataset.i); });
  bg.addEventListener('click', e => { if (e.target === bg) bg.classList.remove('open'); });
  window.__hrpPalette = () => { closeAll(); bg.classList.add('open'); inp.value = ''; sel = 0; draw(); setTimeout(() => inp.focus(), 20); };
});

feat('Global keyboard shortcuts (t, ?, /, g + key, u, Esc)', () => {
  let g = 0; const map = { h: null, t: 'themes', p: 'problems', l: 'playground', a: 'arena', r: 'register', b: 'leaderboard', c: 'contact', f: 'faq' };
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); window.__hrpPalette && window.__hrpPalette(); return; }
    if (e.key === 'Escape') { closeAll(); return; }
    if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (g && Date.now() - g < 1000) {
      g = 0; const k = e.key.toLowerCase();
      if (k in map) { e.preventDefault(); const t = map[k] ? document.getElementById(map[k]) : null; if (t) t.scrollIntoView({ behavior: 'smooth' }); else window.scrollTo({ top: 0, behavior: 'smooth' }); }
      return;
    }
    if (e.key === 'g') { g = Date.now(); return; }
    if (e.key === '/') { e.preventDefault(); window.__hrpPalette && window.__hrpPalette(); }
    else if (e.key === '?') { openHub('help'); }
    else if (e.key === 't') { const b = $('#themeToggle'); if (b) b.click(); }
    else if (e.key === 'u') { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
});

/* ============ TOOLS ============ */
const nu = (c, s) => $(s, c);
reg('tools', 'JSON formatter & validator', c => {
  c.innerHTML = `<textarea class="hrp-ta" placeholder='{"paste":"your json"}' aria-label="JSON input"></textarea>
  <div class="hrp-row"><button class="hrp-btn pri" data-a="fmt">Format</button><button class="hrp-btn" data-a="min">Minify</button><button class="hrp-btn" data-a="sort">Sort keys</button><button class="hrp-btn" data-a="copy">Copy result</button></div><div class="hrp-out"></div>`;
  const ta = $('textarea', c), out = $('.hrp-out', c); let last = '';
  const sortK = v => Array.isArray(v) ? v.map(sortK) : (v && typeof v === 'object') ? Object.keys(v).sort().reduce((o, k) => (o[k] = sortK(v[k]), o), {}) : v;
  c.addEventListener('click', e => {
    const a = e.target.dataset.a; if (!a) return;
    if (a === 'copy') return copy(last);
    try { const v = JSON.parse(ta.value); last = a === 'min' ? JSON.stringify(v) : JSON.stringify(a === 'sort' ? sortK(v) : v, null, 2); out.textContent = last; }
    catch(err){ last = ''; out.textContent = '❌ Invalid JSON: ' + err.message; }
  });
});
reg('tools', 'Base64 encode / decode', c => {
  c.innerHTML = `<textarea class="hrp-ta" aria-label="Text"></textarea><div class="hrp-row"><button class="hrp-btn pri" data-a="e">Encode</button><button class="hrp-btn" data-a="d">Decode</button><button class="hrp-btn" data-a="c">Copy</button></div><div class="hrp-out"></div>`;
  const ta = $('textarea', c), out = $('.hrp-out', c);
  c.addEventListener('click', e => {
    const a = e.target.dataset.a; if (!a) return;
    try {
      if (a === 'c') return copy(out.textContent);
      if (a === 'e') { const b = new TextEncoder().encode(ta.value); let s = ''; b.forEach(x => s += String.fromCharCode(x)); out.textContent = btoa(s); }
      else { const s = atob(ta.value.trim().replace(/-/g, '+').replace(/_/g, '/')); out.textContent = new TextDecoder().decode(Uint8Array.from(s, ch => ch.charCodeAt(0))); }
    } catch(err){ out.textContent = '❌ ' + err.message; }
  });
});
reg('tools', 'URL encode / decode & query parser', c => {
  c.innerHTML = `<textarea class="hrp-ta" placeholder="Text or full URL" aria-label="Input"></textarea><div class="hrp-row"><button class="hrp-btn pri" data-a="e">Encode</button><button class="hrp-btn" data-a="d">Decode</button><button class="hrp-btn" data-a="p">Parse URL</button></div><div class="hrp-out"></div>`;
  const ta = $('textarea', c), out = $('.hrp-out', c);
  c.addEventListener('click', e => {
    const a = e.target.dataset.a; if (!a) return;
    try {
      if (a === 'e') out.textContent = encodeURIComponent(ta.value);
      else if (a === 'd') out.textContent = decodeURIComponent(ta.value.replace(/\+/g, ' '));
      else { const u = new URL(ta.value.trim()); let t = `Protocol: ${u.protocol}\nHost: ${u.host}\nPath: ${u.pathname}\nHash: ${u.hash || '-'}\nParams:`; u.searchParams.forEach((v, k) => t += `\n  ${k} = ${v}`); out.textContent = t; }
    } catch(err){ out.textContent = '❌ ' + err.message; }
  });
});
reg('tools', 'UUID generator', c => {
  c.innerHTML = `<div class="hrp-row"><input class="hrp-in sm" type="number" min="1" max="50" value="5" aria-label="How many"><button class="hrp-btn pri">Generate</button><button class="hrp-btn" data-c="1">Copy</button></div><div class="hrp-out"></div>`;
  const out = $('.hrp-out', c), n = $('input', c);
  const uuid = () => { if (crypto.randomUUID) return crypto.randomUUID(); const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128; const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join(''); return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20); };
  const gen = () => { out.textContent = Array.from({ length: Math.min(50, Math.max(1, +n.value || 1)) }, uuid).join('\n'); };
  c.addEventListener('click', e => { if (e.target.dataset.c) copy(out.textContent); else if (e.target.classList.contains('pri')) gen(); }); gen();
});
reg('tools', 'Hash generator (SHA)', c => {
  c.innerHTML = `<textarea class="hrp-ta" placeholder="Text to hash" aria-label="Text"></textarea><div class="hrp-row"><select class="hrp-sel sm hrp-in" style="max-width:150px"><option>SHA-256</option><option>SHA-1</option><option>SHA-384</option><option>SHA-512</option></select><button class="hrp-btn pri">Hash</button><button class="hrp-btn" data-c="1">Copy</button></div><div class="hrp-out"></div>`;
  const out = $('.hrp-out', c);
  c.addEventListener('click', async e => {
    if (e.target.dataset.c) return copy(out.textContent);
    if (!e.target.classList.contains('pri')) return;
    try {
      if (!(crypto && crypto.subtle)) throw new Error('Hashing needs a secure (https) page');
      const buf = await crypto.subtle.digest($('select', c).value, new TextEncoder().encode($('textarea', c).value));
      out.textContent = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch(err){ out.textContent = '❌ ' + err.message; }
  });
});
reg('tools', 'Regex tester', c => {
  c.innerHTML = `<div class="hrp-row"><input class="hrp-in sm" placeholder="pattern e.g. \\b\\w+@\\w+\\.\\w+" aria-label="Pattern"><input class="hrp-in sm" style="max-width:80px;flex:0" value="g" aria-label="Flags"></div><textarea class="hrp-ta" placeholder="Test text" aria-label="Test text"></textarea><div class="hrp-muted" id="rxCount"></div><div class="hrp-out"></div>`;
  const [pi, fi] = $$('input', c), ta = $('textarea', c), out = $('.hrp-out', c), cnt = $('#rxCount', c);
  function run(){
    try {
      if (!pi.value) { out.textContent = ''; cnt.textContent = ''; return; }
      const flags = fi.value.includes('g') ? fi.value : fi.value + 'g'; const re = new RegExp(pi.value, flags); const t = ta.value.slice(0, 20000);
      let html = '', last = 0, n = 0, m;
      while ((m = re.exec(t)) && n < 500) { n++; html += esc(t.slice(last, m.index)) + '<mark class="hrp-hl">' + esc(m[0]) + '</mark>'; last = m.index + m[0].length; if (m[0] === '') re.lastIndex++; }
      out.innerHTML = html + esc(t.slice(last)); cnt.textContent = n + ' match' + (n === 1 ? '' : 'es');
    } catch(err){ out.textContent = '❌ ' + err.message; cnt.textContent = ''; }
  }
  [pi, fi, ta].forEach(x => x.addEventListener('input', run));
});
reg('tools', 'Timestamp / epoch converter', c => {
  c.innerHTML = `<div class="hrp-row"><input class="hrp-in sm" placeholder="Epoch (s/ms) or date e.g. 2026-05-15 09:00" aria-label="Value"><button class="hrp-btn pri">Convert</button><button class="hrp-btn" data-n="1">Now</button></div><div class="hrp-out"></div>`;
  const inp = $('input', c), out = $('.hrp-out', c);
  const show = d => { out.textContent = isNaN(d) ? '❌ Could not parse' : `Epoch (s): ${Math.floor(d / 1000)}\nEpoch (ms): ${d.getTime()}\nISO (UTC): ${d.toISOString()}\nLocal: ${d.toString()}\nIST: ${d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`; };
  c.addEventListener('click', e => {
    if (e.target.dataset.n) { inp.value = Date.now(); show(new Date()); }
    else if (e.target.classList.contains('pri')) { const v = inp.value.trim(); show(/^\d{9,13}$/.test(v) ? new Date(v.length <= 10 ? +v * 1000 : +v) : new Date(v)); }
  });
});
reg('tools', 'Colour converter & contrast checker', c => {
  c.innerHTML = `<div class="hrp-row"><label>Foreground <input type="color" value="#ffffff" data-k="f"></label><label>Background <input type="color" value="#0f1119" data-k="b"></label></div><div class="hrp-out" id="clOut"></div><div class="hrp-card" id="clPrev" style="margin-top:8px;font-size:18px;font-weight:600">Sample text — The quick brown fox</div>`;
  const [f, b] = $$('input', c), out = $('#clOut', c), prev = $('#clPrev', c);
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lum = ([r, g, bl]) => { const x = [r, g, bl].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * x[0] + .7152 * x[1] + .0722 * x[2]; };
  const hsl = ([r, g, bl]) => { r /= 255; g /= 255; bl /= 255; const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - bl) / d + (g < bl ? 6 : 0) : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4; h *= 60; } return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`; };
  function upd(){
    const A = rgb(f.value), B = rgb(b.value); const la = lum(A), lb = lum(B); const ratio = (Math.max(la, lb) + .05) / (Math.min(la, lb) + .05);
    prev.style.color = f.value; prev.style.background = b.value;
    out.textContent = `Foreground: ${f.value} · rgb(${A}) · ${hsl(A)}\nBackground: ${b.value} · rgb(${B}) · ${hsl(B)}\nContrast ratio: ${ratio.toFixed(2)}:1\nAA normal (4.5): ${ratio >= 4.5 ? '✅' : '❌'}   AA large (3): ${ratio >= 3 ? '✅' : '❌'}   AAA (7): ${ratio >= 7 ? '✅' : '❌'}`;
  }
  [f, b].forEach(x => x.addEventListener('input', upd)); upd();
});
reg('tools', 'Lorem ipsum generator', c => {
  c.innerHTML = `<div class="hrp-row"><input class="hrp-in sm" type="number" min="1" max="10" value="2" aria-label="Paragraphs"><button class="hrp-btn pri">Generate</button><button class="hrp-btn" data-c="1">Copy</button></div><div class="hrp-out" style="font-family:inherit"></div>`;
  const W = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur'.split(' ');
  const out = $('.hrp-out', c);
  const para = () => { const s = Array.from({ length: 4 + rnd(3) }, () => { const w = Array.from({ length: 8 + rnd(10) }, () => pick(W)); w[0] = w[0][0].toUpperCase() + w[0].slice(1); return w.join(' ') + '.'; }); return s.join(' '); };
  const gen = () => { out.textContent = Array.from({ length: Math.min(10, Math.max(1, +$('input', c).value || 1)) }, para).join('\n\n'); };
  c.addEventListener('click', e => { if (e.target.dataset.c) copy(out.textContent); else if (e.target.classList.contains('pri')) gen(); }); gen();
});
reg('tools', 'Secure password generator', c => {
  c.innerHTML = `<div class="hrp-row"><label>Length <input type="range" min="8" max="64" value="16" id="pgLen"> <b id="pgLenV">16</b></label></div><div class="hrp-row"><label><input type="checkbox" checked data-o="u"> A-Z</label><label><input type="checkbox" checked data-o="l"> a-z</label><label><input type="checkbox" checked data-o="d"> 0-9</label><label><input type="checkbox" checked data-o="s"> Symbols</label></div><div class="hrp-row"><button class="hrp-btn pri">Generate</button><button class="hrp-btn" data-c="1">Copy</button></div><div class="hrp-out"></div><div class="hrp-muted" id="pgEnt"></div>`;
  const out = $('.hrp-out', c), len = $('#pgLen', c);
  const sets = { u: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', l: 'abcdefghijklmnopqrstuvwxyz', d: '0123456789', s: '!@#$%^&*()-_=+[]{};:,.?' };
  function gen(){
    $('#pgLenV', c).textContent = len.value;
    let pool = ''; $$('[data-o]', c).forEach(x => { if (x.checked) pool += sets[x.dataset.o]; });
    if (!pool) { out.textContent = 'Select at least one set'; return; }
    let p = ''; for (let i = 0; i < +len.value; i++) p += pool[rnd(pool.length)];
    out.textContent = p; $('#pgEnt', c).textContent = `≈ ${Math.round(len.value * Math.log2(pool.length))} bits of entropy`;
  }
  len.addEventListener('input', gen);
  c.addEventListener('click', e => { if (e.target.dataset.c) copy(out.textContent); else if (e.target.classList.contains('pri')) gen(); }); gen();
});
reg('tools', 'Word & character counter', c => {
  c.innerHTML = `<textarea class="hrp-ta" placeholder="Paste or type text…" aria-label="Text"></textarea><div class="hrp-out"></div>`;
  const ta = $('textarea', c), out = $('.hrp-out', c);
  const upd = () => { const t = ta.value; const w = (t.trim().match(/\S+/g) || []).length; out.textContent = `Words: ${w}\nCharacters: ${t.length}\nCharacters (no spaces): ${t.replace(/\s/g, '').length}\nLines: ${t ? t.split('\n').length : 0}\nSentences: ${(t.match(/[.!?]+(\s|$)/g) || []).length}\nReading time: ${Math.max(w ? 1 : 0, Math.ceil(w / 200))} min · Speaking time: ${Math.max(w ? 1 : 0, Math.ceil(w / 130))} min`; };
  ta.addEventListener('input', upd); upd();
});
reg('tools', 'Case converter & slugify', c => {
  c.innerHTML = `<textarea class="hrp-ta" aria-label="Text"></textarea><div class="hrp-row">${['UPPER','lower','Title Case','camelCase','snake_case','kebab-case','slug','Reverse'].map(x => `<button class="hrp-btn" data-a="${x}">${x}</button>`).join('')}<button class="hrp-btn pri" data-c="1">Copy</button></div><div class="hrp-out"></div>`;
  const ta = $('textarea', c), out = $('.hrp-out', c);
  const words = s => s.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[^A-Za-z0-9]+/).filter(Boolean);
  const F2 = { 'UPPER': s => s.toUpperCase(), 'lower': s => s.toLowerCase(), 'Title Case': s => s.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()),
    'camelCase': s => words(s).map((w, i) => i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join(''),
    'snake_case': s => words(s).map(w => w.toLowerCase()).join('_'), 'kebab-case': s => words(s).map(w => w.toLowerCase()).join('-'),
    'slug': s => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    'Reverse': s => Array.from(s).reverse().join('') };
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (a) out.textContent = F2[a](ta.value); else if (e.target.dataset.c) copy(out.textContent); });
});
function mdRender(src){
  let t = esc(src); const blocks = [];
  t = t.replace(/```([\s\S]*?)```/g, (m, code) => { blocks.push('<pre style="background:var(--surface-3);padding:10px;border-radius:8px;overflow:auto"><code>' + code.replace(/^\n/, '') + '</code></pre>'); return '\u0000' + (blocks.length - 1) + '\u0000'; });
  t = t.split('\n').map(line => {
    let m;
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) return `<h${m[1].length} style="margin:10px 0 4px">${m[2]}</h${m[1].length}>`;
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) return '<hr>';
    if ((m = line.match(/^&gt;\s?(.*)$/))) return `<blockquote style="border-left:3px solid var(--violet);margin:6px 0;padding-left:10px;color:var(--muted)">${m[1]}</blockquote>`;
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) return `<li style="margin-left:20px">${m[1]}</li>`;
    if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) return `<li style="margin-left:20px;list-style:decimal">${m[1]}</li>`;
    return line.trim() === '' ? '<br>' : line + '<br>';
  }).join('');
  t = t.replace(/`([^`]+)`/g, '<code style="background:var(--surface-3);padding:1px 5px;border-radius:5px">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--cyan);text-decoration:underline">$1</a>');
  return t.replace(/\u0000(\d+)\u0000/g, (m, i) => blocks[+i]);
}
reg('tools', 'Markdown live preview', c => {
  c.innerHTML = `<textarea class="hrp-ta" aria-label="Markdown">${esc('# Hello\n\nWrite **markdown** here.\n\n- item one\n- item two\n\n[Hackathon Rivals](https://www.hackathonrivals.in/)')}</textarea><div class="hrp-out" style="font-family:inherit;white-space:normal"></div>`;
  const ta = $('textarea', c), out = $('.hrp-out', c); const upd = () => { out.innerHTML = mdRender(ta.value); };
  ta.addEventListener('input', upd); upd();
});
reg('tools', 'Line sorter & de-duplicator', c => {
  c.innerHTML = `<textarea class="hrp-ta" placeholder="One item per line" aria-label="Lines"></textarea><div class="hrp-row">${['Sort A→Z','Sort Z→A','Remove duplicates','Reverse','Shuffle','Trim','Number'].map(x => `<button class="hrp-btn" data-a="${x}">${x}</button>`).join('')}<button class="hrp-btn pri" data-c="1">Copy</button></div><div class="hrp-out"></div>`;
  const ta = $('textarea', c), out = $('.hrp-out', c);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const OPS = { 'Sort A→Z': a => a.sort((x, y) => x.localeCompare(y)), 'Sort Z→A': a => a.sort((x, y) => y.localeCompare(x)), 'Remove duplicates': a => [...new Set(a)],
    'Reverse': a => a.reverse(), 'Shuffle': shuffle, 'Trim': a => a.map(s => s.trim()).filter(Boolean), 'Number': a => a.map((s, i) => (i + 1) + '. ' + s) };
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (a) out.textContent = OPS[a](ta.value.split('\n')).join('\n'); else if (e.target.dataset.c) copy(out.textContent); });
});
reg('tools', 'JWT decoder (no verification)', c => {
  c.innerHTML = `<textarea class="hrp-ta" placeholder="Paste a JWT" aria-label="JWT"></textarea><div class="hrp-out"></div><div class="hrp-muted">⚠️ Decoding only — the signature is NOT verified. Never paste production secrets.</div>`;
  const ta = $('textarea', c), out = $('.hrp-out', c);
  const dec = p => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(p.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(p.length / 4) * 4, '=')), ch => ch.charCodeAt(0))));
  ta.addEventListener('input', () => {
    try { const [h, p] = ta.value.trim().split('.'); const H = dec(h), P = dec(p); let t = 'HEADER\n' + JSON.stringify(H, null, 2) + '\n\nPAYLOAD\n' + JSON.stringify(P, null, 2);
      if (P.exp) t += '\n\nExpires: ' + new Date(P.exp * 1000).toLocaleString() + (P.exp * 1000 < Date.now() ? '  (EXPIRED)' : ''); out.textContent = t; }
    catch(e){ out.textContent = ta.value.trim() ? '❌ Not a valid JWT' : ''; }
  });
});
reg('tools', 'Number base converter', c => {
  c.innerHTML = `<div class="hrp-row"><input class="hrp-in sm" placeholder="Enter a number" aria-label="Number"><select class="hrp-in sm" aria-label="Base"><option value="10">Decimal</option><option value="2">Binary</option><option value="8">Octal</option><option value="16">Hex</option></select></div><div class="hrp-out"></div>`;
  const inp = $('input', c), sel = $('select', c), out = $('.hrp-out', c);
  const upd = () => {
    try { let v = inp.value.trim().replace(/^0[xbo]/i, '').replace(/[_\s]/g, ''); if (!v) { out.textContent = ''; return; }
      const b = +sel.value; const pre = { 2: '0b', 8: '0o', 10: '', 16: '0x' }[b]; if (b === 10 && !/^\d+$/.test(v)) throw new Error('Digits only'); const n = BigInt(pre + v);
      out.textContent = `Decimal: ${n.toString(10)}\nBinary:  ${n.toString(2)}\nOctal:   ${n.toString(8)}\nHex:     ${n.toString(16).toUpperCase()}`; }
    catch(e){ out.textContent = '❌ Invalid number for this base'; }
  };
  inp.addEventListener('input', upd); sel.addEventListener('change', upd);
});
reg('tools', 'CSV → JSON converter', c => {
  c.innerHTML = `<textarea class="hrp-ta" placeholder="name,age&#10;Asha,20" aria-label="CSV"></textarea><div class="hrp-row"><button class="hrp-btn pri">Convert</button><button class="hrp-btn" data-c="1">Copy</button></div><div class="hrp-out"></div>`;
  const ta = $('textarea', c), out = $('.hrp-out', c);
  function parse(t){ const rows = []; let r = [], f = '', q = false; for (let i = 0; i < t.length; i++) { const ch = t[i];
      if (q) { if (ch === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (ch === '"') q = false; else f += ch; }
      else if (ch === '"') q = true; else if (ch === ',') { r.push(f); f = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(f); f = ''; rows.push(r); r = []; } else f += ch; }
    if (f !== '' || r.length) { r.push(f); rows.push(r); } return rows.filter(x => x.length > 1 || x[0] !== ''); }
  c.addEventListener('click', e => {
    if (e.target.dataset.c) return copy(out.textContent);
    if (!e.target.classList.contains('pri')) return;
    const rows = parse(ta.value); if (rows.length < 2) { out.textContent = '❌ Need a header row and at least one data row'; return; }
    const h = rows[0].map(x => x.trim()); out.textContent = JSON.stringify(rows.slice(1).map(r => h.reduce((o, k, i) => (o[k] = r[i] ?? '', o), {})), null, 2);
  });
});
reg('tools', 'Random picker, dice & coin', c => {
  c.innerHTML = `<textarea class="hrp-ta" placeholder="Names, one per line" aria-label="Names"></textarea><div class="hrp-row"><button class="hrp-btn pri" data-a="pick">🎯 Pick one</button><button class="hrp-btn" data-a="order">🔀 Shuffle order</button><button class="hrp-btn" data-a="coin">🪙 Coin</button><button class="hrp-btn" data-a="dice">🎲 Dice</button></div><div class="hrp-out"></div>`;
  const ta = $('textarea', c), out = $('.hrp-out', c); const names = () => ta.value.split('\n').map(s => s.trim()).filter(Boolean);
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return; const n = names();
    if (a === 'coin') out.textContent = pick(['Heads 🪙', 'Tails 🪙']); else if (a === 'dice') out.textContent = '🎲 ' + (1 + rnd(6));
    else if (!n.length) out.textContent = 'Add some names first'; else if (a === 'pick') out.textContent = '🎉 ' + pick(n);
    else { const s = n.slice(); for (let i = s.length - 1; i > 0; i--) { const j = rnd(i + 1); [s[i], s[j]] = [s[j], s[i]]; } out.textContent = s.map((x, i) => (i + 1) + '. ' + x).join('\n'); } });
});
reg('tools', 'Team splitter', c => {
  c.innerHTML = `<textarea class="hrp-ta" placeholder="Participant names, one per line" aria-label="Names"></textarea><div class="hrp-row"><label>Team size <input class="hrp-in sm" type="number" min="1" max="6" value="4" style="max-width:80px"></label><button class="hrp-btn pri">Split into teams</button><button class="hrp-btn" data-c="1">Copy</button></div><div class="hrp-out"></div>`;
  const ta = $('textarea', c), out = $('.hrp-out', c);
  c.addEventListener('click', e => {
    if (e.target.dataset.c) return copy(out.textContent); if (!e.target.classList.contains('pri')) return;
    const n = ta.value.split('\n').map(s => s.trim()).filter(Boolean); const size = Math.min(6, Math.max(1, +$('input[type=number]', c).value || 4));
    if (!n.length) { out.textContent = 'Add some names first'; return; }
    for (let i = n.length - 1; i > 0; i--) { const j = rnd(i + 1); [n[i], n[j]] = [n[j], n[i]]; }
    const teams = Math.ceil(n.length / size); const T = Array.from({ length: teams }, () => []); n.forEach((x, i) => T[i % teams].push(x));
    out.textContent = T.map((t, i) => `Team ${i + 1} (${t.length}): ${t.join(', ')}`).join('\n');
  });
});

/* ============ CHEAT SHEETS ============ */
function table(rows, head){
  return `<table class="hrp-table">${head ? '<tr>' + head.map(h => `<th>${esc(h)}</th>`).join('') + '</tr>' : ''}${rows.map(r => '<tr>' + r.map((x, i) => `<td${i === 0 ? ' style="font-family:JetBrains Mono,monospace;word-break:break-word"' : ''}>${esc(x)}</td>`).join('') + '</tr>').join('')}</table>`;
}
reg('cheats', 'Git commands', c => { c.innerHTML = table([
  ['git init','Start a new repository'],['git clone <url>','Copy a remote repo'],['git status','See changed files'],['git add -A','Stage everything'],['git commit -m "msg"','Save a snapshot'],
  ['git push origin main','Upload commits'],['git pull --rebase','Fetch and replay your commits on top'],['git switch -c feature','Create & switch branch'],['git merge feature','Merge a branch'],
  ['git stash / stash pop','Shelve / restore changes'],['git log --oneline --graph','Compact history'],['git restore <file>','Discard local edits'],['git reset --soft HEAD~1','Undo last commit, keep changes'],['git diff --staged','Review what will be committed']], ['Command', 'What it does']); });
reg('cheats', 'HTTP status codes (searchable)', c => {
  const codes = [[200,'OK'],[201,'Created'],[204,'No Content'],[301,'Moved Permanently'],[302,'Found (temporary redirect)'],[304,'Not Modified'],[400,'Bad Request'],[401,'Unauthorized (not logged in)'],[403,'Forbidden (no permission)'],[404,'Not Found'],[405,'Method Not Allowed'],[408,'Request Timeout'],[409,'Conflict'],[410,'Gone'],[413,'Payload Too Large'],[418,"I'm a teapot"],[422,'Unprocessable Entity'],[429,'Too Many Requests'],[500,'Internal Server Error'],[501,'Not Implemented'],[502,'Bad Gateway'],[503,'Service Unavailable'],[504,'Gateway Timeout']];
  c.innerHTML = '<input class="hrp-in" placeholder="Search code or meaning…" aria-label="Search"><div id="hcBox"></div>';
  const box = $('#hcBox', c), inp = $('input', c); const draw = () => { const q = inp.value.toLowerCase(); box.innerHTML = table(codes.filter(x => !q || String(x[0]).includes(q) || x[1].toLowerCase().includes(q)).map(x => [String(x[0]), x[1]]), ['Code', 'Meaning']); };
  inp.addEventListener('input', draw); draw();
});
reg('cheats', 'Big-O complexity', c => { c.innerHTML = table([
  ['O(1)','Array index, hash lookup'],['O(log n)','Binary search, balanced BST'],['O(n)','Linear scan'],['O(n log n)','Merge sort, heap sort, quick sort (avg)'],['O(n²)','Nested loops, bubble sort'],['O(2ⁿ)','Naive recursive Fibonacci, subsets'],['O(n!)','Permutations, brute-force TSP']], ['Complexity', 'Typical example']) + '<p class="hrp-muted" style="margin-top:8px">Rule of thumb: ~10⁸ simple operations per second in most judges.</p>'; });
reg('cheats', 'Regex quick reference', c => { c.innerHTML = table([
  ['.','Any character'],['\\d \\w \\s','Digit / word char / whitespace'],['^  $','Start / end of line'],['*  +  ?','0+, 1+, 0 or 1'],['{n,m}','Between n and m times'],['[abc]  [^abc]','Any of / none of'],['(a|b)','Group / alternation'],['(?:…)','Non-capturing group'],['(?=…)  (?!…)','Look-ahead / negative'],['\\b','Word boundary'],['+? *?','Lazy quantifiers']], ['Token', 'Meaning']); });
reg('cheats', 'SQL basics', c => { c.innerHTML = table([
  ['SELECT a, b FROM t WHERE x > 5','Read rows'],['INSERT INTO t (a,b) VALUES (1,2)','Add a row'],['UPDATE t SET a=1 WHERE id=3','Change rows'],['DELETE FROM t WHERE id=3','Remove rows'],
  ['ORDER BY a DESC LIMIT 10','Sort & limit'],['GROUP BY a HAVING COUNT(*)>1','Aggregate & filter groups'],['JOIN u ON u.id = t.uid','Combine tables'],['CREATE INDEX i ON t(a)','Speed up lookups']], ['Statement', 'Purpose']); });
reg('cheats', 'Markdown syntax', c => { c.innerHTML = table([
  ['# Heading','Heading (## smaller)'],['**bold**  *italic*','Emphasis'],['[text](url)','Link'],['![alt](img.png)','Image'],['- item','Bullet list'],['1. item','Numbered list'],['`code`','Inline code'],['```lang …```','Code block'],['> quote','Blockquote'],['---','Horizontal rule']], ['Write', 'Result']); });
reg('cheats', 'Linux / terminal', c => { c.innerHTML = table([
  ['ls -la','List files with details'],['cd <dir>','Change directory'],['pwd','Print current directory'],['grep -rn "text" .','Search in files'],['cat / less <file>','View a file'],['chmod +x file','Make executable'],['ps aux | grep x','Find a process'],['kill -9 <pid>','Force-stop a process'],['curl -I <url>','Fetch headers'],['tar -czf a.tgz dir/','Create archive']], ['Command', 'Purpose']); });

/* ============ TIMER ENGINE ============ */
const T = { end: 0, total: 0, label: '', kind: '', iv: null, w60: false, w10: false };
const fmtT = s => { s = Math.max(0, Math.round(s)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
function beep(n){
  try { const ac = new (window.AudioContext || window.webkitAudioContext)(); for (let i = 0; i < n; i++) { const o = ac.createOscillator(), g = ac.createGain(); o.connect(g); g.connect(ac.destination); o.frequency.value = 880; g.gain.value = .08; o.start(ac.currentTime + i * .35); o.stop(ac.currentTime + i * .35 + .2); } } catch(e){}
  try { if (navigator.vibrate) navigator.vibrate(n === 1 ? 120 : [200, 100, 200]); } catch(e){}
}
function paintT(){
  const left = T.iv ? (T.end - Date.now()) / 1000 : 0;
  $$('.hrp-tv').forEach(e => { e.textContent = T.iv ? fmtT(left) : '00:00'; });
  $$('.hrp-tl').forEach(e => { e.textContent = T.iv ? T.label : 'Not running'; });
  $$('.hrp-tb i').forEach(b => { b.style.width = (T.iv && T.total ? (100 - left / T.total * 100) : 0) + '%'; });
}
function tickT(){
  const left = (T.end - Date.now()) / 1000; paintT();
  if (T.kind === 'pitch') {
    if (left <= 60 && !T.w60 && T.total > 90) { T.w60 = true; toast('1 minute left in your pitch', 'warn', '⏱️'); beep(1); }
    if (left <= 10 && !T.w10) { T.w10 = true; toast('10 seconds left!', 'warn', '⏱️'); beep(1); }
  }
  if (left <= 0) {
    clearInterval(T.iv); T.iv = null; beep(3); toast(T.label + ' finished', 'success', '⏰'); paintT();
    if (T.kind === 'pitch') award('pitch'); if (T.kind === 'focus' && /^Focus/.test(T.label)) { award('focus'); addXP(20); }
  }
}
function startT(sec, label, kind){ clearInterval(T.iv); Object.assign(T, { total: sec, end: Date.now() + sec * 1000, label, kind, w60: false, w10: false }); T.iv = setInterval(tickT, 250); tickT(); }
function stopT(){ clearInterval(T.iv); T.iv = null; paintT(); }
function timerUI(c, presets, kind, note){
  c.innerHTML = `<div class="hrp-big hrp-tv">00:00</div><div class="hrp-muted hrp-tl" style="text-align:center">Not running</div><div class="hrp-bar hrp-tb"><i></i></div>
  <div class="hrp-row" style="justify-content:center">${presets.map(p => `<button class="hrp-btn" data-s="${p[1]}" data-l="${esc(p[0])}">${esc(p[0])}</button>`).join('')}<button class="hrp-btn" data-x="1">■ Stop</button></div>
  <div class="hrp-row" style="justify-content:center"><input class="hrp-in sm" style="max-width:110px;flex:0" type="number" min="1" max="180" placeholder="Minutes"><button class="hrp-btn pri" data-cu="1">Start custom</button></div>${note ? `<p class="hrp-muted">${note}</p>` : ''}`;
  c.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.x) return stopT();
    if (b.dataset.s) return startT(+b.dataset.s, b.dataset.l, kind);
    if (b.dataset.cu) { const m = +$('input', c).value; if (m > 0) startT(Math.min(180, m) * 60, m + ' min ' + kind, kind); }
  }); paintT();
}

/* ============ PLANNER ============ */
reg('plan', 'Pitch timer', c => timerUI(c, [['3 min', 180], ['5 min', 300], ['7 min', 420]], 'pitch', 'Warns at 1 minute and 10 seconds with a beep. Keeps running if you close this panel.'));
reg('plan', 'Focus (Pomodoro) timer', c => timerUI(c, [['Focus 25', 1500], ['Break 5', 300], ['Long break 15', 900]], 'focus', 'Finish a 25-minute focus block to earn XP and the Deep Focus badge.'));

const SW = { run: false, t0: 0, acc: 0, laps: [], iv: null };
reg('plan', 'Stopwatch with laps', c => {
  c.innerHTML = `<div class="hrp-big" id="swv">00:00.0</div><div class="hrp-row" style="justify-content:center"><button class="hrp-btn pri" data-a="ss">Start / Pause</button><button class="hrp-btn" data-a="lap">Lap</button><button class="hrp-btn" data-a="rs">Reset</button></div><div class="hrp-out" id="swl"></div>`;
  const fmt = ms => { const t = Math.floor(ms / 100); return pad(Math.floor(t / 600)) + ':' + pad(Math.floor(t / 10) % 60) + '.' + (t % 10); };
  const cur = () => SW.acc + (SW.run ? Date.now() - SW.t0 : 0);
  const paint = () => { const v = $('#swv'); if (v) v.textContent = fmt(cur()); const l = $('#swl'); if (l) l.textContent = SW.laps.map((x, i) => `Lap ${i + 1}: ${fmt(x)}`).reverse().join('\n'); };
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return;
    if (a === 'ss') { if (SW.run) { SW.acc += Date.now() - SW.t0; SW.run = false; clearInterval(SW.iv); } else { SW.t0 = Date.now(); SW.run = true; SW.iv = setInterval(paint, 100); } }
    else if (a === 'lap') SW.laps.push(cur()); else { SW.run = false; SW.acc = 0; SW.laps = []; clearInterval(SW.iv); }
    paint(); });
  if (SW.run) { clearInterval(SW.iv); SW.iv = setInterval(paint, 100); } paint();
});

let brIv = null, brMin = 0;
reg('plan', 'Break & hydration reminders', c => {
  c.innerHTML = `<p class="hrp-muted">Get a gentle nudge while this tab stays open — great for a 36-hour sprint.</p><div class="hrp-row"><select class="hrp-sel" style="max-width:200px"><option value="0">Off</option><option value="30">Every 30 min</option><option value="45">Every 45 min</option><option value="60">Every hour</option><option value="90">Every 90 min</option></select></div><div class="hrp-out" id="brs"></div>`;
  const sel = $('select', c), out = $('#brs', c); sel.value = String(brMin);
  const msgs = ['💧 Drink some water', '🧍 Stand up and stretch', '👀 Look 20 feet away for 20 seconds', '🍎 Grab a healthy snack', '🚶 Take a 5-minute walk', '😮‍💨 Take 5 slow breaths'];
  sel.addEventListener('change', () => { clearInterval(brIv); brMin = +sel.value; out.textContent = brMin ? `Reminders every ${brMin} minutes.` : 'Reminders off.'; if (brMin) { let i = 0; brIv = setInterval(() => { toast(msgs[i++ % msgs.length], 'info', '⏰'); beep(1); }, brMin * 60000); } });
  out.textContent = brMin ? `Reminders every ${brMin} minutes.` : 'Reminders off.';
});

const icsEsc = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsDate = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function makeICS(events){
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hackathon Rivals//HR+//EN', 'CALSCALE:GREGORIAN'].concat(...events.map((e, i) => [
    'BEGIN:VEVENT', `UID:hrp-${Date.now()}-${i}@hackathonrivals.in`, 'DTSTAMP:' + icsDate(new Date()), 'DTSTART:' + icsDate(e.start), 'DTEND:' + icsDate(e.end),
    'SUMMARY:' + icsEsc(e.title), 'DESCRIPTION:' + icsEsc(e.desc || ''),
    ...(e.alarm ? ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(e.title), 'TRIGGER:-PT' + e.alarm + 'M', 'END:VALARM'] : []), 'END:VEVENT'])).concat('END:VCALENDAR').join('\r\n');
}
const localInput = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
reg('plan', '36-hour sprint plan generator', c => {
  const now = new Date(); now.setMinutes(0, 0, 0); now.setHours(now.getHours() + 1);
  c.innerHTML = `<div class="hrp-row"><label>Start time <input type="datetime-local" class="hrp-in" value="${localInput(now)}" style="width:auto"></label><button class="hrp-btn pri" data-a="g">Generate plan</button></div><div class="hrp-out" id="plo"></div><div class="hrp-row"><button class="hrp-btn" data-a="c">Copy</button><button class="hrp-btn" data-a="t">⬇ .txt</button><button class="hrp-btn" data-a="i">⬇ Calendar (.ics)</button></div>`;
  const out = $('#plo', c); let plan = [];
  const PH = [[2, '💡 Ideation & lock the problem statement'], [2, '🏗️ Architecture, repo, tooling & roles'], [10, '⚙️ Build the core MVP'], [4, '🔌 Integrations & data'], [4, '😴 Sleep in shifts (keep one person awake)'],
    [6, '✨ Features & polish'], [3, '🧪 Testing & bug bash'], [2, '🎞️ Pitch deck + demo video'], [2, '🎤 Rehearse the 3-minute pitch'], [1, '📤 Submission buffer']];
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return;
    if (a === 'g') { const st = new Date($('input', c).value); if (isNaN(st)) { out.textContent = 'Pick a valid start time'; return; }
      let t = st.getTime(); plan = PH.map(([h, name]) => { const s = new Date(t), e2 = new Date(t + h * 3600000); t += h * 3600000; return { start: s, end: e2, title: name }; });
      out.textContent = plan.map(p => `${p.start.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })} → ${p.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  ${p.title}`).join('\n'); award('planner'); addXP(10); }
    else if (!plan.length) toast('Generate a plan first', 'warn', '⚠️');
    else if (a === 'c') copy(out.textContent); else if (a === 't') download('36h-sprint-plan.txt', out.textContent);
    else if (a === 'i') download('36h-sprint-plan.ics', makeICS(plan.map(p => ({ ...p, alarm: 10 }))), 'text/calendar'); });
});
reg('plan', 'Calendar reminder (.ics) maker', c => {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0);
  c.innerHTML = `<input class="hrp-in" placeholder="Event title" value="Hackathon Rivals — register my team" aria-label="Title"><div class="hrp-row"><input type="datetime-local" class="hrp-in sm" value="${localInput(d)}" aria-label="When"><input type="number" class="hrp-in sm" value="30" min="5" style="max-width:110px;flex:0" aria-label="Minutes"> <span class="hrp-muted">minutes</span></div><textarea class="hrp-ta" style="min-height:70px" placeholder="Notes (optional)"></textarea><div class="hrp-row"><button class="hrp-btn pri">⬇ Download .ics</button></div>`;
  $('.pri', c).addEventListener('click', () => {
    const [t, w, m] = $$('input', c); const s = new Date(w.value); if (isNaN(s)) return toast('Pick a valid date & time', 'warn', '⚠️');
    download('reminder.ics', makeICS([{ title: t.value || 'Reminder', desc: $('textarea', c).value, start: s, end: new Date(s.getTime() + Math.max(5, +m.value || 30) * 60000), alarm: 15 }]), 'text/calendar');
  });
});
reg('plan', 'Team name generator', c => {
  const A = ['Quantum','Neon','Rogue','Silent','Turbo','Binary','Cosmic','Agile','Phantom','Stealth','Fusion','Pixel','Rapid','Cyber','Alpha','Zen','Hyper','Solar','Atomic','Nova'];
  const N = ['Coders','Rivals','Hackers','Wolves','Titans','Ninjas','Pilots','Builders','Falcons','Sparks','Bytes','Circuits','Rockets','Wizards','Pandas','Tigers','Forge','Guild','Squad','Syndicate'];
  c.innerHTML = '<div class="hrp-row"><button class="hrp-btn pri">🎲 Generate 8 names</button></div><div class="hrp-out"></div>';
  const out = $('.hrp-out', c); const gen = () => { out.textContent = Array.from({ length: 8 }, () => pick(A) + ' ' + pick(N)).join('\n'); };
  $('.pri', c).addEventListener('click', gen); out.addEventListener('click', () => copy(out.textContent, true)); gen();
});
reg('plan', 'Project idea generator', c => {
  const D = ['healthcare','agriculture','education','smart cities','clean energy','disaster response','public transport','financial inclusion','accessibility','waste management','water conservation','cyber safety'];
  const TE = ['an AI assistant','a mobile app','an IoT sensor network','a dashboard','a chatbot on WhatsApp','a browser extension','a computer-vision tool','a blockchain ledger','an offline-first PWA','a voice interface'];
  const AU = ['rural communities','college students','small shopkeepers','senior citizens','first responders','farmers','teachers','daily commuters','differently-abled users','city officials'];
  c.innerHTML = '<div class="hrp-row"><button class="hrp-btn pri">🎲 New idea</button><button class="hrp-btn" data-c="1">Copy</button></div><div class="hrp-out" style="font-family:inherit;font-size:15px"></div>';
  const out = $('.hrp-out', c); const gen = () => { out.textContent = `Build ${pick(TE)} for ${pick(AU)} in the ${pick(D)} space.`; };
  c.addEventListener('click', e => { if (e.target.dataset.c) copy(out.textContent); else if (e.target.classList.contains('pri')) gen(); }); gen();
});
reg('plan', 'Elevator pitch builder', c => {
  const saved = store.get('pitch', {});
  c.innerHTML = ['audience:Who is it for?', 'problem:What problem do they face?', 'solution:Your solution (one line)', 'diff:What makes it different?', 'impact:Impact / result'].map(x => { const [k, l] = x.split(':'); return `<label class="hrp-muted">${l}</label><input class="hrp-in" data-k="${k}" value="${esc(saved[k] || '')}" style="margin-bottom:8px">`; }).join('') + '<div class="hrp-out" id="epo" style="font-family:inherit;font-size:14px"></div><div class="hrp-muted" id="epm"></div><div class="hrp-row"><button class="hrp-btn" data-c="1">Copy pitch</button></div>';
  const out = $('#epo', c), meta = $('#epm', c);
  const upd = () => { const v = {}; $$('input[data-k]', c).forEach(i => v[i.dataset.k] = i.value.trim()); store.set('pitch', v);
    const t = `For ${v.audience || '[audience]'} who struggle with ${v.problem || '[problem]'}, we built ${v.solution || '[solution]'}. Unlike existing options, ${v.diff || '[differentiator]'}. The result: ${v.impact || '[impact]'}.`;
    out.textContent = t; const w = t.split(/\s+/).length; meta.textContent = `${w} words · about ${Math.max(1, Math.round(w / 130 * 60))} seconds to say aloud`; };
  c.addEventListener('input', upd); c.addEventListener('click', e => { if (e.target.dataset.c) copy(out.textContent); }); upd();
});
reg('plan', 'README generator', c => {
  c.innerHTML = `<input class="hrp-in" data-k="n" placeholder="Project name" style="margin-bottom:8px"><input class="hrp-in" data-k="t" placeholder="One-line tagline" style="margin-bottom:8px"><input class="hrp-in" data-k="ps" placeholder="Problem statement ID / title" style="margin-bottom:8px"><textarea class="hrp-ta" data-k="f" style="min-height:70px" placeholder="Key features (one per line)"></textarea><input class="hrp-in" data-k="s" placeholder="Tech stack (comma separated)" style="margin:8px 0"><textarea class="hrp-ta" data-k="m" style="min-height:70px" placeholder="Team members (one per line)"></textarea><div class="hrp-row"><button class="hrp-btn pri" data-a="g">Generate</button><button class="hrp-btn" data-a="c">Copy</button><button class="hrp-btn" data-a="d">⬇ README.md</button></div><div class="hrp-out" style="max-height:220px;overflow:auto"></div>`;
  const out = $('.hrp-out', c); const v = k => ($('[data-k="' + k + '"]', c).value || '').trim(); const lines = k => v(k).split('\n').map(x => x.trim()).filter(Boolean);
  const build = () => `# ${v('n') || 'Project Name'}\n\n> ${v('t') || 'One-line tagline'}\n\n**Hackathon Rivals — Season 2026** · Problem statement: ${v('ps') || '—'}\n\n## Features\n${lines('f').map(x => '- ' + x).join('\n') || '- …'}\n\n## Tech stack\n${v('s').split(',').map(x => x.trim()).filter(Boolean).map(x => '- ' + x).join('\n') || '- …'}\n\n## Getting started\n\`\`\`bash\ngit clone <repo-url>\ncd ${(v('n') || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-')}\n# install dependencies and run\n\`\`\`\n\n## Team\n${lines('m').map(x => '- ' + x).join('\n') || '- …'}\n`;
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return; if (a === 'g') out.textContent = build(); else { if (!out.textContent) out.textContent = build(); if (a === 'c') copy(out.textContent); else download('README.md', out.textContent, 'text/markdown'); } });
});
reg('plan', 'Tech stack suggester', c => {
  const M = { 'Web app': ['React or Vue + Tailwind', 'Node.js (Express) or FastAPI', 'PostgreSQL / Supabase', 'Vercel / Netlify + Render'], 'Mobile app': ['Flutter or React Native', 'Firebase / Supabase', 'Firestore', 'Play Store internal testing / APK'],
    'AI / ML': ['Streamlit or React', 'FastAPI + scikit-learn / PyTorch', 'SQLite / Postgres + vector store', 'Hugging Face Spaces / Render'], 'IoT / Hardware': ['ESP32 / Arduino + sensors', 'MQTT broker + Node-RED', 'InfluxDB / Firebase', 'Grafana dashboard'],
    'Data dashboard': ['Plotly Dash / Streamlit', 'Pandas + FastAPI', 'DuckDB / Postgres', 'Streamlit Cloud'], 'Chatbot': ['Web chat widget or Telegram/WhatsApp', 'Python + LLM API', 'Redis / Postgres for memory', 'Render / Railway'],
    'Game / AR-VR': ['Unity or Godot / three.js', 'Photon / WebSockets', 'Firebase', 'itch.io / WebGL build'] };
  c.innerHTML = `<select class="hrp-sel">${Object.keys(M).map(k => `<option>${k}</option>`).join('')}</select><div class="hrp-out" style="font-family:inherit"></div>`;
  const sel = $('select', c), out = $('.hrp-out', c);
  const upd = () => { const m = M[sel.value]; out.textContent = `Frontend: ${m[0]}\nBackend: ${m[1]}\nData: ${m[2]}\nDeploy / demo: ${m[3]}\n\nTip: pick tools your team already knows — a 36-hour sprint is no time to learn a new framework.`; };
  sel.addEventListener('change', upd); upd();
});
reg('plan', 'Track suggester (by your skills)', c => {
  const SK = { 'Frontend / UI': ['dashboard', 'accessibility', 'citizen'], 'Backend / APIs': ['portal', 'platform', 'data'], 'AI / ML': ['prediction', 'detection', 'AI'], 'Embedded / IoT': ['sensor', 'monitoring', 'device'], 'Data & analytics': ['analytics', 'data', 'dashboard'], 'Design / UX': ['citizen', 'accessibility', 'app'], 'Domain: health': ['health', 'medical'], 'Domain: agriculture': ['agri', 'farm', 'crop'], 'Domain: education': ['education', 'learning', 'student'] };
  c.innerHTML = '<div class="hrp-grid">' + Object.keys(SK).map(k => `<label class="hrp-card" style="cursor:pointer"><input type="checkbox" value="${esc(k)}"> ${esc(k)}</label>`).join('') + '</div><div class="hrp-row"><button class="hrp-btn pri">Find matching problem statements</button></div><div class="hrp-muted" id="tsr"></div>';
  $('.pri', c).addEventListener('click', () => {
    const kw = new Set(); $$('input:checked', c).forEach(i => SK[i.value].forEach(k => kw.add(k)));
    if (!kw.size) return toast('Tick at least one skill', 'warn', '⚠️');
    const first = [...kw][0]; hubEl.classList.remove('open'); const s = $('#hrpPsSearch'); const pr = $('#problems');
    if (s) { s.value = first; s.dispatchEvent(new Event('input', { bubbles: true })); } if (pr) pr.scrollIntoView({ behavior: 'smooth' }); toast('Searching problem statements for "' + first + '"', 'info', '🔍');
  });
});
reg('plan', 'Eligibility quick-check', c => {
  c.innerHTML = `<label class="hrp-check"><input type="checkbox" data-q="enrolled"><span>I am currently enrolled at a college / university</span></label><label class="hrp-check"><input type="checkbox" data-q="india"><span>My college is in India</span></label><div class="hrp-row"><label>Team size <input type="number" class="hrp-in sm" min="1" max="20" value="4" style="max-width:90px;flex:0"></label></div><div class="hrp-row"><button class="hrp-btn pri">Check</button></div><div class="hrp-out" style="font-family:inherit"></div><p class="hrp-muted">Based only on the rules shown on this page (solo or team of 1–6, open to all colleges). The registration form is the final word.</p>`;
  $('.pri', c).addEventListener('click', () => {
    const q = k => $(`[data-q="${k}"]`, c).checked; const n = +$('input[type=number]', c).value; const notes = [];
    if (!q('enrolled')) notes.push('❌ You need to be a currently enrolled student.'); if (!q('india')) notes.push('⚠️ The event is described as India\'s national hackathon — confirm with the organisers if your college is outside India.');
    if (n < 1 || n > 6) notes.push('❌ Team size must be between 1 and 6.');
    $('.hrp-out', c).textContent = notes.length ? notes.join('\n') : '✅ You look eligible based on the details on this page. Head to Register!';
  });
});

/* ============ LISTS ============ */
function ticks(){ return store.get('ticks', 0); }
function checklist(c, key, base){
  const st = store.get('cl:' + key, { done: {}, extra: [] });
  const items = base.concat(st.extra);
  c.innerHTML = `<div class="hrp-bar"><i></i></div><div class="hrp-muted" id="clp"></div><div id="cll"></div><div class="hrp-row"><input class="hrp-in sm" placeholder="Add your own item…" aria-label="New item"><button class="hrp-btn" data-a="add">Add</button><button class="hrp-btn" data-a="rs">Reset</button></div>`;
  const list = $('#cll', c);
  function draw(){
    list.innerHTML = items.map((t, i) => `<label class="hrp-check${st.done[i] ? ' done' : ''}"><input type="checkbox" data-i="${i}" ${st.done[i] ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('');
    const n = items.filter((_, i) => st.done[i]).length; $('.hrp-bar i', c).style.width = (items.length ? n / items.length * 100 : 0) + '%'; $('#clp', c).textContent = `${n} of ${items.length} done`;
  }
  c.addEventListener('change', e => { const i = e.target.dataset.i; if (i == null) return; st.done[i] = e.target.checked; store.set('cl:' + key, st);
    if (e.target.checked) { store.set('ticks', ticks() + 1); addXP(2); if (ticks() >= 5) award('check5'); } draw(); });
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (a === 'add') { const inp = $('input.hrp-in', c); if (inp.value.trim()) { st.extra.push(inp.value.trim().slice(0, 120)); items.push(inp.value.trim().slice(0, 120)); inp.value = ''; store.set('cl:' + key, st); draw(); } }
    else if (a === 'rs') { st.done = {}; st.extra = []; store.set('cl:' + key, st); renderHub(); } });
  draw();
}
reg('lists', 'Submission checklist', c => checklist(c, 'sub', ['Problem statement chosen and understood', 'Working prototype or demo ready', 'Source code pushed to the repo', 'README with setup steps', 'Demo video recorded (under 3 minutes)', 'Pitch deck finalised', 'Team member details verified', 'Screenshots added', 'Deployed link tested on a phone', 'Submission form filled before the deadline']));
reg('lists', 'Preparation checklist', c => checklist(c, 'prep', ['Team formed (1–6 members)', 'Registered on the portal', 'Problem statement shortlisted', 'Roles assigned', 'Laptops, chargers & extension board packed', 'College ID and documents ready', 'Dev environment set up', 'Git repo created and shared', 'Rough UI wireframes drawn', 'Backup internet / hotspot arranged', 'Sleep well before the finale']));
reg('lists', 'Notes scratchpad', c => {
  c.innerHTML = `<textarea class="hrp-ta" style="min-height:220px;font-family:inherit" placeholder="Ideas, links, todos… saved automatically on this device" aria-label="Notes"></textarea><div class="hrp-count" id="nc"></div><div class="hrp-row"><button class="hrp-btn" data-a="c">Copy</button><button class="hrp-btn" data-a="d">⬇ .txt</button><button class="hrp-btn" data-a="x">Clear</button></div>`;
  const ta = $('textarea', c), nc = $('#nc', c); ta.value = store.get('notes', ''); let tm;
  const cnt = () => { nc.textContent = `${(ta.value.trim().match(/\S+/g) || []).length} words · ${ta.value.length} chars · autosaved`; }; cnt();
  ta.addEventListener('input', () => { cnt(); clearTimeout(tm); tm = setTimeout(() => { store.set('notes', ta.value); if (ta.value.trim().length > 10) award('notes'); }, 400); });
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (a === 'c') copy(ta.value); else if (a === 'd') download('hackathon-notes.txt', ta.value); else if (a === 'x' && confirm('Clear all notes?')) { ta.value = ''; store.set('notes', ''); cnt(); } });
});
reg('lists', 'Team to-do list', c => {
  let list = store.get('todo', []);
  c.innerHTML = `<div class="hrp-row"><input class="hrp-in sm" placeholder="Add a task and press Enter" aria-label="Task"><button class="hrp-btn pri" data-a="add">Add</button></div><div id="tdl"></div><div class="hrp-row"><button class="hrp-btn" data-a="clr">Clear completed</button></div>`;
  const box = $('#tdl', c), inp = $('input', c);
  const draw = () => { box.innerHTML = list.map((t, i) => `<div class="hrp-check${t.d ? ' done' : ''}"><input type="checkbox" data-i="${i}" ${t.d ? 'checked' : ''}><span style="flex:1">${esc(t.t)}</span><button class="hrp-x" data-del="${i}" aria-label="Delete">✕</button></div>`).join('') || '<p class="hrp-muted">No tasks yet.</p>'; store.set('todo', list); };
  const add = () => { const v = inp.value.trim(); if (v) { list.unshift({ t: v.slice(0, 140), d: false }); inp.value = ''; draw(); } };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  c.addEventListener('click', e => { const a = e.target.dataset.a, d = e.target.dataset.del; if (a === 'add') add(); else if (a === 'clr') { list = list.filter(t => !t.d); draw(); } else if (d != null) { list.splice(+d, 1); draw(); } });
  c.addEventListener('change', e => { const i = e.target.dataset.i; if (i != null) { list[+i].d = e.target.checked; draw(); } });
  draw();
});
reg('lists', 'My starred problem statements', c => {
  let ids = []; try { ids = JSON.parse(localStorage.getItem('hr-stars') || '[]'); } catch(e){}
  c.innerHTML = `<p>${ids.length ? `You have <b>${ids.length}</b> starred problem statement${ids.length > 1 ? 's' : ''}:` : 'No starred problem statements yet. Tap ☆ on any problem statement to bookmark it.'}</p><div class="hrp-out">${esc(ids.join('\n'))}</div><div class="hrp-row"><button class="hrp-btn pri" data-a="show">Show them</button><button class="hrp-btn" data-a="c">Copy IDs</button></div>`;
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (a === 'c') copy(ids.join(', ')); else if (a === 'show') { hubEl.classList.remove('open'); const b = $('#problems [data-filter="starred"]'); if (b) b.click(); const p = $('#problems'); if (p) p.scrollIntoView({ behavior: 'smooth' }); } });
});

/* ============ TABS ============ */
const TIPS = ['Read the whole problem statement twice before writing code.', 'Pick one core feature and make it flawless — judges remember a great demo.', 'Commit and push every hour. Future-you will say thanks.', 'Record your demo video early; last-minute recording always goes wrong.', 'Assign roles: builder, designer, presenter, tester.', 'Test on a real phone, not just the desktop browser.', 'Keep a fallback demo (video or screenshots) in case the Wi-Fi fails.', 'Write the README while the project is fresh.', 'Sleep in shifts — a rested teammate writes fewer bugs.', 'Use environment variables; never push secret keys to Git.', 'Practise your pitch out loud with a timer.', 'Show the problem first, then the solution, then the impact.', 'Use free tiers (Supabase, Vercel, Render) to deploy quickly.', 'Keep the UI simple; clarity beats decoration.', 'Prepare answers for "How does it scale?" and "Who are your users?".', 'Ask mentors early; ten minutes of advice can save five hours.', 'Add one number to your pitch: users reached, time saved or cost cut.', 'Have a backup plan for your riskiest integration.', 'Name your team something memorable and easy to pronounce.', 'Celebrate small wins — a working login page counts!'];
const QUOTES = ['Ship a small thing that works before a big thing that doesn\'t.', 'A demo that runs beats a slide that promises.', 'Read the problem twice, code once.', 'Sleep is a feature. Schedule it.', 'Cut scope, not corners.', 'Talk to a user before you write a line.', 'Commit early, commit often, push before you sleep.', 'Good teams argue about ideas and agree about deadlines.', 'The best pitch is one problem, one solution, one demo.', 'Make it work, make it right, make it fast — in that order.', 'Done is a milestone; polished is a habit.', 'Small teams win by focus, not by size.'];
const doy = () => Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
TABS.push(['home', '🏠 Home', c => {
  const h = new Date().getHours(); const g = h < 5 ? 'Still up? Good night owl' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
  const now = new Date(); const ist = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
  const lv = level(), nextXP = 25 * lv * lv, prevXP = 25 * (lv - 1) * (lv - 1); const prog = Math.min(100, (G.xp - prevXP) / (nextXP - prevXP) * 100);
  const rec = store.get('recent', []); const notif = store.get('notif', []);
  c.innerHTML = `<h3 style="font-size:20px">${g} 👋</h3><p class="hrp-muted">Local time ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · India (IST) ${ist}</p>
  <div class="hrp-grid" style="margin:12px 0"><div class="hrp-card"><b>Level ${lv}</b>${G.xp} XP<div class="hrp-bar"><i style="width:${prog}%"></i></div></div><div class="hrp-card"><b>🔥 ${streak()}-day streak</b>${G.days.length} days visited</div><div class="hrp-card"><b>🏅 ${Object.keys(G.badges).length}/${Object.keys(BADGES).length} badges</b>Earn more in Badges</div></div>
  <div class="hrp-h">💡 Tip of the day</div><div class="hrp-card">${esc(TIPS[doy() % TIPS.length])}</div>
  <div class="hrp-h">💬 Hacker wisdom</div><div class="hrp-card" id="hq">${esc(QUOTES[doy() % QUOTES.length])}</div><div class="hrp-row"><button class="hrp-btn" data-a="q">Another one</button></div>
  <div class="hrp-h">🕘 Recently viewed problem statements</div>${rec.length ? rec.map(r => `<div class="hrp-pi" data-ps="${esc(r.id)}"><span>${esc(r.id)} — ${esc(r.title)}</span></div>`).join('') : '<p class="hrp-muted">Nothing yet — open a problem statement to see it here.</p>'}
  <div class="hrp-h">🔔 Recent notifications</div>${notif.length ? notif.slice(0, 6).map(n => `<div class="hrp-muted" style="padding:3px 0">${new Date(n.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${esc(n.m)}</div>`).join('') + '<div class="hrp-row"><button class="hrp-btn" data-a="cn">Clear</button></div>' : '<p class="hrp-muted">All quiet.</p>'}`;
  c.addEventListener('click', e => {
    const a = e.target.dataset.a; if (a === 'q') { $('#hq', c).textContent = pick(QUOTES); }
    else if (a === 'cn') { store.set('notif', []); renderHub(); }
    const p = e.target.closest('[data-ps]'); if (p) { hubEl.classList.remove('open'); const pr = $('#problems'); if (pr) pr.scrollIntoView({ behavior: 'smooth' }); setTimeout(() => { const r = $('.ps-row[data-id="' + CSS.escape(p.dataset.ps) + '"]'); if (r) r.click(); }, 500); }
  });
}]);
feat('Home tab: greeting, IST clock, level, streak', () => {});
feat('Tip of the day (20 rotating tips)', () => {});
feat('Hacker-wisdom quote generator', () => {});
feat('Recently viewed problem statements', () => {});
feat('Notification centre with unread dot', () => {});
TABS.push(['tools', '🛠️ Tools', c => multi(c, TOOLS, 'toolSel')]);
TABS.push(['cheats', '📚 Cheats', c => multi(c, CHEATS, 'cheatSel')]);
TABS.push(['plan', '🗓️ Plan', c => multi(c, PLAN, 'planSel')]);
TABS.push(['lists', '✅ Lists', c => multi(c, LISTS, 'listSel')]);
TABS.push(['badges', '🏅 Badges', c => {
  const lv = level(); const nextXP = 25 * lv * lv, prevXP = 25 * (lv - 1) * (lv - 1);
  c.innerHTML = `<div class="hrp-card"><b>Level ${lv} · ${G.xp} XP</b><div class="hrp-bar"><i style="width:${Math.min(100, (G.xp - prevXP) / (nextXP - prevXP) * 100)}%"></i></div><span class="hrp-muted">${nextXP - G.xp} XP to level ${lv + 1} · 🔥 ${streak()}-day streak</span></div><div class="hrp-h">Badges</div><div class="hrp-grid">${Object.entries(BADGES).map(([id, b]) => `<div class="hrp-badge${G.badges[id] ? ' got' : ''}"><span class="ic">${b[0]}</span><div><b>${esc(b[1])}</b><div class="hrp-muted">${esc(b[2])}</div></div></div>`).join('')}</div><div class="hrp-row"><button class="hrp-btn" data-a="rs">Reset progress</button></div>`;
  c.addEventListener('click', e => { if (e.target.dataset.a === 'rs' && confirm('Reset XP, badges and streak?')) { ['xp', 'badges', 'used', 'days', 'ticks'].forEach(k => store.del(k)); location.reload(); } });
}]);
feat('XP, levels & progress bar', () => {});
feat('Visit streak counter', () => {});
feat('16 unlockable badges', () => {});

/* ---------- Share tab ---------- */
feat('Share panel (WhatsApp, LinkedIn, X, Telegram, email, Web Share)', () => {
  let code = store.get('refcode', null); if (!code) { code = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join('').slice(0, 6).toUpperCase(); store.set('refcode', code); }
  TABS.push(['share', '📣 Share', c => {
    const url = location.origin + location.pathname + '?ref=' + code; const inRef = store.get('ref_in', null);
    const msg = 'Join me at Hackathon Rivals 2026 — India\'s national hackathon arena for student innovators. Free registration!';
    c.innerHTML = `<label class="hrp-muted">Your message</label><textarea class="hrp-ta" style="min-height:70px;font-family:inherit">${esc(msg)}</textarea><label class="hrp-muted">Your personal link</label><input class="hrp-in" readonly value="${esc(url)}">
    <div class="hrp-row">${navigator.share ? '<button class="hrp-btn pri" data-a="ws">📲 Share…</button>' : ''}<button class="hrp-btn" data-a="cp">📋 Copy link</button><button class="hrp-btn" data-a="wa">WhatsApp</button><button class="hrp-btn" data-a="li">LinkedIn</button><button class="hrp-btn" data-a="x">X</button><button class="hrp-btn" data-a="tg">Telegram</button><button class="hrp-btn" data-a="em">Email</button></div>${inRef ? `<p class="hrp-muted">You arrived through referral code <b>${esc(inRef)}</b>.</p>` : ''}`;
    c.addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return; const m = $('textarea', c).value; const eu = encodeURIComponent(url), em2 = encodeURIComponent(m);
      const open = u => window.open(u, '_blank', 'noopener,noreferrer');
      if (a === 'ws') navigator.share({ title: 'Hackathon Rivals', text: m, url }).catch(() => {}); else if (a === 'cp') copy(url);
      else if (a === 'wa') open('https://wa.me/?text=' + encodeURIComponent(m + ' ' + url)); else if (a === 'li') open('https://www.linkedin.com/sharing/share-offsite/?url=' + eu);
      else if (a === 'x') open('https://twitter.com/intent/tweet?text=' + em2 + '&url=' + eu); else if (a === 'tg') open('https://t.me/share/url?url=' + eu + '&text=' + em2);
      else if (a === 'em') location.href = 'mailto:?subject=' + encodeURIComponent('Hackathon Rivals 2026') + '&body=' + encodeURIComponent(m + '\n\n' + url);
      award('share'); addXP(5); });
  }]);
  const ref = new URLSearchParams(location.search).get('ref'); if (ref && /^[A-Za-z0-9]{3,12}$/.test(ref)) store.set('ref_in', ref);
});
feat('Personal referral link (?ref=) + inbound referral capture', () => {});

/* ---------- Settings tab ---------- */
TABS.push(['settings', '⚙️ Settings', c => {
  const sw = ['#7c5cff', '#22d3ee', '#ff4d9d', '#3ddc84', '#ff9f43'];
  c.innerHTML = `<div class="hrp-h">Display & accessibility</div>
  <div class="hrp-row"><label>Text size <input type="range" min="85" max="130" step="5" value="${Math.round(S.fs * 100)}" data-k="fs"></label><span class="hrp-muted">${Math.round(S.fs * 100)}%</span></div>
  ${[['contrast', 'High-contrast mode'], ['dys', 'Dyslexia-friendly text'], ['motion', 'Reduce motion & animations'], ['links', 'Underline all links']].map(([k, l]) => `<label class="hrp-check"><input type="checkbox" data-t="${k}" ${S[k] ? 'checked' : ''}><span>${l}</span></label>`).join('')}
  <div class="hrp-h">Accent colour</div><div class="hrp-row">${sw.map(x => `<div class="hrp-swatch" role="button" tabindex="0" data-c="${x}" style="background:${x};${S.accent === x ? 'outline:2px solid var(--text)' : ''}" aria-label="Accent ${x}"></div>`).join('')}</div>
  <div class="hrp-h">Layout</div><div class="hrp-row"><button class="hrp-btn" data-a="lookr">✨ New layout</button><button class="hrp-btn" data-a="lookc">⚪ Classic layout</button></div>
  <div class="hrp-h">Theme & language</div><div class="hrp-row"><button class="hrp-btn" data-a="sys">🖥️ Match system theme</button><button class="hrp-btn" data-a="lang">${S.hi ? 'Switch to English' : 'हिंदी में देखें'}</button></div>
  <div class="hrp-h">Your data (stored only on this device)</div><div class="hrp-muted" id="stu"></div><div class="hrp-row"><button class="hrp-btn" data-a="ex">⬇ Export</button><label class="hrp-btn" style="cursor:pointer">⬆ Import<input type="file" accept="application/json" hidden id="impF"></label><button class="hrp-btn" data-a="rst">🗑 Reset HR+ data</button></div>`;
  let bytes = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); bytes += k.length + (localStorage.getItem(k) || '').length; } } catch(e){}
  $('#stu', c).textContent = `Using about ${(bytes * 2 / 1024).toFixed(1)} KB of local storage.`;
  c.addEventListener('input', e => { if (e.target.dataset.k === 'fs') { S.fs = +e.target.value / 100; saveS(); applySettings(); e.target.closest('.hrp-row').lastElementChild.textContent = e.target.value + '%'; } });
  c.addEventListener('change', e => {
    const t = e.target.dataset.t; if (t) { S[t] = e.target.checked; saveS(); applySettings(); }
    if (e.target.id === 'impF' && e.target.files[0]) { const r = new FileReader(); r.onload = () => { try { const o = JSON.parse(r.result); let n = 0; Object.keys(o).forEach(k => { if (/^(hrp:|hr-)/.test(k) && typeof o[k] === 'string') { localStorage.setItem(k, o[k]); n++; } }); toast('Imported ' + n + ' items — reloading', 'success', '⬆'); setTimeout(() => location.reload(), 800); } catch(err){ toast('Not a valid export file', 'warn', '⚠️'); } }; r.readAsText(e.target.files[0]); }
  });
  c.addEventListener('click', e => {
    const sw2 = e.target.closest('[data-c]'); if (sw2) { S.accent = sw2.dataset.c; saveS(); applySettings(); award('theme'); renderHub(); return; }
    const a = e.target.dataset.a; if (!a) return;
    if (a === 'lookr' || a === 'lookc') { const L = a === 'lookc' ? 'classic' : 'rival'; try { localStorage.setItem('hr-look', L); } catch(_){} document.documentElement.setAttribute('data-look', L); applySettings(); renderHub(); return; }
    if (a === 'sys') { const th = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', th); try { localStorage.setItem('hr-theme', th); } catch(_){} const tb = $('#themeToggle'); if (tb) tb.textContent = th === 'dark' ? '🌙' : '☀️'; toast('Theme set to ' + th, 'info', '🖥️'); }
    else if (a === 'lang') { const l = $$('.govt-bar .right a').find(x => /हिंदी|English/.test(x.textContent)); if (l) l.click(); renderHub(); }
    else if (a === 'ex') { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^(hrp:|hr-)/.test(k)) o[k] = localStorage.getItem(k); } download('hackathon-rivals-data.json', JSON.stringify(o, null, 2), 'application/json'); }
    else if (a === 'rst' && confirm('Delete all HR+ data (notes, checklists, badges, settings)?')) { Object.keys(localStorage).filter(k => k.startsWith('hrp:')).forEach(k => localStorage.removeItem(k)); location.reload(); }
  });
}]);
feat('Settings: text size, contrast, dyslexia, motion, links, accent', () => {});
feat('Match-system-theme button', () => {});
feat('Export / import / reset your HR+ data', () => {});
feat('Local-storage usage meter', () => {});

/* ---------- Help tab ---------- */
TABS.push(['help', '❔ Help', c => {
  const SH = [['Ctrl/⌘ + K  or  /', 'Command palette'], ['?', 'This help'], ['t', 'Toggle theme'], ['g then h/t/p/l/a/r/b/c/f', 'Jump to a section'], ['u', 'Scroll to top'], ['Esc', 'Close any panel'], ['Ctrl + Enter', 'Run code in Code Lab'], ['↑↑↓↓←→←→ B A', '🎮 ?']];
  c.innerHTML = `<div class="hrp-h">Keyboard shortcuts</div>${table(SH)}
  <div class="hrp-h">Send feedback to the team</div><select class="hrp-sel" id="fbr" style="max-width:140px"><option>5 ★</option><option>4 ★</option><option>3 ★</option><option>2 ★</option><option>1 ★</option></select><textarea class="hrp-ta" id="fbm" style="min-height:80px;font-family:inherit;margin-top:8px" placeholder="What can we improve?" maxlength="1000"></textarea><div class="hrp-row"><button class="hrp-btn pri" data-a="fb">Send feedback</button><a class="hrp-btn" data-a="bug" href="#">🐞 Report a bug (email)</a><button class="hrp-btn" data-a="dg">Copy diagnostics</button></div>
  <div class="hrp-h">What's inside HR+ (${F.length} features)</div><details><summary class="hrp-muted" style="cursor:pointer">Show the full list</summary><ol class="hrp-muted" style="padding-left:20px;line-height:1.7">${F.map(x => `<li>${esc(x)}</li>`).join('')}</ol></details>`;
  const diag = () => `URL: ${location.href}\nUA: ${navigator.userAgent}\nViewport: ${innerWidth}x${innerHeight} @${devicePixelRatio}x\nLang: ${navigator.language}\nTZ: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\nOnline: ${navigator.onLine}\nTheme: ${document.documentElement.getAttribute('data-theme')}`;
  c.addEventListener('click', async e => {
    const a = e.target.dataset.a; if (!a) return;
    if (a === 'dg') copy(diag()); else if (a === 'bug') { e.preventDefault(); location.href = 'mailto:hackathonrivals@gmail.com?subject=' + encodeURIComponent('Bug report — Hackathon Rivals') + '&body=' + encodeURIComponent('What happened?\n\n\n---\n' + diag()); }
    else if (a === 'fb') { const m = $('#fbm', c).value.trim(); if (m.length < 5) return toast('Please write a little more', 'warn', '⚠️'); const last = store.get('fbAt', 0); if (Date.now() - last < 60000) return toast('Please wait a minute before sending again', 'warn', '⏳');
      try { const r = await fetch('https://formspree.io/f/mppwlbwq', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ _subject: 'Site feedback (HR+)', rating: $('#fbr', c).value, message: m, page: location.href }) });
        if (!r.ok) throw new Error('bad'); store.set('fbAt', Date.now()); $('#fbm', c).value = ''; toast('Thanks for the feedback!', 'success', '💜'); addXP(5); } catch(err){ toast('Could not send — please try again later', 'warn', '⚠️'); } }
  });
}]);
feat('Keyboard-shortcut help sheet', () => {});
feat('In-app feedback form with rate limit', () => {});
feat('Bug-report email with auto diagnostics', () => {});
feat('Copy diagnostics for support', () => {});
feat('Live feature list', () => {});

/* ============ PAGE ENHANCERS ============ */
feat('Problem statements: live search + result counter', () => {
  const f = $('#problems .filters'), list = $('#psList'); if (!f || !list) return;
  const bar = el('div', { class: 'hrp-tools' }, '<input id="hrpPsSearch" class="hrp-in" style="max-width:280px" placeholder="🔍 Search problem statements…" aria-label="Search problem statements"><button class="hrp-mini" data-a="rand" type="button">🎲 Random</button><button class="hrp-mini" data-a="az" type="button">A→Z</button><button class="hrp-mini" data-a="csv" type="button">⬇ CSV</button><button class="hrp-mini" data-a="copy" type="button">📋 Copy list</button><span class="hrp-muted" id="hrpPsCount"></span>');
  f.insertAdjacentElement('afterend', bar);
  const inp = $('#hrpPsSearch');
  const rows = () => $$('.ps-row', list), visible = () => rows().filter(r => r.style.display !== 'none');
  const apply = () => { const q = inp.value.trim().toLowerCase(); rows().forEach(r => { r.style.display = q && !r.textContent.toLowerCase().includes(q) ? 'none' : ''; }); const v = visible().length; $('#hrpPsCount').textContent = rows().length ? `${v} of ${rows().length} shown` : ''; };
  inp.addEventListener('input', apply); new MutationObserver(apply).observe(list, { childList: true }); apply();
  const data = () => visible().map(r => [$('.ps-id', r).textContent.trim(), $('.ps-title', r).textContent.trim(), $('.ps-meta', r).textContent.trim(), $('.ps-theme', r).textContent.trim()]);
  window.__hrpRandomPS = () => { const v = visible(); if (!v.length) return toast('No problem statements to pick from', 'warn', '⚠️'); const r = pick(v); r.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => r.click(), 450); toast('Random pick: ' + $('.ps-title', r).textContent.trim(), 'info', '🎲'); };
  bar.addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return;
    if (a === 'rand') window.__hrpRandomPS();
    else if (a === 'az') { const s = rows().sort((x, y) => $('.ps-title', x).textContent.localeCompare($('.ps-title', y).textContent)); s.forEach(r => list.appendChild(r)); }
    else if (a === 'csv') download('problem-statements.csv', toCSV([['ID', 'Title', 'Ministry · Theme', 'Category']].concat(data())), 'text/csv');
    else if (a === 'copy') copy(data().map(d => `${d[0]} — ${d[1]} (${d[2]})`).join('\n')); });
});
feat('Problem statements: random pick', () => {});
feat('Problem statements: sort A→Z', () => {});
feat('Problem statements: export CSV', () => {});
feat('Problem statements: copy visible list', () => {});
feat('Track recently viewed problem statements + bookmark badge', () => {
  document.addEventListener('click', e => {
    const star = e.target.closest('.ps-star'); if (star) { setTimeout(() => { if (star.classList.contains('active')) award('star'); }, 80); return; }
    const row = e.target.closest('.ps-row'); if (!row) return;
    const id = row.dataset.id, title = ($('.ps-title', row) || {}).textContent || ''; let rec = store.get('recent', []).filter(r => r.id !== id); rec.unshift({ id, title: title.trim() }); store.set('recent', rec.slice(0, 8)); addXP(1);
  });
});

feat('FAQ: live search', () => {
  const g = $('#faq .faq-grid'); if (!g) return;
  const bar = el('div', { class: 'hrp-tools' }, '<input class="hrp-in" style="max-width:280px" placeholder="🔍 Search FAQs…" aria-label="Search FAQs"><button class="hrp-mini" data-a="open" type="button">Expand all</button><button class="hrp-mini" data-a="close" type="button">Collapse all</button><span class="hrp-muted" id="hrpFaqCount"></span>');
  g.insertAdjacentElement('beforebegin', bar);
  const items = $$('.faq-item', g); const inp = $('input', bar);
  inp.addEventListener('input', () => { const q = inp.value.trim().toLowerCase(); let n = 0; items.forEach(i => { const h = q && !i.textContent.toLowerCase().includes(q); i.style.display = h ? 'none' : ''; if (!h) n++; }); $('#hrpFaqCount').textContent = q ? n + ' match' + (n === 1 ? '' : 'es') : ''; });
  bar.addEventListener('click', e => { const a = e.target.dataset.a; if (a) items.forEach(i => i.classList.toggle('open', a === 'open' && i.style.display !== 'none')); });
});
feat('FAQ: expand / collapse all', () => {});
feat('FAQ: "Was this helpful?" votes', () => {
  const votes = store.get('faqv', {});
  $$('#faq .faq-item').forEach((it, idx) => { const inner = $('.faq-a-inner', it); if (!inner) return;
    const b = el('div', { class: 'hrp-muted', style: 'margin-top:8px' }, 'Helpful? <button class="hrp-mini" data-v="up" type="button">👍</button> <button class="hrp-mini" data-v="down" type="button">👎</button> <span></span>');
    const mark = () => { $('span', b).textContent = votes[idx] ? (votes[idx] === 'up' ? 'Thanks!' : 'Thanks — tell us more via Contact') : ''; }; mark();
    b.addEventListener('click', e => { const v = e.target.dataset.v; if (v) { votes[idx] = v; store.set('faqv', votes); mark(); } }); inner.appendChild(b); });
});
feat('FAQ opens earn the "Curious Mind" badge', () => {
  const seen = new Set(store.get('faqSeen', []));
  $$('#faq .faq-q').forEach((q, i) => q.addEventListener('click', () => { seen.add(i); store.set('faqSeen', [...seen]); if (seen.size >= 3) award('faq3'); }));
});

feat('Leaderboard: search, CSV export, copy top 3', () => {
  const rows = $('#boardRows'); if (!rows) return;
  const bar = el('div', { class: 'hrp-tools' }, '<input class="hrp-in" style="max-width:240px" placeholder="🔍 Find a team…" aria-label="Search leaderboard"><button class="hrp-mini" data-a="csv" type="button">⬇ CSV</button><button class="hrp-mini" data-a="top" type="button">📋 Copy top 3</button><span class="hrp-muted" id="hrpLbTime"></span>');
  rows.insertAdjacentElement('beforebegin', bar); const inp = $('input', bar);
  const data = () => $$('.row', rows).map(r => { const d = $('.team > div', r); return [($('.rank', r) || {}).textContent, d && d.firstChild ? d.firstChild.textContent.trim() : '', ($('.team small', r) || {}).textContent || '', ($('.pts', r) || {}).textContent]; });
  const apply = () => { const q = inp.value.trim().toLowerCase(); $$('.row', rows).forEach(r => { r.style.display = q && !r.textContent.toLowerCase().includes(q) ? 'none' : ''; }); };
  inp.addEventListener('input', apply);
  new MutationObserver(() => { apply(); $('#hrpLbTime').textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }).observe(rows, { childList: true });
  bar.addEventListener('click', e => { const a = e.target.dataset.a; if (a === 'csv') download('leaderboard.csv', toCSV([['Rank', 'Name', 'Email', 'Points']].concat(data())), 'text/csv'); else if (a === 'top') copy('🏆 Hackathon Rivals leaderboard\n' + data().slice(0, 3).map(d => `${d[0]} ${d[1]} — ${d[3]}`).join('\n')); });
});
feat('Leaderboard: "last updated" timestamp', () => {});

/* ---------- forms ---------- */
const TYPOS = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com', 'outlok.com': 'outlook.com', 'outlook.co': 'outlook.com', 'iclod.com': 'icloud.com', 'icloud.co': 'icloud.com' };
feat('Email typo suggestions (gmial.com → gmail.com)', () => {
  ['#qEmail', '#newsletterEmail', '#loginEmail'].forEach(sel => { const i = $(sel); if (!i) return;
    const hint = el('div', { class: 'hrp-warn', style: 'display:none;cursor:pointer' }); (i.closest('.input-wrap') || i).insertAdjacentElement('afterend', hint);
    i.addEventListener('blur', () => { const v = i.value.trim(); const at = v.lastIndexOf('@'); if (at < 1) { hint.style.display = 'none'; return; } const dom = v.slice(at + 1).toLowerCase(); const fix = TYPOS[dom];
      if (fix) { hint.textContent = `Did you mean ${v.slice(0, at)}@${fix}? (tap to fix)`; hint.style.display = 'block'; hint.onclick = () => { i.value = v.slice(0, at) + '@' + fix; hint.style.display = 'none'; i.dispatchEvent(new Event('input', { bubbles: true })); }; } else hint.style.display = 'none'; }); });
});
feat('Trim spaces & lowercase emails on blur', () => {
  ['#qName', '#qOrg', '#qSubject', '#qEmail', '#newsletterEmail', '#loginEmail'].forEach(sel => { const i = $(sel); if (!i) return; i.addEventListener('blur', () => { let v = i.value.trim().replace(/\s{2,}/g, ' '); if (/mail/i.test(i.id)) v = v.toLowerCase(); if (v !== i.value) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } }); });
});
feat('Name auto-capitalisation (contact form)', () => {
  const i = $('#qName'); if (!i) return; i.addEventListener('blur', () => { const v = i.value; if (v && (v === v.toLowerCase() || v === v.toUpperCase())) i.value = v.toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase()); });
});
feat('Phone field: strips letters, caps length', () => {
  const i = $('#qPhone'); if (!i) return; i.setAttribute('inputmode', 'tel'); i.addEventListener('input', () => { const v = i.value.replace(/[^\d+\s-]/g, '').slice(0, 15); if (v !== i.value) i.value = v; });
});
feat('Message character counter', () => {
  const m = $('#qMessage'); if (!m) return; const c = el('div', { class: 'hrp-count' }); m.insertAdjacentElement('afterend', c);
  const u = () => { const max = m.maxLength > 0 ? m.maxLength : 0; c.textContent = m.value.length + (max ? ' / ' + max : ' characters'); }; m.addEventListener('input', u); u();
});
feat('Contact form draft autosave', () => {
  const ids = ['#qName', '#qEmail', '#qPhone', '#qOrg', '#qSubject', '#qMessage']; const d = store.get('draft', {});
  ids.forEach(sel => { const i = $(sel); if (!i) return; if (d[sel] && !i.value) i.value = d[sel]; i.addEventListener('input', () => { d[sel] = i.value; store.set('draft', d); }); });
  const b = $('#qSubmit'); if (b) b.addEventListener('click', () => setTimeout(() => { const m = $('#qMessage'); if (m && m.value === '') store.del('draft'); }, 3000));
});
feat('Password strength meter (login / sign-up)', () => {
  const p = $('#loginPassword'); if (!p) return; const m = el('div', null, '<div class="hrp-pw"><i></i></div><div class="hrp-muted" style="font-size:11.5px;margin-top:3px"></div>'); (p.closest('.input-wrap') || p).insertAdjacentElement('afterend', m);
  p.addEventListener('input', () => { const v = p.value; let s = 0; if (v.length >= 8) s++; if (v.length >= 12) s++; if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
    const L = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent']; const col = ['#ff6b6b', '#ff6b6b', '#ff9f43', '#fbbf24', '#3ddc84', '#22d3ee'];
    const i = $('i', m); i.style.width = v ? (s / 5 * 100) + '%' : '0'; i.style.background = col[s]; $('.hrp-muted', m).textContent = v ? 'Strength: ' + L[s] : ''; });
});
feat('Caps-Lock warning on password field', () => {
  const p = $('#loginPassword'); if (!p) return; const w = el('div', { class: 'hrp-warn', style: 'display:none' }, '⇪ Caps Lock is on'); (p.closest('.input-wrap') || p).insertAdjacentElement('afterend', w);
  const chk = e => { if (e.getModifierState) w.style.display = e.getModifierState('CapsLock') ? 'block' : 'none'; }; p.addEventListener('keydown', chk); p.addEventListener('keyup', chk); p.addEventListener('blur', () => { w.style.display = 'none'; });
});

/* ---------- editors ---------- */
feat('Code Lab: Ctrl/⌘ + Enter to run', () => {
  const t = $('#pgCode'), r = $('#pgRun'); if (!t || !r) return; t.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); r.click(); } });
});
feat('Code Lab: live line / word / character counter', () => {
  const t = $('#pgCode'); if (!t) return; const c = el('div', { class: 'hrp-count' }); t.insertAdjacentElement('afterend', c);
  const u = () => { c.textContent = `${t.value ? t.value.split('\n').length : 0} lines · ${(t.value.trim().match(/\S+/g) || []).length} words · ${t.value.length} chars`; }; t.addEventListener('input', u); setInterval(u, 1500); u();
});
feat('Code Lab: download code file', () => {
  const rs = $('#pgReset'); if (!rs) return; const b = el('button', { class: 'pg-icon-btn', title: 'Download code', type: 'button', 'aria-label': 'Download code' }, '⬇'); rs.insertAdjacentElement('afterend', b);
  b.addEventListener('click', () => { const ext = ($('#pgExt') || {}).textContent || 'txt'; download('main.' + ext.trim(), $('#pgCode').value); });
});
feat('Code Lab: editor font-size buttons', () => {
  const t = $('#pgCode'), rs = $('#pgReset'); if (!t || !rs) return; let fs = store.get('pgfs', 13); t.style.fontSize = fs + 'px';
  [['A−', -1], ['A+', 1]].forEach(([l, d]) => { const b = el('button', { class: 'pg-icon-btn', type: 'button', title: 'Editor font size', 'aria-label': l === 'A+' ? 'Increase editor font size' : 'Decrease editor font size' }, l); rs.insertAdjacentElement('afterend', b); b.addEventListener('click', () => { fs = Math.min(24, Math.max(10, fs + d)); t.style.fontSize = fs + 'px'; store.set('pgfs', fs); }); });
});
feat('Code Lab: word-wrap toggle', () => {
  const t = $('#pgCode'), rs = $('#pgReset'); if (!t || !rs) return; const b = el('button', { class: 'pg-icon-btn', type: 'button', title: 'Toggle word wrap', 'aria-label': 'Toggle word wrap' }, '↩'); rs.insertAdjacentElement('afterend', b);
  let w = true; b.addEventListener('click', () => { w = !w; t.setAttribute('wrap', w ? 'soft' : 'off'); t.style.whiteSpace = w ? 'pre-wrap' : 'pre'; toast('Word wrap ' + (w ? 'on' : 'off'), 'info', '↩'); });
});
feat('Code Arena: export history (JSON / CSV)', () => {
  const h = $('#arenaHistory'); if (!h) return; const bar = el('div', { class: 'hrp-tools', style: 'margin-top:8px' }, '<button class="hrp-mini" data-a="j" type="button">⬇ History JSON</button><button class="hrp-mini" data-a="c" type="button">⬇ History CSV</button>'); h.insertAdjacentElement('afterbegin', bar);
  const get = () => { try { return JSON.parse(localStorage.getItem('hr-arena-history') || '[]'); } catch(e){ return []; } };
  bar.addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return; const l = get(); if (!l.length) return toast('No history to export yet', 'warn', '⚠️');
    if (a === 'j') download('arena-history.json', JSON.stringify(l, null, 2), 'application/json'); else { const keys = [...new Set(l.flatMap(o => Object.keys(o)))].filter(k => typeof l[0][k] !== 'object'); download('arena-history.csv', toCSV([keys].concat(l.map(o => keys.map(k => o[k])))), 'text/csv'); } });
});
feat('Admin: one-click CSV export for every table', () => {
  const adm = $('#admin'); if (!adm) return;
  const scan = () => { if (adm.style.display === 'none') return; $$('table', adm).forEach(t => { if (t.dataset.hrp) return; t.dataset.hrp = '1'; const b = el('button', { class: 'hrp-mini', type: 'button', style: 'margin:0 0 8px' }, '⬇ Export table CSV');
    t.insertAdjacentElement('beforebegin', b); b.addEventListener('click', () => { const rows = $$('tr', t).filter(r => r.style.display !== 'none' && !r.querySelector('.admin-empty')).map(r => $$('th,td', r).map(c => c.textContent.trim().replace(/\s+/g, ' '))); download('table-export.csv', toCSV(rows), 'text/csv'); }); }); };
  setInterval(scan, 2000);
});

/* ============ EXAM DATA ============ */
const SUBJ = { dsa: 'DSA', dbms: 'DBMS', os: 'Operating Systems', cn: 'Networks', prog: 'Programming', web: 'Web & Git', apt: 'Aptitude', lr: 'Reasoning' };
const QB = [];
const QM = {};
function Q(s, d, t, o, a, e){ const id = s + (QB.filter(x => x.s === s).length + 1); const item = { id, s, d, t, o, a, e }; QB.push(item); QM[id] = item; }

/* --- DSA --- */
Q('dsa',1,'What is the time complexity of binary search on a sorted array of n elements?',['O(n)','O(log n)','O(n log n)','O(1)'],1,'Each step halves the search range, so about log₂ n steps are needed.');
Q('dsa',1,'Which data structure follows the LIFO principle?',['Queue','Stack','Heap','Linked list'],1,'A stack removes the most recently added element first (Last In, First Out).');
Q('dsa',2,'What is the worst-case time complexity of Quick Sort?',['O(n log n)','O(n)','O(n²)','O(log n)'],2,'A consistently bad pivot (for example a sorted input with the first element as pivot) gives n levels of n work each.');
Q('dsa',1,'Which traversal of a Binary Search Tree visits the keys in sorted order?',['Preorder','Inorder','Postorder','Level order'],1,'Inorder visits left subtree, node, then right subtree, which gives ascending order in a BST.');
Q('dsa',1,'A tree with n nodes has how many edges?',['n','n − 1','n + 1','2n'],1,'Every node except the root has exactly one edge to its parent.');
Q('dsa',1,'Which data structure is normally used to implement Breadth-First Search?',['Stack','Queue','Priority queue','Hash map'],1,'BFS explores level by level, which needs first-in-first-out order.');
Q('dsa',2,'Which of these sorting algorithms is stable in its standard form?',['Quick sort','Heap sort','Merge sort','Selection sort'],2,'Merge sort keeps equal elements in their original order when merging.');
Q('dsa',1,'Average time to look up a key in a well-designed hash table?',['O(1)','O(log n)','O(n)','O(n²)'],0,'With a good hash function and load factor, lookups take constant time on average.');
Q('dsa',2,'Which algorithm finds shortest paths from one source when all edge weights are non-negative?',['Kruskal','Prim','Dijkstra','Topological sort'],2,'Dijkstra greedily settles the closest unvisited vertex; it fails with negative edges.');
Q('dsa',2,'Maximum number of nodes in a binary tree of height h (root at height 0)?',['2ʰ','2ʰ⁺¹ − 1','2ʰ − 1','h²'],1,'Levels 0..h hold 1 + 2 + … + 2ʰ = 2ʰ⁺¹ − 1 nodes.');
Q('dsa',2,'Which structure is most suitable for implementing a priority queue?',['Binary heap','Stack','Array of linked lists','Trie'],0,'A binary heap gives O(log n) insert and extract-min/max.');
Q('dsa',1,'Inserting a node at the head of a singly linked list takes…',['O(1)','O(log n)','O(n)','O(n²)'],0,'Only the new node’s pointer and the head pointer change.');
Q('dsa',2,'Floyd’s tortoise-and-hare technique is used to…',['Sort a list','Detect a cycle in a linked list','Find the median','Balance a BST'],1,'A fast and a slow pointer meet inside a cycle if one exists.');
Q('dsa',2,'Minimum number of comparisons needed to find the maximum of n distinct numbers?',['n','n − 1','log n','n / 2'],1,'Every element except the maximum must lose at least one comparison.');
Q('dsa',3,'What is the time complexity of building a binary heap from n elements with the bottom-up (heapify) method?',['O(n log n)','O(n)','O(log n)','O(n²)'],1,'Most nodes are near the leaves and sift down very little, so the total work sums to O(n).');

/* --- DBMS --- */
Q('dbms',1,'In ACID, what does the letter “A” stand for?',['Availability','Atomicity','Aggregation','Authorization'],1,'Atomicity means a transaction happens completely or not at all.');
Q('dbms',1,'Which statement about a primary key is true?',['It can contain NULL','It uniquely identifies each row and cannot be NULL','It may have duplicates','It must be numeric'],1,'A primary key is unique and NOT NULL, and can be of any data type.');
Q('dbms',2,'Which normal form removes transitive dependencies?',['1NF','2NF','3NF','BCNF only'],2,'3NF requires that non-key attributes depend only on the key, not on other non-key attributes.');
Q('dbms',1,'Which command quickly removes all rows from a table while keeping its structure?',['DROP','TRUNCATE','ALTER','RENAME'],1,'TRUNCATE empties the table; DROP would delete the table itself.');
Q('dbms',1,'Which join returns all rows from the left table and the matching rows from the right table?',['INNER JOIN','LEFT JOIN','CROSS JOIN','SELF JOIN'],1,'Unmatched right-side columns come back as NULL.');
Q('dbms',1,'Which of these is a DDL command?',['INSERT','UPDATE','CREATE','SELECT'],2,'DDL defines structure (CREATE, ALTER, DROP). The others are DML/DQL.');
Q('dbms',1,'A foreign key is mainly used to enforce…',['Referential integrity','Faster sorting','Data encryption','Row-level locking'],0,'It ensures a value in one table matches an existing key in another table.');
Q('dbms',1,'GROUP BY is most commonly used together with…',['Aggregate functions','ORDER BY only','Triggers','Views only'],0,'Functions such as COUNT, SUM and AVG summarise each group.');
Q('dbms',2,'How does HAVING differ from WHERE?',['HAVING filters groups after aggregation','HAVING is faster','WHERE works only on numbers','They are identical'],0,'WHERE filters rows before grouping; HAVING filters the resulting groups.');
Q('dbms',2,'Reading data written by an uncommitted transaction is called a…',['Dirty read','Phantom read','Lost update','Deadlock'],0,'If that transaction later rolls back, the reader has seen data that never existed.');
Q('dbms',2,'What is the typical effect of adding an index on a column?',['Faster reads, slower writes','Faster writes, slower reads','No effect','Faster reads and writes'],0,'Lookups improve, but every insert/update must also maintain the index.');
Q('dbms',2,'A candidate key is…',['Any set of columns','A minimal set of attributes that uniquely identifies a row','Only a foreign key','A duplicate column'],1,'It is a minimal superkey; one candidate key is chosen as the primary key.');
Q('dbms',1,'Which of the following is NOT an aggregate function?',['COUNT','SUM','AVG','ROUND'],3,'ROUND works on a single value (scalar function); the others combine many rows.');
Q('dbms',2,'A table is in 2NF when it is in 1NF and has no…',['Transitive dependency','Partial dependency','Multivalued attribute','Foreign key'],1,'No non-key attribute may depend on only part of a composite key.');
Q('dbms',3,'Why do databases commonly use B+ trees for indexes?',['They store no data in leaves','Leaves are linked, making range scans efficient','They need no balancing','They use hashing'],1,'Linked leaf nodes let a range query walk sequentially after one tree descent.');

/* --- OS --- */
Q('os',1,'Which CPU scheduling algorithm is non-preemptive?',['Round Robin','FCFS','Shortest Remaining Time First','Preemptive priority'],1,'First-Come-First-Served lets a process run until it finishes or blocks.');
Q('os',2,'Which of these is NOT a necessary condition for deadlock?',['Mutual exclusion','Hold and wait','Starvation','Circular wait'],2,'The four Coffman conditions are mutual exclusion, hold and wait, no preemption and circular wait.');
Q('os',2,'Belady’s anomaly can occur with which page replacement algorithm?',['LRU','FIFO','Optimal','None'],1,'With FIFO, giving a process more frames can sometimes increase page faults.');
Q('os',1,'Thrashing in an operating system refers to…',['Excessive paging that slows the system','CPU overheating','Disk failure','Too many users logged in'],0,'The system spends more time swapping pages than executing.');
Q('os',1,'What do threads of the same process share?',['Stack','Registers','Address space and open files','Program counter'],2,'Each thread has its own stack, registers and program counter, but shares memory and resources.');
Q('os',1,'A semaphore is primarily used for…',['Process synchronization','Memory compaction','File compression','Disk scheduling'],0,'It controls access to shared resources between processes or threads.');
Q('os',1,'What is the smallest unit of CPU utilisation?',['Process','Thread','Program','Job'],1,'A thread is the basic unit of CPU scheduling within a process.');
Q('os',1,'Virtual memory allows…',['Running programs larger than physical RAM','Faster CPUs','Bigger disks','Unlimited cache'],0,'Parts of a program are kept on disk and paged into RAM as needed.');
Q('os',1,'Performance of Round Robin scheduling depends heavily on…',['Time quantum','Disk size','Number of files','Network speed'],0,'Too small a quantum wastes time on context switches; too large behaves like FCFS.');
Q('os',2,'A zombie process is one that…',['Uses 100% CPU','Has terminated but still has an entry in the process table','Is waiting for I/O','Is a child of init'],1,'It stays until its parent reads the exit status with wait().');
Q('os',1,'Which mode allows execution of privileged instructions?',['User mode','Kernel mode','Safe mode','Guest mode'],1,'Only the kernel may access hardware and critical resources directly.');
Q('os',2,'Non-preemptive Shortest Job First minimises…',['Average waiting time','Throughput','Context switches','Memory use'],0,'When all jobs arrive together, SJF gives the minimum average waiting time.');
Q('os',2,'What does the TLB cache?',['Page table entries','Disk blocks','CPU registers','File names'],0,'The Translation Lookaside Buffer speeds up virtual-to-physical address translation.');
Q('os',2,'During a context switch the OS saves the state of the outgoing process in its…',['PCB','TLB','Page table only','Heap'],0,'The Process Control Block stores registers, program counter and other state.');
Q('os',2,'Which memory management scheme suffers from external fragmentation?',['Paging','Segmentation','Both use fixed blocks','None'],1,'Variable-sized segments leave scattered free holes; paging mainly wastes space inside the last page.');

/* --- Networks --- */
Q('cn',1,'How many layers are there in the OSI model?',['4','5','7','9'],2,'Physical, Data link, Network, Transport, Session, Presentation, Application.');
Q('cn',1,'Class A IPv4 addresses have a first octet in the range…',['1–126','128–191','192–223','224–239'],0,'0 and 127 are reserved, so usable Class A networks start with 1 to 126.');
Q('cn',1,'Which transport-layer protocol is connectionless?',['TCP','UDP','HTTP','FTP'],1,'UDP sends datagrams without setting up a connection or guaranteeing delivery.');
Q('cn',1,'Default port number of HTTPS?',['80','21','443','8080'],2,'HTTP uses 80; HTTPS uses 443.');
Q('cn',1,'DNS is used to…',['Translate domain names to IP addresses','Assign IP addresses','Encrypt traffic','Route packets'],0,'It works like the internet’s phone book.');
Q('cn',1,'How long is a MAC address?',['32 bits','48 bits','64 bits','128 bits'],1,'MAC addresses are 48 bits, usually written as six hexadecimal pairs.');
Q('cn',1,'Which device operates at the Network layer?',['Hub','Switch','Router','Repeater'],2,'Routers forward packets between networks using IP addresses.');
Q('cn',1,'How does TCP establish a connection?',['Two-way handshake','Three-way handshake','Four-way handshake','No handshake'],1,'SYN, SYN-ACK, ACK.');
Q('cn',1,'How long is an IPv6 address?',['32 bits','64 bits','128 bits','256 bits'],2,'IPv6 uses 128-bit addresses, giving a vastly larger address space than IPv4.');
Q('cn',1,'Which protocol is used to send email?',['SMTP','FTP','SNMP','TFTP'],0,'SMTP sends mail; IMAP and POP3 retrieve it.');
Q('cn',2,'The subnet mask /24 is equal to…',['255.0.0.0','255.255.0.0','255.255.255.0','255.255.255.255'],2,'24 network bits = three full octets of ones.');
Q('cn',1,'ARP is used to map…',['IP address to MAC address','Domain to IP','MAC to domain','Port to service'],0,'It finds the hardware address that corresponds to an IPv4 address on the local network.');
Q('cn',1,'Which port does SSH use by default?',['21','22','23','25'],1,'FTP is 21, Telnet is 23, SMTP is 25.');
Q('cn',1,'Routing is a function of which OSI layer?',['Data link','Network','Transport','Session'],1,'The Network layer handles logical addressing and path selection.');
Q('cn',3,'How many usable host addresses are there in a /30 subnet?',['2','4','6','8'],0,'A /30 has 4 addresses; subtract the network and broadcast addresses to get 2.');

/* --- Programming --- */
Q('prog',1,'Which of these is NOT a pillar of OOP?',['Encapsulation','Inheritance','Polymorphism','Compilation'],3,'The pillars are encapsulation, inheritance, polymorphism and abstraction.');
Q('prog',1,'Method overloading is an example of…',['Compile-time polymorphism','Runtime polymorphism','Inheritance','Encapsulation'],0,'The compiler picks the method by its signature at compile time.');
Q('prog',1,'What is the purpose of a constructor?',['Destroy an object','Initialise a newly created object','Copy files','Import modules'],1,'It runs when an object is created and sets its initial state.');
Q('prog',1,'In Java, which keyword prevents a class from being inherited?',['static','final','abstract','private'],1,'A final class cannot be extended.');
Q('prog',1,'Which Python type is immutable?',['list','dict','tuple','set'],2,'Tuples cannot be changed after creation.');
Q('prog',1,'What does 7 // 2 evaluate to in Python?',['3.5','3','4','2'],1,'// is floor division.');
Q('prog',2,'An abstract class can contain…',['Only abstract methods','Only concrete methods','Both abstract and concrete methods','Neither'],2,'It can mix implemented methods with abstract ones that subclasses must define.');
Q('prog',1,'Accessing an array element by index takes…',['O(1)','O(log n)','O(n)','O(n²)'],0,'The address is computed directly from the index.');
Q('prog',1,'Every correct recursive function needs a…',['Loop','Base case','Global variable','Pointer'],1,'Without a base case the recursion never stops.');
Q('prog',2,'In Python, what does the “is” operator check?',['Value equality','Object identity','Type only','Length'],1,'“is” tests whether both names refer to the same object; “==” compares values.');
Q('prog',1,'On most modern platforms the size of an int in C is typically…',['1 byte','2 bytes','4 bytes','16 bytes'],2,'It is implementation-defined, but 4 bytes (32 bits) is the common size.');
Q('prog',1,'Which C operator gives the address of a variable?',['*','&','->','#'],1,'&x returns the address of x.');
Q('prog',1,'Encapsulation means…',['Hiding data and bundling it with the methods that use it','Creating many objects','Reusing code through classes','Converting types'],0,'Data is kept private and accessed through controlled methods.');
Q('prog',2,'What does garbage collection in Java reclaim?',['Unused files','Memory of unreachable objects','CPU cycles','Network sockets'],1,'Objects with no live references are freed automatically.');
Q('prog',2,'In JavaScript, what does typeof null return?',['"null"','"undefined"','"object"','"number"'],2,'It is a long-standing quirk of the language.');

/* --- Web & Git --- */
Q('web',1,'What does HTML stand for?',['HyperText Markup Language','High Transfer Markup Language','HyperTool Multi Language','Home Text Markup Language'],0,'HTML describes the structure of web pages.');
Q('web',2,'Which HTTP method is typically used to replace a whole resource and is idempotent?',['POST','PUT','PATCH','CONNECT'],1,'Repeating the same PUT leaves the resource in the same state.');
Q('web',1,'Which Git command creates a new branch and switches to it?',['git branch new','git checkout -b new','git merge new','git stash new'],1,'“git switch -c new” does the same in newer Git versions.');
Q('web',1,'Which CSS declaration turns an element into a flex container?',['display: flex','position: flex','flex: container','layout: flex'],0,'It enables the flexbox layout model for the element’s children.');
Q('web',1,'HTTP status code 404 means…',['OK','Not Found','Server Error','Forbidden'],1,'The server cannot find the requested resource.');
Q('web',1,'Data stored in localStorage…',['Is deleted when the tab closes','Persists until it is cleared','Is sent to the server on every request','Expires after one hour'],1,'Unlike sessionStorage, it survives browser restarts.');
Q('web',1,'REST stands for…',['Representational State Transfer','Remote Execution Service Tool','Reliable Server Transfer','Resource State Template'],0,'An architectural style for designing networked APIs.');
Q('web',2,'Which of these does standard JSON NOT support?',['Strings','Numbers','Comments','Arrays'],2,'JSON has no comment syntax.');
Q('web',1,'Which HTML tag creates a hyperlink?',['<link>','<a>','<href>','<url>'],1,'The anchor element with an href attribute.');
Q('web',1,'By default, “git pull” is equivalent to…',['git fetch + git merge','git push + git fetch','git clone + git merge','git add + git commit'],0,'It downloads remote changes and integrates them (or rebases, if configured).');
Q('web',2,'CORS restrictions are enforced by…',['The web browser','The DNS server','The database','The operating system'],0,'Browsers block cross-origin responses unless the server allows them via CORS headers.');
Q('web',1,'HTTP status code 500 indicates…',['Client error','Redirect','Internal server error','Success'],2,'The server hit an unexpected condition.');
Q('web',1,'What does “npm install” do when run in a project folder?',['Publishes the package','Installs dependencies listed in package.json','Deletes node_modules','Starts the server'],1,'It downloads the packages the project depends on.');
Q('web',2,'Which cookie attribute stops JavaScript from reading the cookie?',['Secure','HttpOnly','SameSite','Path'],1,'HttpOnly cookies are sent to the server but hidden from document.cookie.');
Q('web',2,'The best defence against SQL injection is…',['Parameterised queries','Hiding the database','Longer passwords','Client-side validation only'],0,'Placeholders keep user input as data, never as SQL code.');

/* --- Aptitude --- */
Q('apt',1,'What is 20% of 250?',['25','40','50','60'],2,'250 × 20 / 100 = 50.');
Q('apt',1,'Simple interest on ₹5,000 at 10% per annum for 2 years?',['₹500','₹1,000','₹1,050','₹1,200'],1,'SI = P × R × T / 100 = 5000 × 10 × 2 / 100 = 1000.');
Q('apt',2,'A 120 m long train moving at 60 km/h crosses a pole in…',['6 s','7.2 s','8 s','12 s'],1,'60 km/h = 50/3 m/s, so time = 120 ÷ (50/3) = 7.2 s.');
Q('apt',1,'A shopkeeper buys an article for ₹400 and sells it for ₹500. Profit percentage?',['20%','25%','30%','10%'],1,'Profit = 100; 100 / 400 × 100 = 25%.');
Q('apt',2,'A can finish a job in 10 days and B in 15 days. Working together they finish in…',['5 days','6 days','7.5 days','12 days'],1,'Combined rate = 1/10 + 1/15 = 1/6 per day.');
Q('apt',1,'₹160 is divided in the ratio 3 : 5. What is the larger share?',['₹60','₹80','₹100','₹120'],2,'160 ÷ 8 = 20 per part, and 5 × 20 = 100.');
Q('apt',2,'Compound interest on ₹1,000 at 10% per annum for 2 years?',['₹200','₹210','₹220','₹121'],1,'Amount = 1000 × 1.1² = 1210, so CI = 210.');
Q('apt',1,'LCM of 12 and 18 is…',['6','36','54','72'],1,'12 = 2²×3 and 18 = 2×3², so LCM = 2²×3² = 36.');
Q('apt',1,'Find 15% of 40 + 40% of 15.',['6','12','15','24'],1,'6 + 6 = 12.');
Q('apt',1,'How many different arrangements are possible for the letters of the word CAT?',['3','6','9','12'],1,'3! = 6.');
Q('apt',1,'Probability of getting two heads in two tosses of a fair coin?',['1/2','1/4','1/3','3/4'],1,'(1/2) × (1/2) = 1/4.');
Q('apt',1,'72 km/h expressed in m/s is…',['15','18','20','25'],2,'Multiply by 5/18: 72 × 5/18 = 20.');
Q('apt',1,'The sum of the first 20 natural numbers is…',['190','200','210','220'],2,'n(n + 1)/2 = 20 × 21 / 2 = 210.');
Q('apt',1,'A 20% discount is given on a marked price of ₹1,500. The selling price is…',['₹1,000','₹1,200','₹1,300','₹1,350'],1,'1500 − 300 = 1200.');
Q('apt',3,'Two numbers are in the ratio 2 : 3 and the sum of their squares is 468. The larger number is…',['12','15','18','21'],2,'4k² + 9k² = 13k² = 468 gives k = 6, so the numbers are 12 and 18.');

/* --- Reasoning --- */
Q('lr',1,'Find the next number: 2, 6, 12, 20, 30, ?',['38','40','42','44'],2,'Differences are 4, 6, 8, 10, so the next difference is 12: 30 + 12 = 42.');
Q('lr',1,'Find the next number: 1, 4, 9, 16, 25, ?',['30','32','36','49'],2,'These are perfect squares: 6² = 36.');
Q('lr',1,'Odd one out: 2, 3, 5, 9, 11',['2','5','9','11'],2,'All the others are prime numbers.');
Q('lr',1,'If A = 1, B = 2, C = 3 and so on, the sum of the letter values in BAD is…',['6','7','8','9'],1,'2 + 1 + 4 = 7.');
Q('lr',2,'A is the sister of B, and B is the father of C. How is A related to C?',['Mother','Aunt','Grandmother','Cousin'],1,'A is the sister of C’s father, so she is C’s paternal aunt.');
Q('lr',2,'A man walks 5 km north, then 5 km east, then 5 km south. How far is he from the start?',['0 km','5 km','10 km','15 km'],1,'The north and south legs cancel, leaving him 5 km east of the start.');
Q('lr',1,'What is the angle between the hands of a clock at 3:00?',['60°','75°','90°','120°'],2,'Each hour mark is 30°, and 3 hours = 90°.');
Q('lr',2,'Statements: All cats are animals. Some animals are black. Conclusion: Some cats are black.',['Definitely true','Definitely false','Cannot be determined','Partly true'],2,'The black animals might not include any cats, so the conclusion does not necessarily follow.');
Q('lr',1,'Find the next number: 3, 6, 12, 24, ?',['30','36','48','60'],2,'Each term doubles.');
Q('lr',2,'If today is Monday, what day will it be after 100 days?',['Tuesday','Wednesday','Thursday','Friday'],1,'100 = 14 × 7 + 2, so move 2 days ahead: Wednesday.');
Q('lr',1,'Book : Reading :: Fork : ?',['Kitchen','Eating','Metal','Spoon'],1,'A book is used for reading; a fork is used for eating.');
Q('lr',1,'Find the next number: 1, 1, 2, 3, 5, 8, ?',['11','12','13','15'],2,'Each term is the sum of the previous two.');
Q('lr',2,'In a row of 20 people, Ravi is 8th from the left. What is his position from the right?',['11th','12th','13th','14th'],2,'20 − 8 + 1 = 13.');
Q('lr',1,'Odd one out: Square, Triangle, Circle, Cube',['Square','Triangle','Circle','Cube'],3,'The cube is three-dimensional; the others are flat shapes.');
Q('lr',2,'A father is three times as old as his son. The sum of their ages is 48. How old is the son?',['10','12','14','16'],1,'x + 3x = 48 gives x = 12.');

/* --- Flashcard decks --- */
const DECKS = {
  'Tech acronyms': [['API','Application Programming Interface'],['CPU','Central Processing Unit'],['RAM','Random Access Memory'],['HTTP','HyperText Transfer Protocol'],['HTTPS','HTTP Secure (HTTP over TLS)'],['URL','Uniform Resource Locator'],['DNS','Domain Name System'],['IP','Internet Protocol'],['TCP','Transmission Control Protocol'],['UDP','User Datagram Protocol'],['SQL','Structured Query Language'],['CRUD','Create, Read, Update, Delete'],['IDE','Integrated Development Environment'],['OOP','Object-Oriented Programming'],['JSON','JavaScript Object Notation'],['XML','eXtensible Markup Language'],['CSS','Cascading Style Sheets'],['SDK','Software Development Kit'],['CI/CD','Continuous Integration / Continuous Delivery'],['VPN','Virtual Private Network'],['GUI','Graphical User Interface'],['ROM','Read-Only Memory'],['SSD','Solid State Drive'],['LAN','Local Area Network'],['MVP','Minimum Viable Product']],
  'Data structures': [['Stack','LIFO collection. Push and pop happen at the same end. Used for undo, recursion and expression evaluation.'],['Queue','FIFO collection. Enqueue at the rear, dequeue at the front. Used in BFS and scheduling.'],['Linked list','Nodes connected by pointers. Fast insert/delete at a known node, slow random access.'],['Hash table','Maps keys to buckets using a hash function. Average O(1) lookup, collisions must be handled.'],['Binary tree','Tree in which each node has at most two children.'],['Binary search tree','Binary tree where left < node < right. Inorder traversal gives sorted order.'],['Heap','Complete binary tree with the heap property (parent ≥ or ≤ children). Backbone of priority queues.'],['Graph','Vertices connected by edges; may be directed/undirected and weighted/unweighted.'],['Trie','Tree that stores strings character by character. Great for prefix search and autocomplete.'],['Deque','Double-ended queue: insert and remove at both ends.'],['Array','Contiguous memory with O(1) index access; insertion in the middle costs O(n).'],['Set','Collection of unique elements with fast membership tests.']],
  'OS & DBMS terms': [['Process','A program in execution, with its own address space and resources.'],['Thread','Lightweight unit of execution inside a process; threads share memory.'],['Deadlock','Processes wait forever for resources held by each other (mutual exclusion, hold & wait, no preemption, circular wait).'],['Semaphore','Integer variable used with wait/signal to synchronise access to shared resources.'],['Paging','Memory split into fixed-size pages/frames; removes external fragmentation.'],['Virtual memory','Technique that lets processes use more memory than physically available by swapping pages to disk.'],['Context switch','Saving one process’s state and loading another’s so the CPU can switch between them.'],['Primary key','Column(s) that uniquely identify each row; cannot be NULL.'],['Foreign key','Column referring to a key in another table; enforces referential integrity.'],['Normalisation','Organising tables to reduce redundancy and anomalies (1NF, 2NF, 3NF, BCNF).'],['Transaction','A logical unit of work that follows ACID properties.'],['Index','Auxiliary structure (often a B+ tree) that speeds up lookups at the cost of extra writes.'],['View','A stored query that behaves like a virtual table.'],['Join','Operation that combines rows from two or more tables based on a related column.']],
  'Networking terms': [['Router','Forwards packets between networks using IP addresses (Layer 3).'],['Switch','Forwards frames inside a LAN using MAC addresses (Layer 2).'],['Firewall','Filters network traffic according to security rules.'],['DHCP','Automatically assigns IP addresses to devices on a network.'],['NAT','Translates private IP addresses to a public one at the router.'],['MAC address','48-bit hardware identifier of a network interface.'],['Bandwidth','Maximum amount of data that can be transferred per unit time.'],['Latency','Delay between sending a request and receiving the response.'],['Subnet','A logical subdivision of an IP network.'],['Gateway','Node that connects a local network to other networks, often the internet.']]
};

/* --- Syllabus topics --- */
const SYL = {
  'DSA': ['Arrays & strings','Linked lists','Stacks & queues','Recursion','Sorting & searching','Trees & BST','Heaps','Hashing','Graphs (BFS/DFS)','Dynamic programming','Complexity analysis'],
  'DBMS': ['ER model','Relational algebra','SQL queries','Joins','Normalisation','Transactions & ACID','Indexing','Concurrency control'],
  'Operating Systems': ['Processes & threads','CPU scheduling','Synchronisation','Deadlocks','Memory management','Virtual memory','File systems','I/O & disk scheduling'],
  'Networks': ['OSI & TCP/IP','IP addressing & subnetting','Routing','TCP vs UDP','Application protocols','Network security'],
  'Programming': ['OOP concepts','Inheritance & polymorphism','Exception handling','Pointers & memory','Python basics','Data types & operators'],
  'Web & Git': ['HTML & CSS','JavaScript basics','HTTP & REST','Git workflow','Databases for web','Deployment'],
  'Aptitude': ['Percentages','Profit & loss','Ratio & proportion','Time, speed & distance','Time & work','Interest','Permutations & probability'],
  'Reasoning': ['Number series','Coding-decoding','Blood relations','Directions','Syllogisms','Seating arrangement','Analogies']
};

/* ============ B.TECH-LEVEL QUESTION BANK ============ */
Object.assign(SUBJ, { coa: 'Computer Organization', dl: 'Digital Logic', toc: 'Theory of Computation', cd: 'Compiler Design', algo: 'Algorithms', dm: 'Discrete Maths', em: 'Engg Maths & Probability', se: 'Software Engineering' });
function B(s, d, t, o, a, e){ Q(s, d, t, o, a, e); QB[QB.length - 1].b = 1; }

/* --- Computer Organization & Architecture --- */
B('coa',1,'How many bytes can a byte-addressable machine with a 32-bit address bus access?',['2 GB','4 GB','8 GB','16 GB'],1,'2³² bytes = 4 GB.');
B('coa',2,'A direct-mapped cache has 256 lines with 16-byte blocks. For a 32-bit address, how many tag bits are needed?',['16','18','20','24'],2,'Offset = 4 bits (16 B), index = 8 bits (256 lines), so tag = 32 − 4 − 8 = 20 bits.');
B('coa',2,'Cache hit time is 2 ns, miss rate 5% and miss penalty 100 ns. What is the average memory access time?',['5 ns','7 ns','9 ns','12 ns'],1,'AMAT = hit time + miss rate × miss penalty = 2 + 0.05 × 100 = 7 ns.');
B('coa',1,'An ideal k-stage pipeline with no stalls processing a very large number of instructions gives a speedup of approximately…',['1','k','k²','log k'],1,'Each cycle completes one instruction instead of one per k cycles, so speedup → k.');
B('coa',2,'A read-after-write (RAW) hazard is also called a…',['True (flow) dependency','Anti-dependency','Output dependency','Control dependency'],0,'The second instruction needs a value produced by the first, so it is a genuine data flow dependency.');
B('coa',2,'A 2 GHz processor has an average CPI of 2.5. How long does it take to execute 10⁹ instructions?',['0.5 s','1.0 s','1.25 s','2.5 s'],2,'Time = instructions × CPI ÷ clock rate = 10⁹ × 2.5 ÷ 2×10⁹ = 1.25 s.');
B('coa',1,'Booth’s algorithm is used for…',['Multiplying signed numbers in two’s complement','Dividing unsigned numbers','Floating-point addition','Cache replacement'],0,'It reduces the number of additions by encoding runs of 1s in the multiplier.');
B('coa',1,'How many address lines are needed for a 64K × 8 memory?',['8','12','16','64'],2,'64K = 2¹⁶ locations, so 16 address lines.');
B('coa',2,'The 8-bit two’s complement representation of −13 is…',['11110011','11110010','10001101','11110001'],0,'13 = 00001101 → invert = 11110010 → add 1 = 11110011.');
B('coa',1,'Which technique lets an I/O device transfer blocks of data to memory without the CPU handling every word?',['Polling','DMA','Interrupt-driven I/O','Programmed I/O'],1,'A DMA controller moves the data directly and interrupts the CPU when the transfer completes.');
B('coa',3,'40% of a program’s execution time can be sped up 10×. By Amdahl’s law, the overall speedup is about…',['1.56','2.5','4.0','10'],0,'Speedup = 1 ÷ (0.6 + 0.4/10) = 1 ÷ 0.64 ≈ 1.56.');
B('coa',1,'Which addressing mode is most suitable for accessing array elements?',['Immediate','Indexed','Implied','Register direct'],1,'The base address plus an index register selects the element.');

/* --- Digital Logic --- */
B('dl',2,'What is the minimum number of 2-input NAND gates needed to implement an XOR gate?',['2','3','4','5'],2,'The standard construction uses four NAND gates.');
B('dl',1,'How many flip-flops are needed to build a mod-10 counter?',['3','4','5','10'],1,'2³ = 8 < 10 ≤ 16 = 2⁴, so 4 flip-flops.');
B('dl',1,'Simplify F = A + A′B.',['A','B','A + B','AB'],2,'A + A′B = (A + A′)(A + B) = A + B.');
B('dl',2,'A full adder can be built from…',['1 half adder and 1 OR gate','2 half adders and 1 OR gate','2 half adders and 2 OR gates','3 half adders'],1,'The two half-adder carries are combined with an OR gate.');
B('dl',3,'How many 2-to-4 decoders (with enable) are needed to construct a 4-to-16 decoder?',['2','4','5','8'],2,'Four decoders produce the 16 outputs and one more decodes the two upper bits to enable them.');
B('dl',2,'The race-around condition in a JK flip-flop occurs when…',['J = K = 0','J = K = 1 and the clock pulse is longer than the propagation delay','J = 1, K = 0','The clock is edge-triggered'],1,'The output keeps toggling during the pulse; master-slave or edge-triggered designs prevent it.');
B('dl',1,'How many minterms does a 4-variable Boolean function have (total possible)?',['4','8','16','32'],2,'2⁴ = 16 possible minterms.');
B('dl',2,'The Gray code equivalent of binary 1011 is…',['1110','1010','1101','0111'],0,'MSB stays 1; then 1⊕0 = 1, 0⊕1 = 1, 1⊕1 = 0.');
B('dl',1,'How many select lines does a 4:1 multiplexer have?',['1','2','3','4'],1,'log₂ 4 = 2.');
B('dl',1,'Which single gate type is universal (can build any logic function)?',['AND','OR','NAND','XOR'],2,'NAND (and also NOR) can implement NOT, AND and OR.');
B('dl',1,'Which flip-flop removes the invalid input condition of the SR flip-flop?',['D','T','JK','Latch only'],2,'For J = K = 1 the JK flip-flop simply toggles.');
B('dl',3,'How many distinct states does a Johnson (twisted-ring) counter with n flip-flops have?',['n','2n','2ⁿ','2ⁿ − 1'],1,'A Johnson counter cycles through 2n states.');

/* --- Theory of Computation --- */
B('toc',1,'Which machine recognises exactly the regular languages?',['DFA','PDA','Linear bounded automaton','Turing machine'],0,'DFAs, NFAs and regular expressions have equal power.');
B('toc',2,'The language { aⁿbⁿ | n ≥ 1 } is…',['Regular','Context-free but not regular','Context-sensitive only','Not recursive'],1,'A PDA can match the counts using its stack, but no finite automaton can.');
B('toc',2,'The pumping lemma for regular languages is used to…',['Prove a language is regular','Prove a language is NOT regular','Minimise a DFA','Convert an NFA to a DFA'],1,'It gives a property every regular language has; violating it shows a language is not regular.');
B('toc',2,'How many states does the minimal DFA have for strings over {a, b} that end with “ab”?',['2','3','4','5'],1,'States: no progress, seen “a”, seen “ab” (accepting).');
B('toc',2,'An NFA with n states can be converted to an equivalent DFA with at most how many states?',['n','n²','2ⁿ','n!'],2,'Subset construction may create every subset of the NFA’s states.');
B('toc',1,'The halting problem is…',['Decidable','Undecidable','Regular','Context-free'],1,'No algorithm can decide, for every program and input, whether it halts.');
B('toc',1,'The regular expression (a|b)*abb generates…',['Strings that start with abb','Strings over {a, b} that end with abb','Strings that contain exactly one abb','Only the string abb'],1,'Any string of a’s and b’s followed by abb.');
B('toc',2,'A context-free grammar is ambiguous if…',['It has left recursion','Some string has more than one parse tree','It has no start symbol','It generates an infinite language'],1,'Two different parse trees (equivalently leftmost derivations) exist for one string.');
B('toc',1,'Nondeterministic pushdown automata accept exactly…',['Regular languages','Context-free languages','Recursive languages','Finite languages'],1,'PDA = finite automaton + stack = CFL recognisers.');
B('toc',3,'Regular languages are NOT closed under…',['Union','Complement','Intersection','Arbitrary (infinite) union'],3,'An infinite union of finite (hence regular) languages can give a non-regular language such as { aⁿbⁿ }.');
B('toc',2,'Type-0 grammars in the Chomsky hierarchy generate…',['Regular languages','Context-free languages','Context-sensitive languages','Recursively enumerable languages'],3,'They are recognised by Turing machines.');
B('toc',3,'The language { ww | w ∈ {a, b}* } is…',['Regular','Context-free','Not context-free','Not decidable'],2,'A PDA cannot match the second half against the first because the stack reverses order.');

/* --- Compiler Design --- */
B('cd',1,'Which compiler phase converts the character stream into tokens?',['Syntax analysis','Lexical analysis','Semantic analysis','Code generation'],1,'The lexer groups characters into lexemes and tokens.');
B('cd',1,'LL(1) parsers are…',['Top-down','Bottom-up','Operator-precedence only','Non-deterministic'],0,'They read Left-to-right and build a Leftmost derivation with 1 token of look-ahead.');
B('cd',2,'LR parsers construct…',['A leftmost derivation','A rightmost derivation in reverse','A random derivation','No derivation'],1,'They shift and reduce, which yields a rightmost derivation in reverse.');
B('cd',2,'Which of these LR parsers is the most powerful?',['LR(0)','SLR(1)','LALR(1)','Canonical LR(1)'],3,'CLR(1) uses full look-ahead sets and accepts the largest class of grammars.');
B('cd',2,'For A → Aα | β, an equivalent grammar without left recursion is…',['A → βA′, A′ → αA′ | ε','A → αA′, A′ → βA′ | ε','A → Aβ | α','A → βα'],0,'β comes first, followed by zero or more α’s handled by the new non-terminal A′.');
B('cd',1,'Which data structure is most commonly used to implement a symbol table for fast lookup?',['Stack','Hash table','Queue','Circular list'],1,'Hashing gives near-constant time insert and lookup of identifiers.');
B('cd',2,'For the grammar S → aB | ε, what is FIRST(S)?',['{ a }','{ ε }','{ a, ε }','{ B }'],2,'S can begin with a or derive the empty string.');
B('cd',2,'Representing a basic block as a DAG helps to eliminate…',['Syntax errors','Common subexpressions','Comments','Macros'],1,'Identical sub-computations map to the same DAG node and are evaluated once.');
B('cd',2,'In bottom-up parsing, a handle is…',['The start symbol','A substring matching a production’s right side that can be reduced','A terminal symbol','An error token'],1,'Reducing the handle is the next step of the reverse rightmost derivation.');
B('cd',1,'Yacc / Bison is used to generate…',['Lexical analysers','Parsers','Linkers','Debuggers'],1,'Lex/Flex generate scanners; Yacc/Bison generate parsers.');
B('cd',2,'Peephole optimisation works on…',['The whole program at once','A small window of target instructions','Only source-code comments','The symbol table'],1,'It replaces short instruction sequences with faster or shorter ones.');
B('cd',2,'Evaluating 2 * 3 at compile time and replacing it by 6 is called…',['Dead-code elimination','Constant folding','Loop unrolling','Strength reduction'],1,'Constant folding computes constant expressions during compilation.');

/* --- Algorithms --- */
B('algo',2,'Solve T(n) = 2T(n/2) + n.',['Θ(n)','Θ(n log n)','Θ(n²)','Θ(log n)'],1,'Master theorem case 2: n^(log₂2) = n matches f(n), giving Θ(n log n).');
B('algo',2,'Solve T(n) = 4T(n/2) + n.',['Θ(n)','Θ(n log n)','Θ(n²)','Θ(n³)'],2,'n^(log₂4) = n² dominates f(n) = n, so Θ(n²).');
B('algo',2,'Dijkstra’s algorithm with a binary heap runs in…',['O(V²)','O((V + E) log V)','O(VE)','O(E log E + V)'],1,'Each edge relaxation may do an O(log V) heap operation.');
B('algo',2,'Bellman–Ford has a running time of…',['O(V + E)','O(V log V)','O(VE)','O(V³)'],2,'It relaxes all E edges V − 1 times and can detect negative cycles.');
B('algo',1,'Floyd–Warshall computes all-pairs shortest paths in…',['O(V²)','O(V³)','O(V² log V)','O(VE log V)'],1,'Three nested loops over the vertices.');
B('algo',2,'Kruskal’s algorithm normally uses which structure to detect cycles?',['Stack','Disjoint-set (union–find)','Queue','Trie'],1,'Union–find quickly checks whether two vertices are already connected.');
B('algo',3,'The dynamic-programming solution of 0/1 knapsack runs in O(nW). This is…',['Polynomial in input size','Pseudo-polynomial','Exponential in n only','Linear'],1,'W is a numeric value, so the running time is exponential in the number of bits used to write W.');
B('algo',3,'What is the length of the longest common subsequence of “ABCBDAB” and “BDCABA”?',['3','4','5','6'],1,'One LCS is BCBA (length 4).');
B('algo',3,'Matrices A (10×30), B (30×5) and C (5×60) are multiplied. The minimum number of scalar multiplications is…',['1,500','4,500','9,000','27,000'],1,'(AB)C costs 10·30·5 + 10·5·60 = 4,500; A(BC) costs 27,000.');
B('algo',2,'Which of these problems is NP-complete (decision version)?',['Shortest path','Minimum spanning tree','Travelling salesman','Sorting'],2,'TSP decision version is NP-complete; the others have polynomial-time solutions.');
B('algo',2,'Appending to a dynamic array that doubles its capacity when full has an amortised cost of…',['O(1)','O(log n)','O(n)','O(n²)'],0,'Occasional O(n) copies are spread over many cheap appends.');
B('algo',1,'Huffman coding is an example of a…',['Greedy algorithm','Backtracking algorithm','Divide and conquer algorithm','Branch and bound algorithm'],0,'It repeatedly merges the two least frequent nodes.');

/* --- Discrete Mathematics --- */
B('dm',1,'How many subsets does a set with n elements have?',['n²','2ⁿ','n!','2n'],1,'Each element is either in or out of a subset.');
B('dm',1,'How many edges does the complete graph Kₙ have?',['n','n(n − 1)/2','n²','2ⁿ'],1,'Every unordered pair of vertices is joined.');
B('dm',1,'A graph has 10 edges. What is the sum of the degrees of all its vertices?',['10','15','20','25'],2,'Handshaking lemma: sum of degrees = 2E = 20.');
B('dm',3,'In how many distinct ways can the letters of MISSISSIPPI be arranged?',['39,916,800','34,650','5,040','69,300'],1,'11! ÷ (4! · 4! · 2!) = 34,650 (I×4, S×4, P×2).');
B('dm',1,'The chromatic number of a bipartite graph with at least one edge is…',['1','2','3','4'],1,'Two colours suffice, and one is not enough because of an edge.');
B('dm',2,'How many binary relations can be defined on a set with 3 elements?',['9','64','512','729'],2,'A relation is any subset of A × A, so 2⁹ = 512.');
B('dm',1,'What is the minimum number of people needed to guarantee two share a birth month?',['12','13','24','365'],1,'By the pigeonhole principle, 12 months + 1 = 13.');
B('dm',2,'A connected graph has an Euler circuit if and only if…',['All vertices have even degree','Exactly two vertices have odd degree','It is a tree','It is bipartite'],0,'Every vertex must be entered and left equally often.');
B('dm',1,'The implication p → q is logically equivalent to…',['¬p ∨ q','p ∨ ¬q','¬p ∧ q','p ∧ q'],0,'It is false only when p is true and q is false.');
B('dm',3,'How many labelled spanning trees does the complete graph K₄ have?',['4','8','16','24'],2,'Cayley’s formula: nⁿ⁻² = 4² = 16.');
B('dm',1,'A relation that is reflexive, symmetric and transitive is called a(n)…',['Partial order','Equivalence relation','Function','Total order'],1,'It partitions the set into equivalence classes.');
B('dm',2,'How many functions are there from a set of 3 elements to a set of 2 elements?',['6','8','9','16'],1,'Each of the 3 inputs has 2 choices: 2³ = 8.');
B('dm',2,'For a connected planar graph, Euler’s formula states…',['V + E + F = 2','V − E + F = 2','V − E − F = 2','V + E − F = 2'],1,'V vertices, E edges and F faces satisfy V − E + F = 2.');

/* --- Engineering Maths & Probability --- */
B('em',2,'The eigenvalues of the matrix [[4, 1], [2, 3]] are…',['2 and 5','1 and 6','3 and 4','−2 and −5'],0,'Trace = 7, determinant = 10, so λ² − 7λ + 10 = 0 gives λ = 2, 5.');
B('em',1,'The determinant of [[1, 2], [3, 4]] is…',['−2','2','10','−10'],0,'1·4 − 2·3 = −2.');
B('em',2,'The rank of a 3×3 matrix in which all three rows are the same non-zero row is…',['0','1','2','3'],1,'Only one linearly independent row.');
B('em',2,'∫ x eˣ dx =',['eˣ(x − 1) + C','eˣ(x + 1) + C','x eˣ + C','eˣ/x + C'],0,'Integration by parts: x eˣ − ∫ eˣ dx = eˣ(x − 1) + C.');
B('em',1,'d/dx [ sin(x²) ] =',['cos(x²)','2x cos(x²)','2x sin(x²)','−2x cos(x²)'],1,'Chain rule: cos(x²) · 2x.');
B('em',1,'lim (x → 0) of sin x ÷ x is…',['0','1','∞','Does not exist'],1,'A standard limit.');
B('em',1,'Two fair dice are rolled. The probability that the sum is 7 is…',['1/12','1/9','1/6','7/36'],2,'6 favourable outcomes out of 36.');
B('em',1,'The expected value of one roll of a fair six-sided die is…',['3','3.5','4','6'],1,'(1 + 2 + … + 6) ÷ 6 = 3.5.');
B('em',3,'P(A) = 0.3, P(B | A) = 0.8, P(B | not A) = 0.2. Find P(A | B).',['0.24','0.63','0.80','0.30'],1,'P(A|B) = 0.24 ÷ (0.24 + 0.14) = 0.24 ÷ 0.38 ≈ 0.63.');
B('em',2,'The variance of a Binomial(n = 10, p = 0.5) random variable is…',['2.5','5','0.25','10'],0,'np(1 − p) = 10 × 0.5 × 0.5 = 2.5.');
B('em',2,'The Laplace transform of e^(at) is…',['1/(s + a)','1/(s − a)','a/s','s/(s − a)'],1,'L{e^(at)} = 1 ÷ (s − a) for s > a.');
B('em',2,'For a Poisson distribution with mean 4, the variance is…',['2','4','8','16'],1,'For a Poisson distribution the mean and variance are both λ.');

/* --- Software Engineering --- */
B('se',1,'Which SDLC model is best suited when requirements are unclear and the project is high-risk?',['Waterfall','Spiral','V-model','Big bang'],1,'The spiral model repeats planning, risk analysis, engineering and evaluation.');
B('se',2,'A control-flow graph has E = 9 edges and N = 7 nodes (one connected component). Its cyclomatic complexity is…',['2','3','4','5'],2,'V(G) = E − N + 2 = 9 − 7 + 2 = 4.');
B('se',1,'Boundary value analysis is a…',['White-box technique','Black-box technique','Static analysis technique','Maintenance technique'],1,'Test cases are chosen at the edges of input ranges without looking at the code.');
B('se',1,'COCOMO is used to estimate…',['Code coverage','Effort, schedule and cost','Network latency','Defect density only'],1,'The Constructive Cost Model predicts effort from size and cost drivers.');
B('se',2,'Which type of coupling between modules is the most desirable?',['Content coupling','Common coupling','Control coupling','Data coupling'],3,'Passing only the needed data keeps modules loosely connected.');
B('se',2,'Which type of cohesion is the best?',['Coincidental','Logical','Functional','Temporal'],2,'A functionally cohesive module performs a single well-defined task.');
B('se',1,'In Scrum, who is responsible for maximising the value of the product and managing the backlog?',['Scrum Master','Product Owner','Developer','Stakeholder'],1,'The Product Owner orders the product backlog.');
B('se',1,'Regression testing is done to…',['Find performance limits','Check that changes have not broken existing functionality','Test only new features','Measure usability'],1,'Previously passing tests are re-run after each change.');
B('se',1,'Which UML diagram shows the time-ordered interaction between objects?',['Class diagram','Sequence diagram','Use-case diagram','Component diagram'],1,'Lifelines and messages are drawn in time order.');
B('se',1,'Fixing bugs found after delivery is which kind of maintenance?',['Corrective','Adaptive','Perfective','Preventive'],0,'Corrective maintenance repairs defects.');
B('se',2,'Validation asks the question…',['Are we building the product right?','Are we building the right product?','Is the code formatted?','Is the schedule met?'],1,'Verification checks conformance to specification; validation checks it meets user needs.');
B('se',2,'Which coverage criterion is stronger?',['Statement coverage','Branch (decision) coverage','Function coverage','Line-count coverage'],1,'100% branch coverage guarantees 100% statement coverage, but not the reverse.');

/* --- Advanced DSA --- */
B('dsa',2,'Keys 10, 20 and 30 are inserted in this order into an empty AVL tree. What is the root?',['10','20','30','The tree is unbalanced'],1,'Inserting 30 makes the tree right-heavy at 10; a left rotation makes 20 the root.');
B('dsa',3,'How many structurally different binary search trees can be built with 4 distinct keys?',['8','12','14','24'],2,'The Catalan number C₄ = 14.');
B('dsa',2,'The height of a binary heap with n nodes is…',['⌊log₂ n⌋','n','⌈n/2⌉','√n'],0,'A heap is a complete binary tree.');
B('dsa',2,'A binary tree has preorder 1 2 4 5 3 and inorder 4 2 5 1 3. Its postorder is…',['4 5 2 3 1','4 2 5 3 1','5 4 2 3 1','4 5 3 2 1'],0,'Root 1; left subtree {4,2,5} with root 2; right subtree {3}. Postorder: 4 5 2 3 1.');
B('dsa',3,'Union–find with path compression and union by rank performs m operations in about…',['O(m log n)','O(m α(n))','O(m n)','O(m²)'],1,'The inverse Ackermann function α(n) grows so slowly that it is effectively constant.');
B('dsa',2,'Building a trie from n strings of maximum length L takes…',['O(n)','O(L)','O(nL)','O(n²L)'],2,'Each character of each string is processed once.');
B('dsa',2,'Prim’s algorithm on a graph stored as an adjacency matrix (simple array search for the minimum) runs in…',['O(V)','O(V²)','O(E log V)','O(V³)'],1,'Each of V iterations scans V vertices.');
B('dsa',2,'A hash table of size 7 uses h(k) = k mod 7 with linear probing. Keys 10, 17 and 24 are inserted in this order. At which index does 24 end up?',['3','4','5','6'],2,'All three hash to 3, so they occupy indices 3, 4 and 5.');
B('dsa',2,'A topological ordering of a directed graph exists if and only if the graph is…',['Connected','A DAG','A tree','Bipartite'],1,'A cycle would make it impossible to place all vertices before their successors.');
B('dsa',3,'The average-case time of QuickSelect for finding the k-th smallest element is…',['O(log n)','O(n)','O(n log n)','O(n²)'],1,'Each partition shrinks the problem geometrically on average: n + n/2 + n/4 + … = O(n).');
B('dsa',3,'How many different output permutations of 1, 2, 3 (pushed in that order) can be produced using a single stack?',['3','4','5','6'],2,'The count equals the Catalan number C₃ = 5 (only 3 1 2 is impossible).');

/* --- Advanced DBMS --- */
B('dbms',2,'A schedule is conflict-serialisable if and only if its precedence graph…',['Is complete','Has no cycle','Has a cycle','Has exactly one node'],1,'An acyclic graph gives an equivalent serial order.');
B('dbms',2,'Strict two-phase locking guarantees…',['Conflict serialisability','Deadlock freedom','No aborts','Lower latency'],0,'2PL ensures conflict-serialisable schedules; deadlocks are still possible.');
B('dbms',3,'R(A, B, C, D) has functional dependencies A → B, B → C and C → D. What is the highest normal form of R?',['1NF','2NF','3NF','BCNF'],1,'A is the only key, so there are no partial dependencies (2NF), but B → C and C → D are transitive, violating 3NF.');
B('dbms',3,'R(A, B, C, D, E) has FDs A → B, BC → D and D → E. How many attributes are in the closure of { A, C }?',['2','3','4','5'],3,'A, C → B (from A) → D (BC → D) → E, so {A, B, C, D, E}.');
B('dbms',2,'In a B+ tree where each node has at most m child pointers, the maximum number of keys in a node is…',['m − 1','m','m + 1','2m'],0,'A node with m pointers holds m − 1 keys.');
B('dbms',2,'Table R has 1,000 rows, each with a non-null foreign key referencing the primary key of S. How many rows does R ⋈ S return?',['500','1,000','Exactly |S|','1,000 × |S|'],1,'Each R row matches exactly one S row.');
B('dbms',2,'Deadlocks in a DBMS are typically detected by finding a cycle in the…',['Precedence graph','Wait-for graph','ER diagram','B+ tree'],1,'Nodes are transactions; an edge means one is waiting for another’s lock.');
B('dbms',2,'Which isolation level prevents dirty reads, non-repeatable reads and phantom reads?',['Read uncommitted','Read committed','Repeatable read (in the SQL standard)','Serializable'],3,'Serializable is the strictest level.');
B('dbms',2,'Write-ahead logging (WAL) means…',['Data pages are written before their log records','Log records are written to stable storage before the data pages','Only committed data is logged','Logs are never flushed'],1,'This lets the system undo or redo changes after a crash.');
B('dbms',2,'R has 5 tuples and S has 7, with 3 tuples common to both. How many tuples are in R ∪ S?',['7','9','10','12'],1,'5 + 7 − 3 = 9 (duplicates are removed).');

/* --- Advanced OS --- */
B('os',3,'P1, P2, P3 arrive at time 0 with CPU bursts 5, 3 and 8 ms. Round Robin with a 2 ms quantum (order P1, P2, P3) gives an average waiting time of…',['5.0 ms','6.0 ms','7.0 ms','8.0 ms'],2,'Completion times are 12, 9 and 16; waiting times are 7, 6 and 8, so the average is 21 ÷ 3 = 7.0 ms.');
B('os',2,'Banker’s algorithm is used for deadlock…',['Prevention by removing hold-and-wait','Avoidance','Detection only','Recovery'],1,'It grants a request only if the resulting state is safe.');
B('os',3,'Reference string 1 2 3 4 1 2 5 1 2 3 4 5 with 3 frames and FIFO replacement produces how many page faults?',['7','9','10','12'],1,'FIFO gives 9 faults with 3 frames and 10 with 4 frames (Belady’s anomaly).');
B('os',3,'For the same reference string and 3 frames, LRU replacement produces how many page faults?',['7','8','9','10'],3,'Simulating LRU with 3 frames gives 10 faults.');
B('os',2,'A system has 32-bit virtual addresses and 4 KB pages. How many entries does a single-level page table have?',['2¹⁰','2¹²','2²⁰','2³²'],2,'The offset uses 12 bits, leaving 20 bits for the page number: 2²⁰ entries.');
B('os',3,'The disk head is at cylinder 50 and requests arrive for 82, 170, 43, 140, 24, 16 and 190 (served in this order, FCFS). What is the total head movement?',['208','642','510','360'],1,'32 + 88 + 127 + 97 + 116 + 8 + 174 = 642 cylinders (SSTF would need only 208).');
B('os',3,'Memory access takes 100 ns, the page-fault rate is 0.001 and servicing a fault takes 8 ms. The effective access time is about…',['100 ns','8.1 µs','80 µs','8 ms'],1,'EAT = 0.999 × 100 ns + 0.001 × 8,000,000 ns ≈ 8,100 ns.');
B('os',2,'Priority inversion is commonly solved by…',['Priority inheritance','Round-robin scheduling','Disabling interrupts','Increasing the quantum'],0,'The low-priority lock holder temporarily inherits the higher priority of a waiter.');
B('os',2,'Peterson’s solution for two processes satisfies…',['Mutual exclusion only','Mutual exclusion, progress and bounded waiting','Progress only','None of the critical-section requirements'],1,'It uses flag[] and turn to meet all three requirements.');

/* --- Advanced Networks --- */
B('cn',2,'How many usable host addresses does the subnet 192.168.10.0/26 have?',['30','62','64','126'],1,'6 host bits → 2⁶ − 2 = 62.');
B('cn',2,'A class C network is subnetted with mask 255.255.255.224. How many subnets are created?',['4','6','8','16'],2,'/27 borrows 3 bits from the host part, so 2³ = 8 subnets.');
B('cn',3,'With n-bit sequence numbers, the maximum sender window size for Go-Back-N is…',['2ⁿ','2ⁿ − 1','2ⁿ⁻¹','n'],1,'A window of 2ⁿ would make old and new frames indistinguishable.');
B('cn',3,'In stop-and-wait, if propagation delay equals transmission time (a = Tp/Tt = 1), the link efficiency is…',['100%','50%','33%','25%'],2,'Efficiency = 1 ÷ (1 + 2a) = 1/3.');
B('cn',2,'What is the minimum Ethernet frame size (needed for CSMA/CD collision detection)?',['46 bytes','64 bytes','512 bytes','1500 bytes'],1,'The 64-byte minimum ensures the sender is still transmitting when a collision signal returns.');
B('cn',2,'During TCP slow start, the congestion window grows…',['Linearly each RTT','Exponentially each RTT','Only after a loss','Not at all'],1,'The window doubles each round-trip time until it reaches ssthresh.');
B('cn',3,'To correct any 2-bit error, a code needs a minimum Hamming distance of…',['3','4','5','6'],2,'To correct t errors we need d ≥ 2t + 1 = 5.');
B('cn',3,'Nyquist’s formula: the maximum data rate of a noiseless 4 kHz channel with 2 signal levels is…',['4 kbps','8 kbps','16 kbps','32 kbps'],1,'2 × B × log₂ L = 2 × 4000 × 1 = 8,000 bps.');
B('cn',3,'Shannon’s capacity for B = 3 kHz and S/N = 1023 is…',['3 kbps','10 kbps','30 kbps','300 kbps'],2,'C = B log₂(1 + S/N) = 3000 × log₂ 1024 = 30,000 bps.');
B('cn',2,'The maximum hop count in RIP is…',['15','16','255','Unlimited'],0,'A metric of 16 means “unreachable”, which limits count-to-infinity.');
B('cn',2,'What is the minimum length of an IPv4 header?',['8 bytes','20 bytes','40 bytes','60 bytes'],1,'Five 32-bit words when no options are used.');
B('cn',3,'Four contiguous /24 networks (200.1.0.0 to 200.1.3.0) can be aggregated into one prefix of…',['/21','/22','/23','/25'],1,'Four /24s = 2² blocks, so the prefix shortens by 2 bits to /22.');

/* --- B.Tech key-formula flashcards --- */
DECKS['B.Tech key formulas'] = [
  ['Master theorem: T(n) = aT(n/b) + f(n)','Compare f(n) with n^(log_b a): smaller → Θ(n^(log_b a)); equal → Θ(n^(log_b a) log n); larger (with regularity) → Θ(f(n)).'],
  ['Amdahl’s law','Speedup = 1 ÷ ((1 − f) + f/s), where f is the fraction improved and s its speedup.'],
  ['AMAT (average memory access time)','Hit time + miss rate × miss penalty.'],
  ['Direct-mapped cache address split','Address = tag | index | block offset; index bits = log₂(lines), offset bits = log₂(block size).'],
  ['Cyclomatic complexity','V(G) = E − N + 2P (P = connected components), or number of decision points + 1.'],
  ['Handshaking lemma','Sum of vertex degrees = 2 × number of edges.'],
  ['Euler’s formula (planar graphs)','V − E + F = 2 for a connected planar graph.'],
  ['Cayley’s formula','A complete graph Kₙ has nⁿ⁻² labelled spanning trees.'],
  ['Catalan number','Cₙ = C(2n, n) ÷ (n + 1): counts BSTs with n keys, valid bracket sequences and stack permutations.'],
  ['Bayes’ theorem','P(A|B) = P(B|A) P(A) ÷ P(B).'],
  ['Binomial and Poisson','Binomial: mean np, variance np(1 − p). Poisson: mean = variance = λ.'],
  ['Nyquist bit rate','Max rate (noiseless) = 2 B log₂ L.'],
  ['Shannon capacity','C = B log₂(1 + S/N).'],
  ['Stop-and-wait efficiency','1 ÷ (1 + 2a), where a = propagation delay ÷ transmission time.'],
  ['Go-Back-N / Selective Repeat windows','Go-Back-N: 2ⁿ − 1. Selective Repeat: 2ⁿ⁻¹ (n-bit sequence numbers).'],
  ['Hamming distance rules','Detect d errors: d_min ≥ d + 1. Correct t errors: d_min ≥ 2t + 1.'],
  ['Effective access time (paging)','(1 − p) × memory time + p × page-fault service time.'],
  ['Armstrong’s axioms','Reflexivity, augmentation, transitivity (plus union, decomposition and pseudo-transitivity as derived rules).'],
  ['Pumping lemma (regular)','For long enough strings w = xyz with |xy| ≤ p and |y| ≥ 1, xyⁱz stays in the language for all i ≥ 0.'],
  ['Chomsky hierarchy','Type 3 regular ⊂ Type 2 context-free ⊂ Type 1 context-sensitive ⊂ Type 0 recursively enumerable.'],
  ['Little’s law (queues)','Average number in system L = arrival rate λ × average time in system W.'],
  ['Shortest-path algorithms','Dijkstra O((V+E) log V) for non-negative weights; Bellman–Ford O(VE) handles negative edges; Floyd–Warshall O(V³) all pairs.']
];
Object.assign(SYL, {
  'Computer Organization': ['Number representation','Instruction cycle & addressing modes','Pipelining & hazards','Cache & memory hierarchy','I/O & DMA','CPU performance & Amdahl’s law'],
  'Digital Logic': ['Boolean algebra & K-maps','Combinational circuits','Flip-flops','Counters & registers','Number codes'],
  'Theory of Computation': ['DFA / NFA','Regular expressions','Pumping lemma','CFG & PDA','Turing machines','Decidability'],
  'Compiler Design': ['Lexical analysis','Parsing (LL / LR)','Syntax-directed translation','Intermediate code','Code optimisation'],
  'Algorithms': ['Recurrences & master theorem','Greedy','Dynamic programming','Graph algorithms','NP-completeness','Amortised analysis'],
  'Discrete Maths': ['Logic & proofs','Sets, relations & functions','Counting & pigeonhole','Graph theory','Recurrences'],
  'Engineering Maths': ['Linear algebra','Calculus','Probability & distributions','Laplace transform','Numerical methods'],
  'Software Engineering': ['SDLC models','Testing techniques','Coupling & cohesion','Estimation (COCOMO)','UML & design','Agile & Scrum']
});

/* balance answer positions so the correct option is spread evenly across A–D (matters when option shuffling is off) */
QB.forEach((q, i) => { const t = (i * 7 + 3) % 4; if (q.a !== t) { const x = q.o[q.a]; q.o[q.a] = q.o[t]; q.o[t] = x; q.a = t; } });

/* ============ SEMESTER-WISE B.TECH BANK (first year + later semesters) ============ */
Object.assign(SUBJ, { m1: 'Engineering Mathematics-I', m2: 'Engineering Mathematics-II', phy: 'Engineering Physics', chem: 'Engineering Chemistry', bee: 'Basic Electrical Engg', c: 'Programming in C', ml: 'Machine Learning', ai: 'Artificial Intelligence', crypto: 'Cryptography & Security', cloud: 'Cloud Computing' });

/* --- Engineering Mathematics-I (Sem 1) --- */
B('m1',1,'∫₀¹ x² dx =',['1/3','1/2','1','2/3'],0,'∫x² dx = x³/3, evaluated from 0 to 1 gives 1/3.');
B('m1',1,'The rank of the 3×3 identity matrix is…',['1','2','3','0'],2,'All three rows are linearly independent.');
B('m1',2,'The first three non-zero terms of the Maclaurin series of cos x are…',['1 − x²/2 + x⁴/24','1 + x²/2 + x⁴/24','x − x³/6 + x⁵/120','1 − x + x²/2'],0,'cos x = Σ (−1)ⁿ x²ⁿ/(2n)! = 1 − x²/2! + x⁴/4! − …');
B('m1',2,'The eigenvalues of [[2, 1], [1, 2]] are…',['1 and 3','2 and 2','0 and 4','−1 and 3'],0,'Trace 4 and determinant 3 give λ² − 4λ + 3 = 0, so λ = 1, 3.');
B('m1',2,'If f(x, y) = x²y + y³, then ∂f/∂y =',['x² + 3y²','2xy','x² + y²','2xy + 3y²'],0,'Treat x as a constant: ∂/∂y (x²y) = x² and ∂/∂y (y³) = 3y².');
B('m1',2,'∫₀¹ ∫₀¹ (x + y) dx dy =',['1/2','1','3/2','2'],1,'Each of the two terms integrates to 1/2, so the total is 1.');
B('m1',2,'The Jacobian ∂(x, y)/∂(r, θ) for x = r cos θ, y = r sin θ is…',['r','1','r²','cos θ sin θ'],0,'The determinant of [[cos θ, −r sin θ], [sin θ, r cos θ]] is r cos²θ + r sin²θ = r.');
B('m1',3,'By the Mean Value Theorem, for f(x) = x² on [1, 3], the value of c is…',['1.5','2','2.5','3'],1,'f′(c) = (9 − 1)/(3 − 1) = 4, so 2c = 4 and c = 2.');
B('m1',3,'The characteristic equation of A = [[1, 2], [3, 4]] is…',['λ² − 5λ − 2 = 0','λ² + 5λ − 2 = 0','λ² − 5λ + 2 = 0','λ² − 4λ − 2 = 0'],0,'λ² − (trace)λ + det = λ² − 5λ + (4 − 6) = λ² − 5λ − 2.');
B('m1',3,'The radius of convergence of the power series Σ xⁿ/n (n ≥ 1) is…',['0','1','2','∞'],1,'By the ratio test |x| < 1 (the series converges for −1 ≤ x < 1).');
B('m1',3,'lim (x → 0) (1 − cos x)/x² =',['0','1/2','1','∞'],1,'1 − cos x ≈ x²/2 for small x.');

/* --- Engineering Mathematics-II (Sem 2) --- */
B('m2',1,'The order and degree of (d²y/dx²)³ + (dy/dx)² + y = 0 are…',['2 and 3','3 and 2','2 and 2','1 and 3'],0,'The highest derivative is second order and it is raised to the power 3.');
B('m2',1,'The solution of dy/dx = 2x is…',['y = x² + C','y = 2x² + C','y = x + C','y = eˣ + C'],0,'Integrate both sides.');
B('m2',1,'The Laplace transform of t is…',['1/s','1/s²','s²','s'],1,'L{tⁿ} = n!/sⁿ⁺¹, so L{t} = 1/s².');
B('m2',1,'The divergence of F = x i + y j + z k is…',['0','1','3','x + y + z'],2,'∂x/∂x + ∂y/∂y + ∂z/∂z = 3.');
B('m2',2,'The integrating factor of dy/dx + 2y = eˣ is…',['e²ˣ','eˣ','e⁻²ˣ','2eˣ'],0,'IF = e^(∫2 dx) = e²ˣ.');
B('m2',2,'The general solution of y″ + y = 0 is…',['C₁ cos x + C₂ sin x','C₁ eˣ + C₂ e⁻ˣ','C₁ + C₂ x','C₁ cosh x'],0,'The characteristic roots are ±i.');
B('m2',2,'L{ sin(at) } =',['a/(s² + a²)','s/(s² + a²)','a/(s² − a²)','1/(s + a)'],0,'A standard Laplace transform pair.');
B('m2',2,'For a scalar field φ, curl(grad φ) is…',['0','∇²φ','φ','A non-zero vector in general'],0,'The curl of a gradient is always the zero vector.');
B('m2',2,'The general solution of y″ − 3y′ + 2y = 0 is…',['C₁ eˣ + C₂ e²ˣ','C₁ e⁻ˣ + C₂ e⁻²ˣ','C₁ eˣ + C₂ e⁻²ˣ','C₁ cos x + C₂ sin 2x'],0,'The roots of m² − 3m + 2 = 0 are 1 and 2.');
B('m2',3,'Green’s theorem relates…',['A line integral around a closed curve to a double integral over the enclosed region','A surface integral to a volume integral','A line integral to a surface integral in 3-D','Two double integrals'],0,'∮(P dx + Q dy) = ∬(∂Q/∂x − ∂P/∂y) dA.');
B('m2',3,'The Fourier series of f(x) = x on (−π, π) contains…',['Only sine terms','Only cosine terms','Both sine and cosine terms','Only a constant'],0,'f is an odd function, so all cosine coefficients (and a₀) vanish.');
B('m2',3,'If L{f(t)} = F(s), then L{ e^(at) f(t) } =',['F(s − a)','F(s + a)','e^(as) F(s)','F(s)/a'],0,'The first shifting theorem.');

/* --- Engineering Physics (Sem 1) --- */
B('phy',1,'The de Broglie wavelength of a particle of momentum p is…',['h/p','p/h','hp','h/p²'],0,'λ = h/p.');
B('phy',1,'In Young’s double-slit experiment the fringe width is…',['λD/d','λd/D','D/λd','dD/λ'],0,'β = λD/d (D = screen distance, d = slit separation).');
B('phy',1,'In the photoelectric effect the maximum kinetic energy of emitted electrons is…',['hν − φ','hν + φ','φ − hν','hν/φ'],0,'Einstein’s equation: KE_max = hν − φ.');
B('phy',1,'For laser action, which condition is essential?',['Population inversion','Thermal equilibrium','Low pumping','Only spontaneous emission'],0,'More atoms must be in the excited state than in the lower state.');
B('phy',2,'The Heisenberg uncertainty principle states that…',['Δx Δp ≥ ħ/2','Δx Δp = 0','Δx + Δp ≥ ħ','Δx/Δp ≥ ħ'],0,'Position and momentum cannot both be known exactly.');
B('phy',2,'For a particle in a 1-D infinite potential well, the energy Eₙ is proportional to…',['n²','n','1/n','n³'],0,'Eₙ = n²h²/(8mL²).');
B('phy',2,'Bragg’s law for X-ray diffraction is…',['2d sin θ = nλ','d sin θ = nλ','2d cos θ = nλ','d = 2nλ sin θ'],0,'It gives the condition for constructive interference from crystal planes.');
B('phy',2,'The numerical aperture of an optical fibre is…',['√(n₁² − n₂²)','n₁ − n₂','n₁² − n₂²','(n₁ − n₂)/n₁'],0,'NA = sin θ_max = √(n₁² − n₂²) for core index n₁ and cladding index n₂.');
B('phy',3,'For a particle in a 1-D infinite well, the ratio E₂/E₁ is…',['2','4','8','1/4'],1,'Eₙ ∝ n², so E₂/E₁ = 4.');
B('phy',3,'A fibre has core index 1.50 and cladding index 1.46. Its numerical aperture is about…',['0.34','0.50','0.04','1.03'],0,'√(1.50² − 1.46²) = √0.1184 ≈ 0.344.');
B('phy',3,'In Compton scattering, the wavelength shift is maximum at a scattering angle of…',['0°','90°','180°','45°'],2,'Δλ = (h/mc)(1 − cos θ) is largest when cos θ = −1.');

/* --- Engineering Chemistry (Sem 2) --- */
B('chem',1,'The pH of a 0.01 M HCl solution is…',['1','2','3','12'],1,'[H⁺] = 10⁻² M, so pH = 2.');
B('chem',1,'Hardness of water is mainly due to dissolved salts of…',['Sodium and potassium','Calcium and magnesium','Iron and copper','Zinc and lead'],1,'Ca²⁺ and Mg²⁺ bicarbonates, chlorides and sulphates cause hardness.');
B('chem',1,'The octane number of iso-octane is…',['0','50','100','150'],2,'It is the reference value 100 on the octane scale (n-heptane = 0).');
B('chem',1,'The Beer–Lambert law is…',['A = εcl','A = c/εl','A = εl/c','A = ε + c + l'],0,'Absorbance is proportional to concentration and path length.');
B('chem',2,'The zeolite (permutit) process softens water by…',['Ion exchange','Precipitation with lime','Boiling','Reverse osmosis'],0,'Na⁺ in the zeolite exchanges with Ca²⁺ and Mg²⁺ in hard water.');
B('chem',2,'In galvanic corrosion of two connected metals, the anode is the metal that has…',['Lower (more negative) reduction potential','Higher reduction potential','Higher melting point','Greater density'],0,'The more active metal is oxidised (corrodes) and the noble metal is protected.');
B('chem',2,'The standard EMF of the Daniell cell (E°Cu = +0.34 V, E°Zn = −0.76 V) is…',['0.42 V','1.10 V','−1.10 V','0.76 V'],1,'E°cell = E°cathode − E°anode = 0.34 − (−0.76) = 1.10 V.');
B('chem',2,'The monomer of Teflon is…',['Tetrafluoroethylene','Vinyl chloride','Ethylene','Styrene'],0,'Polymerisation of CF₂=CF₂ gives PTFE.');
B('chem',3,'The Gibbs phase rule is…',['F = C − P + 2','F = C + P − 2','F = P − C + 2','F = C − P − 2'],0,'F = degrees of freedom, C = components, P = phases.');
B('chem',3,'At the triple point of water, the number of degrees of freedom is…',['0','1','2','3'],0,'C = 1 and P = 3, so F = 1 − 3 + 2 = 0.');
B('chem',3,'The higher calorific value of a fuel differs from the lower calorific value because it includes…',['Latent heat of condensation of the steam formed','Heat lost in flue gases','Ash content','Moisture in air'],0,'HCV includes the latent heat recovered when the water vapour from combustion condenses.');

/* --- Basic Electrical Engineering (Sem 1) --- */
B('bee',1,'Two resistors of 4 Ω and 6 Ω are connected in series. The equivalent resistance is…',['2.4 Ω','5 Ω','10 Ω','24 Ω'],2,'Series resistances add.');
B('bee',1,'Two resistors of 6 Ω and 3 Ω are connected in parallel. The equivalent resistance is…',['2 Ω','4.5 Ω','9 Ω','18 Ω'],0,'(6 × 3)/(6 + 3) = 2 Ω.');
B('bee',1,'The RMS value of a sinusoidal voltage with a peak of 100 V is about…',['50 V','70.7 V','100 V','141 V'],1,'V_rms = V_peak/√2 ≈ 70.7 V.');
B('bee',1,'A transformer has a 10 : 1 turns ratio (step-down) and a 230 V primary. The secondary voltage is…',['23 V','2300 V','115 V','10 V'],0,'V₂ = V₁ × (N₂/N₁) = 230/10 = 23 V.');
B('bee',2,'Kirchhoff’s voltage law is based on the conservation of…',['Energy','Charge','Momentum','Mass'],0,'The algebraic sum of voltages around a closed loop is zero.');
B('bee',2,'The power factor of a purely inductive circuit is…',['0','0.5','1','∞'],0,'Voltage leads current by 90°, so cos 90° = 0.');
B('bee',2,'The time constant of a series R–L circuit is…',['L/R','R/L','RL','1/(RL)'],0,'τ = L/R.');
B('bee',2,'In a balanced star connection, the line voltage equals…',['√3 × phase voltage','Phase voltage','Phase voltage/√3','3 × phase voltage'],0,'V_L = √3 V_ph in star; I_L = I_ph.');
B('bee',3,'A series RLC circuit has L = 1 mH and C = 10 µF. Its resonant frequency is about…',['1.59 kHz','159 Hz','15.9 kHz','50 Hz'],0,'f₀ = 1 ÷ (2π√(LC)) = 1 ÷ (2π × 10⁻⁴) ≈ 1,591 Hz.');
B('bee',3,'The total real power of a balanced three-phase load is…',['√3 V_L I_L cos φ','3 V_L I_L cos φ','V_L I_L sin φ','√3 V_L I_L'],0,'P = √3 × line voltage × line current × power factor.');
B('bee',3,'The back EMF of a DC motor is proportional to…',['Speed and flux','Armature current only','Supply frequency','Load torque only'],0,'E_b = kΦN.');

/* --- Programming in C (Sem 1) --- */
B('c',1,'What does printf("%d", 5 / 2); print in C?',['2','2.5','3','0'],0,'Integer division truncates: 5 / 2 = 2.');
B('c',1,'int a = 10, *p = &a; printf("%d", *p + 1); prints…',['11','10','The address of a','Error'],0,'*p is 10, so *p + 1 = 11.');
B('c',1,'A static local variable in a function…',['Keeps its value between calls','Is re-initialised on every call','Is stored on the stack','Cannot be initialised'],0,'It lives for the whole program run and is initialised only once.');
B('c',1,'What is factorial(5) computed by f(n) = (n <= 1) ? 1 : n * f(n − 1)?',['24','60','120','720'],2,'5 × 4 × 3 × 2 × 1 = 120.');
B('c',1,'malloc() returns…',['A void pointer, or NULL on failure','An int','A char pointer only','Nothing'],0,'The result should be checked for NULL before use.');
B('c',2,'int r = 2 + 3 * 4 % 5; The value of r is…',['4','2','6','0'],0,'*, / and % have equal precedence (left to right): 3 × 4 = 12, 12 % 5 = 2, then 2 + 2 = 4.');
B('c',2,'for (i = 0; i < 3; i++); printf("%d", i); prints…',['3','2','0','012'],0,'The semicolon makes the loop body empty; after the loop i is 3.');
B('c',2,'char s[] = "hello"; What are strlen(s) and sizeof(s)?',['5 and 6','5 and 5','6 and 6','6 and 5'],0,'sizeof also counts the terminating null character.');
B('c',2,'The main difference between a struct and a union is that…',['Union members share the same memory','Struct members share memory','Unions cannot hold arrays','Structs cannot be nested'],0,'A union’s size is that of its largest member.');
B('c',2,'int x = 7; x >>= 1; The value of x is…',['3','4','14','6'],0,'Right-shifting 7 (111 in binary) by one bit gives 11 in binary = 3.');
B('c',2,'What is 5 & 3 in C?',['1','2','7','8'],0,'101 AND 011 = 001 = 1.');
B('c',3,'What does printf("%d", 10 > 5 > 2); print in C?',['0','1','2','Compile error'],0,'It is evaluated as (10 > 5) > 2, i.e. 1 > 2, which is 0.');
B('c',3,'int a[5] = {1, 2, 3}; The value of a[4] is…',['0','Garbage','3','Undefined'],0,'Remaining elements of a partially initialised array are set to 0.');

/* --- Artificial Intelligence (Sem 5) --- */
B('ai',1,'Breadth-first search is complete and optimal when…',['All step costs are equal','Costs are negative','The graph is infinite','The heuristic is admissible'],0,'It expands the shallowest node first, which is the cheapest when every step costs the same.');
B('ai',1,'Who proposed the Turing test?',['Alan Turing','John McCarthy','Marvin Minsky','Herbert Simon'],0,'Turing described it in his 1950 paper on machine intelligence.');
B('ai',1,'Modus ponens states that from P and P → Q we can infer…',['Q','¬P','P ∧ ¬Q','¬Q'],0,'It is the basic inference rule of propositional logic.');
B('ai',1,'Hill-climbing search can get stuck at…',['Local maxima, plateaus and ridges','Only the global maximum','The start state always','Nowhere'],0,'It only moves to better neighbours.');
B('ai',2,'A* search is optimal when its heuristic is…',['Admissible (never overestimates)','Always zero only','Larger than the true cost','Random'],0,'For graph search, consistency is also required.');
B('ai',2,'A simple reflex agent selects actions based on…',['Condition–action rules using the current percept','A full model of the world and goals','Learned utility','Past percept history only'],0,'It ignores history.');
B('ai',2,'The three genetic-algorithm operators are…',['Selection, crossover and mutation','Sorting, hashing and merging','Training, testing and validation','Pruning, sampling and boosting'],0,'They are applied repeatedly to evolve a population.');
B('ai',2,'In a Bayesian network, the joint probability is…',['The product of P(Xᵢ | Parents(Xᵢ)) over all nodes','The sum of all marginals','The maximum of the conditionals','Independent of the graph'],0,'The network structure encodes conditional independence.');
B('ai',3,'With perfect move ordering, alpha–beta pruning reduces minimax time from O(bᵈ) to about…',['O(b^(d/2))','O(d)','O(b)','O(bᵈ⁺¹)'],0,'It can search roughly twice as deep in the same time.');
B('ai',3,'Resolution is a proof method that is…',['Refutation-complete for first-order logic','Only for propositional Horn clauses','Incomplete for all logics','A heuristic search'],0,'If a set of clauses is unsatisfiable, resolution can derive the empty clause.');
B('ai',3,'A heuristic h(n) is consistent if for every edge (n, n′) with cost c…',['h(n) ≤ c(n, n′) + h(n′)','h(n) ≥ c(n, n′) + h(n′)','h(n) = 0','h(n) = c(n, n′)'],0,'This triangle-inequality condition implies admissibility.');

/* --- Machine Learning (Sem 6) --- */
B('ml',1,'Which of these is an unsupervised learning algorithm?',['k-means clustering','Linear regression','Logistic regression','Decision tree classifier'],0,'k-means groups unlabelled data.');
B('ml',1,'Overfitting means a model…',['Fits training data very well but generalises poorly','Fits training data poorly','Has too few parameters','Cannot be trained'],0,'Training error is low but test error is high.');
B('ml',1,'The gradient-descent update rule is…',['θ := θ − α ∇J(θ)','θ := θ + α ∇J(θ)','θ := α ∇J(θ)','θ := θ ÷ α'],0,'Move the parameters against the gradient of the cost, with learning rate α.');
B('ml',1,'The sigmoid function σ(0) equals…',['0.5','0','1','−1'],0,'1 ÷ (1 + e⁰) = 0.5.');
B('ml',2,'A classifier has TP = 40 and FP = 10. Its precision is…',['0.8','0.4','0.25','0.5'],0,'Precision = TP ÷ (TP + FP) = 40 ÷ 50.');
B('ml',2,'L1 regularisation (Lasso) tends to…',['Produce sparse weights (many exactly zero)','Shrink all weights equally','Increase variance','Remove the bias term'],0,'The L1 penalty can drive some coefficients exactly to zero.');
B('ml',2,'A 1-nearest-neighbour classifier typically has…',['Low bias and high variance','High bias and low variance','High bias and high variance','No training error possible'],0,'It fits the training data exactly and is sensitive to noise.');
B('ml',2,'The principal components in PCA are…',['Eigenvectors of the covariance matrix','Rows of the data matrix','Cluster centres','Support vectors'],0,'They are ordered by the eigenvalues (variance explained).');
B('ml',2,'The entropy of a fair coin toss is…',['1 bit','0 bits','2 bits','0.5 bits'],0,'−(½ log₂ ½ + ½ log₂ ½) = 1.');
B('ml',3,'Precision = 0.8 and recall = 2/3. The F1-score is…',['8/11 ≈ 0.727','0.733','0.8','0.667'],0,'F1 = 2PR ÷ (P + R) = 2 × (4/5)(2/3) ÷ (22/15) = 8/11.');
B('ml',3,'In an SVM the support vectors are…',['Training points that lie on or inside the margin','All training points','Points far from the boundary','The cluster centres'],0,'Only these points determine the separating hyperplane.');
B('ml',3,'Increasing model complexity generally…',['Reduces bias and increases variance','Increases both bias and variance','Reduces both','Increases bias and reduces variance'],0,'This is the bias–variance trade-off.');

/* --- Cryptography & Network Security (Sem 6) --- */
B('crypto',1,'With a Caesar cipher of shift 3, “ABC” becomes…',['DEF','XYZ','CDE','BCD'],0,'Each letter moves three places forward.');
B('crypto',1,'The block size of AES is…',['128 bits','64 bits','256 bits only','56 bits'],0,'AES uses 128-bit blocks with 128, 192 or 256-bit keys.');
B('crypto',1,'SHA-256 produces a digest of…',['256 bits','128 bits','160 bits','512 bits'],0,'The name gives the output length.');
B('crypto',1,'Which of these is an asymmetric (public-key) algorithm?',['RSA','AES','DES','RC4'],0,'RSA uses a key pair.');
B('crypto',1,'The CIA triad stands for…',['Confidentiality, Integrity, Availability','Control, Identity, Access','Cipher, Integrity, Authentication','Confidentiality, Identity, Authorisation'],0,'The three core goals of information security.');
B('crypto',2,'A digital signature provides…',['Authentication, integrity and non-repudiation','Only confidentiality','Only availability','Compression'],0,'The signer’s private key signs a hash of the message.');
B('crypto',2,'Unauthenticated Diffie–Hellman key exchange is vulnerable to…',['A man-in-the-middle attack','Brute force on the hash','A padding oracle','SQL injection'],0,'An attacker can negotiate a separate key with each party.');
B('crypto',2,'CBC mode of a block cipher requires…',['An initialisation vector (IV)','No key','A public key','A hash function'],0,'The IV randomises the first block so equal plaintexts encrypt differently.');
B('crypto',2,'The birthday paradox is relevant to…',['Finding hash collisions','The key length of AES','The Caesar cipher','Firewall rules'],0,'A collision in an n-bit hash needs only about 2^(n/2) attempts.');
B('crypto',3,'In RSA, p = 3, q = 11 and e = 3. What is the private exponent d?',['7','9','11','13'],0,'n = 33, φ(n) = 20 and 3 × 7 = 21 ≡ 1 (mod 20).');
B('crypto',3,'Diffie–Hellman with p = 23, g = 5, a = 6, b = 15. The shared secret is…',['2','8','19','6'],0,'A = 5⁶ mod 23 = 8, B = 5¹⁵ mod 23 = 19, and 19⁶ mod 23 = 2.');
B('crypto',3,'In the RSA example n = 33, e = 3, d = 7, the plaintext 4 encrypts to…',['31','12','7','19'],0,'4³ mod 33 = 64 mod 33 = 31.');

/* --- Cloud Computing (Sem 7) --- */
B('cloud',1,'Gmail is an example of…',['SaaS','IaaS','PaaS','DaaS only'],0,'Software delivered to users over the web.');
B('cloud',1,'A virtual machine on a rented cloud server is an example of…',['IaaS','SaaS','PaaS','FaaS'],0,'Infrastructure as a Service.');
B('cloud',1,'Kubernetes is mainly used for…',['Container orchestration','Data encryption','Version control','Load testing'],0,'It automates deployment, scaling and management of containers.');
B('cloud',1,'A load balancer…',['Distributes incoming traffic across several servers','Stores backups','Compiles code','Encrypts disks'],0,'It improves availability and throughput.');
B('cloud',2,'Elasticity in cloud computing means…',['Resources scale up and down automatically with demand','Fixed capacity','Cheaper hardware','More RAM only'],0,'Capacity follows workload.');
B('cloud',2,'A Type-1 hypervisor…',['Runs directly on the hardware','Runs inside a host OS','Is a container runtime','Is a load balancer'],0,'Examples: VMware ESXi and Xen.');
B('cloud',2,'Docker containers on one host share…',['The host OS kernel','A separate kernel each','The same file system always','Nothing'],0,'This makes containers lighter than virtual machines.');
B('cloud',2,'Serverless computing (FaaS) means…',['Code runs in on-demand functions and you do not manage servers','There are no servers anywhere','Only static websites','Applications run offline'],0,'The provider manages the servers and scales automatically.');
B('cloud',3,'According to the CAP theorem, during a network partition a distributed system must trade off…',['Consistency and availability','Cost and speed','Security and privacy','Latency and bandwidth'],0,'When a partition occurs you can keep either consistency or availability, not both.');
B('cloud',3,'In the shared responsibility model, the cloud customer is always responsible for…',['Their data and access management','Physical data-centre security','Hypervisor patches','Network cables'],0,'The provider secures the infrastructure; customers secure what they put in it.');

/* --- semester & branch metadata (0 = placement / general) --- */
const SUBJ_META = { m1: [1, 'common'], phy: [1, 'common'], bee: [1, 'common'], c: [1, 'common'], m2: [2, 'common'], chem: [2, 'common'],
  dsa: [3, 'cse'], dm: [3, 'cse'], dl: [3, 'cse'], coa: [3, 'cse'], prog: [3, 'cse'], dbms: [4, 'cse'], os: [4, 'cse'], algo: [4, 'cse'], em: [4, 'cse'],
  toc: [5, 'cse'], cn: [5, 'cse'], se: [5, 'cse'], web: [5, 'cse'], ai: [5, 'cse'], cd: [6, 'cse'], ml: [6, 'cse'], crypto: [6, 'cse'], cloud: [7, 'cse'], apt: [0, 'all'], lr: [0, 'all'] };
const BRANCHES = { all: 'All branches', common: 'Common (Sem 1–2)', cse: 'CSE / IT' };
QB.forEach(q => { const m = SUBJ_META[q.s] || [0, 'all']; if (q.sem === undefined) q.sem = m[0]; if (!q.br) q.br = m[1]; });
const BUILTIN_Q = QB.map(q => ({ ...q, o: q.o.slice() }));   // pristine copy for admin overrides
/* re-balance answer positions across A–D for the whole bank */
QB.forEach((q, i) => { const t = (i * 7 + 3) % 4; if (q.a !== t) { const x = q.o[q.a]; q.o[q.a] = q.o[t]; q.o[t] = x; q.a = t; } });
BUILTIN_Q.forEach((q, i) => { const src = QM[q.id]; q.o = src.o.slice(); q.a = src.a; });

/* ============ EXAM CENTRE ============ */
Object.assign(BADGES, {
  quiz1: ['📝', 'First Test', 'Finished your first test'], ace: ['🏆', 'Ace', 'Scored 90%+ on a test of 10+ questions'],
  perfect: ['💯', 'Perfectionist', '100% on a test of 5+ questions'], grind100: ['💪', 'Century', 'Answered 100 questions'],
  daily3: ['📅', 'Daily Grinder', '3-day daily-challenge streak'], mock: ['⏱️', 'Exam Warrior', 'Finished a timed mock test'],
  cards50: ['🃏', 'Card Shark', 'Reviewed 50 flashcards'], typist: ['⌨️', 'Speed Typist', 'Typed 40+ WPM'], math: ['➗', 'Mental Athlete', 'Scored 15+ in Mental Math Sprint']
});
const EXS = { view: 'home', T: null, res: null, c: null, iv: null, rf: 'all',
  cfg: store.get('ex:cfg', { mode: 'practice', subj: 'all', diff: 0, n: 10, mins: 10, neg: true, shuf: true, lvl: 1 }) };
if (EXS.cfg.lvl === undefined) EXS.cfg.lvl = 1;
const XS = {
  hist: () => store.get('ex:hist', []), mist: () => store.get('ex:mist', {}), bm: () => store.get('ex:bm', []),
  sub: () => store.get('ex:sub', {}), pb: () => store.get('ex:pb', {}), daily: () => store.get('ex:daily', {})
};
const today = () => ymd(new Date());
function seeded(seed){ let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function seededPick(n, seed){ const bt = QB.filter(q => q.b), src = bt.length >= n ? bt : QB, r = seeded(seed), idx = src.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } return idx.slice(0, n).map(i => src[i].id); }
const dateSeed = () => +today().replace(/-/g, '');
function shuffled(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const semOk = (c, q) => c.sem === undefined || c.sem < 0 || q.sem === c.sem;
const dLabel = d => ['All levels', 'Easy', 'Medium', 'Hard'][d] || 'All levels';
const fmtClock = s => { s = Math.max(0, Math.round(s)); return (s >= 3600 ? Math.floor(s / 3600) + ':' : '') + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); };
const totalAnswered = () => Object.values(XS.sub()).reduce((a, s) => a + (s.a || 0), 0);
const totalCorrect = () => Object.values(XS.sub()).reduce((a, s) => a + (s.c || 0), 0);
function dailyStreak(){ const d = XS.daily(); let n = 0; const day = new Date(); if (!d[ymd(day)]) day.setDate(day.getDate() - 1); while (d[ymd(day)]) { n++; day.setDate(day.getDate() - 1); } return n; }
function rankName(){ const c = totalCorrect(); return c >= 300 ? '👑 Master' : c >= 150 ? '🎓 Expert' : c >= 75 ? '📘 Scholar' : c >= 25 ? '📗 Learner' : '🌱 Novice'; }
function sylPct(){ const d = store.get('syl:done', {}); let t = 0, n = 0; Object.keys(SYL).forEach(s => SYL[s].forEach(tp => { t++; if (d[s + '|' + tp]) n++; })); return t ? n / t : 0; }
function readiness(){
  const h = XS.hist().slice(-10); const acc = h.length ? h.reduce((a, x) => a + x.pct, 0) / h.length : 0;
  const vol = Math.min(1, totalAnswered() / 200), str = Math.min(1, dailyStreak() / 7);
  return Math.round(acc * .5 + vol * 20 + sylPct() * 20 + str * 10);
}
function pool(cfg){
  if (cfg.ids) return cfg.ids.filter(id => QM[id]);
  return QB.filter(q => (cfg.subj === 'all' || q.s === cfg.subj) && (!cfg.diff || q.d === cfg.diff) && (!cfg.lvl || q.b) && semOk(cfg, q)).map(q => q.id);
}
function saveResume(){ const T = EXS.T; if (T && !T.fin) store.set('ex:resume', T); else store.del('ex:resume'); }
function startTest(cfg, ids){
  ids = ids || shuffled(pool(cfg)).slice(0, Math.max(1, +cfg.n || 10));
  if (!ids.length) { toast('No questions match these filters', 'warn', '⚠️'); return; }
  const n = ids.length;
  EXS.T = { cfg: { ...cfg }, mode: cfg.mode, qids: ids, ord: ids.map(id => { const k = [0, 1, 2, 3]; return cfg.shuf ? shuffled(k) : k; }),
    ans: ids.map(() => null), mark: ids.map(() => false), rev: ids.map(() => false), tq: ids.map(() => 0), idx: 0, qs: Date.now(), start: Date.now(),
    deadline: cfg.mode === 'mock' ? Date.now() + Math.max(1, +cfg.mins || n) * 60000 : 0, neg: !!cfg.neg && cfg.mode === 'mock', tabSw: 0, fin: false, warned: 0 };
  EXS.view = 'run'; saveResume(); startClock(); exDraw();
  if (cfg.mode === 'mock' && document.fullscreenEnabled) toast('Tip: press F11 for a distraction-free test', 'info', '🖥️');
}
function leaveQ(){ const T = EXS.T; if (!T) return; T.tq[T.idx] += (Date.now() - T.qs) / 1000; T.qs = Date.now(); }
function startClock(){ clearInterval(EXS.iv); EXS.iv = setInterval(tickEx, 500); }
function tickEx(){
  const T = EXS.T; if (!T || T.fin) { clearInterval(EXS.iv); return; }
  const el2 = document.getElementById('exT');
  if (T.deadline) {
    const left = (T.deadline - Date.now()) / 1000; if (el2) { el2.textContent = '⏱ ' + fmtClock(left); el2.style.color = left < 60 ? 'var(--pink)' : ''; }
    const total = (T.deadline - T.start) / 1000;
    if (left <= 300 && total > 600 && T.warned < 1) { T.warned = 1; toast('5 minutes left', 'warn', '⏱️'); beep(1); }
    if (left <= 60 && total > 120 && T.warned < 2) { T.warned = 2; toast('1 minute left!', 'warn', '⏱️'); beep(2); }
    if (left <= 0) { toast('Time is up — test submitted', 'warn', '⏰'); beep(3); finishTest(); }
  } else if (el2) el2.textContent = '⏱ ' + fmtClock((Date.now() - T.start) / 1000);
}
function isRight(T, i){ const q = QM[T.qids[i]]; return T.ans[i] !== null && T.ord[i][T.ans[i]] === q.a; }
function finishTest(){
  const T = EXS.T; if (!T || T.fin) return; leaveQ(); T.fin = true; clearInterval(EXS.iv);
  const n = T.qids.length; let c = 0, w = 0, sk = 0; const sub = XS.sub(), mist = XS.mist(); const per = {};
  T.qids.forEach((id, i) => { const q = QM[id]; per[q.s] = per[q.s] || { a: 0, c: 0, n: 0 }; per[q.s].n++;
    if (T.ans[i] === null) { sk++; return; }
    sub[q.s] = sub[q.s] || { a: 0, c: 0 }; sub[q.s].a++; per[q.s].a++;
    if (isRight(T, i)) { c++; sub[q.s].c++; per[q.s].c++; delete mist[id]; } else { w++; mist[id] = (mist[id] || 0) + 1; } });
  const raw = c - (T.neg ? w * .25 : 0); const pct = Math.round(c / n * 100); const secs = Math.round((Date.now() - T.start) / 1000);
  const rec = { t: Date.now(), mode: T.mode, n, correct: c, wrong: w, skipped: sk, score: Math.round(raw * 100) / 100, pct, secs, subj: T.cfg.subj || 'all' };
  const h = XS.hist(); h.push(rec); store.set('ex:hist', h.slice(-50)); store.set('ex:sub', sub); store.set('ex:mist', mist);
  if (n >= 5 && T.cfg.subj && T.mode !== 'daily') { const pb = XS.pb(); if (!pb[T.cfg.subj] || pb[T.cfg.subj] < pct) { pb[T.cfg.subj] = pct; store.set('ex:pb', pb); } }
  if (T.mode === 'daily') { const d = XS.daily(); d[today()] = { c, n }; store.set('ex:daily', d); if (dailyStreak() >= 3) award('daily3'); }
  addXP(c * 2 + w + 10); award('quiz1'); if (T.mode === 'mock') award('mock'); if (pct >= 90 && n >= 10) award('ace'); if (pct === 100 && n >= 5) award('perfect'); if (totalAnswered() >= 100) award('grind100');
  EXS.res = { ...rec, per, tabSw: T.tabSw, neg: T.neg }; EXS.view = 'result'; store.del('ex:resume');
  if (pct >= 80) confetti(70); exDraw();
}
function xesc(s){ return esc(s).replace(/\n/g, '<br>'); }
function optHTML(T, i, review){
  const q = QM[T.qids[i]], ord = T.ord[i], correctPos = ord.indexOf(q.a);
  return ord.map((oi, pos) => {
    let cls = 'hrp-btn', st = 'display:block;width:100%;text-align:left;margin:7px 0;padding:11px 14px;font-weight:500;line-height:1.4';
    const sel = T.ans[i] === pos; const showAns = review || T.rev[i];
    if (showAns && pos === correctPos) st += ';border-color:var(--green);background:rgba(61,220,132,.15)';
    else if (showAns && sel) st += ';border-color:var(--pink);background:rgba(255,77,157,.15)';
    else if (sel) st += ';border-color:var(--violet);background:rgba(124,92,255,.22)';
    return `<button type="button" class="${cls}" style="${st}" data-act="opt" data-i="${pos}"${review ? ' disabled' : ''}><b style="margin-right:8px;color:var(--muted)">${'ABCD'[pos]}</b>${esc(q.o[oi])}</button>`;
  }).join('');
}
const VIEWS = {
  home(){
    const T = EXS.T, res = store.get('ex:resume', null); const bm = XS.bm(), mist = Object.keys(XS.mist()), dn = XS.daily()[today()];
    const r = readiness(); const qid = seededPick(1, dateSeed() + 7)[0], qq = QM[qid]; const qd = store.get('ex:qotd', {});
    const solved = qd.date === today();
    const resumeCard = (T && !T.fin) ? `<div class="hrp-card" style="border-color:var(--orange)"><b>Test in progress</b>${T.mode} · ${T.qids.length} questions<div class="hrp-row"><button class="hrp-btn pri" data-act="view" data-v="run">▶ Continue</button></div></div>`
      : res ? `<div class="hrp-card" style="border-color:var(--orange)"><b>Unfinished test found</b>${res.qids.length} questions · ${res.mode}<div class="hrp-row"><button class="hrp-btn pri" data-act="resume">▶ Resume</button><button class="hrp-btn" data-act="discard">Discard</button></div></div>` : '';
    return `<div class="hrp-card"><b>Exam readiness: ${r}%</b><div class="hrp-bar"><i style="width:${r}%"></i></div><span class="hrp-muted">${rankName()} · ${totalAnswered()} answered · ${totalCorrect()} correct · 🔥 daily streak ${dailyStreak()}</span></div>${resumeCard}
    <div class="hrp-h">Start</div><div class="hrp-grid"><button class="hrp-btn pri" data-act="setup" data-m="practice">📖 Practice<br><small>instant feedback</small></button><button class="hrp-btn pri" data-act="setup" data-m="mock">⏱ Mock test<br><small>timed · negative marking</small></button>
    <button class="hrp-btn" data-act="daily">📅 Daily challenge<br><small>${dn ? 'done ✅ ' + dn.c + '/' + dn.n : '5 questions'}</small></button><button class="hrp-btn" data-act="mistakes">🧾 Mistake bank<br><small>${mist.length} to revise</small></button>
    <button class="hrp-btn" data-act="bookmarks">🔖 Bookmarked<br><small>${bm.length} questions</small></button><button class="hrp-btn" data-act="view" data-v="stats">📊 My stats<br><small>history & subjects</small></button><button class="hrp-btn pri" data-act="view" data-v="browse" style="grid-column:1/-1">📚 Browse by semester · subject · level</button></div>
    <div class="hrp-h">💡 Question of the day · ${esc(SUBJ[qq.s])}</div><div class="hrp-card"><div style="margin-bottom:6px">${esc(qq.t)}</div>${qq.o.map((o, i) => `<button type="button" class="hrp-btn" style="display:block;width:100%;text-align:left;margin:5px 0;${solved ? (i === qq.a ? 'border-color:var(--green);background:rgba(61,220,132,.15)' : (qd.pick === i ? 'border-color:var(--pink)' : '')) : ''}" data-act="qotd" data-i="${i}" ${solved ? 'disabled' : ''}>${'ABCD'[i]}. ${esc(o)}</button>`).join('')}${solved ? `<div class="hrp-muted" style="margin-top:6px">${qd.pick === qq.a ? '✅ Correct!' : '❌ Not quite.'} ${esc(qq.e)}</div>` : ''}</div>
    <p class="hrp-muted">${QB.length} questions (${QB.filter(q => q.b).length} at B.Tech level) across ${Object.keys(SUBJ).length} subjects · progress is saved on this device only.</p>`;
  },
  setup(){
    const c = EXS.cfg, m = c.mode, avail = pool(c).length;
    return `<div class="hrp-row"><button class="hrp-tab" data-act="view" data-v="home">← Back</button><b>${m === 'mock' ? '⏱ Mock test' : '📖 Practice'} setup</b></div>
    <label class="hrp-muted">Level</label><select class="hrp-sel" data-cfg="lvl"><option value="1"${c.lvl ? ' selected' : ''}>B.Tech level (semester / GATE-style)</option><option value="0"${c.lvl ? '' : ' selected'}>All levels (includes basics)</option></select>
    <label class="hrp-muted">Semester</label><select class="hrp-sel" data-cfg="sem"><option value="-1"${(c.sem === undefined || c.sem < 0) ? ' selected' : ''}>All semesters</option>${[...new Set(QB.map(q => q.sem))].sort((x, y) => x - y).map(s => `<option value="${s}"${c.sem === s ? ' selected' : ''}>${s === 0 ? 'General & placement' : 'Semester ' + s}</option>`).join('')}</select>
    <label class="hrp-muted">Subject</label><select class="hrp-sel" data-cfg="subj"><option value="all"${c.subj === 'all' ? ' selected' : ''}>All subjects (${QB.filter(q => (!c.lvl || q.b) && semOk(c, q)).length})</option>${Object.keys(SUBJ).filter(k => QB.some(q => q.s === k && (!c.lvl || q.b) && semOk(c, q))).map(k => `<option value="${k}"${c.subj === k ? ' selected' : ''}>${esc(SUBJ[k])} (${QB.filter(q => q.s === k && (!c.lvl || q.b) && semOk(c, q)).length})</option>`).join('')}</select>
    <label class="hrp-muted">Difficulty</label><select class="hrp-sel" data-cfg="diff">${[0, 1, 2, 3].map(d => `<option value="${d}"${c.diff === d ? ' selected' : ''}>${dLabel(d)}</option>`).join('')}</select>
    <label class="hrp-muted">Number of questions (${avail} available)</label><select class="hrp-sel" data-cfg="n">${[5, 10, 15, 20, 30, 50, 65].map(n => `<option value="${n}"${c.n === n ? ' selected' : ''}>${n}</option>`).join('')}</select>
    ${m === 'mock' ? `<label class="hrp-muted">Time limit (minutes)</label><input class="hrp-in" type="number" min="1" max="180" value="${c.mins}" data-cfg="mins"><label class="hrp-check"><input type="checkbox" data-cfg="neg" ${c.neg ? 'checked' : ''}><span>Negative marking (−¼ per wrong answer)</span></label>` : ''}
    <label class="hrp-check"><input type="checkbox" data-cfg="shuf" ${c.shuf ? 'checked' : ''}><span>Shuffle answer options</span></label>
    <div class="hrp-row"><button class="hrp-btn pri" data-act="go" ${avail ? '' : 'disabled'}>Start ▶</button></div>`;
  },
  run(){
    const T = EXS.T; if (!T) return VIEWS.home(); const i = T.idx, q = QM[T.qids[i]], n = T.qids.length; const bm = XS.bm().includes(q.id);
    const answered = T.ans.filter(a => a !== null).length;
    const pal = T.qids.map((_, k) => { const st = k === i ? 'outline:2px solid var(--text)' : ''; const bg = T.mark[k] ? 'var(--orange)' : T.ans[k] !== null ? 'var(--green)' : 'var(--surface-3)';
      return `<button type="button" data-act="jump" data-i="${k}" aria-label="Question ${k + 1}" style="width:34px;height:34px;border-radius:8px;border:1px solid var(--border-strong);background:${bg};color:${T.ans[k] !== null || T.mark[k] ? '#111' : 'var(--text)'};font-weight:700;cursor:pointer;${st}">${k + 1}</button>`; }).join('');
    const showExp = T.mode === 'practice' && T.rev[i];
    return `<div class="hrp-row" style="justify-content:space-between"><b>Q ${i + 1} / ${n}</b><span id="exT" class="hrp-kbd">⏱ --:--</span><span class="hrp-muted">${answered} answered</span></div>
    <div class="hrp-muted">${esc(SUBJ[q.s])} · ${dLabel(q.d)}</div>
    <div style="font-size:16px;font-weight:600;margin:8px 0 6px;line-height:1.5">${xesc(q.t)}</div>${optHTML(T, i, false)}
    ${showExp ? `<div class="hrp-card" style="margin-top:8px;border-color:${isRight(T, i) ? 'var(--green)' : 'var(--pink)'}"><b>${isRight(T, i) ? '✅ Correct' : '❌ Incorrect'}</b>${xesc(q.e)}</div>` : ''}
    <div class="hrp-row"><button class="hrp-btn" data-act="prev" ${i ? '' : 'disabled'}>← Prev</button><button class="hrp-btn" data-act="next" ${i < n - 1 ? '' : 'disabled'}>Next →</button>
    ${T.mode !== 'practice' ? `<button class="hrp-btn" data-act="mark">${T.mark[i] ? '★ Marked' : '☆ Mark'}</button><button class="hrp-btn" data-act="clear">Clear</button>` : ''}
    <button class="hrp-btn" data-act="bm">${bm ? '🔖 Saved' : '🔖 Save'}</button><button class="hrp-btn" data-act="speak" aria-label="Read aloud">🔊</button></div>
    <div class="hrp-h">Question palette</div><div style="display:flex;flex-wrap:wrap;gap:6px">${pal}</div>
    <div class="hrp-muted" style="margin-top:6px">Keys: 1–4 choose · N next · P previous${T.mode !== 'practice' ? ' · M mark' : ''}</div>
    <div class="hrp-row"><button class="hrp-btn pri" data-act="submit">Submit test</button><button class="hrp-btn" data-act="quit">Quit</button></div>`;
  },
  result(){
    const r = EXS.res; if (!r) return VIEWS.home(); const grade = r.pct >= 90 ? 'Outstanding 🏆' : r.pct >= 75 ? 'Great job 🎉' : r.pct >= 60 ? 'Good — keep going 👍' : r.pct >= 40 ? 'Needs practice 📚' : 'Keep at it — review the answers 💪';
    const avgT = r.n ? Math.round(r.secs / r.n) : 0;
    const perRows = Object.keys(r.per).map(s => { const p = r.per[s]; const pc = p.n ? Math.round(p.c / p.n * 100) : 0; return `<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(SUBJ[s])}</span><span>${p.c}/${p.n} · ${pc}%</span></div><div class="hrp-bar"><i style="width:${pc}%"></i></div></div>`; }).join('');
    const weak = Object.keys(r.per).filter(s => r.per[s].n >= 2 && r.per[s].c / r.per[s].n < .6).map(s => SUBJ[s]);
    return `<div class="hrp-card" style="text-align:center"><div class="hrp-big" style="margin:0">${r.pct}%</div><b>${grade}</b>${r.correct} correct · ${r.wrong} wrong · ${r.skipped} skipped<br>${r.neg ? 'Score with negative marking: <b>' + r.score + ' / ' + r.n + '</b><br>' : ''}Time ${fmtClock(r.secs)} · ~${avgT}s per question${r.tabSw ? '<br>⚠️ Tab switched ' + r.tabSw + ' time(s)' : ''}</div>
    <div class="hrp-h">By subject</div>${perRows}${weak.length ? `<div class="hrp-card" style="margin-top:8px"><b>Focus next on</b>${esc(weak.join(', '))}</div>` : ''}
    <div class="hrp-row"><button class="hrp-btn pri" data-act="review" data-f="all">🔍 Review answers</button><button class="hrp-btn" data-act="retry">🔁 Retry wrong & skipped</button><button class="hrp-btn" data-act="view" data-v="home">🏠 Exam home</button></div>
    <div class="hrp-row"><button class="hrp-btn" data-act="share">📋 Copy score</button><button class="hrp-btn" data-act="csv">⬇ CSV</button><button class="hrp-btn" data-act="print">🖨 Print</button>${r.pct >= 60 && r.n >= 5 ? '<button class="hrp-btn" data-act="cert">🎓 Certificate</button>' : ''}</div>`;
  },
  review(){
    const T = EXS.T; if (!T) return VIEWS.home(); const f = EXS.rf; const bm = XS.bm();
    const st = i => T.ans[i] === null ? 'skipped' : isRight(T, i) ? 'right' : 'wrong';
    const items = T.qids.map((_, i) => i).filter(i => f === 'all' || (f === 'marked' ? T.mark[i] : st(i) === f));
    return `<div class="hrp-row"><button class="hrp-tab" data-act="view" data-v="result">← Result</button>${['all', 'wrong', 'skipped', 'right', 'marked'].map(x => `<button class="hrp-tab${f === x ? ' active' : ''}" data-act="review" data-f="${x}">${x}</button>`).join('')}</div>
    ${items.map(i => { const q = QM[T.qids[i]]; const s = st(i); const cp = T.ord[i].indexOf(q.a);
      return `<div class="hrp-card" style="margin:10px 0;border-color:${s === 'right' ? 'var(--green)' : s === 'wrong' ? 'var(--pink)' : 'var(--border)'}"><b>Q${i + 1}. ${xesc(q.t)}</b>
      <div class="hrp-muted">Your answer: ${T.ans[i] === null ? '— skipped —' : esc(q.o[T.ord[i][T.ans[i]]])}${s === 'right' ? ' ✅' : ''}</div><div style="color:var(--green);font-size:13px">Correct: ${esc(q.o[q.a])}</div><div class="hrp-muted" style="margin-top:4px">${xesc(q.e)}</div>
      <div class="hrp-row"><button class="hrp-mini" data-act="bmid" data-id="${q.id}">${bm.includes(q.id) ? '🔖 Saved' : '🔖 Save'}</button></div></div>`; }).join('') || '<p class="hrp-muted">Nothing in this filter.</p>'}`;
  },
  stats(){
    const h = XS.hist(), sub = XS.sub(), pb = XS.pb(); const last = h.slice(-15);
    const pts = last.map((x, i) => `${last.length > 1 ? i / (last.length - 1) * 280 : 140},${60 - x.pct * .56}`).join(' ');
    const avgAll = h.length ? Math.round(h.reduce((a, x) => a + x.pct, 0) / h.length) : 0;
    const rows = Object.keys(SUBJ).map(k => { const s = sub[k] || { a: 0, c: 0 }; const pc = s.a ? Math.round(s.c / s.a * 100) : 0; return `<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(SUBJ[k])}</span><span>${s.c}/${s.a} · ${pc}%${pb[k] ? ' · best ' + pb[k] + '%' : ''}</span></div><div class="hrp-bar"><i style="width:${pc}%"></i></div></div>`; }).join('');
    const weakest = Object.keys(SUBJ).filter(k => (sub[k] || {}).a >= 5).sort((a, b) => sub[a].c / sub[a].a - sub[b].c / sub[b].a)[0];
    return `<div class="hrp-row"><button class="hrp-tab" data-act="view" data-v="home">← Back</button><b>My stats</b></div>
    <div class="hrp-grid"><div class="hrp-card"><b>${h.length}</b>tests taken</div><div class="hrp-card"><b>${avgAll}%</b>average score</div><div class="hrp-card"><b>${totalAnswered()}</b>questions answered</div><div class="hrp-card"><b>${dailyStreak()}</b>daily streak</div></div>
    <div class="hrp-h">Last ${last.length} tests</div>${last.length ? `<svg viewBox="0 0 280 64" style="width:100%;height:80px;background:var(--surface-2);border-radius:10px;padding:4px"><polyline fill="none" stroke="var(--violet)" stroke-width="2.5" points="${pts}"/></svg>` : '<p class="hrp-muted">Take a test to see your trend.</p>'}
    <div class="hrp-h">Accuracy by subject</div>${rows}${weakest ? `<div class="hrp-card"><b>Suggested next topic</b>${esc(SUBJ[weakest])} — your lowest accuracy so far.</div>` : ''}
    <div class="hrp-row"><button class="hrp-btn" data-act="hcsv">⬇ Export history CSV</button><button class="hrp-btn" data-act="wipe">🗑 Reset exam data</button></div>`;
  }
};
function exDraw(){ const c = EXS.c; if (!c || !c.isConnected) return; c.innerHTML = VIEWS[EXS.view](); if (EXS.view === 'run') tickEx(); }
function certificate(name){
  const r = EXS.res, cv = document.createElement('canvas'); cv.width = 1200; cv.height = 850; const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 1200, 850); g.addColorStop(0, '#12122a'); g.addColorStop(1, '#2b1f5c'); x.fillStyle = g; x.fillRect(0, 0, 1200, 850);
  x.strokeStyle = '#fbbf24'; x.lineWidth = 6; x.strokeRect(30, 30, 1140, 790); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 2; x.strokeRect(46, 46, 1108, 758);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = 'bold 30px sans-serif'; x.fillText('HACKATHON RIVALS · PRACTICE EXAM CENTRE', 600, 130);
  x.font = 'bold 72px serif'; x.fillStyle = '#fbbf24'; x.fillText('Certificate of Achievement', 600, 260);
  x.fillStyle = '#ddd'; x.font = '28px sans-serif'; x.fillText('This is proudly presented to', 600, 340);
  x.fillStyle = '#fff'; x.font = 'bold 64px serif'; x.fillText((name || 'Student').slice(0, 32), 600, 440);
  x.fillStyle = '#ddd'; x.font = '28px sans-serif'; x.fillText('for scoring ' + r.pct + '% (' + r.correct + ' of ' + r.n + ') in a ' + r.mode + ' test', 600, 520);
  x.fillText((r.subj === 'all' ? 'across all subjects' : 'in ' + (SUBJ[r.subj] || r.subj)) + ' on ' + new Date().toLocaleDateString(), 600, 570);
  x.font = 'italic 22px sans-serif'; x.fillStyle = '#aaa'; x.fillText('Self-practice certificate generated on this device — not an official credential.', 600, 760);
  cv.toBlob(b => { const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'certificate.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1500); });
}
const EXACT = {
  view(b){ EXS.view = b.dataset.v; exDraw(); },
  setup(b){ EXS.cfg.mode = b.dataset.m; if (b.dataset.m === 'mock') { EXS.cfg.n = Math.max(EXS.cfg.n, 10); EXS.cfg.mins = Math.max(1, Math.round(EXS.cfg.n * (EXS.cfg.lvl ? 1.5 : 1))); } EXS.view = 'setup'; exDraw(); },
  go(){ const c = EXS.cfg; store.set('ex:cfg', c); if (c.mode === 'mock') c.mins = Math.max(1, +c.mins || c.n); startTest(c); },
  opt(b){ const T = EXS.T; if (!T || T.fin) return; const i = T.idx, pos = +b.dataset.i;
    if (T.mode === 'practice') { if (T.rev[i]) return; T.ans[i] = pos; T.rev[i] = true; } else T.ans[i] = pos;
    saveResume(); exDraw(); },
  next(){ const T = EXS.T; if (T && T.idx < T.qids.length - 1) { leaveQ(); T.idx++; saveResume(); exDraw(); } },
  prev(){ const T = EXS.T; if (T && T.idx > 0) { leaveQ(); T.idx--; saveResume(); exDraw(); } },
  jump(b){ const T = EXS.T; if (T) { leaveQ(); T.idx = +b.dataset.i; saveResume(); exDraw(); } },
  mark(){ const T = EXS.T; if (T) { T.mark[T.idx] = !T.mark[T.idx]; saveResume(); exDraw(); } },
  clear(){ const T = EXS.T; if (T && T.mode !== 'practice') { T.ans[T.idx] = null; saveResume(); exDraw(); } },
  bm(){ const T = EXS.T; if (!T) return; const id = T.qids[T.idx]; let bm = XS.bm(); bm = bm.includes(id) ? bm.filter(x => x !== id) : bm.concat(id); store.set('ex:bm', bm); exDraw(); },
  bmid(b){ const id = b.dataset.id; let bm = XS.bm(); bm = bm.includes(id) ? bm.filter(x => x !== id) : bm.concat(id); store.set('ex:bm', bm); exDraw(); },
  speak(){ const T = EXS.T; if (!T || !window.speechSynthesis) return toast('Read-aloud is not supported here', 'warn', '🔇'); const q = QM[T.qids[T.idx]];
    speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(q.t + '. ' + T.ord[T.idx].map((o, p) => 'Option ' + 'ABCD'[p] + ': ' + q.o[o]).join('. '))); },
  submit(){ const T = EXS.T; if (!T) return; const un = T.ans.filter(a => a === null).length, mk = T.mark.filter(Boolean).length;
    if (confirm(`Submit now?\n${T.qids.length - un} answered · ${un} unanswered${mk ? ' · ' + mk + ' marked for review' : ''}`)) finishTest(); },
  quit(){ if (confirm('Quit this test? Your progress will not be scored.')) { EXS.T = null; clearInterval(EXS.iv); store.del('ex:resume'); EXS.view = 'home'; exDraw(); } },
  resume(){ const r = store.get('ex:resume', null); if (!r) return; EXS.T = r; EXS.view = 'run'; EXS.T.qs = Date.now(); startClock(); exDraw(); },
  discard(){ store.del('ex:resume'); exDraw(); },
  daily(){ if (XS.daily()[today()] && !confirm('You already completed today’s challenge. Play again (won’t change your streak)?')) return; startTest({ mode: 'daily', subj: 'all', diff: 0, n: 5, mins: 0, neg: false, shuf: true }, seededPick(5, dateSeed())); },
  mistakes(){ const ids = Object.keys(XS.mist()); if (!ids.length) return toast('No mistakes saved yet — great!', 'success', '✨'); startTest({ mode: 'practice', subj: 'all', diff: 0, n: ids.length, shuf: true, ids }, shuffled(ids).slice(0, 20)); },
  bookmarks(){ const ids = XS.bm().filter(id => QM[id]); if (!ids.length) return toast('Save questions with 🔖 to practise them here', 'info', '🔖'); startTest({ mode: 'practice', subj: 'all', diff: 0, n: ids.length, shuf: true, ids }, shuffled(ids).slice(0, 30)); },
  review(b){ EXS.rf = b.dataset.f || 'all'; EXS.view = 'review'; exDraw(); },
  retry(){ const T = EXS.T; if (!T) return; const ids = T.qids.filter((_, i) => !isRight(T, i)); if (!ids.length) return toast('Nothing to retry — perfect score!', 'success', '💯'); startTest({ mode: 'practice', subj: 'all', diff: 0, n: ids.length, shuf: true, ids }, ids); },
  share(){ const r = EXS.res; copy(`📝 I scored ${r.pct}% (${r.correct}/${r.n}) on a ${r.mode} test at Hackathon Rivals Exam Centre! ${location.origin}${location.pathname}`); award('share'); },
  csv(){ const T = EXS.T; if (!T) return; download('test-result.csv', toCSV([['#', 'Subject', 'Question', 'Your answer', 'Correct answer', 'Result', 'Seconds']].concat(T.qids.map((id, i) => { const q = QM[id]; return [i + 1, SUBJ[q.s], q.t, T.ans[i] === null ? '' : q.o[T.ord[i][T.ans[i]]], q.o[q.a], T.ans[i] === null ? 'skipped' : isRight(T, i) ? 'correct' : 'wrong', Math.round(T.tq[i])]; }))), 'text/csv'); },
  hcsv(){ const h = XS.hist(); if (!h.length) return toast('No tests yet', 'warn', '⚠️'); download('exam-history.csv', toCSV([['Date', 'Mode', 'Subject', 'Questions', 'Correct', 'Wrong', 'Skipped', 'Score', 'Percent', 'Seconds']].concat(h.map(x => [new Date(x.t).toLocaleString(), x.mode, x.subj, x.n, x.correct, x.wrong, x.skipped, x.score, x.pct, x.secs]))), 'text/csv'); },
  print(){ window.print(); },
  cert(){ const nm = prompt('Name to print on the certificate:', store.get('certName', '')); if (nm === null) return; store.set('certName', nm.slice(0, 32)); certificate(nm); },
  wipe(){ if (confirm('Delete all test history, stats, bookmarks and mistakes?')) { ['ex:hist', 'ex:mist', 'ex:bm', 'ex:sub', 'ex:pb', 'ex:daily', 'ex:resume', 'ex:qotd'].forEach(k => store.del(k)); EXS.view = 'home'; exDraw(); } },
  qotd(b){ const qid = seededPick(1, dateSeed() + 7)[0], q = QM[qid], pick2 = +b.dataset.i; store.set('ex:qotd', { date: today(), pick: pick2 }); const sub = XS.sub(); sub[q.s] = sub[q.s] || { a: 0, c: 0 }; sub[q.s].a++; if (pick2 === q.a) { sub[q.s].c++; addXP(3); } else { const m = XS.mist(); m[qid] = 1; store.set('ex:mist', m); } store.set('ex:sub', sub); exDraw(); }
};
TABS.push(['exam', '🎓 Exam', c => {
  EXS.c = c;
  if (EXS.view === 'run' && (!EXS.T || EXS.T.fin)) EXS.view = 'home';
  if ((EXS.view === 'result' || EXS.view === 'review') && !EXS.res) EXS.view = 'home';
  exDraw();
  c.onclick = e => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; const f = EXACT[b.dataset.act]; if (f) f(b, e); };
  c.onchange = c.oninput = e => { const d = e.target.dataset; if (d.bn) { EXS.bm.n = +e.target.value; return; } if (d.lsem) { EXS.bm.lsem = +e.target.value; exDraw(); return; } const k = d.cfg; if (!k) return; const t = e.target; const v = t.type === 'checkbox' ? t.checked : (k === 'subj' ? t.value : +t.value); EXS.cfg[k] = v; if ((k === 'lvl' || k === 'sem') && EXS.cfg.subj !== 'all' && !QB.some(q => q.s === EXS.cfg.subj && (!EXS.cfg.lvl || q.b) && semOk(EXS.cfg, q))) EXS.cfg.subj = 'all';
    if (t.tagName === 'SELECT' && e.type === 'change') exDraw(); };
}]);
document.addEventListener('keydown', e => {
  if (!hubEl || !hubEl.classList.contains('open') || EXS.view !== 'run' || !EXS.T || EXS.T.fin || isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (['1', '2', '3', '4'].includes(k)) { EXACT.opt({ dataset: { i: String(+k - 1) } }); e.stopPropagation(); }
  else if (k === 'n' || k === 'arrowright') EXACT.next(); else if (k === 'p' || k === 'arrowleft') EXACT.prev(); else if (k === 'm') EXACT.mark();
}, true);
document.addEventListener('visibilitychange', () => { const T = EXS.T; if (T && !T.fin && T.mode === 'mock' && document.hidden) { T.tabSw++; saveResume(); } });

/* ---------- Exam guard (admin can switch ON/OFF: Admin → Hackathon settings) ----------
   While a test/quiz is running: leaving the page (tab/app switch, window blur) or a screenshot /
   print / copy attempt auto-submits it. Browsers cannot truly block OS screenshots or a phone camera,
   so this is a deterrent: PrintScreen & screenshot shortcuts are caught, content is hidden on blur. */
const GUARD = { fp: 0, busy: false };
const guardOn = () => !(typeof HB !== "undefined" && HB.ev && HB.ev.proctor === false);
function guardSession(){
  if (EXS.T && !EXS.T.fin && EXS.view === 'run') return { kind: 'test', t0: EXS.T.start, stop: () => finishTest() };
  if (HQ.cur && HQ.cur.submit) return { kind: 'quiz', t0: HQ.cur.t0 || 0, stop: () => HQ.cur.submit(true) };
  return null;
}
function guardViolation(why){
  if (GUARD.busy || !guardOn()) return; const S = guardSession(); if (!S) return;
  if (Date.now() - S.t0 < 2000) return; if (GUARD.fp && Date.now() < GUARD.fp) return;
  GUARD.busy = true; try { toast(why + ' — your ' + S.kind + ' was auto-submitted.', 'warn', '🚫'); (window.__hrViol ? window.__hrViol(S, why) : S.stop()); } catch(e){ console.warn(e); }
  setTimeout(() => { GUARD.busy = false; }, 1500);
}
function guardShield(on){ document.documentElement.classList.toggle('hr-shield', !!on && guardOn() && !!guardSession()); }
(function(){
  const st = document.createElement('style'); st.textContent = '@media print{body{display:none!important}} html.hr-shield body>*{visibility:hidden!important} html.hr-shield body::before{content:"Test in progress — content hidden";visibility:visible;position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0b0b14;color:#fff;font:600 18px sans-serif;z-index:2147483647}'; document.head.appendChild(st);
  const oc = window.confirm; window.confirm = function(m){ GUARD.fp = Date.now() + 600000; try { return oc.call(window, m); } finally { GUARD.fp = Date.now() + 1500; } };
  document.addEventListener('click', e => { if (e.target && e.target.type === 'file') GUARD.fp = Date.now() + 300000; }, true);
  document.addEventListener('change', e => { if (e.target && e.target.type === 'file') GUARD.fp = Date.now() + 1500; }, true);
  document.addEventListener('cancel', e => { if (e.target && e.target.type === 'file') GUARD.fp = Date.now() + 1500; }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) guardViolation('You left the page'); });
  window.addEventListener('blur', () => { guardShield(true); setTimeout(() => { if (!document.hasFocus()) guardViolation('You switched away from the page'); }, 250); });
  window.addEventListener('focus', () => { if (!GUARD.busy) guardShield(false); });
  window.addEventListener('pagehide', () => guardViolation('You left the page'));
  window.addEventListener('beforeprint', () => guardViolation('Print attempt'));
  document.addEventListener('keyup', e => { if (e.key === 'PrintScreen' && guardSession() && guardOn()) { try { navigator.clipboard.writeText(' '); } catch(_){} guardViolation('Screenshot attempt'); } });
  document.addEventListener('keydown', e => {
    if (!guardSession() || !guardOn()) return; const k = (e.key || '').toLowerCase();
    if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && ['3','4','5','s'].includes(k)) || (e.ctrlKey && e.shiftKey && k === 's') || (e.metaKey && e.shiftKey && k === 's')) { e.preventDefault(); guardViolation('Screenshot attempt'); return; }
    if ((e.ctrlKey || e.metaKey) && ['p','s','u'].includes(k)) { e.preventDefault(); guardViolation('Blocked shortcut'); }
  }, true);
  ['contextmenu','copy','cut','dragstart'].forEach(ev => document.addEventListener(ev, e => { if (guardSession() && guardOn() && !(e.target && e.target.closest && e.target.closest('textarea,input'))) e.preventDefault(); }, true));
})();
window.addEventListener('beforeunload', e => { const T = EXS.T; if (T && !T.fin && T.mode === 'mock') { e.preventDefault(); e.returnValue = ''; } });
['Practice mode with instant explanations', 'Timed mock test with auto-submit', 'Negative-marking toggle (−¼)', Object.keys(SUBJ).length + '-subject question bank (' + QB.length + ' questions, ' + QB.filter(q => q.b).length + ' at B.Tech level)', 'B.Tech-level filter (semester / GATE-style questions)', 'Difficulty filter (easy / medium / hard)', 'Choose 5–50 questions per test',
  'Shuffle answer options', 'Question palette (answered / marked colours)', 'Mark-for-review and clear-answer', 'Keyboard control during tests (1–4, N, P, M)', 'Time-left warnings at 5 min and 1 min with beep', 'Submit summary before final submission',
  'Score, accuracy and time-per-question report', 'Subject-wise result breakdown with weak-area hints', 'Answer review with explanations and filters', 'Retry only wrong & skipped questions', 'Bookmark questions and practise them later',
  'Mistake bank that empties as you master questions', 'Daily challenge (same 5 questions for everyone each day) with streak', 'Question of the day', 'Personal best per subject', 'Score-history trend chart', 'Exam readiness score', 'Rank titles (Novice → Master)',
  'Resume an interrupted test after refresh', 'Refresh-protection warning during mock tests', 'Tab-switch counter during mock tests', 'Read-aloud for questions (speech)', 'Result CSV export', 'History CSV export', 'Print-friendly result page',
  'Copy-to-share score text', 'Downloadable PNG certificate (≥60%)', '9 new exam badges'].forEach(n => feat('Exam: ' + n, () => {}));

/* ============ FLASHCARDS (Leitner spaced repetition) ============ */
const DAYS = [0, 1, 2, 4, 8, 16];
const FCS = { deck: store.get('fc:deck', 'Tech acronyms'), q: [], cur: null, flip: false, c: null };
const deckCards = d => d === 'My cards' ? store.get('fc:mine', []) : (DECKS[d] || []);
const deckProg = d => store.get('fc:p:' + d, {});
function fcQueue(d){
  const cards = deckCards(d), p = deckProg(d), now = Date.now();
  return shuffled(cards.map((_, i) => i).filter(i => !p[i] || p[i].due <= now)).slice(0, 25);
}
function fcDraw(){
  const c = FCS.c; if (!c || !c.isConnected) return; const d = FCS.deck, cards = deckCards(d), p = deckProg(d), now = Date.now();
  const nNew = cards.filter((_, i) => !p[i]).length, nDue = cards.filter((_, i) => p[i] && p[i].due <= now).length, nMas = cards.filter((_, i) => p[i] && p[i].b >= 5).length;
  const decks = Object.keys(DECKS).concat('My cards');
  const cur = FCS.q[0]; const card = cur != null ? cards[cur] : null;
  c.innerHTML = `<select class="hrp-sel" data-fc="deck">${decks.map(k => `<option${k === d ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select>
  <div class="hrp-muted" style="margin:8px 0">${cards.length} cards · 🆕 ${nNew} new · ⏰ ${nDue} due · ⭐ ${nMas} mastered · ${FCS.q.length} left in this session</div>
  ${card ? `<div class="hrp-card" data-fcact="flip" style="min-height:150px;display:grid;place-items:center;text-align:center;cursor:pointer;font-size:${FCS.flip ? 15 : 20}px;padding:20px;border-color:${FCS.flip ? 'var(--cyan)' : 'var(--violet)'}"><div>${FCS.flip ? xesc(card[1]) : '<b>' + esc(card[0]) + '</b><div class="hrp-muted" style="margin-top:10px">tap to reveal</div>'}</div></div>
  ${FCS.flip ? '<div class="hrp-row" style="justify-content:center"><button class="hrp-btn" data-fcact="again">❌ Again</button><button class="hrp-btn" data-fcact="good">👍 Good</button><button class="hrp-btn" data-fcact="easy">⚡ Easy</button></div>' : ''}`
    : `<div class="hrp-card" style="text-align:center"><b>${cards.length ? '🎉 Session complete!' : 'This deck is empty'}</b>${cards.length ? 'No cards are due right now. Come back later — or study ahead.' : 'Add your own cards below.'}<div class="hrp-row" style="justify-content:center">${cards.length ? '<button class="hrp-btn pri" data-fcact="ahead">Study ahead (10 cards)</button>' : ''}</div></div>`}
  <div class="hrp-row"><button class="hrp-btn" data-fcact="shuffle">🔀 Restart session</button><button class="hrp-btn" data-fcact="reset">↺ Reset progress</button></div>
  <details><summary class="hrp-muted" style="cursor:pointer">➕ Add / manage my cards</summary><input class="hrp-in" id="fcF" placeholder="Front (question / term)" maxlength="200" style="margin:8px 0"><textarea class="hrp-ta" id="fcB" style="min-height:70px;font-family:inherit" placeholder="Back (answer / definition)" maxlength="400"></textarea>
  <div class="hrp-row"><button class="hrp-btn pri" data-fcact="add">Add to “My cards”</button><button class="hrp-btn" data-fcact="exp">⬇ Export</button><label class="hrp-btn" style="cursor:pointer">⬆ Import<input type="file" accept="application/json" hidden data-fc="imp"></label></div></details>`;
}
function fcNext(){ FCS.q.shift(); FCS.flip = false; fcDraw(); }
function fcRate(kind){
  const d = FCS.deck, i = FCS.q[0]; if (i == null) return; const p = deckProg(d), old = p[i] ? p[i].b : 0;
  let b = kind === 'again' ? 1 : Math.min(5, old + (kind === 'easy' ? 2 : 1)); if (kind === 'again') { p[i] = { b, due: Date.now() + 10 * 60000 }; FCS.q.push(i); }
  else p[i] = { b, due: Date.now() + DAYS[b] * 86400000 };
  store.set('fc:p:' + d, p); const n = store.get('fc:n', 0) + 1; store.set('fc:n', n); addXP(1); if (n >= 50) award('cards50'); fcNext();
}
TABS.push(['cards', '🃏 Cards', c => {
  FCS.c = c; FCS.q = fcQueue(FCS.deck); FCS.flip = false; fcDraw();
  c.onclick = e => { const b = e.target.closest('[data-fcact]'); if (!b) return; const a = b.dataset.fcact;
    if (a === 'flip') { FCS.flip = true; fcDraw(); } else if (a === 'again' || a === 'good' || a === 'easy') fcRate(a);
    else if (a === 'shuffle') { FCS.q = fcQueue(FCS.deck); FCS.flip = false; fcDraw(); }
    else if (a === 'ahead') { FCS.q = shuffled(deckCards(FCS.deck).map((_, i) => i)).slice(0, 10); FCS.flip = false; fcDraw(); }
    else if (a === 'reset') { if (confirm('Reset progress for this deck?')) { store.del('fc:p:' + FCS.deck); FCS.q = fcQueue(FCS.deck); fcDraw(); } }
    else if (a === 'add') { const f = $('#fcF', c).value.trim(), bk = $('#fcB', c).value.trim(); if (!f || !bk) return toast('Fill both sides of the card', 'warn', '⚠️'); const m = store.get('fc:mine', []); if (m.length >= 500) return toast('Card limit reached (500)', 'warn', '⚠️');
      m.push([f.slice(0, 200), bk.slice(0, 400)]); store.set('fc:mine', m); FCS.deck = 'My cards'; store.set('fc:deck', 'My cards'); FCS.q = fcQueue('My cards'); toast('Card added to “My cards”', 'success', '🃏'); fcDraw(); }
    else if (a === 'exp') download('my-flashcards.json', JSON.stringify(store.get('fc:mine', []), null, 2), 'application/json'); };
  c.onchange = e => { if (e.target.dataset.fc === 'deck') { FCS.deck = e.target.value; store.set('fc:deck', FCS.deck); FCS.q = fcQueue(FCS.deck); FCS.flip = false; fcDraw(); }
    else if (e.target.dataset.fc === 'imp' && e.target.files[0]) { const r = new FileReader(); r.onload = () => { try { const a = JSON.parse(r.result); if (!Array.isArray(a)) throw 0; const ok = a.filter(x => Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string').map(x => [x[0].slice(0, 200), x[1].slice(0, 400)]);
      const m = store.get('fc:mine', []).concat(ok).slice(0, 500); store.set('fc:mine', m); toast('Imported ' + ok.length + ' cards', 'success', '⬆'); FCS.deck = 'My cards'; FCS.q = fcQueue('My cards'); fcDraw(); } catch(err){ toast('Not a valid card file', 'warn', '⚠️'); } }; r.readAsText(e.target.files[0]); } };
}]);
['Flashcards with Leitner spaced repetition (5 boxes)', Object.keys(DECKS).length + ' ready-made decks (' + Object.values(DECKS).reduce((a, d) => a + d.length, 0) + ' cards)', 'Tap-to-flip cards with Again / Good / Easy grading', 'Due, new and mastered counters', 'Create your own flashcards (up to 500)', 'Import / export flashcards as JSON', 'Study-ahead mode and session restart'].forEach(n => feat('Cards: ' + n, () => {}));

/* ============ CALCULATORS ============ */
const nf = x => Number.isFinite(x) ? String(+x.toFixed(6)) : '—';
function need(...v){ v.forEach(x => { if (!Number.isFinite(x)) throw new Error('Please fill every field with a number'); }); }
function mk(c, fields, run, note){
  c.innerHTML = fields.map(f => `<label class="hrp-muted">${esc(f[1])}</label>` + (f[3] === 'textarea' ? `<textarea class="hrp-ta" data-f="${f[0]}" style="min-height:90px;margin-bottom:8px">${esc(f[2] ?? '')}</textarea>` : `<input class="hrp-in" data-f="${f[0]}" type="${f[3] || 'number'}" step="any" value="${esc(f[2] ?? '')}" style="margin-bottom:8px">`)).join('') +
    '<div class="hrp-row"><button class="hrp-btn pri" data-go="1">Calculate</button><button class="hrp-btn" data-cp="1">Copy</button></div><div class="hrp-out"></div>' + (note ? `<p class="hrp-muted">${note}</p>` : '');
  const out = $('.hrp-out', c);
  const get = () => { const o = {}; $$('[data-f]', c).forEach(i => { o[i.dataset.f] = i.type === 'number' ? (i.value === '' ? NaN : parseFloat(i.value)) : i.value; }); return o; };
  const go = () => { try { out.textContent = run(get()); } catch(e){ out.textContent = '❌ ' + e.message; } };
  c.addEventListener('click', e => { if (e.target.dataset.go) go(); else if (e.target.dataset.cp) copy(out.textContent); });
  c.addEventListener('input', go); go();
}
const gcd2 = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
function factorize(n){ const f = []; let d = 2; while (n > 1 && d * d <= n) { while (n % d === 0) { f.push(d); n /= d; } d++; } if (n > 1) f.push(n); return f; }
const isPrime = n => { if (n < 2 || !Number.isInteger(n)) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const big = n => { let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return r; };

function calcEval(src, deg){
  if (src.length > 200) throw new Error('Expression too long');
  const s = src.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/√/g, 'sqrt'); let i = 0;
  const T = x => deg ? x * Math.PI / 180 : x, U = x => deg ? x * 180 / Math.PI : x;
  const fact = n => { if (n < 0 || !Number.isInteger(n) || n > 170) throw new Error('Factorial needs an integer from 0 to 170'); let r = 1; for (let k = 2; k <= n; k++) r *= k; return r; };
  const F1 = { sin: x => Math.sin(T(x)), cos: x => Math.cos(T(x)), tan: x => Math.tan(T(x)), asin: x => U(Math.asin(x)), acos: x => U(Math.acos(x)), atan: x => U(Math.atan(x)), sqrt: Math.sqrt, cbrt: Math.cbrt, log: Math.log10, ln: Math.log, abs: Math.abs, exp: Math.exp, floor: Math.floor, ceil: Math.ceil, round: Math.round, fact };
  const F2 = { pow: Math.pow, mod: (a, b) => a % b, max: Math.max, min: Math.min, gcd: gcd2, lcm: (a, b) => a && b ? Math.abs(a * b) / gcd2(a, b) : 0, npr: (n, r) => fact(n) / fact(n - r), ncr: (n, r) => fact(n) / (fact(r) * fact(n - r)) };
  function expr(){ let v = term(); while (s[i] === '+' || s[i] === '-') { const op = s[i++]; const r = term(); v = op === '+' ? v + r : v - r; } return v; }
  function term(){ let v = unary(); while (s[i] === '*' || s[i] === '/') { const op = s[i++]; const r = unary(); v = op === '*' ? v * r : v / r; } return v; }
  function unary(){ if (s[i] === '-') { i++; return -unary(); } if (s[i] === '+') { i++; return unary(); } return power(); }
  function power(){ let b = post(); if (s[i] === '^') { i++; return Math.pow(b, unary()); } return b; }
  function post(){ let v = primary(); while (s[i] === '!' || s[i] === '%') { v = s[i++] === '!' ? fact(v) : v / 100; } return v; }
  function primary(){
    if (s[i] === '(') { i++; const v = expr(); if (s[i] !== ')') throw new Error('Missing )'); i++; return v; }
    const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i)); if (m) { i += m[0].length; return parseFloat(m[0]); }
    const id = /^[a-z]+/i.exec(s.slice(i)); if (!id) throw new Error('Unexpected “' + (s[i] || 'end') + '”'); const name = id[0].toLowerCase(); i += name.length;
    if (name === 'pi') return Math.PI; if (name === 'e') return Math.E;
    if (s[i] !== '(') throw new Error('Unknown name “' + name + '”'); i++; const args = [expr()]; while (s[i] === ',') { i++; args.push(expr()); } if (s[i] !== ')') throw new Error('Missing )'); i++;
    if (F1[name] && args.length === 1) return F1[name](args[0]); if (F2[name] && args.length === 2) return F2[name](args[0], args[1]);
    throw new Error('Bad function “' + name + '”');
  }
  const v = expr(); if (i < s.length) throw new Error('Unexpected “' + s[i] + '”'); return v;
}
reg('calc', 'Scientific calculator', c => {
  c.innerHTML = `<input class="hrp-in" id="scI" placeholder="e.g. sqrt(16) + 2^3 * (5 - 1) / 4" autocomplete="off" aria-label="Expression"><div class="hrp-row"><select class="hrp-sel hrp-in sm" id="scD" style="max-width:120px"><option value="1">Degrees</option><option value="0">Radians</option></select><button class="hrp-btn pri" data-a="eq">=</button><button class="hrp-btn" data-a="clr">C</button></div>
  <div class="hrp-row">${['sin(', 'cos(', 'tan(', 'sqrt(', 'log(', 'ln(', '(', ')', '^', '!', '%', 'pi', 'e', 'abs(', 'pow(', 'mod('].map(x => `<button class="hrp-mini" data-i="${x}">${x}</button>`).join('')}</div><div class="hrp-out" id="scO" style="font-size:20px">0</div><div class="hrp-muted" id="scH"></div>`;
  const inp = $('#scI', c), out = $('#scO', c), his = $('#scH', c); let hist = store.get('sch', []);
  const run = commit => { if (!inp.value.trim()) { out.textContent = '0'; return; } try { const v = calcEval(inp.value, $('#scD', c).value === '1'); out.textContent = nf(v); if (commit) { hist.unshift(inp.value + ' = ' + nf(v)); hist = hist.slice(0, 8); store.set('sch', hist); his.innerHTML = hist.map(esc).join('<br>'); } } catch(e){ out.textContent = '❌ ' + e.message; } };
  inp.addEventListener('input', () => run(false)); inp.addEventListener('keydown', e => { if (e.key === 'Enter') run(true); }); his.innerHTML = hist.map(esc).join('<br>');
  c.addEventListener('click', e => { const t = e.target; if (t.dataset.i) { inp.value += t.dataset.i; inp.focus(); run(false); } else if (t.dataset.a === 'eq') run(true); else if (t.dataset.a === 'clr') { inp.value = ''; out.textContent = '0'; } });
});
reg('calc', 'Percentage calculator', c => mk(c, [['x', 'X (percent or first value)', 20], ['y', 'Y (second value)', 250]], v => { need(v.x, v.y);
  return `${nf(v.x)}% of ${nf(v.y)} = ${nf(v.x / 100 * v.y)}\n${nf(v.x)} is ${nf(v.x / v.y * 100)}% of ${nf(v.y)}\nChange from ${nf(v.x)} to ${nf(v.y)} = ${nf((v.y - v.x) / v.x * 100)}%\n${nf(v.y)} increased by ${nf(v.x)}% = ${nf(v.y * (1 + v.x / 100))}\n${nf(v.y)} decreased by ${nf(v.x)}% = ${nf(v.y * (1 - v.x / 100))}`; }));
reg('calc', 'Simple & compound interest', c => mk(c, [['p', 'Principal (₹)', 10000], ['r', 'Rate (% per year)', 8], ['t', 'Time (years)', 3], ['n', 'Compounds per year', 1]], v => { need(v.p, v.r, v.t, v.n);
  const si = v.p * v.r * v.t / 100, amt = v.p * Math.pow(1 + v.r / (100 * v.n), v.n * v.t); return `Simple interest: ${nf(si)}  (amount ${nf(v.p + si)})\nCompound amount: ${nf(amt)}\nCompound interest: ${nf(amt - v.p)}\nCI − SI: ${nf(amt - v.p - si)}`; }));
reg('calc', 'Profit, loss & discount', c => mk(c, [['cp', 'Cost price', 400], ['sp', 'Selling price', 500], ['mp', 'Marked price (optional)', 600], ['d', 'Discount % (optional)', '']], v => { need(v.cp, v.sp);
  const d = v.sp - v.cp; let t = d >= 0 ? `Profit: ${nf(d)} (${nf(d / v.cp * 100)}%)` : `Loss: ${nf(-d)} (${nf(-d / v.cp * 100)}%)`;
  if (Number.isFinite(v.mp)) t += `\nDiscount given: ${nf(v.mp - v.sp)} (${nf((v.mp - v.sp) / v.mp * 100)}% of marked price)`; if (Number.isFinite(v.mp) && Number.isFinite(v.d)) t += `\nSelling price after ${nf(v.d)}% discount: ${nf(v.mp * (1 - v.d / 100))}`; return t; }));
reg('calc', 'Speed, distance & time', c => mk(c, [['d', 'Distance (km)', 120], ['t', 'Time (hours)', ''], ['s', 'Speed (km/h)', 60]], v => { const k = [v.d, v.t, v.s].filter(Number.isFinite).length; if (k !== 2) throw new Error('Fill exactly two fields and leave one blank');
  let d = v.d, t = v.t, s = v.s; if (!Number.isFinite(d)) d = s * t; else if (!Number.isFinite(t)) t = d / s; else s = d / t; return `Distance: ${nf(d)} km\nTime: ${nf(t)} h (${nf(t * 60)} min)\nSpeed: ${nf(s)} km/h = ${nf(s * 5 / 18)} m/s`; }, 'Leave the field you want to find blank.'));
reg('calc', 'Time & work', c => mk(c, [['a', 'A alone takes (days)', 10], ['b', 'B alone takes (days)', 15], ['t', 'A and B together take (days, optional)', '']], v => { need(v.a);
  let t = ''; if (Number.isFinite(v.b)) t += `Together: ${nf(1 / (1 / v.a + 1 / v.b))} days\n`; if (Number.isFinite(v.t)) { const r = 1 / v.t - 1 / v.a; t += r > 0 ? `B alone would take: ${nf(1 / r)} days` : 'Inconsistent: together must be faster than A alone'; } return t.trim(); }));
reg('calc', 'Permutations & combinations', c => mk(c, [['n', 'n', 10], ['r', 'r', 3]], v => { need(v.n, v.r); if (!Number.isInteger(v.n) || !Number.isInteger(v.r) || v.n < 0 || v.r < 0 || v.r > v.n || v.n > 200) throw new Error('Use whole numbers with 0 ≤ r ≤ n ≤ 200');
  const f = big(v.n), pr = f / big(v.n - v.r); return `n! = ${f.toString().length > 60 ? f.toString().slice(0, 30) + '…' : f}\nP(n,r) = ${pr}\nC(n,r) = ${pr / big(v.r)}`; }));
reg('calc', 'GCD, LCM & prime factors', c => mk(c, [['a', 'First number', 36], ['b', 'Second number', 48]], v => { need(v.a, v.b); if (!Number.isInteger(v.a) || !Number.isInteger(v.b) || v.a < 1 || v.b < 1) throw new Error('Use positive whole numbers');
  const g = gcd2(v.a, v.b); const fa = a => factorize(a).join(' × ') || '1'; return `HCF (GCD): ${g}\nLCM: ${v.a / g * v.b}\n${v.a} = ${fa(v.a)}\n${v.b} = ${fa(v.b)}`; }));
reg('calc', 'Prime checker & sieve', c => mk(c, [['n', 'Number to test', 97], ['m', 'List all primes up to (max 2000)', 50]], v => { need(v.n); let t = `${v.n} is ${isPrime(v.n) ? 'PRIME ✅' : 'not prime'}`; if (!isPrime(v.n) && v.n > 1) t += ` (= ${factorize(v.n).join(' × ')})`; let nx = Math.floor(v.n) + 1; while (!isPrime(nx) && nx < 1e9) nx++; t += `\nNext prime: ${nx}`;
  if (Number.isFinite(v.m) && v.m >= 2) { const lim = Math.min(2000, Math.floor(v.m)); const p = []; for (let k = 2; k <= lim; k++) if (isPrime(k)) p.push(k); t += `\n\nPrimes ≤ ${lim} (${p.length}):\n${p.join(', ')}`; } return t; }));
reg('calc', 'Quadratic equation solver', c => mk(c, [['a', 'a (x² coefficient)', 1], ['b', 'b (x coefficient)', -5], ['c', 'c (constant)', 6]], v => { need(v.a, v.b, v.c); if (v.a === 0) throw new Error('a cannot be 0'); const D = v.b * v.b - 4 * v.a * v.c;
  if (D > 0) return `Discriminant: ${nf(D)} → two real roots\nx₁ = ${nf((-v.b + Math.sqrt(D)) / (2 * v.a))}\nx₂ = ${nf((-v.b - Math.sqrt(D)) / (2 * v.a))}\nSum = ${nf(-v.b / v.a)}, product = ${nf(v.c / v.a)}`;
  if (D === 0) return `Discriminant: 0 → one repeated root\nx = ${nf(-v.b / (2 * v.a))}`; return `Discriminant: ${nf(D)} → complex roots\nx = ${nf(-v.b / (2 * v.a))} ± ${nf(Math.sqrt(-D) / (2 * v.a))}i`; }));
reg('calc', 'Statistics (mean, median, mode, σ)', c => mk(c, [['v', 'Numbers (comma or space separated)', '4, 8, 15, 16, 23, 42, 8', 'text']], v => {
  const a = v.v.split(/[\s,;]+/).filter(Boolean).map(Number); if (!a.length || a.some(x => !Number.isFinite(x))) throw new Error('Enter numbers only'); const n = a.length, s = a.reduce((x, y) => x + y, 0), m = s / n, so = a.slice().sort((x, y) => x - y);
  const med = n % 2 ? so[(n - 1) / 2] : (so[n / 2 - 1] + so[n / 2]) / 2; const cnt = {}; a.forEach(x => cnt[x] = (cnt[x] || 0) + 1); const mx = Math.max(...Object.values(cnt)); const mode = mx === 1 ? 'no repeated value' : Object.keys(cnt).filter(k => cnt[k] === mx).join(', ');
  const ss = a.reduce((x, y) => x + (y - m) ** 2, 0); return `Count: ${n}   Sum: ${nf(s)}\nMean: ${nf(m)}\nMedian: ${nf(med)}\nMode: ${mode}\nMin: ${so[0]}   Max: ${so[n - 1]}   Range: ${nf(so[n - 1] - so[0])}\nVariance (population): ${nf(ss / n)}\nStd dev (population): ${nf(Math.sqrt(ss / n))}${n > 1 ? `\nStd dev (sample): ${nf(Math.sqrt(ss / (n - 1)))}` : ''}`; }));
const UNITS = { Length: { m: 1, km: 1000, cm: .01, mm: .001, mile: 1609.344, yard: .9144, foot: .3048, inch: .0254 }, Mass: { kg: 1, g: .001, mg: 1e-6, tonne: 1000, lb: .45359237, oz: .0283495 }, Data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776, bit: .125 }, Time: { s: 1, min: 60, hour: 3600, day: 86400, week: 604800, year: 31557600 }, Area: { 'm²': 1, 'km²': 1e6, 'cm²': 1e-4, hectare: 1e4, acre: 4046.8564, 'ft²': .09290304 }, Speed: { 'm/s': 1, 'km/h': 1 / 3.6, mph: .44704, knot: .514444 }, Temperature: { '°C': 1, '°F': 1, K: 1 } };
reg('calc', 'Unit converter', c => {
  c.innerHTML = `<select class="hrp-sel" id="ucK">${Object.keys(UNITS).map(k => `<option>${k}</option>`).join('')}</select><div class="hrp-row"><input class="hrp-in sm" type="number" step="any" value="1" id="ucV" aria-label="Value"><select class="hrp-sel sm hrp-in" id="ucF" aria-label="From"></select><span>→</span><select class="hrp-sel sm hrp-in" id="ucT" aria-label="To"></select></div><div class="hrp-out" id="ucO"></div>`;
  const K = $('#ucK', c), F = $('#ucF', c), Tt = $('#ucT', c), V = $('#ucV', c), O = $('#ucO', c);
  const fill = () => { const u = Object.keys(UNITS[K.value]); F.innerHTML = Tt.innerHTML = u.map(x => `<option>${x}</option>`).join(''); Tt.selectedIndex = Math.min(1, u.length - 1); run(); };
  const run = () => { const v = parseFloat(V.value); if (!Number.isFinite(v)) { O.textContent = ''; return; } let r;
    if (K.value === 'Temperature') { const toC = { '°C': x => x, '°F': x => (x - 32) * 5 / 9, K: x => x - 273.15 }[F.value](v); r = { '°C': x => x, '°F': x => x * 9 / 5 + 32, K: x => x + 273.15 }[Tt.value](toC); }
    else r = v * UNITS[K.value][F.value] / UNITS[K.value][Tt.value]; O.textContent = `${nf(v)} ${F.value} = ${+r.toPrecision(10)} ${Tt.value}`; };
  K.addEventListener('change', fill); [V, F, Tt].forEach(x => x.addEventListener('input', run)); fill();
});
reg('calc', 'Date difference & add days', c => mk(c, [['a', 'From date', today(), 'date'], ['b', 'To date', ymd(new Date(Date.now() + 30 * 86400000)), 'date'], ['n', 'Add days to “From” date', 45]], v => {
  const a = new Date(v.a + 'T00:00'), b = new Date(v.b + 'T00:00'); if (isNaN(a) || isNaN(b)) throw new Error('Pick both dates'); const d = Math.round((b - a) / 86400000); let t = `Difference: ${d} days (${Math.floor(Math.abs(d) / 7)} weeks ${Math.abs(d) % 7} days)`;
  if (Number.isFinite(v.n)) { const x = new Date(a.getTime() + v.n * 86400000); t += `\n${v.a} + ${v.n} days = ${x.toDateString()}`; } return t; }));
reg('calc', 'SGPA / CGPA calculator', c => mk(c, [['v', 'One subject per line: credits, grade point', '4, 9\n3, 8\n4, 10\n2, 7', 'textarea']], v => {
  const rows = v.v.split('\n').map(l => l.split(/[,\s]+/).filter(Boolean).map(Number)).filter(r => r.length >= 2); if (!rows.length || rows.some(r => !Number.isFinite(r[0]) || !Number.isFinite(r[1]))) throw new Error('Use “credits, grade point” on each line');
  const cr = rows.reduce((a, r) => a + r[0], 0), pts = rows.reduce((a, r) => a + r[0] * r[1], 0); return `Total credits: ${nf(cr)}\nGPA = Σ(credit × grade point) / Σ credits = ${nf(pts / cr)}\nApprox. percentage (×9.5): ${nf(pts / cr * 9.5)}%`; }, 'The same formula works for CGPA — enter all subjects, or use each semester’s total credits and SGPA as one line.'));
reg('calc', 'CGPA ⇄ percentage & marks needed', c => mk(c, [['g', 'CGPA (10-point)', 8.2], ['p', 'Percentage', ''], ['tp', 'Target overall % (optional)', 75], ['got', 'Marks obtained so far (optional)', 300], ['tot', 'Out of (so far)', 450], ['rem', 'Remaining paper total', 150]], v => {
  let t = ''; if (Number.isFinite(v.g)) t += `CGPA ${nf(v.g)} ≈ ${nf(v.g * 9.5)}%\n`; if (Number.isFinite(v.p)) t += `${nf(v.p)}% ≈ CGPA ${nf(v.p / 9.5)}\n`;
  if ([v.tp, v.got, v.tot, v.rem].every(Number.isFinite)) { const need2 = v.tp / 100 * (v.tot + v.rem) - v.got; t += `To reach ${nf(v.tp)}% overall you need ${nf(need2)} out of ${nf(v.rem)} (${nf(need2 / v.rem * 100)}%)${need2 > v.rem ? ' — not reachable' : need2 <= 0 ? ' — already secured' : ''}`; } return t.trim(); }, 'Uses the common ×9.5 conversion; check your university’s own rule.'));
reg('calc', 'Attendance (75%) calculator', c => mk(c, [['a', 'Classes attended', 42], ['t', 'Total classes held', 52], ['r', 'Required attendance %', 75]], v => { need(v.a, v.t, v.r); if (v.t <= 0 || v.a > v.t || v.r >= 100) throw new Error('Check the numbers'); const cur = v.a / v.t * 100;
  let t = `Current attendance: ${nf(cur)}%\n`; if (cur >= v.r) { const x = Math.floor(v.a * 100 / v.r - v.t); t += `✅ You can safely miss up to ${x} more class(es) and stay at ${v.r}% or above.`; } else { const y = Math.ceil((v.r * v.t - 100 * v.a) / (100 - v.r)); t += `⚠️ Attend the next ${y} class(es) in a row to reach ${v.r}%.`; } return t; }));
reg('calc', 'Roman numerals converter', c => mk(c, [['v', 'Number (1–3999) or Roman numeral', 2026, 'text']], v => {
  const s = String(v.v).trim().toUpperCase(); const R = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  if (/^\d+$/.test(s)) { let n = +s; if (n < 1 || n > 3999) throw new Error('Use 1 to 3999'); let r = ''; R.forEach(([k, l]) => { while (n >= k) { r += l; n -= k; } }); return r; }
  if (/^[IVXLCDM]+$/.test(s)) { let n = 0, p = 0; for (let k = s.length - 1; k >= 0; k--) { const val = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }[s[k]]; n += val < p ? -val : val; p = val; } return String(n); } throw new Error('Enter digits or a Roman numeral'); }));
reg('calc', 'Fibonacci, factorial & powers', c => mk(c, [['n', 'n (0–90)', 15]], v => { need(v.n); const n = Math.floor(v.n); if (n < 0 || n > 90) throw new Error('Use 0 to 90'); const f = [0n, 1n]; for (let i = 2; i <= n; i++) f[i] = f[i - 1] + f[i - 2];
  const fs = big(n).toString(); return `Fibonacci F(${n}) = ${f[n]}\nSequence: ${f.slice(0, Math.min(n + 1, 20)).join(', ')}${n > 19 ? ', …' : ''}\n${n}! = ${fs.length > 60 ? fs.slice(0, 30) + '… (' + fs.length + ' digits)' : fs}\n2^${n} = ${2n ** BigInt(n)}\n${n}² = ${n * n}, ${n}³ = ${n ** 3}`; }));
reg('calc', 'Squares & cubes table', c => mk(c, [['a', 'From', 1], ['b', 'To (max 60 rows)', 20]], v => { need(v.a, v.b); const a = Math.floor(v.a), b = Math.min(Math.floor(v.b), a + 59); if (b < a) throw new Error('“To” must be ≥ “From”'); let t = 'n    n²      n³      √n\n'; for (let k = a; k <= b; k++) t += `${String(k).padEnd(5)}${String(k * k).padEnd(8)}${String(k ** 3).padEnd(8)}${nf(Math.sqrt(k))}\n`; return t; }));
function truthTable(expr){
  let s = expr.toUpperCase().replace(/XNOR/g, '#').replace(/NAND/g, '@').replace(/NOR/g, '$').replace(/XOR/g, '^').replace(/AND/g, '&').replace(/OR/g, '|').replace(/NOT/g, '!').replace(/&&/g, '&').replace(/\|\|/g, '|').replace(/[~¬]/g, '!').replace(/[·*]/g, '&').replace(/\+/g, '|').replace(/\s+/g, '');
  const vars = [...new Set(s.match(/[A-Z]/g) || [])].sort(); if (!vars.length) throw new Error('Use variables like A, B, C'); if (vars.length > 5) throw new Error('Up to 5 variables'); let i = 0;
  const OR = () => { let l = XOR(); while (s[i] === '|' || s[i] === '$') { const o = s[i++], r = XOR(), a = l; l = e => o === '|' ? (a(e) || r(e)) : !(a(e) || r(e)); } return l; };
  const XOR = () => { let l = AND(); while (s[i] === '^' || s[i] === '#') { const o = s[i++], r = AND(), a = l; l = e => o === '^' ? (a(e) !== r(e)) : (a(e) === r(e)); } return l; };
  const AND = () => { let l = NOT(); while (s[i] === '&' || s[i] === '@') { const o = s[i++], r = NOT(), a = l; l = e => o === '&' ? (a(e) && r(e)) : !(a(e) && r(e)); } return l; };
  const NOT = () => { if (s[i] === '!') { i++; const f = NOT(); return e => !f(e); } return PR(); };
  const PR = () => { const ch = s[i]; if (ch === '(') { i++; const f = OR(); if (s[i] !== ')') throw new Error('Missing )'); i++; return f; } if (ch === '0' || ch === '1') { i++; return () => ch === '1'; } if (/[A-Z]/.test(ch || '')) { i++; return e => e[ch]; } throw new Error('Unexpected “' + (ch || 'end') + '”'); };
  const f = OR(); if (i < s.length) throw new Error('Unexpected “' + s[i] + '”'); let t = vars.join(' ') + ' │ F\n' + '─'.repeat(vars.length * 2 + 4) + '\n', ones = 0;
  for (let m = 0; m < (1 << vars.length); m++) { const e = {}; vars.forEach((v, k) => { e[v] = !!(m & (1 << (vars.length - 1 - k))); }); const r = f(e); if (r) ones++; t += vars.map(v => e[v] ? 1 : 0).join(' ') + ' │ ' + (r ? 1 : 0) + '\n'; }
  return t + `\n${ones === 0 ? 'Contradiction (always 0)' : ones === (1 << vars.length) ? 'Tautology (always 1)' : ones + ' of ' + (1 << vars.length) + ' rows are 1'}`;
}
reg('calc', 'Boolean truth-table generator', c => mk(c, [['e', 'Expression (AND OR NOT XOR NAND NOR or & | ! ^)', '(A AND B) OR NOT C', 'text']], v => truthTable(v.e), 'Precedence: NOT, then AND, then XOR, then OR. Use brackets when unsure.'));
function words(n){
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'], tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const two = x => x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : ''); const three = x => (x >= 100 ? ones[Math.floor(x / 100)] + ' hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? two(x % 100) : '');
  if (n === 0) return 'zero'; const parts = [], cr = Math.floor(n / 1e7), la = Math.floor(n / 1e5) % 100, th = Math.floor(n / 1e3) % 100, rest = n % 1000;
  if (cr) parts.push(words(cr) + ' crore'); if (la) parts.push(two(la) + ' lakh'); if (th) parts.push(two(th) + ' thousand'); if (rest) parts.push(three(rest)); return parts.join(' ');
}
reg('calc', 'Number to words (Indian system)', c => mk(c, [['n', 'Whole number (up to 99,99,99,999)', 1234567]], v => { need(v.n); if (!Number.isInteger(v.n) || v.n < 0 || v.n > 9999999999) throw new Error('Use a whole number from 0 to 9,999,999,999'); return words(v.n).replace(/^./, m => m.toUpperCase()) + '\n\n' + v.n.toLocaleString('en-IN'); }));
reg('calc', 'Ratio simplifier & proportion', c => mk(c, [['a', 'a', 12], ['b', 'b', 18], ['c', 'c (optional third term)', ''], ['x', 'Proportion: a : b = c : x → give c', 30]], v => { need(v.a, v.b); if (![v.a, v.b].every(Number.isInteger) || v.a < 0 || v.b < 0) throw new Error('Use whole numbers for the ratio'); const g = Number.isFinite(v.c) ? gcd2(gcd2(v.a, v.b), v.c) : gcd2(v.a, v.b);
  let t = `Simplified: ${v.a / g} : ${v.b / g}${Number.isFinite(v.c) ? ' : ' + v.c / g : ''}`; if (Number.isFinite(v.x)) t += `\nIf ${v.a} : ${v.b} = ${nf(v.x)} : x, then x = ${nf(v.b * v.x / v.a)}`; return t; }));
reg('calc', 'Weighted average', c => mk(c, [['v', 'One per line: value, weight', '80, 30\n90, 20\n70, 50', 'textarea']], v => { const rows = v.v.split('\n').map(l => l.split(/[,\s]+/).filter(Boolean).map(Number)).filter(r => r.length >= 2); if (!rows.length || rows.some(r => !r.every(Number.isFinite))) throw new Error('Use “value, weight” on each line');
  const w = rows.reduce((a, r) => a + r[1], 0), s = rows.reduce((a, r) => a + r[0] * r[1], 0); return `Weighted average = ${nf(s / w)}\nSimple average = ${nf(rows.reduce((a, r) => a + r[0], 0) / rows.length)}\nTotal weight = ${nf(w)}`; }));
reg('calc', 'Loan EMI calculator', c => mk(c, [['p', 'Loan amount (₹)', 500000], ['r', 'Annual interest (%)', 9], ['n', 'Tenure (months)', 60]], v => { need(v.p, v.r, v.n); const i = v.r / 1200, emi = i === 0 ? v.p / v.n : v.p * i * Math.pow(1 + i, v.n) / (Math.pow(1 + i, v.n) - 1);
  return `Monthly EMI: ₹${nf(emi)}\nTotal payment: ₹${nf(emi * v.n)}\nTotal interest: ₹${nf(emi * v.n - v.p)}`; }));

/* ============ FORMULA SHEETS ============ */
const sheet = (name, rows, head) => reg('forms', name, c => { c.innerHTML = '<input class="hrp-in" placeholder="Filter…" aria-label="Filter" style="margin-bottom:8px"><div id="fsB"></div>'; const b = $('#fsB', c), inp = $('input', c);
  const draw = () => { const q = inp.value.toLowerCase(); b.innerHTML = table(rows.filter(r => !q || r.join(' ').toLowerCase().includes(q)), head); }; inp.addEventListener('input', draw); draw(); });
sheet('Aptitude formulas', [['Percentage change', '(New − Old) ÷ Old × 100'], ['Profit %', '(SP − CP) ÷ CP × 100'], ['Discount %', '(MP − SP) ÷ MP × 100'], ['Simple interest', 'P × R × T ÷ 100'], ['Compound amount', 'P (1 + R/100)ⁿ'], ['Average', 'Sum of terms ÷ number of terms'],
  ['km/h → m/s', '× 5/18  (m/s → km/h: × 18/5)'], ['Relative speed', 'Same direction: S₁ − S₂ · Opposite: S₁ + S₂'], ['Train crossing', 'Pole: L ÷ v · Platform: (L + P) ÷ v'], ['Time & work', 'Together = 1 ÷ (1/a + 1/b)'], ['Ratio split', 'Part = Total × share ÷ sum of ratio'],
  ['Alligation', 'Cheaper : Dearer = (d − m) : (m − c)'], ['Permutation', 'nPr = n! ÷ (n − r)!'], ['Combination', 'nCr = n! ÷ (r! (n − r)!)'], ['Probability', 'Favourable ÷ Total outcomes'], ['Sum of n naturals', 'n(n + 1) ÷ 2'], ['Sum of n squares', 'n(n + 1)(2n + 1) ÷ 6'],
  ['AP', 'aₙ = a + (n − 1)d · Sₙ = n/2 [2a + (n − 1)d]'], ['GP', 'aₙ = a rⁿ⁻¹ · Sₙ = a (rⁿ − 1) ÷ (r − 1)']], ['Topic', 'Formula']);
sheet('Algebra & trigonometry', [['(a + b)²', 'a² + 2ab + b²'], ['(a − b)²', 'a² − 2ab + b²'], ['a² − b²', '(a + b)(a − b)'], ['a³ + b³', '(a + b)(a² − ab + b²)'], ['a³ − b³', '(a − b)(a² + ab + b²)'], ['Quadratic roots', 'x = (−b ± √(b² − 4ac)) ÷ 2a'],
  ['Sum / product of roots', '−b/a  ·  c/a'], ['Log rules', 'log(ab) = log a + log b · log(a/b) = log a − log b · log aⁿ = n log a'], ['sin² θ + cos² θ', '1'], ['tan θ', 'sin θ ÷ cos θ'], ['1 + tan² θ', 'sec² θ'], ['sin 2θ', '2 sin θ cos θ'], ['cos 2θ', 'cos² θ − sin² θ'],
  ['Angles 0° 30° 45° 60° 90°', 'sin: 0, ½, 1/√2, √3/2, 1 · cos: 1, √3/2, 1/√2, ½, 0 · tan: 0, 1/√3, 1, √3, ∞']], ['Item', 'Value']);
sheet('Geometry & mensuration', [['Circle', 'Area πr² · Circumference 2πr'], ['Triangle', 'Area ½ b h · Heron: √(s(s − a)(s − b)(s − c))'], ['Rectangle', 'Area l b · Perimeter 2(l + b)'], ['Square', 'Area a² · Diagonal a√2'], ['Trapezium', '½ (a + b) h'],
  ['Cube', 'Volume a³ · Surface 6a²'], ['Cuboid', 'Volume l b h · Surface 2(lb + bh + hl)'], ['Cylinder', 'Volume πr²h · Curved surface 2πrh'], ['Cone', 'Volume ⅓πr²h · Curved surface πrl'], ['Sphere', 'Volume 4/3 πr³ · Surface 4πr²'], ['Pythagoras', 'a² + b² = c²'], ['Sum of interior angles', '(n − 2) × 180°']], ['Shape', 'Formulas']);
sheet('Boolean algebra & logic gates', [['Identity', 'A + 0 = A · A · 1 = A'], ['Null', 'A + 1 = 1 · A · 0 = 0'], ['Idempotent', 'A + A = A · A · A = A'], ['Complement', 'A + A′ = 1 · A · A′ = 0'], ['Double negation', '(A′)′ = A'], ['De Morgan', '(A · B)′ = A′ + B′ · (A + B)′ = A′ · B′'],
  ['Absorption', 'A + AB = A · A(A + B) = A'], ['XOR', 'A ⊕ B = A′B + AB′'], ['XNOR', '(A ⊕ B)′ = AB + A′B′'], ['Universal gates', 'NAND and NOR can build any gate'], ['Half adder', 'Sum = A ⊕ B · Carry = A · B'], ['Full adder', 'Sum = A ⊕ B ⊕ Cin · Carry = AB + Cin(A ⊕ B)']], ['Law', 'Rule']);
sheet('Sorting algorithms', [['Bubble', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'Yes'], ['Selection', 'O(n²)', 'O(n²)', 'O(n²)', 'O(1)', 'No'], ['Insertion', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'Yes'], ['Merge', 'O(n log n)', 'O(n log n)', 'O(n log n)', 'O(n)', 'Yes'], ['Quick', 'O(n log n)', 'O(n log n)', 'O(n²)', 'O(log n)', 'No'], ['Heap', 'O(n log n)', 'O(n log n)', 'O(n log n)', 'O(1)', 'No'], ['Counting', 'O(n + k)', 'O(n + k)', 'O(n + k)', 'O(k)', 'Yes'], ['Radix', 'O(nk)', 'O(nk)', 'O(nk)', 'O(n + k)', 'Yes']], ['Algorithm', 'Best', 'Average', 'Worst', 'Space', 'Stable']);
sheet('Data-structure complexities', [['Array', 'O(1)', 'O(n)', 'O(n)', 'O(n)'], ['Linked list', 'O(n)', 'O(n)', 'O(1)*', 'O(1)*'], ['Stack / Queue', 'O(n)', 'O(n)', 'O(1)', 'O(1)'], ['Hash table', 'O(1)', 'O(1)', 'O(1)', 'O(1)'], ['Binary search tree (balanced)', 'O(log n)', 'O(log n)', 'O(log n)', 'O(log n)'], ['Binary heap', 'O(n)', 'O(n)', 'O(log n)', 'O(log n)']], ['Structure', 'Access', 'Search', 'Insert', 'Delete']);
sheet('Operating-system quick sheet', [['FCFS', 'Non-preemptive, simple, convoy effect'], ['SJF', 'Minimum average waiting time; may starve long jobs'], ['SRTF', 'Preemptive SJF'], ['Round Robin', 'Preemptive, time quantum, good response time'], ['Priority', 'Can starve low priority — fix with aging'], ['Deadlock conditions', 'Mutual exclusion · Hold & wait · No preemption · Circular wait'],
  ['Page replacement', 'FIFO (Belady’s anomaly) · LRU · Optimal'], ['Fragmentation', 'Paging → internal · Segmentation → external'], ['Semaphore', 'wait(S): S--, block if < 0 · signal(S): S++, wake one'], ['Process states', 'New → Ready → Running → Waiting → Terminated'], ['Thrashing', 'Too much paging; cure by reducing multiprogramming']], ['Topic', 'Key points']);
sheet('SQL joins & normal forms', [['INNER JOIN', 'Only matching rows in both tables'], ['LEFT JOIN', 'All left rows + matches from right'], ['RIGHT JOIN', 'All right rows + matches from left'], ['FULL OUTER JOIN', 'All rows from both, matched where possible'], ['CROSS JOIN', 'Cartesian product'], ['1NF', 'Atomic values, no repeating groups'], ['2NF', '1NF + no partial dependency'], ['3NF', '2NF + no transitive dependency'], ['BCNF', 'Every determinant is a candidate key'],
  ['ACID', 'Atomicity · Consistency · Isolation · Durability'], ['Isolation problems', 'Dirty read · Non-repeatable read · Phantom read'], ['WHERE vs HAVING', 'Rows before grouping vs groups after aggregation']], ['Topic', 'Meaning']);
sheet('OSI layers & common ports', [['7 Application', 'HTTP, FTP, SMTP, DNS'], ['6 Presentation', 'Encryption, compression, encoding'], ['5 Session', 'Session set-up and control'], ['4 Transport', 'TCP, UDP — ports, reliability'], ['3 Network', 'IP, routers — logical addressing'], ['2 Data link', 'MAC, switches — frames'], ['1 Physical', 'Cables, signals, bits'],
  ['Port 20/21', 'FTP'], ['Port 22', 'SSH'], ['Port 23', 'Telnet'], ['Port 25', 'SMTP'], ['Port 53', 'DNS'], ['Port 80', 'HTTP'], ['Port 110 / 143', 'POP3 / IMAP'], ['Port 443', 'HTTPS'], ['Port 3306 / 5432', 'MySQL / PostgreSQL']], ['Layer / port', 'Protocols / use']);
sheet('OOP concepts & SOLID', [['Encapsulation', 'Bundle data with methods; hide internals'], ['Inheritance', 'Reuse and extend a parent class'], ['Polymorphism', 'One interface, many forms (overloading, overriding)'], ['Abstraction', 'Expose essentials, hide details'], ['S — Single responsibility', 'A class should have one reason to change'], ['O — Open/closed', 'Open for extension, closed for modification'],
  ['L — Liskov substitution', 'Subtypes must be usable in place of their base types'], ['I — Interface segregation', 'Prefer small, specific interfaces'], ['D — Dependency inversion', 'Depend on abstractions, not concrete classes']], ['Concept', 'Meaning']);
sheet('Design patterns', [['Singleton', 'One instance with global access'], ['Factory', 'Create objects without exposing the exact class'], ['Builder', 'Construct complex objects step by step'], ['Observer', 'Subscribers get notified when state changes'], ['Strategy', 'Swap algorithms at runtime'], ['Decorator', 'Add behaviour by wrapping objects'], ['Adapter', 'Make incompatible interfaces work together'], ['MVC', 'Separate Model, View and Controller']], ['Pattern', 'Purpose']);
sheet('Python quick reference', [['List / tuple / set / dict', '[1, 2] · (1, 2) · {1, 2} · {"a": 1}'], ['Comprehension', '[x*x for x in range(5) if x % 2]'], ['f-string', 'f"{name} scored {marks:.1f}"'], ['Slicing', 'a[start:stop:step] · a[::-1] reverses'], ['Functions', 'def f(a, b=2, *args, **kw): return a + b'], ['Lambda', 'lambda x: x * 2'], ['Loops', 'for i, v in enumerate(a): …'], ['Exceptions', 'try: … except ValueError as e: … finally: …'],
  ['Files', 'with open("f.txt") as f: data = f.read()'], ['Classes', 'class A(B): def __init__(self): super().__init__()'], ['Useful built-ins', 'len, sum, min, max, sorted, zip, map, filter, any, all']], ['Topic', 'Syntax']);
sheet('C language quick reference', [['Data types', 'int (4B) · char (1B) · float (4B) · double (8B)'], ['Format specifiers', '%d int · %f float · %c char · %s string · %p pointer'], ['Pointers', 'int *p = &x; *p reads the value at p'], ['Arrays', 'int a[5]; a[i] == *(a + i)'], ['Strings', 'char s[] = "hi"; ends with \\0'], ['Dynamic memory', 'malloc(n) · calloc(n, size) · realloc · free'], ['Structs', 'struct P { int x; int y; };'], ['Operators', '++ -- · && || ! · & | ^ ~ << >>'], ['Loops', 'for, while, do…while · break / continue']], ['Topic', 'Syntax']);
sheet('HTML, CSS & JavaScript quick reference', [['Flexbox', 'display:flex; justify-content; align-items; gap; flex-wrap'], ['Grid', 'display:grid; grid-template-columns: repeat(3, 1fr); gap'], ['Box model', 'content + padding + border + margin'], ['Selectors', '.class · #id · a:hover · div > p · h1 + p'], ['Media query', '@media (max-width: 600px) { … }'], ['Semantic tags', 'header, nav, main, section, article, footer'],
  ['DOM', 'document.querySelector(".x").addEventListener("click", fn)'], ['Fetch', 'const r = await fetch(url); const d = await r.json();'], ['Array methods', 'map, filter, reduce, find, some, every, forEach'], ['Equality', '=== compares type and value; == coerces types'], ['let / const / var', 'let, const are block-scoped; var is function-scoped']], ['Topic', 'Snippet']);
sheet('Number systems & ASCII', [['Binary → decimal', 'Sum of bits × 2ᵖᵒˢⁱᵗⁱᵒⁿ'], ['Hex digits', 'A=10 B=11 C=12 D=13 E=14 F=15'], ['Powers of 2', '2⁴=16 · 2⁵=32 · 2⁶=64 · 2⁷=128 · 2⁸=256 · 2¹⁰=1024'], ['ASCII', '“0”=48 · “A”=65 · “a”=97 · space=32 · newline=10'], ['Two’s complement', 'Invert bits and add 1'], ['Range of n-bit unsigned', '0 … 2ⁿ − 1'], ['Range of n-bit signed', '−2ⁿ⁻¹ … 2ⁿ⁻¹ − 1'], ['1 KB, 1 MB, 1 GB', '1024 B · 1024 KB · 1024 MB']], ['Item', 'Value']);
sheet('Squares, cubes & tables', Array.from({ length: 30 }, (_, k) => { k++; return [String(k), `${k}² = ${k * k}` + (k <= 15 ? ` · ${k}³ = ${k ** 3}` : '') + ` · ${k} × 12 = ${k * 12}`]; }), ['n', 'Values']);
sheet('Useful constants & conversions', [['π', '3.14159265'], ['e', '2.71828183'], ['√2 · √3 · √5', '1.414 · 1.732 · 2.236'], ['g (gravity)', '9.8 m/s²'], ['Speed of light', '3 × 10⁸ m/s'], ['1 mile', '1.609 km'], ['1 inch', '2.54 cm'], ['1 kg', '2.205 lb'], ['°F ↔ °C', '°F = °C × 9/5 + 32'], ['1 lakh · 1 crore', '10⁵ · 10⁷'], ['Leap year', 'Divisible by 4, but centuries only if divisible by 400']], ['Item', 'Value']);

/* ============ STUDY TOOLS ============ */
const dt = s => new Date(s + 'T00:00');
const dshort = d => d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
reg('study', 'Exam countdown', c => {
  let ex = store.get('exams', []);
  c.innerHTML = `<div id="ecL"></div><div class="hrp-h">Add an exam</div><div class="hrp-row"><input class="hrp-in sm" id="ecN" placeholder="Exam name" maxlength="60"><input class="hrp-in sm" id="ecD" type="date" style="max-width:170px;flex:0"><button class="hrp-btn pri" data-a="add">Add</button></div>`;
  const draw = () => { const now = dt(today()); ex.sort((a, b) => a.d.localeCompare(b.d));
    $('#ecL', c).innerHTML = ex.map((e, i) => { const n = Math.round((dt(e.d) - now) / 86400000); const tone = n < 0 ? 'var(--muted)' : n <= 7 ? 'var(--pink)' : n <= 21 ? 'var(--orange)' : 'var(--green)';
      return `<div class="hrp-card" style="margin:8px 0;display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b>${esc(e.n)}</b>${dt(e.d).toDateString()}</div><div style="text-align:right"><div style="font-size:26px;font-weight:700;color:${tone}">${n < 0 ? 'Done' : n === 0 ? 'Today!' : n}</div><div class="hrp-muted">${n > 0 ? 'days left' : ''}</div><button class="hrp-x" data-del="${i}" aria-label="Delete">✕</button></div></div>`; }).join('') || '<p class="hrp-muted">No exams yet — add your first one below.</p>'; store.set('exams', ex); };
  c.addEventListener('click', e => { if (e.target.dataset.a === 'add') { const n = $('#ecN', c).value.trim(), d = $('#ecD', c).value; if (!n || !d) return toast('Enter a name and a date', 'warn', '⚠️'); ex.push({ n: n.slice(0, 60), d }); $('#ecN', c).value = ''; draw(); } else if (e.target.dataset.del != null) { ex.splice(+e.target.dataset.del, 1); draw(); } }); draw();
});
reg('study', 'Study timetable generator', c => {
  const d0 = new Date(Date.now() + 30 * 86400000);
  c.innerHTML = `<label class="hrp-muted">Subjects (one per line)</label><textarea class="hrp-ta" style="font-family:inherit;min-height:90px">DSA\nDBMS\nOperating Systems\nNetworks</textarea><div class="hrp-row"><label>Exam date <input type="date" class="hrp-in" value="${ymd(d0)}" style="width:auto"></label><label>Hours/day <input type="number" class="hrp-in" min="1" max="14" value="4" style="width:80px"></label></div><div class="hrp-row"><button class="hrp-btn pri" data-a="g">Generate</button><button class="hrp-btn" data-a="c">Copy</button><button class="hrp-btn" data-a="d">⬇ .txt</button></div><div class="hrp-out" style="max-height:300px;overflow:auto"></div>`;
  const out = $('.hrp-out', c);
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return;
    if (a === 'c') return copy(out.textContent); if (a === 'd') return download('study-timetable.txt', out.textContent);
    const subs = $('textarea', c).value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 12), ed = dt($('input[type=date]', c).value), h = Math.max(1, Math.min(14, +$('input[type=number]', c).value || 4));
    if (!subs.length || isNaN(ed)) return toast('Add subjects and an exam date', 'warn', '⚠️'); const days = Math.round((ed - dt(today())) / 86400000); if (days < 1) { out.textContent = 'The exam date must be in the future.'; return; } if (days > 120) { out.textContent = 'Pick an exam within the next 120 days.'; return; }
    const lines = []; let k = 0;
    for (let d = 0; d < days; d++) { const day = new Date(dt(today()).getTime() + d * 86400000);
      if (days - d <= 2) lines.push(`${dshort(day)}: 🔁 Full revision + previous papers + formula sheets`);
      else if (day.getDay() === 0) lines.push(`${dshort(day)}: 📝 Mock test + review weak topics (${h}h)`);
      else { const a = subs[k % subs.length], b = subs.length > 1 ? subs[(k + 1) % subs.length] : null; k += 2; lines.push(`${dshort(day)}: ${a}${b ? ' (' + (h / 2).toFixed(1) + 'h) + ' + b + ' (' + (h / 2).toFixed(1) + 'h)' : ' (' + h + 'h)'}`); } }
    lines.unshift(`${days} days to go · ${h} h/day · ${subs.length} subject(s)\n`); out.textContent = lines.join('\n'); });
});
reg('study', 'Syllabus tracker', c => {
  const done = store.get('syl:done', {}); const subs = Object.keys(SYL);
  c.innerHTML = `<div class="hrp-card"><b id="syO">Overall</b><div class="hrp-bar"><i id="syB"></i></div></div><select class="hrp-sel" style="margin-top:10px">${subs.map(s => `<option>${esc(s)}</option>`).join('')}</select><div id="syL"></div>`;
  const sel = $('select', c); sel.value = store.get('syl:sel', subs[0]); if (!subs.includes(sel.value)) sel.value = subs[0];
  const draw = () => { const s = sel.value; store.set('syl:sel', s); $('#syL', c).innerHTML = SYL[s].map(t => `<label class="hrp-check${done[s + '|' + t] ? ' done' : ''}"><input type="checkbox" data-k="${esc(s + '|' + t)}" ${done[s + '|' + t] ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('');
    const p = Math.round(sylPct() * 100); $('#syO', c).textContent = `Overall syllabus done: ${p}%`; $('#syB', c).style.width = p + '%'; };
  sel.addEventListener('change', draw); c.addEventListener('change', e => { const k = e.target.dataset.k; if (!k) return; if (e.target.checked) done[k] = 1; else delete done[k]; store.set('syl:done', done); addXP(e.target.checked ? 2 : 0); draw(); }); draw();
});
reg('study', 'Study log & daily goal', c => {
  let log = store.get('study:log', []); const goal0 = store.get('study:goal', 120);
  c.innerHTML = `<div class="hrp-card"><b id="slT"></b><div class="hrp-bar"><i id="slB"></i></div><span class="hrp-muted" id="slS"></span></div><div class="hrp-row"><label>Daily goal (min) <input class="hrp-in" id="slG" type="number" min="10" max="900" value="${goal0}" style="width:90px"></label></div>
  <div class="hrp-h">Log a session</div><div class="hrp-row"><input class="hrp-in sm" id="slM" type="number" min="1" max="600" placeholder="Minutes" style="max-width:110px;flex:0"><select class="hrp-sel hrp-in sm" id="slSub">${Object.keys(SYL).map(s => `<option>${esc(s)}</option>`).join('')}<option>Other</option></select><button class="hrp-btn pri" data-a="add">Add</button></div><div class="hrp-h">Last 7 days</div><div id="slC" style="display:flex;gap:6px;align-items:flex-end;height:110px"></div><div class="hrp-row"><button class="hrp-btn" data-a="csv">⬇ Export log</button><button class="hrp-btn" data-a="clr">Clear log</button></div>`;
  const byDay = () => { const m = {}; log.forEach(x => { m[x.d] = (m[x.d] || 0) + x.m; }); return m; };
  const draw = () => { const m = byDay(), goal = Math.max(10, +$('#slG', c).value || 120), td = m[today()] || 0; $('#slT', c).textContent = `Today: ${td} / ${goal} min`; $('#slB', c).style.width = Math.min(100, td / goal * 100) + '%';
    let st = 0; const d = new Date(); if (!m[ymd(d)]) d.setDate(d.getDate() - 1); while (m[ymd(d)] >= goal) { st++; d.setDate(d.getDate() - 1); } $('#slS', c).textContent = `${(log.reduce((a, x) => a + x.m, 0) / 60).toFixed(1)} h logged in total · goal streak ${st} day(s)`;
    const days = Array.from({ length: 7 }, (_, k) => { const x = new Date(); x.setDate(x.getDate() - (6 - k)); return x; }); const mxv = Math.max(goal, ...days.map(x => m[ymd(x)] || 0));
    $('#slC', c).innerHTML = days.map(x => { const v = m[ymd(x)] || 0; return `<div style="flex:1;text-align:center;font-size:11px"><div style="height:${Math.max(2, v / mxv * 80)}px;background:${v >= goal ? 'var(--green)' : 'var(--violet)'};border-radius:5px 5px 0 0"></div>${v}<br>${x.toLocaleDateString([], { weekday: 'short' }).slice(0, 2)}</div>`; }).join(''); store.set('study:log', log.slice(-400)); store.set('study:goal', goal); };
  c.addEventListener('input', e => { if (e.target.id === 'slG') draw(); });
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (a === 'add') { const mn = +$('#slM', c).value; if (!(mn > 0)) return toast('Enter the minutes studied', 'warn', '⚠️'); log.push({ d: today(), m: Math.min(600, Math.round(mn)), s: $('#slSub', c).value }); $('#slM', c).value = ''; addXP(Math.min(20, Math.round(mn / 10))); draw(); }
    else if (a === 'csv') download('study-log.csv', toCSV([['Date', 'Minutes', 'Subject']].concat(log.map(x => [x.d, x.m, x.s]))), 'text/csv'); else if (a === 'clr' && confirm('Clear the whole study log?')) { log = []; draw(); } }); draw();
});
reg('study', 'Spaced revision scheduler', c => {
  c.innerHTML = `<input class="hrp-in" placeholder="Topic just studied, e.g. Normalisation" maxlength="80" style="margin-bottom:8px"><div class="hrp-row"><label>Studied on <input type="date" class="hrp-in" value="${today()}" style="width:auto"></label><button class="hrp-btn pri" data-a="g">Schedule</button></div><div class="hrp-out"></div><div class="hrp-row"><button class="hrp-btn" data-a="c">Copy</button><button class="hrp-btn" data-a="i">⬇ Calendar (.ics)</button></div><p class="hrp-muted">Revisit after 1, 3, 7, 14 and 30 days — the schedule most memory research supports.</p>`;
  const out = $('.hrp-out', c); let ev = [];
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return; if (a === 'c') return copy(out.textContent);
    if (a === 'i') { if (!ev.length) return toast('Create a schedule first', 'warn', '⚠️'); return download('revision-schedule.ics', makeICS(ev), 'text/calendar'); }
    const topic = $('input', c).value.trim() || 'Revision', d0 = dt($('input[type=date]', c).value); if (isNaN(d0)) return toast('Pick a date', 'warn', '⚠️');
    ev = [1, 3, 7, 14, 30].map((n, k) => { const s = new Date(d0.getTime() + n * 86400000); s.setHours(9, 0, 0, 0); return { title: `Revise: ${topic} (#${k + 1})`, start: s, end: new Date(s.getTime() + 30 * 60000), alarm: 15 }; });
    out.textContent = `${topic}\n` + ev.map((x, k) => `Revision ${k + 1} (+${[1, 3, 7, 14, 30][k]}d): ${x.start.toDateString()}`).join('\n'); });
});
reg('study', 'Exam-day checklist', c => checklist(c, 'examday', ['Admit card / hall ticket', 'College ID card', 'Two working pens + pencil', 'Calculator (only if allowed)', 'Water bottle (clear)', 'Know the exam centre route and reporting time', 'Reach 30 minutes early', 'Phone switched off and stored as instructed', 'Read every instruction twice', 'Attempt easy questions first', 'Keep 10 minutes for review', 'Write your roll number on every sheet']));
reg('study', 'Night-before checklist', c => checklist(c, 'nightbefore', ['Revise formula sheets and short notes only', 'Pack bag and documents', 'Set two alarms', 'Light dinner', 'Skip new topics', 'Charge phone and power bank', 'Lay out clothes', 'Sleep at least 7 hours', 'Do 5 minutes of slow breathing']));
reg('study', 'Exam time allocator', c => {
  c.innerHTML = `<div class="hrp-row"><label>Total time (min) <input class="hrp-in" type="number" min="10" max="480" value="180" style="width:100px"></label></div><label class="hrp-muted">Sections: name, marks (one per line)</label><textarea class="hrp-ta" style="min-height:90px">Section A, 40\nSection B, 30\nSection C, 30</textarea><div class="hrp-row"><button class="hrp-btn pri">Plan my time</button></div><div class="hrp-out"></div>`;
  $('.pri', c).addEventListener('click', () => { const tot = +$('input', c).value, rows = $('textarea', c).value.split('\n').map(l => { const p = l.split(','); return [p.slice(0, -1).join(',').trim() || 'Section', +p[p.length - 1]]; }).filter(r => r[1] > 0); const out = $('.hrp-out', c);
    if (!(tot > 0) || !rows.length) { out.textContent = 'Enter the total time and at least one section with marks.'; return; } const sm = rows.reduce((a, r) => a + r[1], 0), review = Math.round(tot * .1), work = tot - review; let t = `Working time ${work} min + ${review} min review\n≈ ${nf(work / sm)} min per mark\n\n`;
    let clock = 0; rows.forEach(r => { const m = Math.round(work * r[1] / sm); t += `${r[0]} (${r[1]} marks): ${m} min  [${fmtClock(clock * 60).slice(0, -3) || '0'}–${Math.floor((clock + m) / 60)}:${pad((clock + m) % 60)}]\n`; clock += m; }); out.textContent = t + `Review: last ${review} min`; });
});
reg('study', 'Exam strategy guide', c => { c.innerHTML = table([['Before', 'Read the paper fully for the first 5 minutes; mark easy, medium and hard questions.'], ['Order', 'Start with sure marks, then medium, then hard. Never sit stuck for more than 3 minutes.'], ['MCQs', 'Eliminate two options first; guess only if negative marking is small.'], ['Numericals', 'Write formulae and units; partial marks reward method.'], ['Theory', 'Use headings, short points and a labelled diagram or example.'], ['Time', 'Check the clock at 25%, 50% and 75% of the time.'], ['Nerves', 'Slow breathing: in 4 s, hold 4 s, out 6 s. Then start with one easy question.'], ['Review', 'Recheck silly mistakes: signs, units, options marked in the wrong bubble.'], ['After', 'Do not post-mortem between papers — rest and revise for the next one.']], ['Stage', 'What to do']); });
function simpleList(c, key, ph){
  let list = store.get(key, []); c.innerHTML = `<div class="hrp-row"><input class="hrp-in sm" placeholder="${esc(ph)}" maxlength="140" aria-label="Item"><button class="hrp-btn pri" data-a="add">Add</button></div><div id="slI"></div><div class="hrp-row"><button class="hrp-btn" data-a="clr">Clear resolved</button><button class="hrp-btn" data-a="cp">Copy all</button></div>`;
  const box = $('#slI', c), inp = $('input', c); const draw = () => { box.innerHTML = list.map((t, i) => `<div class="hrp-check${t.d ? ' done' : ''}"><input type="checkbox" data-i="${i}" ${t.d ? 'checked' : ''}><span style="flex:1">${esc(t.t)}</span><button class="hrp-x" data-del="${i}" aria-label="Delete">✕</button></div>`).join('') || '<p class="hrp-muted">Nothing here yet.</p>'; store.set(key, list); };
  const add = () => { const v = inp.value.trim(); if (v) { list.unshift({ t: v.slice(0, 140), d: false }); inp.value = ''; draw(); } };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  c.addEventListener('click', e => { const a = e.target.dataset.a, d = e.target.dataset.del; if (a === 'add') add(); else if (a === 'clr') { list = list.filter(t => !t.d); draw(); } else if (a === 'cp') copy(list.map(t => (t.d ? '[x] ' : '[ ] ') + t.t).join('\n')); else if (d != null) { list.splice(+d, 1); draw(); } });
  c.addEventListener('change', e => { const i = e.target.dataset.i; if (i != null) { list[+i].d = e.target.checked; draw(); } }); draw();
}
reg('study', 'Doubt list', c => simpleList(c, 'doubts', 'A doubt to ask your teacher or friend…'));
reg('study', 'Formulas I keep forgetting', c => simpleList(c, 'forgot', 'Formula or fact to memorise…'));

/* ============ DRILLS ============ */
const PASSAGES = ['A good pitch tells one clear story: the problem people face, the solution you built, and the difference it makes to their lives.', 'Sleep well, drink water and commit your work often, because small habits decide big results during a long hackathon sprint.', 'The quick brown fox jumps over the lazy dog while the team debugs their code, tests every feature and prepares a confident demo.', 'Practice does not make perfect; careful practice makes progress, and steady progress makes exams feel like just another mock test.'];
reg('drills', 'Typing speed test', c => {
  const pass = pick(PASSAGES); let t0 = 0, done = false;
  c.innerHTML = `<div class="hrp-card" id="tyP" style="font-family:JetBrains Mono,monospace;line-height:1.7;font-size:15px"></div><textarea class="hrp-ta" id="tyI" style="min-height:90px;margin-top:8px" placeholder="Start typing here — the timer begins with your first key" autocomplete="off" spellcheck="false"></textarea><div class="hrp-row"><button class="hrp-btn" data-a="new">New passage</button></div><div class="hrp-out" id="tyO">Ready.</div>`;
  const P = $('#tyP', c), I = $('#tyI', c), O = $('#tyO', c);
  const paint = () => { const v = I.value; P.innerHTML = Array.from(pass).map((ch, i) => { const cls = i >= v.length ? '' : v[i] === ch ? 'color:var(--green)' : 'color:var(--pink);text-decoration:underline'; return `<span style="${cls}${i === v.length ? ';background:rgba(124,92,255,.35)' : ''}">${esc(ch)}</span>`; }).join(''); }; paint();
  I.addEventListener('input', () => { if (done) return; if (!t0) t0 = Date.now(); paint(); const v = I.value; let ok = 0; for (let i = 0; i < v.length && i < pass.length; i++) if (v[i] === pass[i]) ok++; const mins = Math.max(.05, (Date.now() - t0) / 60000);
    O.textContent = `${Math.round(ok / 5 / mins)} WPM · ${v.length ? Math.round(ok / v.length * 100) : 100}% accuracy`;
    if (v.length >= pass.length) { done = true; const wpm = Math.round(ok / 5 / mins), acc = Math.round(ok / v.length * 100); O.textContent = `✅ Finished! ${wpm} WPM · ${acc}% accuracy · ${((Date.now() - t0) / 1000).toFixed(1)} s`; const best = store.get('ty:best', 0); if (wpm > best) { store.set('ty:best', wpm); O.textContent += ' · New personal best!'; } else O.textContent += ` · Best ${best} WPM`; if (wpm >= 40 && acc >= 90) award('typist'); addXP(5); } });
  c.addEventListener('click', e => { if (e.target.dataset.a === 'new') renderHub(); });
});
reg('drills', 'Mental math sprint (60 s)', c => {
  c.innerHTML = `<div class="hrp-row"><select class="hrp-sel hrp-in sm" id="mmM"><option value="mix">Mixed + − ×</option><option value="add">Addition</option><option value="sub">Subtraction</option><option value="mul">Multiplication tables (2–12)</option><option value="sq">Squares (1–30)</option><option value="cube">Cubes (1–15)</option></select><button class="hrp-btn pri" data-a="go">Start</button></div><div class="hrp-big" id="mmQ">Ready?</div><div class="hrp-row" style="justify-content:center"><input class="hrp-in" id="mmA" type="number" inputmode="numeric" style="max-width:160px;text-align:center;font-size:20px" disabled aria-label="Answer"></div><div class="hrp-muted" id="mmS" style="text-align:center"></div>`;
  const Qe = $('#mmQ', c), A = $('#mmA', c), S = $('#mmS', c); let iv = null, end = 0, sc = 0, wr = 0, ans = 0;
  const gen = () => { const m = $('#mmM', c).value, r = (a, b) => a + rnd(b - a + 1); let k = m === 'mix' ? pick(['add', 'sub', 'mul']) : m;
    if (k === 'add') { const a = r(10, 99), b = r(10, 99); Qe.textContent = `${a} + ${b}`; ans = a + b; } else if (k === 'sub') { const a = r(30, 150), b = r(10, a - 1); Qe.textContent = `${a} − ${b}`; ans = a - b; }
    else if (k === 'mul') { const a = r(2, 12), b = r(2, 12); Qe.textContent = `${a} × ${b}`; ans = a * b; } else if (k === 'sq') { const a = r(1, 30); Qe.textContent = `${a}²`; ans = a * a; } else { const a = r(1, 15); Qe.textContent = `${a}³`; ans = a ** 3; } A.value = ''; A.focus(); };
  const stop = () => { clearInterval(iv); iv = null; A.disabled = true; const best = store.get('mm:best', 0); const nb = sc > best; if (nb) store.set('mm:best', sc); Qe.textContent = `Score ${sc}`; S.textContent = `${sc} correct · ${wr} wrong · best ${Math.max(best, sc)}${nb ? ' 🎉 new record' : ''}`; if (sc >= 15) award('math'); addXP(Math.min(15, sc)); };
  const tick = () => { if (!c.isConnected) { clearInterval(iv); return; } const left = Math.max(0, Math.ceil((end - Date.now()) / 1000)); S.textContent = `⏱ ${left}s · ${sc} correct · ${wr} wrong`; if (left <= 0) stop(); };
  c.addEventListener('click', e => { if (e.target.dataset.a === 'go') { sc = 0; wr = 0; end = Date.now() + 60000; A.disabled = false; clearInterval(iv); iv = setInterval(tick, 250); gen(); tick(); } });
  A.addEventListener('keydown', e => { if (e.key === 'Enter' && A.value !== '' && iv) { if (+A.value === ans) sc++; else wr++; gen(); tick(); } });
});
const TOPICS = ['Is social media doing more good than harm to students?', 'Should coding be a compulsory subject in schools?', 'How can technology help farmers in India?', 'The role of AI in healthcare', 'Should exams be replaced by continuous assessment?', 'Impact of remote work on productivity', 'Is cyber security everyone’s responsibility?', 'Renewable energy: the way forward', 'Open-source software and innovation', 'Digital India: achievements and challenges'];
reg('drills', 'Timed writing practice', c => {
  c.innerHTML = `<div class="hrp-card" id="twT"><b></b></div><div class="hrp-row"><select class="hrp-sel hrp-in sm" style="max-width:150px"><option value="10">10 minutes</option><option value="20" selected>20 minutes</option><option value="30">30 minutes</option></select><button class="hrp-btn" data-a="topic">🎲 New topic</button><button class="hrp-btn pri" data-a="go">Start writing</button></div><div class="hrp-kbd" id="twC" style="display:inline-block">--:--</div><textarea class="hrp-ta" id="twX" style="min-height:200px;font-family:inherit" placeholder="Your answer…" disabled></textarea><div class="hrp-count" id="twN"></div>`;
  const tp = $('#twT b', c), X = $('#twX', c), C = $('#twC', c), N = $('#twN', c); let iv = null, end = 0; tp.textContent = pick(TOPICS);
  const cnt = () => { const w = (X.value.trim().match(/\S+/g) || []).length; N.textContent = `${w} words · ${X.value.length} characters`; }; X.addEventListener('input', cnt);
  const tick = () => { if (!c.isConnected) { clearInterval(iv); return; } const l = Math.max(0, (end - Date.now()) / 1000); C.textContent = '⏱ ' + fmtClock(l); if (l <= 0) { clearInterval(iv); X.disabled = true; beep(3); const w = (X.value.trim().match(/\S+/g) || []).length; toast(`Time up! You wrote ${w} words`, 'success', '✍️'); addXP(5); } };
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (a === 'topic') tp.textContent = pick(TOPICS); else if (a === 'go') { end = Date.now() + +$('select', c).value * 60000; X.disabled = false; X.value = ''; X.focus(); clearInterval(iv); iv = setInterval(tick, 500); tick(); cnt(); } });
});
let NZ = null;
reg('drills', 'Focus sounds (white / pink / brown noise)', c => {
  c.innerHTML = `<div class="hrp-row"><select class="hrp-sel hrp-in sm" id="nzT"><option value="brown">Brown noise (deep, calming)</option><option value="pink">Pink noise (rain-like)</option><option value="white">White noise (static)</option></select></div><div class="hrp-row"><label>Volume <input type="range" id="nzV" min="1" max="60" value="${store.get('nzv', 20)}"></label></div><div class="hrp-row"><button class="hrp-btn pri" data-a="p">${NZ ? '■ Stop' : '▶ Play'}</button></div><p class="hrp-muted">Generated on your device — no internet needed. Keep the volume low while studying.</p>`;
  const stop = () => { if (NZ) { try { NZ.src.stop(); NZ.ac.close(); } catch(e){} NZ = null; } };
  c.addEventListener('input', e => { if (e.target.id === 'nzV') { store.set('nzv', +e.target.value); if (NZ) NZ.g.gain.value = e.target.value / 100; } });
  c.addEventListener('click', e => { if (e.target.dataset.a !== 'p') return; if (NZ) { stop(); e.target.textContent = '▶ Play'; return; }
    try { const ac = new (window.AudioContext || window.webkitAudioContext)(), len = ac.sampleRate * 4, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0), type = $('#nzT', c).value; let l = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (type === 'white') d[i] = w * .5; else if (type === 'brown') { l = (l + .02 * w) / 1.02; d[i] = l * 3.5; } else { b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926; } }
      const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = buf; src.loop = true; g.gain.value = $('#nzV', c).value / 100; src.connect(g); g.connect(ac.destination); src.start(); NZ = { ac, src, g }; e.target.textContent = '■ Stop'; } catch(err){ toast('Audio is not available here', 'warn', '🔇'); } });
});
reg('drills', '4-7-8 breathing (exam nerves)', c => {
  c.innerHTML = `<div style="display:grid;place-items:center;height:210px"><div id="brC" style="width:90px;height:90px;border-radius:50%;background:radial-gradient(circle,var(--cyan),var(--violet));display:grid;place-items:center;color:#fff;font-weight:700;transition:transform 4s ease-in-out;text-align:center;font-size:14px">Ready</div></div><div class="hrp-big" id="brT" style="font-size:22px">4-7-8</div><div class="hrp-row" style="justify-content:center"><button class="hrp-btn pri" data-a="s">Start</button></div><p class="hrp-muted" style="text-align:center">Inhale 4 s · hold 7 s · exhale 8 s. Four rounds calm most people.</p>`;
  const C = $('#brC', c), Tt = $('#brT', c); let iv = null, round = 0, phase = 0, left = 0; const P = [['Inhale', 4, 'scale(1.9)'], ['Hold', 7, 'scale(1.9)'], ['Exhale', 8, 'scale(1)']];
  const set = () => { const p = P[phase]; C.textContent = p[0]; C.style.transitionDuration = p[1] + 's'; C.style.transform = p[2]; left = p[1]; };
  const tick = () => { if (!c.isConnected) { clearInterval(iv); return; } left--; Tt.textContent = `${P[phase][0]} · ${left + 1 > 0 ? left + 1 : 0}s · round ${round + 1}/4`; if (left <= 0) { phase++; if (phase > 2) { phase = 0; round++; if (round >= 4) { clearInterval(iv); iv = null; C.textContent = 'Done'; C.style.transform = 'scale(1)'; Tt.textContent = '✅ Well done. You are ready.'; addXP(3); return; } } set(); } };
  c.addEventListener('click', e => { if (e.target.dataset.a === 's') { clearInterval(iv); round = 0; phase = 0; set(); Tt.textContent = 'Inhale…'; iv = setInterval(tick, 1000); } });
});
reg('drills', 'Focus mode & fullscreen', c => {
  const on = document.documentElement.classList.contains('hrp-focus');
  c.innerHTML = `<p class="hrp-muted">Hides banners, the marquee and floating buttons so you can study or take a mock test without distractions.</p><div class="hrp-row"><button class="hrp-btn pri" data-a="f">${on ? 'Turn focus mode off' : 'Turn focus mode on'}</button><button class="hrp-btn" data-a="fs">⛶ Toggle fullscreen</button></div>`;
  c.addEventListener('click', e => { const a = e.target.dataset.a; if (a === 'f') { const v = document.documentElement.classList.toggle('hrp-focus'); store.set('focus', v); e.target.textContent = v ? 'Turn focus mode off' : 'Turn focus mode on'; }
    else if (a === 'fs') { if (!document.fullscreenEnabled) return toast('Fullscreen is not supported here', 'warn', '⚠️'); if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); } });
});
if (store.get('focus', false)) document.documentElement.classList.add('hrp-focus');

/* ============ WIRING ============ */
TABS.push(['calc', '🧮 Calc', c => multi(c, CALCS, 'calcSel')]);
TABS.push(['forms', '📐 Formulas', c => multi(c, FORMS, 'formSel')]);
TABS.push(['study', '🎯 Study', c => multi(c, STUDY, 'studySel')]);
TABS.push(['drills', '⌨️ Drills', c => multi(c, DRILLS, 'drillSel')]);
/* ===== UP Rivals guide modules: Team codes (M2), Events & tickets (M8), College co-hosting (M9) =====
   Shared via Supabase (run Setup SQL once); falls back to this browser only if the tables are missing. */
(function(){
const SQL = "-- ============================================================\n-- Hackathon Rivals \u2014 Team codes, Events & tickets, College co-hosting\n-- Run once in Supabase \u2192 SQL Editor. Safe to run again.\n-- Needs the main setup SQL first (hr_is_admin, hr_token_ok, email verification).\n-- ============================================================\ncreate table if not exists public.hr_x_events(id text primary key, title text not null, starts_at timestamptz not null, venue text, seats int not null check (seats > 0), created_at timestamptz default now());\ncreate table if not exists public.hr_x_tickets(id uuid primary key default gen_random_uuid(), event_id text not null references public.hr_x_events(id) on delete cascade, name text, email text not null, code text not null unique, created_at timestamptz default now());\ncreate unique index if not exists hr_x_tickets_uq on public.hr_x_tickets(event_id, email);\ncreate table if not exists public.hr_x_colleges(id uuid primary key default gen_random_uuid(), college text, city text, club text, name text, email text, footfall int, plan_date date, status text not null default 'pending' check (status in ('pending','approved','rejected')), note text default '', created_at timestamptz default now());\ncreate table if not exists public.hr_x_teams(id uuid primary key default gen_random_uuid(), name text not null, skills text, code text not null unique, leader text not null, created_at timestamptz default now());\ncreate table if not exists public.hr_x_members(team_id uuid not null references public.hr_x_teams(id) on delete cascade, name text, email text not null unique, role text not null default 'Member', primary key (team_id, email));\ncreate table if not exists public.hr_x_invites(token text primary key, team_id uuid not null references public.hr_x_teams(id) on delete cascade, status text not null default 'pending');\nalter table public.hr_x_events enable row level security; alter table public.hr_x_tickets enable row level security; alter table public.hr_x_colleges enable row level security;\nalter table public.hr_x_teams enable row level security; alter table public.hr_x_members enable row level security; alter table public.hr_x_invites enable row level security;\ndrop policy if exists hr_x_ev_read on public.hr_x_events; create policy hr_x_ev_read on public.hr_x_events for select using (true);\ndrop policy if exists hr_x_ev_admin on public.hr_x_events; create policy hr_x_ev_admin on public.hr_x_events for all using (public.hr_is_admin()) with check (public.hr_is_admin());\ndrop policy if exists hr_x_tk_admin on public.hr_x_tickets; create policy hr_x_tk_admin on public.hr_x_tickets for all using (public.hr_is_admin()) with check (public.hr_is_admin());\ndrop policy if exists hr_x_co_admin on public.hr_x_colleges; create policy hr_x_co_admin on public.hr_x_colleges for all using (public.hr_is_admin()) with check (public.hr_is_admin());\ndrop policy if exists hr_x_tm_admin on public.hr_x_teams; create policy hr_x_tm_admin on public.hr_x_teams for all using (public.hr_is_admin()) with check (public.hr_is_admin());\ndrop policy if exists hr_x_mb_admin on public.hr_x_members; create policy hr_x_mb_admin on public.hr_x_members for all using (public.hr_is_admin()) with check (public.hr_is_admin());\ndrop policy if exists hr_x_iv_admin on public.hr_x_invites; create policy hr_x_iv_admin on public.hr_x_invites for all using (public.hr_is_admin()) with check (public.hr_is_admin());\n\n-- verified-email gate (same x-quiz-token header the quizzes use)\ncreate or replace function public.hr_x_ok(p_email text) returns boolean language plpgsql stable security definer set search_path = public as $$\ndeclare tok text;\nbegin\n  if public.hr_is_admin() then return true; end if;\n  begin tok := (nullif(current_setting('request.headers', true), '')::json) ->> 'x-quiz-token'; exception when others then tok := null; end;\n  if tok is null then tok := current_setting('request.header.x-quiz-token', true); end if;\n  return public.hr_token_ok(p_email, tok);\nend $$;\n\n-- Events\ncreate or replace function public.hr_x_ev_list() returns table(id text, title text, starts_at timestamptz, venue text, seats int, taken bigint) language sql stable security definer set search_path = public as $$\n  select e.id, e.title, e.starts_at, e.venue, e.seats, (select count(*) from public.hr_x_tickets t where t.event_id = e.id) from public.hr_x_events e order by e.starts_at $$;\ncreate or replace function public.hr_x_ev_mine(p_email text) returns table(event_id text, code text) language sql stable security definer set search_path = public as $$\n  select t.event_id, t.code from public.hr_x_tickets t where public.hr_x_ok(p_email) and t.email = lower(trim(p_email)) $$;\ncreate or replace function public.hr_x_ev_reg(p_event text, p_name text, p_email text) returns text language plpgsql security definer set search_path = public as $$\ndeclare e public.hr_x_events; c text; em text := lower(trim(p_email));\nbegin\n  if not public.hr_x_ok(em) then raise exception 'EMAIL_NOT_VERIFIED'; end if;\n  select * into e from public.hr_x_events where id = p_event for update;\n  if not found then raise exception 'EVENT_NOT_FOUND'; end if;\n  if e.starts_at < now() then raise exception 'EVENT_ENDED'; end if;\n  if exists (select 1 from public.hr_x_tickets where event_id = p_event and email = em) then raise exception 'ALREADY_REGISTERED'; end if;\n  if (select count(*) from public.hr_x_tickets where event_id = p_event) >= e.seats then raise exception 'HOUSEFULL'; end if;\n  c := 'TKT-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));\n  insert into public.hr_x_tickets(event_id, name, email, code) values (p_event, left(trim(p_name), 80), em, c);\n  return c;\nend $$;\n\n-- College co-hosting\ncreate or replace function public.hr_x_co_submit(p_college text, p_city text, p_club text, p_name text, p_email text, p_footfall int, p_date date) returns void language plpgsql security definer set search_path = public as $$\ndeclare em text := lower(trim(p_email));\nbegin\n  if not public.hr_x_ok(em) then raise exception 'EMAIL_NOT_VERIFIED'; end if;\n  if em ~ '@(gmail|yahoo|outlook|hotmail|rediffmail|live|icloud|proton)\\.' then raise exception 'FREE_EMAIL'; end if;\n  insert into public.hr_x_colleges(college, city, club, name, email, footfall, plan_date) values (left(p_college,120), left(p_city,80), left(p_club,120), left(p_name,80), em, p_footfall, p_date);\nend $$;\ncreate or replace function public.hr_x_co_list(p_email text) returns table(id uuid, college text, city text, club text, footfall int, plan_date date, status text, note text, email text) language sql stable security definer set search_path = public as $$\n  select c.id, c.college, c.city, c.club, c.footfall, c.plan_date, c.status, c.note,\n    case when public.hr_is_admin() or (c.email = lower(trim(p_email)) and public.hr_x_ok(p_email)) then c.email else '' end\n  from public.hr_x_colleges c\n  where c.status = 'approved' or public.hr_is_admin() or (c.email = lower(trim(p_email)) and public.hr_x_ok(p_email)) order by c.created_at desc $$;\ncreate or replace function public.hr_x_co_set(p_id uuid, p_status text, p_note text) returns void language plpgsql security definer set search_path = public as $$\nbegin\n  if not public.hr_is_admin() then raise exception 'ADMIN_ONLY'; end if;\n  if p_status not in ('approved','rejected') then raise exception 'BAD_STATUS'; end if;\n  update public.hr_x_colleges set status = p_status, note = left(coalesce(p_note,''), 300) where id = p_id and status = 'pending';\nend $$;\n\n-- Teams\ncreate or replace function public.hr_x_tm_my(p_email text) returns jsonb language plpgsql stable security definer set search_path = public as $$\ndeclare r jsonb;\nbegin\n  if not public.hr_x_ok(p_email) then return null; end if;\n  select jsonb_build_object('id', t.id, 'name', t.name, 'skills', t.skills, 'code', t.code, 'leader', t.leader,\n    'members', (select jsonb_agg(jsonb_build_object('name', m.name, 'email', m.email, 'role', m.role)) from public.hr_x_members m where m.team_id = t.id))\n  into r from public.hr_x_teams t join public.hr_x_members x on x.team_id = t.id where x.email = lower(trim(p_email)) limit 1;\n  return r;\nend $$;\ncreate or replace function public.hr_x_tm_new(p_name text, p_skills text, p_member text, p_email text) returns text language plpgsql security definer set search_path = public as $$\ndeclare em text := lower(trim(p_email)); tid uuid; c text;\nbegin\n  if not public.hr_x_ok(em) then raise exception 'EMAIL_NOT_VERIFIED'; end if;\n  if exists (select 1 from public.hr_x_members where email = em) then raise exception 'ALREADY_IN_TEAM'; end if;\n  c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));\n  insert into public.hr_x_teams(name, skills, code, leader) values (left(trim(p_name),80), left(coalesce(p_skills,''),200), c, em) returning id into tid;\n  insert into public.hr_x_members(team_id, name, email, role) values (tid, left(p_member,80), em, 'Leader');\n  return c;\nend $$;\ncreate or replace function public.hr_x_tm_join(p_code text, p_name text, p_email text) returns void language plpgsql security definer set search_path = public as $$\ndeclare em text := lower(trim(p_email)); t public.hr_x_teams; ev record;\nbegin\n  if not public.hr_x_ok(em) then raise exception 'EMAIL_NOT_VERIFIED'; end if;\n  select * into t from public.hr_x_teams where code = upper(trim(p_code));\n  if not found then raise exception 'INVALID_CODE'; end if;\n  select reg_open, reg_closes_at into ev from public.hr_events where id = 'main';\n  if found and (ev.reg_open is false or now() >= ev.reg_closes_at) then raise exception 'REG_CLOSED'; end if;\n  if exists (select 1 from public.hr_x_members where email = em) then raise exception 'ALREADY_IN_TEAM'; end if;\n  insert into public.hr_x_members(team_id, name, email, role) values (t.id, left(p_name,80), em, 'Member');\nend $$;\ncreate or replace function public.hr_x_tm_inv(p_email text) returns text language plpgsql security definer set search_path = public as $$\ndeclare em text := lower(trim(p_email)); t public.hr_x_teams; k text;\nbegin\n  if not public.hr_x_ok(em) then raise exception 'EMAIL_NOT_VERIFIED'; end if;\n  select * into t from public.hr_x_teams where leader = em;\n  if not found then raise exception 'LEADER_ONLY'; end if;\n  k := md5(random()::text || clock_timestamp()::text) || md5(clock_timestamp()::text || random()::text);\n  insert into public.hr_x_invites(token, team_id) values (k, t.id); return k;\nend $$;\ncreate or replace function public.hr_x_tm_acc(p_token text, p_name text, p_email text) returns void language plpgsql security definer set search_path = public as $$\ndeclare em text := lower(trim(p_email)); i public.hr_x_invites;\nbegin\n  if not public.hr_x_ok(em) then raise exception 'EMAIL_NOT_VERIFIED'; end if;\n  select * into i from public.hr_x_invites where token = trim(p_token) and status = 'pending' for update;\n  if not found then raise exception 'INVALID_TOKEN'; end if;\n  if exists (select 1 from public.hr_x_members where email = em) then raise exception 'ALREADY_IN_TEAM'; end if;\n  insert into public.hr_x_members(team_id, name, email, role) values (i.team_id, left(p_name,80), em, 'Member');\n  update public.hr_x_invites set status = 'accepted' where token = i.token;\nend $$;\ncreate or replace function public.hr_x_tm_leave(p_email text) returns void language plpgsql security definer set search_path = public as $$\nbegin\n  if not public.hr_x_ok(p_email) then raise exception 'EMAIL_NOT_VERIFIED'; end if;\n  delete from public.hr_x_members where email = lower(trim(p_email)) and role <> 'Leader';\nend $$;\ncreate or replace function public.hr_x_tm_del(p_email text) returns void language plpgsql security definer set search_path = public as $$\nbegin\n  if not public.hr_x_ok(p_email) then raise exception 'EMAIL_NOT_VERIFIED'; end if;\n  delete from public.hr_x_teams where leader = lower(trim(p_email));\nend $$;\n\n-- ============================================================\n-- Module 6: 5-dimension jury scoring (Judge / Admin only)\n-- ============================================================\ncreate table if not exists public.hr_x_scores(submission_id text not null, judge uuid not null, innovation int not null check (innovation between 1 and 10), complexity int not null check (complexity between 1 and 10), fit int not null check (fit between 1 and 10), impact int not null check (impact between 1 and 10), presentation int not null check (presentation between 1 and 10), feedback text default '', updated_at timestamptz default now(), primary key (submission_id, judge));\nalter table public.hr_x_scores enable row level security;\ndrop policy if exists hr_x_sc_admin on public.hr_x_scores; create policy hr_x_sc_admin on public.hr_x_scores for all using (public.hr_is_admin()) with check (public.hr_is_admin());\ncreate or replace function public.hr_x_is_judge() returns boolean language sql stable security definer set search_path = public as $$\n  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Judge','Admin')) $$;\ncreate or replace function public.hr_x_subs() returns table(id text, title text, full_name text, lang text, my jsonb) language plpgsql stable security definer set search_path = public as $$\nbegin\n  if not public.hr_x_is_judge() then raise exception 'JUDGE_ONLY'; end if;\n  return query select s.id::text, s.title, s.full_name, s.lang,\n    (select to_jsonb(x) - 'submission_id' - 'judge' from public.hr_x_scores x where x.submission_id = s.id::text and x.judge = auth.uid())\n  from public.arena_submissions s order by s.created_at desc limit 200;\nend $$;\ncreate or replace function public.hr_x_score(p_sub text, p_i int, p_c int, p_f int, p_m int, p_p int, p_fb text) returns void language plpgsql security definer set search_path = public as $$\nbegin\n  if not public.hr_x_is_judge() then raise exception 'JUDGE_ONLY'; end if;\n  if least(p_i, p_c, p_f, p_m, p_p) < 1 or greatest(p_i, p_c, p_f, p_m, p_p) > 10 then raise exception 'SCORE_RANGE'; end if;\n  insert into public.hr_x_scores(submission_id, judge, innovation, complexity, fit, impact, presentation, feedback)\n  values (p_sub, auth.uid(), p_i, p_c, p_f, p_m, p_p, left(coalesce(p_fb, ''), 500))\n  on conflict (submission_id, judge) do update set innovation = excluded.innovation, complexity = excluded.complexity, fit = excluded.fit, impact = excluded.impact, presentation = excluded.presentation, feedback = excluded.feedback, updated_at = now();\nend $$;\ncreate or replace function public.hr_x_board() returns table(submission_id text, title text, judges bigint, avg_total numeric, rnk bigint) language sql stable security definer set search_path = public as $$\n  select x.submission_id, s.title, count(*), round(avg(x.innovation + x.complexity + x.fit + x.impact + x.presentation), 2),\n         rank() over (order by avg(x.innovation + x.complexity + x.fit + x.impact + x.presentation) desc)\n  from public.hr_x_scores x join public.arena_submissions s on s.id::text = x.submission_id\n  where public.hr_x_is_judge() group by x.submission_id, s.title order by 4 desc limit 20 $$;\n\n-- ============================================================\n-- Module 4 + 10: violation log, optional score-0, KPIs, audit log\n-- ============================================================\nalter table public.hr_events add column if not exists proctor_zero boolean not null default false;\ncreate table if not exists public.hr_x_violations(id uuid primary key default gen_random_uuid(), at timestamptz not null default now(), email text not null, kind text, ref text, reason text, zero boolean not null default false, dq boolean not null default false);\ncreate table if not exists public.hr_x_audit(id bigserial primary key, at timestamptz not null default now(), actor uuid, action text not null, detail text);\nalter table public.hr_x_violations enable row level security; alter table public.hr_x_audit enable row level security;\ndrop policy if exists hr_x_vi_admin on public.hr_x_violations; create policy hr_x_vi_admin on public.hr_x_violations for all using (public.hr_is_admin()) with check (public.hr_is_admin());\ndrop policy if exists hr_x_au_admin on public.hr_x_audit; create policy hr_x_au_admin on public.hr_x_audit for all using (public.hr_is_admin()) with check (public.hr_is_admin());\n\ncreate or replace function public.hr_x_cnt(p_tbl text, p_where text default '') returns bigint language plpgsql security definer set search_path = public as $$\ndeclare n bigint;\nbegin\n  if to_regclass('public.' || quote_ident(p_tbl)) is null then return null; end if;\n  execute format('select count(*) from public.%I %s', p_tbl, p_where) into n; return n;\nend $$;\nrevoke all on function public.hr_x_cnt(text, text) from public, anon, authenticated;\ncreate or replace function public.hr_x_kpis() returns jsonb language plpgsql stable security definer set search_path = public as $$\nbegin\n  if not public.hr_is_admin() then raise exception 'ADMIN_ONLY'; end if;\n  return jsonb_build_object('users', public.hr_x_cnt('profiles'), 'submissions', public.hr_x_cnt('arena_submissions'), 'quiz_attempts', public.hr_x_cnt('hr_attempts'),\n    'hack_regs', public.hr_x_cnt('hr_registrations'), 'teams', public.hr_x_cnt('hr_x_teams'), 'tickets', public.hr_x_cnt('hr_x_tickets'),\n    'pending_colleges', public.hr_x_cnt('hr_x_colleges', 'where status = ''pending'''), 'violations', public.hr_x_cnt('hr_x_violations'));\nend $$;\n\ncreate or replace function public.hr_x_violation(p_email text, p_kind text, p_ref text, p_reason text, p_zero boolean) returns void language plpgsql security definer set search_path = public as $$\ndeclare em text := lower(trim(p_email));\nbegin\n  if not public.hr_x_ok(em) then return; end if;\n  if (select count(*) from public.hr_x_violations where email = em and at > now() - interval '1 hour') >= 20 then return; end if;\n  insert into public.hr_x_violations(email, kind, ref, reason, zero) values (em, left(coalesce(p_kind,''), 20), left(coalesce(p_ref,''), 80), left(coalesce(p_reason,''), 120), coalesce(p_zero, false));\nend $$;\n-- zeroes the student's own attempt, only if a zero-mode violation was recorded for that quiz\ncreate or replace function public.hr_x_apply_dq(p_ref text, p_email text) returns int language plpgsql security definer set search_path = public as $$\ndeclare em text := lower(trim(p_email)); n int := 0;\nbegin\n  if not public.hr_x_ok(em) then raise exception 'EMAIL_NOT_VERIFIED'; end if;\n  if not exists (select 1 from public.hr_x_violations where email = em and ref = p_ref and zero) then return 0; end if;\n  update public.hr_attempts set score = 0, bonus = 0 where quiz_id::text = p_ref and lower(email) = em;\n  get diagnostics n = row_count;\n  update public.hr_x_violations set dq = true where email = em and ref = p_ref and zero;\n  return n;\nend $$;\ncreate or replace function public.hr_x_viol_list() returns table(id uuid, at timestamptz, email text, kind text, ref text, reason text, zero boolean, dq boolean) language sql stable security definer set search_path = public as $$\n  select v.id, v.at, v.email, v.kind, v.ref, v.reason, v.zero, v.dq from public.hr_x_violations v where public.hr_is_admin() order by v.at desc limit 200 $$;\ncreate or replace function public.hr_x_dq(p_id uuid) returns int language plpgsql security definer set search_path = public as $$\ndeclare v public.hr_x_violations; n int := 0;\nbegin\n  if not public.hr_is_admin() then raise exception 'ADMIN_ONLY'; end if;\n  select * into v from public.hr_x_violations where id = p_id; if not found then return 0; end if;\n  update public.hr_attempts set score = 0, bonus = 0 where quiz_id::text = v.ref and lower(email) = v.email;\n  get diagnostics n = row_count;\n  update public.hr_x_violations set dq = true where id = p_id;\n  insert into public.hr_x_audit(actor, action, detail) values (auth.uid(), 'score_zero', v.email || ' / ' || v.ref);\n  return n;\nend $$;\ncreate or replace function public.hr_x_audit_add(p_action text, p_detail text) returns void language plpgsql security definer set search_path = public as $$\nbegin\n  if not public.hr_is_admin() then raise exception 'ADMIN_ONLY'; end if;\n  insert into public.hr_x_audit(actor, action, detail) values (auth.uid(), left(p_action, 60), left(coalesce(p_detail, ''), 300));\nend $$;\ncreate or replace function public.hr_x_audit_list() returns table(at timestamptz, action text, detail text) language sql stable security definer set search_path = public as $$\n  select a.at, a.action, a.detail from public.hr_x_audit a where public.hr_is_admin() order by a.at desc limit 100 $$;\n";
const K = { ev: 'x:events', er: 'x:evregs', co: 'x:colleges', tm: 'x:teams', ti: 'x:invites' };
const g = (k, d) => store.get(k, d), sv = (k, v) => store.set(k, v);
const hx = n => { const a = new Uint8Array(n / 2); crypto.getRandomValues(a); return [...a].map(b => b.toString(16).padStart(2, '0')).join(''); };
const me = () => store.get('hk:me', {}) || {};
const okMail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const FREE = /@(gmail|yahoo|outlook|hotmail|rediffmail|live|icloud|proton)\./i;
const v = (c, id) => ((c.querySelector('#' + id) || {}).value || '').trim();
const X = { miss: false };
const rem = () => HB.remote && !X.miss;
const ER = { HOUSEFULL: 'Housefull — registration is full.', ALREADY_REGISTERED: 'Already registered for this session.', EMAIL_NOT_VERIFIED: 'Verify your email first.', EVENT_ENDED: 'This event has ended.', INVALID_CODE: 'Invalid team code.', REG_CLOSED: 'Registration is closed — joining is locked.', ALREADY_IN_TEAM: 'You are already in a team.', INVALID_TOKEN: 'Invalid or already-used token.', LEADER_ONLY: 'Only the team leader can do that.', FREE_EMAIL: 'Please use an official college email domain.', ADMIN_ONLY: 'Admin only.', JUDGE_ONLY: 'Judge or Admin login required.', RETRY_OFF: 'Re-attempt is not enabled.', NO_ATTEMPT: 'There is no earlier attempt to re-attempt.', RETRY_USED: 'Your re-attempt has already been used.', NO_RETRY: 'No re-attempt is available for this quiz.', NO_TIME_LEFT: 'No time was left, so there is no re-attempt.', SCORE_RANGE: 'Each score must be 1 to 10.' };
const errTxt = e => { const m = Object.keys(ER).find(k => String(e && e.message).includes(k)); return m ? ER[m] : ((e && e.message) || 'Something went wrong'); };
const call = async (fn, body, email) => { try { return await pgrest('rpc/' + fn, { method: 'POST', body, headers: email ? vtHdr(email) : {} }); } catch(e){ if (e.status === 404 || /PGRST20|42883|42P01|schema cache|does not exist/i.test((e.code || '') + (e.message || ''))) X.miss = true; throw e; } };
const MISS = /PGRST20|42883|42P01|schema cache|does not exist|Could not find/i;
const op = async (r, l) => { if (rem()) { try { return await r(); } catch(e){ if (e && (e.status === 404 || MISS.test((e.code || '') + (e.message || '')))) X.miss = true; else throw e; } } return l(); };
const ident = () => `<div class="hrp-row"><input class="hrp-in sm" id="xN" placeholder="Your name" value="${esc(me().name || '')}"><input class="hrp-in sm" id="xE" placeholder="Email" value="${esc(me().email || '')}"></div>`;
const bar = () => (X.miss ? '<div class="hrp-card" style="border-color:var(--orange)">🟠 Database tables not set up — data is saved in this browser only.' + (isAdminUI() ? ' Run the setup SQL once in Supabase.' : ' Ask the organiser.') + '</div>' : '') + (isAdminUI() ? '<div class="hrp-row"><button class="hrp-btn" data-x="sql">📋 Copy setup SQL</button></div>' : '');
const who = c => { const name = v(c, 'xN'), email = v(c, 'xE').toLowerCase(); if (!name || !okMail(email)) { msg(c, 'Enter your name and a valid email.'); return null; } store.set('hk:me', { ...me(), name, email }); return { name, email }; };
const gate = async (c, w) => !rem() || !!(await ensureVerified(c.querySelector('#xM'), w.email));
const msg = (c, t, ok) => { const m = c.querySelector('#xM'); if (m) { m.textContent = t; m.className = 'hk-msg ' + (ok ? 'ok' : 'err'); } };
const pill = s => `<span class="hk-pill ${s === 'approved' ? 'ok' : s === 'rejected' ? 'bad' : ''}">${s}</span>`;
const vf = () => rem() && me().email && !vtGet(me().email) ? '<div class="hrp-row"><button class="hrp-btn" data-x="vf">🔐 Verify email to see my data</button></div>' : '';
function tab(id, label, draw, acts){
  acts.sql = c => { try { navigator.clipboard.writeText(SQL); msg(c, 'SQL copied — paste it in Supabase → SQL Editor.', 1); } catch(_){ download('hr-x-setup.sql', SQL, 'text/plain'); } };
  acts.vf = async c => { const e = me().email; if (e && await ensureVerified(c.querySelector('#xM'), e)) draw(c); };
  TABS.push([id, label, c => { draw(c); c.onclick = async e => { const b = e.target.closest('[data-x]'); if (!b || b.disabled) return; const f = acts[b.dataset.x]; if (f) { try { await f(c, b); } catch(err){ msg(c, errTxt(err)); } } }; }]);
}

/* ---- Module 8: Events & digital tickets ---- */
const evList = () => op(async () => (await pgrest('rpc/hr_x_ev_list', { method: 'POST', body: {} })).map(e => ({ id: e.id, title: e.title, date: e.starts_at, venue: e.venue, seats: e.seats, taken: +e.taken })), async () => { const R = g(K.er, []); return g(K.ev, []).map(e => ({ ...e, taken: R.filter(r => r.ev === e.id).length })); });
const evMine = m => op(async () => m ? (await call('hr_x_ev_mine', { p_email: m }, m)).map(r => ({ ev: r.event_id, code: r.code })) : [], async () => g(K.er, []).filter(r => r.email === m));
const drawEv = async c => {
  let L = [], mine = []; try { L = await evList(); mine = await evMine(me().email); } catch(e){ msg(c, errTxt(e)); }
  const adm = isAdminUI();
  c.innerHTML = bar() + (adm ? `<div class="hrp-card"><b>🛡️ Admin — new event</b><div class="hrp-row"><input class="hrp-in sm" id="evT" placeholder="Title"><input class="hrp-in sm" id="evD" type="datetime-local"><input class="hrp-in sm" id="evV" placeholder="Venue / link"><input class="hrp-in sm" id="evS" type="number" min="1" placeholder="Seats"></div><button class="hrp-btn pri" data-x="evAdd">Create event</button></div>` : '')
    + ident() + vf() + '<div class="hk-msg" id="xM"></div>'
    + (L.length ? L.map(e => { const full = e.taken >= e.seats, past = Date.parse(e.date) < Date.now();
      return `<div class="hrp-card" style="margin:8px 0"><b>${esc(e.title)}</b><br><span class="hrp-muted">${new Date(e.date).toLocaleString()} · ${esc(e.venue || 'TBA')} · ${e.taken}/${e.seats} seats</span><div class="hrp-row"><button class="hrp-btn pri" data-x="evReg" data-id="${e.id}" ${full || past ? 'disabled' : ''}>${past ? 'Ended' : full ? '🚫 Housefull' : 'Register'}</button>${adm ? `<button class="hrp-btn" data-x="evDel" data-id="${e.id}">Delete</button>` : ''}</div></div>`; }).join('') : '<p class="hrp-muted">No events yet.</p>')
    + (mine.length ? '<div class="hrp-h">🎟️ My tickets</div>' + mine.map(r => { const e = L.find(x => x.id === r.ev); return e ? `<div class="hrp-card" style="margin:6px 0"><b>${esc(e.title)}</b> · <code>${r.code}</code><div class="hrp-row"><button class="hrp-btn" data-x="evIcs" data-id="${e.id}">📅 Add to calendar (.ics)</button></div></div>` : ''; }).join('') : '');
};
tab('events', '🎟️ Events', drawEv, {
  async evAdd(c){ const title = v(c, 'evT'), d = v(c, 'evD'), seats = +v(c, 'evS'); if (!title || !d || !(seats > 0)) return msg(c, 'Title, date and seats are required.');
    const row = { id: hx(8), title, starts_at: new Date(d).toISOString(), venue: v(c, 'evV'), seats };
    await op(() => pgrest('hr_x_events', { method: 'POST', body: [row], headers: { Prefer: 'return=minimal' } }), async () => { const L = g(K.ev, []); L.push({ id: row.id, title, date: row.starts_at, venue: row.venue, seats }); sv(K.ev, L); }); drawEv(c); },
  async evDel(c, b){ const id = b.dataset.id; await op(() => pgrest('hr_x_events?id=eq.' + encodeURIComponent(id), { method: 'DELETE' }), async () => { sv(K.ev, g(K.ev, []).filter(e => e.id !== id)); sv(K.er, g(K.er, []).filter(r => r.ev !== id)); }); drawEv(c); },
  async evReg(c, b){ const w = who(c); if (!w || !(await gate(c, w))) return; const id = b.dataset.id;
    await op(() => call('hr_x_ev_reg', { p_event: id, p_name: w.name, p_email: w.email }, w.email), async () => { const e = g(K.ev, []).find(x => x.id === id), R = g(K.er, []); if (!e) throw new Error('EVENT_NOT_FOUND');
      if (R.some(r => r.ev === id && r.email === w.email)) throw new Error('ALREADY_REGISTERED'); if (R.filter(r => r.ev === id).length >= e.seats) throw new Error('HOUSEFULL');
      R.push({ ev: id, ...w, code: 'TKT-' + hx(8).toUpperCase(), at: Date.now() }); sv(K.er, R); });
    await drawEv(c); msg(c, 'Registered ✔ — your ticket is below.', 1); },
  async evIcs(c, b){ const e = (await evList()).find(x => x.id === b.dataset.id); if (!e) return; const f = t => new Date(t).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    download((e.title || 'event').replace(/\W+/g, '-') + '.ics', ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'UID:' + e.id + '@uprivals', 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(e.date), 'DTEND:' + f(Date.parse(e.date) + 7200000), 'SUMMARY:' + e.title, 'LOCATION:' + (e.venue || ''), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'), 'text/calendar'); }
});

/* ---- Module 9: College club co-hosting ---- */
const coList = m => op(async () => (await call('hr_x_co_list', { p_email: m || '' }, m)).map(p => ({ id: p.id, college: p.college, city: p.city, club: p.club, footfall: p.footfall, date: p.plan_date, status: p.status, note: p.note, email: p.email })), async () => g(K.co, []));
const drawCo = async c => {
  let L = []; try { L = await coList(me().email); } catch(e){ msg(c, errTxt(e)); }
  const m = me().email, adm = isAdminUI(), mineL = L.filter(p => p.email && p.email === m);
  const row = (p, act) => `<div class="hrp-card" style="margin:6px 0"><b>${esc(p.club)}</b> — ${esc(p.college)}, ${esc(p.city)} ${pill(p.status)}<br><span class="hrp-muted">Footfall ${p.footfall} · ${esc(p.date)}${p.email ? ' · ' + esc(p.email) : ''}${p.note ? ' · Feedback: ' + esc(p.note) : ''}</span>${act || ''}</div>`;
  c.innerHTML = bar() + `<div class="hrp-card"><b>🏫 Propose a co-hosted hackathon</b><div class="hrp-row"><input class="hrp-in sm" id="coC" placeholder="College name"><input class="hrp-in sm" id="coCity" placeholder="City"><input class="hrp-in sm" id="coClub" placeholder="Club title"></div>${ident()}<div class="hrp-row"><input class="hrp-in sm" id="coF" type="number" min="1" placeholder="Expected footfall"><input class="hrp-in sm" id="coD" type="date"></div><p class="hrp-muted">Use your official college email (free mail domains are not accepted).</p><button class="hrp-btn pri" data-x="coAdd">Submit proposal</button><div class="hk-msg" id="xM"></div></div>` + vf()
    + (adm ? '<div class="hrp-h">🛡️ Admin review</div>' + (L.filter(p => p.status === 'pending').map(p => row(p, `<div class="hrp-row"><button class="hrp-btn pri" data-x="coOk" data-id="${p.id}">Approve</button><button class="hrp-btn" data-x="coNo" data-id="${p.id}">Reject</button></div>`)).join('') || '<p class="hrp-muted">No pending proposals.</p>') : '')
    + (mineL.length ? '<div class="hrp-h">My proposals</div>' + mineL.map(p => row(p)).join('') : '')
    + (L.some(p => p.status === 'approved') ? '<div class="hrp-h">🤝 Co-host partners</div>' + L.filter(p => p.status === 'approved').map(p => `<div class="hrp-card" style="margin:6px 0">✅ <b>${esc(p.college)}</b> — ${esc(p.club)} (${esc(p.city)})</div>`).join('') : '');
};
const setSt = async (c, id, st) => { const note = st === 'rejected' ? (prompt('Feedback for the college lead (optional):') || '').slice(0, 300) : '';
  await op(() => call('hr_x_co_set', { p_id: id, p_status: st, p_note: note }), async () => { const L = g(K.co, []), p = L.find(x => x.id === id); if (p && p.status === 'pending') { p.status = st; p.note = note; sv(K.co, L); } }); drawCo(c); };
tab('college', '🏫 Co-Host', drawCo, {
  async coAdd(c){ const w = who(c); if (!w) return; const p = { id: hx(8), college: v(c, 'coC'), city: v(c, 'coCity'), club: v(c, 'coClub'), footfall: +v(c, 'coF'), date: v(c, 'coD'), ...w, status: 'pending', note: '' };
    if (!p.college || !p.city || !p.club || !(p.footfall > 0) || !p.date) return msg(c, 'Fill in every field.'); if (FREE.test(p.email)) return msg(c, ER.FREE_EMAIL); if (!(await gate(c, w))) return;
    await op(() => call('hr_x_co_submit', { p_college: p.college, p_city: p.city, p_club: p.club, p_name: p.name, p_email: p.email, p_footfall: p.footfall, p_date: p.date }, p.email), async () => { const L = g(K.co, []); L.unshift(p); sv(K.co, L); });
    await drawCo(c); msg(c, 'Proposal submitted — status: pending.', 1); },
  coOk: (c, b) => setSt(c, b.dataset.id, 'approved'), coNo: (c, b) => setSt(c, b.dataset.id, 'rejected')
});

/* ---- Module 2: Team codes, leader role, invite tokens ---- */
const myTeamL = e => g(K.tm, []).find(t => t.members.some(m => m.email === e));
const tmGet = m => op(async () => m ? await call('hr_x_tm_my', { p_email: m }, m) : null, async () => (m && myTeamL(m)) || null);
const drawTm = async c => {
  const m = me().email; let t = null; try { t = await tmGet(m); } catch(e){ msg(c, errTxt(e)); }
  const lead = t && t.leader === m;
  c.innerHTML = bar() + ident() + vf() + '<div class="hk-msg" id="xM"></div>' + (t
    ? `<div class="hrp-card"><b>${esc(t.name)}</b> · code <code>${t.code}</code> <button class="hrp-btn" data-x="tmCopy" data-code="${t.code}">Copy code</button><br><span class="hrp-muted">${esc(t.skills || '')}</span>${(t.members || []).map(x => `<div>${x.role === 'Leader' ? '👑' : '👤'} ${esc(x.name)} <span class="hrp-muted">${esc(x.email)}</span></div>`).join('')}<div class="hrp-row">${lead ? '<button class="hrp-btn pri" data-x="tmInv">Generate invite token</button><button class="hrp-btn" data-x="tmDel">Dissolve team</button>' : '<button class="hrp-btn" data-x="tmLeave">Leave team</button>'}</div><div id="tmTok"></div></div>`
    : `<div class="hrp-card"><b>Create a team</b><div class="hrp-row"><input class="hrp-in sm" id="tmN" placeholder="Team name"><input class="hrp-in sm" id="tmS" placeholder="Skills (comma separated)"></div><button class="hrp-btn pri" data-x="tmNew">Create</button></div>
    <div class="hrp-card"><b>Join with an 8-character code</b><div class="hrp-row"><input class="hrp-in sm" id="tmC" maxlength="8" placeholder="TEAM CODE"><button class="hrp-btn pri" data-x="tmJoin">Join</button></div></div>
    <div class="hrp-card"><b>Accept an invitation token</b><div class="hrp-row"><input class="hrp-in sm" id="tmT" placeholder="64-character token"><button class="hrp-btn" data-x="tmAcc">Accept</button></div></div>`);
};
const addL = (t, w) => { const L = g(K.tm, []); L.find(y => y.id === t.id).members.push({ ...w, role: 'Member' }); sv(K.tm, L); };
const me2 = async c => { const w = who(c); return w && (await gate(c, w)) ? w : null; };
tab('team', '👥 Team', drawTm, {
  async tmNew(c){ const w = await me2(c); if (!w) return; const name = v(c, 'tmN'); if (!name) return msg(c, 'Give your team a name.');
    await op(() => call('hr_x_tm_new', { p_name: name, p_skills: v(c, 'tmS'), p_member: w.name, p_email: w.email }, w.email), async () => { if (myTeamL(w.email)) throw new Error('ALREADY_IN_TEAM'); const L = g(K.tm, []); L.push({ id: hx(8), name, skills: v(c, 'tmS'), code: hx(8).toUpperCase(), leader: w.email, members: [{ ...w, role: 'Leader' }] }); sv(K.tm, L); }); drawTm(c); },
  async tmJoin(c){ const w = await me2(c); if (!w) return; const code = v(c, 'tmC').toUpperCase();
    await op(() => call('hr_x_tm_join', { p_code: code, p_name: w.name, p_email: w.email }, w.email), async () => { const t = g(K.tm, []).find(x => x.code === code); if (!t) throw new Error('INVALID_CODE');
      let open = true; try { open = evState().regOpen; } catch(_){} if (!open) throw new Error('REG_CLOSED'); if (myTeamL(w.email)) throw new Error('ALREADY_IN_TEAM'); addL(t, w); }); drawTm(c); },
  async tmInv(c){ const e = me().email;
    const k = await op(() => call('hr_x_tm_inv', { p_email: e }, e), async () => { const t = myTeamL(e); if (!t || t.leader !== e) throw new Error('LEADER_ONLY'); const k = hx(64), I = g(K.ti, []); I.push({ token: k, team: t.id, status: 'pending' }); sv(K.ti, I); return k; });
    c.querySelector('#tmTok').innerHTML = `<p class="hrp-muted">Share this token with your teammate:</p><code style="word-break:break-all">${k}</code>`; },
  async tmAcc(c){ const w = await me2(c); if (!w) return; const tok = v(c, 'tmT');
    await op(() => call('hr_x_tm_acc', { p_token: tok, p_name: w.name, p_email: w.email }, w.email), async () => { const I = g(K.ti, []), i = I.find(x => x.token === tok && x.status === 'pending'); if (!i) throw new Error('INVALID_TOKEN');
      const t = g(K.tm, []).find(x => x.id === i.team); if (!t) throw new Error('INVALID_TOKEN'); if (myTeamL(w.email)) throw new Error('ALREADY_IN_TEAM'); i.status = 'accepted'; sv(K.ti, I); addL(t, w); }); drawTm(c); },
  tmCopy(c, b){ try { navigator.clipboard.writeText(b.dataset.code); msg(c, 'Code copied.', 1); } catch(_){} },
  async tmLeave(c){ const e = me().email; await op(() => call('hr_x_tm_leave', { p_email: e }, e), async () => { const L = g(K.tm, []), t = L.find(x => x.members.some(m => m.email === e)); if (t) t.members = t.members.filter(m => m.email !== e); sv(K.tm, L); }); drawTm(c); },
  async tmDel(c){ const e = me().email; if (!confirm('Dissolve this team?')) return; await op(() => call('hr_x_tm_del', { p_email: e }, e), async () => { sv(K.tm, g(K.tm, []).filter(x => !(x.leader === e))); }); drawTm(c); }
});
/* ---- Module 6: 5-dimension jury scoring (server-enforced Judge / Admin only) ---- */
const DIM = [['innovation', 'Innovation'], ['complexity', 'Complexity'], ['fit', 'Problem fit'], ['impact', 'Impact'], ['presentation', 'Presentation']];
const drawJ = async c => {
  if (!rem()) { c.innerHTML = bar() + '<p class="hrp-muted">⚖️ Judging needs the database and a Judge / Admin login.</p>'; return; }
  let L, B; try { L = await call('hr_x_subs', {}); B = await call('hr_x_board', {}); } catch(e){ c.innerHTML = bar() + `<p class="hrp-muted">${/JUDGE_ONLY/.test(e.message) ? '⚖️ Judge or Admin login required.' : esc(errTxt(e))}</p>`; return; }
  c.innerHTML = bar() + '<div class="hk-msg" id="xM"></div>' + (B.length ? '<div class="hrp-h">🏆 Leaderboard (avg of judges, /50)</div>' + B.slice(0, 10).map(r => `<div class="hrp-card" style="margin:4px 0">#${r.rnk} <b>${esc(r.title || '—')}</b> · ${r.avg_total} <span class="hrp-muted">(${r.judges} judge${r.judges > 1 ? 's' : ''})</span></div>`).join('') : '')
    + '<div class="hrp-h">Score submissions (1–10 each)</div>' + (L.map(s => { const m = s.my || {}; return `<div class="hrp-card jc" data-sid="${esc(s.id)}" style="margin:8px 0"><b>${esc(s.title || 'Untitled')}</b> <span class="hrp-muted">${esc(s.full_name || '')} · ${esc(s.lang || '')}</span><div class="hrp-row">${DIM.map(([k, l]) => `<label class="hrp-muted">${l}<input class="hrp-in sm jin" type="number" min="1" max="10" data-k="${k}" value="${m[k] || ''}" style="width:64px"></label>`).join('')}</div><textarea class="hrp-ta jfb" maxlength="500" placeholder="Feedback (optional)" style="min-height:50px;font-family:inherit">${esc(m.feedback || '')}</textarea><button class="hrp-btn pri" data-x="jSave">${s.my ? 'Update score' : 'Save score'}</button></div>`; }).join('') || '<p class="hrp-muted">No submissions yet.</p>');
};
tab('judge', '⚖️ Judge', drawJ, {
  async jSave(c, b){ const card = b.closest('.jc'), n = [...card.querySelectorAll('.jin')].map(i => +i.value);
    if (n.length !== 5 || n.some(x => !Number.isInteger(x) || x < 1 || x > 10)) return msg(c, 'Each of the 5 scores must be a whole number from 1 to 10.');
    const sid = card.dataset.sid, fb = (card.querySelector('.jfb').value || '').slice(0, 500);
    await call('hr_x_score', { p_sub: sid, p_i: n[0], p_c: n[1], p_f: n[2], p_m: n[3], p_p: n[4], p_fb: fb });
    await drawJ(c); msg(c, 'Saved ✔ — total ' + n.reduce((a, x) => a + x, 0) + '/50', 1); }
});
/* ---- Module 4: violation log, optional score-0, DevTools detection ---- */
const zeroOn = () => !!(HB.ev && HB.ev.proctor_zero === true);
const tryDq = async (ref, email, k = 0) => { let n = 0; try { n = await call('hr_x_apply_dq', { p_ref: ref, p_email: email }, email); } catch(_){} if (!(n > 0) && k < 8) setTimeout(() => tryDq(ref, email, k + 1), 4000); };
const retryOn = () => !!(HB.ev && HB.ev.proctor_retry === true);
window.__hrRtLeft = q => Math.max(0, Math.floor(+(HB.ev && HB.ev.quiz_retry) || 0) - store.get('x:rtn:' + q.id, 0));
window.__hrRetry = async (q, email, mode) => { if (!rem()) throw new Error('Re-attempt needs the database.'); if (mode === 'gen') { try { await call('hr_x_rt_start', { p_ref: String(q.id), p_email: email }); store.set('x:rtn:' + q.id, store.get('x:rtn:' + q.id, 0) + 1); } catch(e){ throw new Error(errTxt(e)); } return; } try { HQ.retrySecs = await call('hr_x_retry_start', { p_ref: String(q.id), p_email: email }, email); store.set('x:rtUsed:' + q.id, 1); } catch(e){ throw new Error(errTxt(e)); } };
window.__hrViol = (S, why) => {
  const Q = S.kind === 'quiz' && HQ.cur ? HQ.cur.q : null, left = HQ.cur && HQ.cur.left ? HQ.cur.left() : 0;
  const email = (me().email || '').toLowerCase(), ref = S.kind === 'quiz' && HQ.cur && HQ.cur.q ? String(HQ.cur.q.id) : 'exam-centre', zero = zeroOn() && S.kind === 'quiz' && !window.__hrNoZero;
  const L = g('x:viol', []); L.unshift({ at: Date.now(), email, kind: S.kind, ref, reason: why, zero }); sv('x:viol', L.slice(0, 100));
  const V = email && rem() ? call('hr_x_violation', { p_email: email, p_kind: S.kind, p_ref: ref, p_reason: why, p_zero: zero, ...(retryOn() ? { p_left: left } : {}) }, email).catch(() => {}) : Promise.resolve();
  if (zero && HQ.cur && HQ.cur.ans) Object.keys(HQ.cur.ans).forEach(k => delete HQ.cur.ans[k]);
  const P = S.stop();
  if (zero && email && rem()) Promise.all([V, P]).then(() => tryDq(ref, email));
  if (zero && Q && retryOn() && left >= 10 && !store.get('x:rtUsed:' + Q.id, 0)) { const setRt = (k = 0) => { const d = store.get('hk:done', {}); if (d[Q.id]) { d[Q.id].rt = left; store.set('hk:done', d); try { renderQuizList(); } catch(_){} const B = document.getElementById('hkQB'); if (B && !B.querySelector('#hrRt')) { const c = document.createElement('div'); c.className = 'hrp-card'; c.id = 'hrRt'; c.innerHTML = '<b>🔁 You can re-attempt once</b><div class="hrp-muted">You will get the same time that was left: ' + fmtClock(left) + '. Your score stays 0 until you submit it.</div><div class="hrp-row"><button class="hrp-btn pri" type="button">Re-attempt now</button></div>'; c.querySelector('button').onclick = () => { HQ.rtMode = true; openQuiz(Q); }; B.appendChild(c); } } else if (k < 20) setTimeout(() => setRt(k + 1), 1500); }; setRt(); }
  return P;
};
let dtN = 0;
if (!matchMedia('(pointer:coarse)').matches) setInterval(() => {
  if (!guardOn() || !guardSession()) { dtN = 0; return; }
  dtN = (Math.abs(outerWidth - innerWidth) > 200 || Math.abs(outerHeight - innerHeight) > 350) ? dtN + 1 : 0;
  if (dtN >= 2) { dtN = 0; guardViolation('Developer tools detected'); }
}, 1000);

/* ---- Module 5: backup runner (Wandbox) when Judge0 is down, and path scrubbing ---- */
const WB = { cpp: ['C++', 'gcc'], c: ['C', 'gcc'], java: ['Java', 'openjdk'], python: ['Python', 'cpython'], javascript: ['JavaScript', 'nodejs'], go: ['Go', 'go'], rust: ['Rust', 'rust'], ruby: ['Ruby', 'ruby'], php: ['PHP', 'php'], lua: ['Lua', 'lua'], perl: ['Perl', 'perl'] };
let wbList = null;
window.__hrScrub = s => String(s || '').replace(/(?:\/home|\/tmp|\/usr|\/opt|\/var|\/Users|\/box)\/[^\s:'"()]+/g, '<path>').replace(/[A-Za-z]:\\[^\s:'"]+/g, '<path>');
window.__hrWandbox = async (lang, code, stdin) => {
  const w = WB[lang]; if (!w) return null; const tm = ms => AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
  if (!wbList) wbList = await (await fetch('https://wandbox.org/api/list.json', { signal: tm(8000) })).json();
  const cs = wbList.filter(x => x.language === w[0]), c = cs.find(x => x.name.startsWith(w[1]) && /head/.test(x.name)) || cs.find(x => x.name.startsWith(w[1])) || cs[0]; if (!c) return null;
  const r = await fetch('https://wandbox.org/api/compile.json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ compiler: c.name, code, stdin: stdin || '', save: false }), signal: tm(20000) });
  if (!r.ok) throw new Error('HTTP ' + r.status); const d = await r.json(), S = window.__hrScrub;
  let h = '<span class="pg-muted">(Main runner unavailable — ran on backup runner: ' + esc(c.name) + ')</span>';
  if (d.program_output) h += '\n<span class="stdout-line">' + esc(S(d.program_output)) + '</span>';
  if (d.compiler_error) h += '\n<span class="error-line">' + esc(S(d.compiler_error)) + '</span>';
  if (d.program_error) h += '\n<span class="error-line">' + esc(S(d.program_error)) + '</span>';
  if (!d.program_output && !d.compiler_error && !d.program_error) h += '\n<span class="pg-muted">(No output)</span>';
  return { html: h, ok: String(d.status) === '0' };
};
feat('Code runner backup: if Judge0 fails, C/C++/Java/Python/JS/Go/Rust/Ruby/PHP/Lua/Perl run on Wandbox; local paths scrubbed from errors', () => {});
feat('Proctoring: DevTools detection, violation log, optional score-0 for hackathon quizzes (admin switch)', () => {});
/* ---- Password strength rule + Privacy / Terms / Copyright / Disclaimer pages ---- */
const WEAKPW = ['12345', '123456', '1234567', '12345678', '123456789', '1234567890', 'password', 'password1', 'qwerty', 'qwerty123', '111111', '000000', 'abc123', 'iloveyou', 'admin', 'admin123', 'letmein', 'welcome', '123123'];
window.__hrWeakPw = (pw, email) => { const p = String(pw || ''); return p.length < 8 || WEAKPW.includes(p.toLowerCase()) || !/[a-z]/i.test(p) || !/\d/.test(p) || (!!email && p.toLowerCase() === String(email).toLowerCase()); };
const LG = {
  privacy: ['Privacy Policy', [
    ['What we collect', 'Name, email, phone (if you give it), college / organisation, designation, your role, team and idea details, files you upload (PPT / PDF), code and answers you submit in the Code Arena and quizzes, scores, and proctoring events during quizzes (for example switching tabs or apps).'],
    ['Camera and microphone (only when the organiser turns proctoring on)', 'With your consent, your camera can be used to check that your face is visible and that only one person is in view, and your microphone to measure sound activity. Face and sound checks happen on your device and no continuous video or audio is recorded. If the organiser also turns on snapshots, a small still photo is taken at set intervals, stored privately, visible only to admins, and deleted after the retention period shown in the consent notice. Otherwise no photos are stored. Event records (type, time, exam) are stored, visible to the organisers, and kept like other exam violation records. Camera or microphone problems are logged as technical issues, not as cheating.'],
    ['Why we collect it', 'To run registrations, hackathon rounds, quizzes and judging, show leaderboards, issue certificates, contact you about the event, keep the platform fair and secure, and fix problems.'],
    ['Who processes it', 'We use Supabase (database and login), Vercel (hosting), Formspree (form and notification emails), and Judge0 / Wandbox (the code you run in the Code Lab is sent to them to execute). Passwords are handled by our login provider and stored in hashed form; we never see them.'],
    ['Sharing', 'We do not sell your data. Your name, team and score may appear on leaderboards. Organisers and judges can view your submissions and registration details.'],
    ['Your choices', 'You can ask to access, correct or delete your data through the Contact section of this website. Some records may be kept where needed for results, certificates or security.'],
    ['Changes', 'We may update this policy; the date above shows the latest version.']]],
  terms: ['Terms of Use', [
    ['Eligibility', 'The event is for students of recognised colleges and universities in India. You must give accurate information and keep your login private.'],
    ['Fair play', 'Submit only your own work. Cheating, sharing quiz answers, using multiple accounts, or tampering with the platform can lead to disqualification. During quizzes, leaving the page, switching apps, taking screenshots, or opening developer tools may be recorded and can auto-submit your attempt or set your score to 0, when the organiser has turned this on.'],
    ['Your work', 'You keep ownership of what you build. You allow the organisers to store, evaluate, display and promote your submission for this event.'],
    ['Judging', 'Scores and results are decided by the organisers and judges. Their decision is final. Dates, rules, prizes and problem statements may change with notice on this website.'],
    ['Use of the platform', 'Do not attack, overload, scrape or misuse the site. Code you run in the Code Lab runs on third-party services; do not submit harmful or illegal code.'],
    ['Liability', 'The platform is provided as is, without guarantees. To the extent allowed by law, the organisers are not liable for losses from downtime, data loss or third-party services.'],
    ['Law', 'These terms are governed by the laws of India.']]],
  copyright: ['Copyright', [
    ['Our content', 'The Hackathon Rivals name, logo, design and original text on this website belong to Hackathon Rivals. Please do not copy or reuse them without permission.'],
    ['Your submissions', 'Projects, code and ideas submitted by participants belong to the participants, subject to the licence in the Terms of Use.'],
    ['Third parties', 'Names and logos of other organisations belong to their owners and are shown only for reference. Report a copyright concern through the Contact section and we will look into it.']]],
  disclaimer: ['Disclaimer', [
    ['General', 'Information on this website, including dates, venue, prize pool and problem statements, may change. Please check the website for the latest details.'],
    ['No endorsement', 'References to government bodies, ministries or other organisations are for context only. They do not mean endorsement, sponsorship or partnership unless clearly stated.'],
    ['Automated checks', 'Scoring, code execution and quiz proctoring use automated tools and third-party services, which can make mistakes. Organisers may review and correct results.'],
    ['External links', 'We are not responsible for the content of external websites.']]]
};
function openLegal(k){
  let m = document.getElementById('hrLegal');
  if (!m) {
    m = document.createElement('div'); m.id = 'hrLegal'; m.style.cssText = 'position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(0,0,0,.65)';
    m.innerHTML = '<div role="dialog" aria-modal="true" style="background:var(--surface,#12121a);color:var(--text,#eee);border:1px solid var(--border,#333);border-radius:14px;max-width:640px;width:100%;max-height:85vh;overflow:auto;padding:18px 18px 22px"><button id="hrLgX" aria-label="Close" style="float:right;background:none;border:1px solid var(--border,#333);color:inherit;border-radius:8px;padding:2px 9px;cursor:pointer;font-size:16px">✕</button><div id="hrLgB"></div></div>';
    document.body.appendChild(m); m.onclick = ev => { if (ev.target === m || ev.target.id === 'hrLgX') m.style.display = 'none'; };
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') m.style.display = 'none'; });
  }
  const [t, items] = LG[k];
  m.querySelector('#hrLgB').innerHTML = '<h2 style="margin:0 0 4px;font-size:20px">' + t + '</h2><p style="color:var(--muted);font-size:12px;margin:0 0 8px">Last updated: 11 October 2026</p>' + items.map(([h, p]) => '<h3 style="font-size:14px;margin:14px 0 4px">' + h + '</h3><p style="margin:0;font-size:13.5px;line-height:1.6;color:var(--muted)">' + p + '</p>').join('');
  m.style.display = 'flex';
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href="#"]'); if (!a) return; const t = a.textContent.trim().toLowerCase();
  const k = /privacy/.test(t) ? 'privacy' : /^terms/.test(t) ? 'terms' : /^copyright/.test(t) ? 'copyright' : /^disclaimer/.test(t) ? 'disclaimer' : null;
  if (k) { e.preventDefault(); e.stopPropagation(); openLegal(k); }
}, true);
/* ---- Video & voice proctoring: admin-controlled, consent first, analysed on this device, nothing recorded or uploaded ---- */
const PCFG = { master: false, mode: 'off', quiz: true, mock: true, face: true, multi: true, voice_alert: true, autosubmit: true, face_grace: 8, multi_secs: 4, voice_secs: 5, cooldown: 30, max_warnings: 3, policy: 'allow', snaps: false, snap_secs: 60, retention_days: 7 };
const pcfg = () => Object.assign({}, PCFG, (HB.ev && HB.ev.proctor_cfg) || {});
const P = { id: 0, key: '', stream: null, ac: null, v: null, timers: [], n: 0, done: false, cool: 0, seen: {} };
const pPlan = S => { const c = pcfg(); if (!c.master || c.mode === 'off' || !(S.kind === 'quiz' ? c.quiz : c.mock)) return null; return { c, video: (c.mode === 'video' || c.mode === 'both') && (c.face || c.multi || c.snaps), voice: (c.mode === 'voice' || c.mode === 'both') && c.voice_alert }; };
function pEvt(cat, reason){
  if (P.seen[reason]) return; P.seen[reason] = 1; const email = (me().email || '').toLowerCase(), ref = HQ.cur && HQ.cur.q ? String(HQ.cur.q.id) : 'exam-centre';
  const L = g('x:viol', []); L.unshift({ at: Date.now(), email, kind: 'media', ref, reason: '[' + cat + '] ' + reason }); sv('x:viol', L.slice(0, 100));
  if (email && rem()) call('hr_x_media_event', { p_email: email, p_ref: ref, p_category: cat, p_reason: reason }, email).catch(() => {});
}
function pBadge(t){ let b = document.getElementById('hrPcBadge'); if (!b) { b = document.createElement('div'); b.id = 'hrPcBadge'; b.style.cssText = 'position:fixed;left:8px;bottom:76px;z-index:99999;font-size:11px;padding:3px 8px;border-radius:8px;background:rgba(0,0,0,.7);color:#fff'; document.body.appendChild(b); } b.textContent = t; }
function pConsent(k){
  return new Promise(res => {
    const w = document.createElement('div'); w.id = 'hrPcConsent'; w.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(0,0,0,.75)';
    const what = [k.video ? 'your <b>camera</b> (to check that your face is visible and that only one person is in view)' : '', k.voice ? 'your <b>microphone</b> (to measure sound/voice activity — it cannot tell what is said)' : ''].filter(Boolean).join(' and ');
    w.innerHTML = '<div role="dialog" aria-modal="true" style="background:var(--surface,#12121a);color:var(--text,#eee);border:1px solid var(--border,#333);border-radius:14px;max-width:520px;width:100%;max-height:88vh;overflow:auto;padding:18px"><h3 style="margin:0 0 8px">🎥 Exam monitoring consent</h3><p style="font-size:13.5px;line-height:1.6;margin:6px 0">The organiser has turned on proctoring for this exam. It uses ' + what + '.</p><ul style="font-size:13px;line-height:1.6;color:var(--muted);padding-left:18px;margin:6px 0"><li><b>Why:</b> to keep the exam fair.</li>' + (k.video && k.c.snaps ? '<li><b>Stored:</b> event records (type, time, exam) and <b>a small still photo every ' + k.c.snap_secs + ' seconds</b>, kept privately for ' + k.c.retention_days + ' days and visible only to admins. <b>No continuous video or audio is recorded.</b> Face checks run on your device.</li>' : '<li><b>Stored:</b> only event records (type, time, exam). <b>No video, audio or photos are recorded or uploaded.</b> Analysis happens on your device.</li>') + '<li><b>Who sees it:</b> the organisers / admins.</li><li><b>How long:</b> as long as other exam violation records, until the organiser deletes them.</li><li><b>Warnings:</b> you get warnings first. Camera or microphone problems are logged as technical issues, not cheating.</li><li>Your browser will ask for permission next. You can decline and continue' + (k.c.policy === 'review' ? '; the organiser may review your exam.' : '; this will be logged.') + '</li></ul><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button id="hrPcNo" type="button" style="padding:8px 14px;border-radius:9px;border:1px solid var(--border,#333);background:none;color:inherit">No thanks</button><button id="hrPcYes" type="button" style="padding:8px 14px;border-radius:9px;border:0;background:var(--violet,#6c5ce7);color:#fff">I agree</button></div></div>';
    document.body.appendChild(w); const done = v => { w.remove(); res(v); }; w.querySelector('#hrPcYes').onclick = () => done(true); w.querySelector('#hrPcNo').onclick = () => done(false);
  });
}
async function pStart(S, k, key){
  P.key = key; P.n = 0; P.done = false; P.cool = 0; P.seen = {}; const my = ++P.id;
  if (!(await pConsent(k))) { if (my !== P.id) return; pEvt('technical', 'consent declined' + (k.c.policy === 'review' ? ' - flagged for admin review' : '')); toast('Monitoring declined — you can continue. This is logged.', 'info', '🎥'); return; }
  if (my !== P.id) return;
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { pEvt('technical', 'camera/microphone API unavailable'); toast('Camera/microphone is not available in this browser.', 'info', '🎥'); return; }
  const want = {}; if (k.video) want.video = { width: 320, height: 240, facingMode: 'user' }; if (k.voice) want.audio = { echoCancellation: true, noiseSuppression: true };
  try { P.stream = await navigator.mediaDevices.getUserMedia(want); } catch(e){ if (my === P.id) { pEvt('technical', 'permission denied or no device (' + (e && e.name) + ')'); toast('Camera/microphone could not be started. This is logged as a technical issue, not cheating.', 'info', '🎥'); } return; }
  if (my !== P.id) { P.stream.getTracks().forEach(t => t.stop()); P.stream = null; return; }
  P.stream.getTracks().forEach(t => t.addEventListener('ended', () => { if (my === P.id) pEvt('technical', 'device disconnected (' + t.kind + ')'); }));
  pBadge((k.video ? '🎥 ' : '') + (k.voice ? '🎤 ' : '') + 'Proctoring active' + (k.video && k.c.snaps && rem() ? ' · 📸 snapshots every ' + k.c.snap_secs + 's' : '')); if (k.video) pVideo(k, my); if (k.voice) pVoice(k, my);
}
function pVideo(k, my){
  const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.srcObject = P.stream; v.style.cssText = 'position:fixed;left:8px;bottom:8px;width:84px;height:63px;border-radius:8px;z-index:99999;object-fit:cover;transform:scaleX(-1);border:1px solid var(--border,#444)'; document.body.appendChild(v); P.v = v; v.play().catch(() => {});
  if (k.c.snaps && rem()) { const cv = document.createElement('canvas'); cv.width = 320; cv.height = 240; let bad = 0;
    P.timers.push(setInterval(async () => { if (my !== P.id || v.readyState < 2) return; try { cv.getContext('2d').drawImage(v, 0, 0, 320, 240); const img = cv.toDataURL('image/jpeg', 0.5), email = (me().email || '').toLowerCase(); if (img.length > 80000 || !email) return;
      await call('hr_x_snap_put', { p_email: email, p_ref: HQ.cur && HQ.cur.q ? String(HQ.cur.q.id) : 'exam-centre', p_img: img }, email); bad = 0; } catch(e){ if (++bad === 3) pEvt('technical', 'snapshot upload failed'); } }, Math.max(1, k.c.snap_secs) * 1000)); }
  if (!('FaceDetector' in window)) { pEvt('technical', 'face detection is not supported in this browser'); toast('Face check is not supported on this browser — you can continue.', 'info', '🎥'); return; }
  let det; try { det = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 }); } catch(e){ pEvt('technical', 'face detector failed to start'); return; }
  let none = 0, multi = 0, fails = 0;
  P.timers.push(setInterval(async () => { if (my !== P.id || v.readyState < 2) return;
    try { const n = (await det.detect(v)).length; fails = 0; none = n === 0 ? none + 1 : 0; multi = n > 1 ? multi + 1 : 0; const c = pcfg();
      if (c.face && none >= c.face_grace) { none = 0; pViolation('your face was not visible for ' + c.face_grace + ' seconds'); }
      if (c.multi && multi >= c.multi_secs) { multi = 0; pViolation('more than one face was visible'); }
    } catch(e){ if (++fails === 5) pEvt('technical', 'face detection error'); } }, 1000));
}
function pVoice(k, my){
  let ac; try { ac = new (window.AudioContext || window.webkitAudioContext)(); ac.resume && ac.resume(); } catch(e){ pEvt('technical', 'audio API unavailable'); return; }
  P.ac = ac; const an = ac.createAnalyser(); an.fftSize = 1024; ac.createMediaStreamSource(P.stream).connect(an); const buf = new Float32Array(an.fftSize); const base = []; let loud = 0, gap = 0;
  P.timers.push(setInterval(() => { if (my !== P.id) return; an.getFloatTimeDomainData(buf); let s = 0; for (const x of buf) s += x * x; const rms = Math.sqrt(s / buf.length);
    if (base.length < 15) { base.push(rms); return; }
    const th = Math.max(0.04, (base.reduce((a, b) => a + b, 0) / base.length) * 3);
    if (rms > th) { loud += 200 + gap; gap = 0; } else { gap += 200; if (gap > 800) { loud = 0; gap = 0; } }
    if (loud >= pcfg().voice_secs * 1000) { loud = 0; pViolation('sustained sound / voice activity was detected'); } }, 200));
}
function pViolation(reason){
  const c = pcfg(); if (P.done || Date.now() < P.cool) return; P.cool = Date.now() + c.cooldown * 1000; P.n++;
  pEvt('suspected', reason + ' (warning ' + P.n + '/' + c.max_warnings + ')');
  if (P.n < c.max_warnings) { toast('Warning ' + P.n + ' of ' + c.max_warnings + ': ' + reason + '. Please stay in view and keep quiet.', 'warn', '🎥'); return; }
  P.done = true;
  if (c.autosubmit) { window.__hrNoZero = true; try { guardViolation('Proctoring: warning limit reached'); } finally { setTimeout(() => { window.__hrNoZero = false; }, 4000); } }
  else toast('Warning limit reached — the organiser will review this exam.', 'warn', '🎥');
}
function pStop(){
  P.id++; P.key = ''; P.timers.forEach(clearInterval); P.timers = []; if (P.stream) P.stream.getTracks().forEach(t => t.stop()); P.stream = null;
  if (P.ac) { try { P.ac.close(); } catch(_){} P.ac = null; } if (P.v) { P.v.remove(); P.v = null; } ['hrPcBadge', 'hrPcConsent'].forEach(i => { const e = document.getElementById(i); if (e) e.remove(); });
}
addEventListener('pagehide', pStop);
setInterval(() => { const S = guardSession(), k = S && pPlan(S), key = S ? S.kind + ':' + S.t0 : '';
  if (P.key && (!S || !k || P.key !== key)) pStop();
  if (S && k && !P.key) pStart(S, k, key); }, 1000);
feat('Video / voice proctoring: admin master switch + 4 modes, consent first, on-device checks, warnings then optional auto-submit', () => {});
/* ---- "Live now" strip: shows while a quiz is open or the hackathon is live; visitors can close it ---- */
(() => {
  const left = ms => { const m = Math.max(0, Math.floor(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60); return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + (m % 60) + 'm' : (m % 60) + 'm'; };
  const css = document.createElement('style');
  css.textContent = '#hrLive{position:relative;z-index:99;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:8px 46px 8px 12px;background:linear-gradient(90deg,var(--violet,#6c5ce7),#e0457b);color:#fff;font-size:13px;font-weight:600;text-align:center}#hrLive[hidden]{display:none}#hrLive .dot{width:8px;height:8px;border-radius:50%;background:#fff;flex:none;animation:hrLv 1.4s infinite}#hrLive button.go{background:#fff;color:#222;border:0;border-radius:999px;padding:4px 12px;font-weight:700;cursor:pointer}#hrLive button.x{position:absolute;right:4px;top:50%;transform:translateY(-50%);background:none;border:0;color:#fff;font-size:20px;line-height:1;cursor:pointer;padding:8px 12px}@keyframes hrLv{50%{opacity:.25}}@media (prefers-reduced-motion:reduce){#hrLive .dot{animation:none}}';
  document.head.appendChild(css);
  const bar = document.createElement('div'); bar.id = 'hrLive'; bar.hidden = true; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Live now');
  bar.innerHTML = '<span class="dot"></span><span class="t"></span><button class="go" type="button">Join</button><button class="x" type="button" aria-label="Close">✕</button>';
  document.body.insertBefore(bar, document.body.firstChild);
  let sig = '', target = null; const SK = 'hrLiveX';
  const seen = () => { try { return sessionStorage.getItem(SK); } catch(_){ return null; } };
  bar.querySelector('.x').onclick = () => { bar.hidden = true; try { sessionStorage.setItem(SK, sig); } catch(_){} };
  bar.querySelector('.go').onclick = () => { const e = target && document.querySelector(target); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const tick = () => {
    const items = [], s = []; let t = null;
    try { if (!/^#\/app/.test(location.hash) && !guardSession()) {
      const open = (HQ.list || []).filter(q => quizState(q) === 'open');
      if (open.length) { s.push('q:' + open.map(q => q.id).join(',')); items.push(open.length === 1 ? 'Quiz live: “' + open[0].title + '”' + (open[0].closes_at ? ' · closes in ' + left(Date.parse(open[0].closes_at) - nowMs()) : '') : open.length + ' quizzes are live now'); t = '#hkQuizBox'; }
      if (HB.ev && evState().phase === 'live') { s.push('h'); items.push((HB.ev.name || 'The hackathon') + ' is LIVE'); t = t || '#hackathon'; }
    } } catch(_){}
    sig = s.join('|'); target = t;
    if (!items.length || seen() === sig) { bar.hidden = true; return; }
    bar.querySelector('.t').textContent = items.join(' · '); bar.hidden = false;
  };
  tick(); setInterval(tick, 5000); window.addEventListener('hashchange', tick);
})();
feat('Live-now strip at the top while a quiz or the hackathon is live, with a Close button', () => {});
/* ---- New look: featured event card under the hero (name + dates come from the live event settings) ---- */
(() => {
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dates = e => { try { const a = new Date(e.starts_at), b = new Date(e.ends_at || e.starts_at); if (isNaN(a)) return ''; return a.getMonth() === b.getMonth() ? mo[a.getMonth()] + ' ' + a.getDate() + (b.getDate() !== a.getDate() ? '–' + b.getDate() : '') : mo[a.getMonth()] + ' ' + a.getDate() + ' – ' + mo[b.getMonth()] + ' ' + b.getDate(); } catch(_){ return ''; } };
  const draw = () => { try { const hero = document.querySelector('.hero'); if (!hero) return; let w = document.getElementById('rvFeat'); if (!w) { w = document.createElement('div'); w.id = 'rvFeat'; w.className = 'rv-featwrap'; hero.insertAdjacentElement('afterend', w); }
    const e = HB.ev || {}; if (!e.name) { w.hidden = true; return; } w.hidden = false;
    w.innerHTML = '<a class="rv-feat" href="#register"><i>🏆</i><div>' + esc(e.name) + '<span>' + esc(dates(e) ? 'Dates: ' + dates(e) : 'Dates to be announced') + '</span></div><b>→</b></a>'; } catch(_){} };
  setTimeout(draw, 0); setInterval(draw, 30000);
})();
feat('Strong-password rule on signup / change password, weak-password warning at login', () => {});
feat('Privacy Policy, Terms of Use, Copyright and Disclaimer pages (footer + signup links)', () => {});
feat('5-dimension jury scoring: 5 criteria x 1-10, judge/admin only, averaged leaderboard', () => {});
feat('Team collaboration: 8-char join codes, leader role, invite tokens, one team per person (shared via Supabase)', () => {});
feat('Events & digital tickets: atomic seat capacity, duplicate block, TKT codes, .ics file (shared via Supabase)', () => {});
feat('College co-hosting portal: proposals, official-email check, admin approve / reject (shared via Supabase)', () => {});
})();

const ORDER = ['home', 'exam', 'team', 'events', 'college', 'judge', 'cards', 'calc', 'forms', 'study', 'drills', 'tools', 'cheats', 'plan', 'lists', 'badges', 'share', 'settings', 'help'];
TABS.sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]));
feat('Command palette: exam shortcuts', () => {
  const cm = window.__hrpCmds; if (!cm) return; const at = (id, sub) => () => { if (sub) store.set(sub[0], sub[1]); openHub(id); };
  cm.push(['🎓 Open Exam Centre', '', at('exam')], ['⏱ Start a mock test', '', () => { EXS.view = 'setup'; EXS.cfg.mode = 'mock'; openHub('exam'); }], ['📅 Daily challenge', '', () => { openHub('exam'); setTimeout(() => EXACT.daily(), 60); }],
    ['🃏 Flashcards', '', at('cards')], ['🧮 Calculators', '', at('calc')], ['📐 Formula sheets', '', at('forms')], ['🎯 Study planner', '', at('study')], ['⌨️ Typing & mental-math drills', '', at('drills')], ['🧮 Scientific calculator', '', at('calc', ['calcSel', 'Scientific calculator'])], ['🧾 Mistake bank', '', () => { openHub('exam'); setTimeout(() => EXACT.mistakes(), 60); }]);
});
feat('Distraction-free focus mode (hides banners & floating buttons)', () => {});
feat('Fullscreen toggle', () => {});
feat('Exam readiness score on the Exam home', () => {});
window.HRPlus_exam = { questions: QB.length, decks: Object.keys(DECKS).length, cards: Object.values(DECKS).reduce((a, d) => a + d.length, 0) };

/* ============ BROWSE MODES (semester / subject / level) ============ */
const LV = ['All levels', 'Easy', 'Medium', 'Hard'];
EXS.bm = { mode: 'sem', sem: 1, run: 'practice', n: 10, lsem: -1 };
const semName = s => s === 0 ? 'General & placement' : 'Semester ' + s;
const qcount = f => QB.reduce((a, q) => a + (f(q) ? 1 : 0), 0);
const semsList = () => [...new Set(QB.map(q => q.sem))].sort((a, b) => a - b);
function lvlButtons(subj, sem){
  return [1, 2, 3, 0].map(d => { const n = qcount(q => (subj === 'all' || q.s === subj) && (!d || q.d === d) && (sem < 0 || q.sem === sem));
    return `<button type="button" class="hrp-mini" data-act="bgo" data-s="${esc(subj)}" data-d="${d}" data-sem="${sem}" ${n ? '' : 'disabled style="opacity:.4"'}>${d ? LV[d] : 'Mixed'} · ${n}</button>`; }).join(' ');
}
function subjRow(k){
  const n = qcount(q => q.s === k); if (!n) return '';
  const sm = (QB.find(q => q.s === k) || {}).sem;
  return `<div class="hrp-card" style="margin:8px 0"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(SUBJ[k] || k)}</b><span class="hrp-muted">${semName(sm)} · ${n} Qs</span></div><div class="hrp-row" style="margin:8px 0 0">${lvlButtons(k, -1)}</div></div>`;
}
VIEWS.browse = function(){
  const B = EXS.bm, sems = semsList();
  if (B.mode === 'sem' && !sems.includes(B.sem)) B.sem = sems[0];
  const head = `<div class="hrp-row"><button class="hrp-tab" data-act="view" data-v="home">← Back</button><b>Browse questions</b></div>
  <div class="hrp-row">${[['sem', '📚 Semester-wise'], ['sub', '🧩 Subject-wise'], ['lvl', '📈 Level-wise']].map(([m, l]) => `<button class="hrp-tab${B.mode === m ? ' active' : ''}" data-act="bmode" data-m="${m}">${l}</button>`).join('')}</div>
  <div class="hrp-row"><button class="hrp-tab${B.run === 'practice' ? ' active' : ''}" data-act="brun" data-r="practice">📖 Practice</button><button class="hrp-tab${B.run === 'mock' ? ' active' : ''}" data-act="brun" data-r="mock">⏱ Mock (timed)</button>
  <select class="hrp-sel" data-bn="1" style="max-width:130px" aria-label="Number of questions">${[5, 10, 15, 20, 30].map(n => `<option value="${n}"${B.n === n ? ' selected' : ''}>${n} questions</option>`).join('')}</select></div>`;
  let body = '';
  if (B.mode === 'sem') {
    body = `<div class="hrp-row">${sems.map(s => `<button class="hrp-tab${B.sem === s ? ' active' : ''}" data-act="bsem" data-sem="${s}">${s === 0 ? 'General' : 'Sem ' + s}</button>`).join('')}</div>
    <div class="hrp-card"><b>${semName(B.sem)} — all subjects</b><span class="hrp-muted">${qcount(q => q.sem === B.sem)} questions</span><div class="hrp-row" style="margin:8px 0 0">${lvlButtons('all', B.sem)}</div></div>
    ${Object.keys(SUBJ).filter(k => QB.some(q => q.s === k && q.sem === B.sem)).map(subjRow).join('')}`;
  } else if (B.mode === 'sub') {
    body = Object.keys(SUBJ).sort((a, b) => ((QB.find(q => q.s === a) || { sem: 99 }).sem - (QB.find(q => q.s === b) || { sem: 99 }).sem) || SUBJ[a].localeCompare(SUBJ[b])).map(subjRow).join('');
  } else {
    body = `<label class="hrp-muted">Limit to a semester (optional)</label><select class="hrp-sel" data-lsem="1"><option value="-1"${B.lsem < 0 ? ' selected' : ''}>All semesters</option>${sems.map(s => `<option value="${s}"${B.lsem === s ? ' selected' : ''}>${semName(s)}</option>`).join('')}</select>
    <div class="hrp-grid" style="margin-top:10px">${[1, 2, 3].map(d => { const n = qcount(q => q.d === d && (B.lsem < 0 || q.sem === B.lsem)); return `<div class="hrp-card"><b>${['', '🟢 Easy', '🟡 Medium', '🔴 Hard'][d]}</b>${n} questions<div class="hrp-row" style="margin:8px 0 0"><button class="hrp-btn pri" data-act="bgo" data-s="all" data-d="${d}" data-sem="${B.lsem}" ${n ? '' : 'disabled'}>Start</button></div></div>`; }).join('')}</div>`;
  }
  return head + body;
};
Object.assign(EXACT, {
  browse(){ EXS.view = 'browse'; exDraw(); },
  bmode(b){ EXS.bm.mode = b.dataset.m; exDraw(); },
  brun(b){ EXS.bm.run = b.dataset.r; exDraw(); },
  bsem(b){ EXS.bm.sem = +b.dataset.sem; exDraw(); },
  bgo(b){ const B = EXS.bm; startTest({ mode: B.run, subj: b.dataset.s, diff: +b.dataset.d, n: B.n, mins: Math.max(1, Math.round(B.n * 1.5)), neg: true, shuf: true, lvl: 0, sem: +b.dataset.sem }); }
});
['Semester-wise mode (Sem 1 → 7 + general)', 'Subject-wise mode', 'Level-wise mode (easy / medium / hard)', 'Per-subject level buttons with live question counts', 'Practice or timed mock from any browse screen', 'Semester filter in the test setup'].forEach(n => feat('Browse: ' + n, () => {}));

/* ============ HACKATHON: backend, countdown, registration ============ */
const HK_URL = 'https://awvcorswnzbxsrrzepto.supabase.co', HK_KEY = 'sb_publishable_6GqdbyBWEX7cIkTzcp9yvw_WYNp5GJh', HK_FORM = 'https://formspree.io/f/mppwlbwq';
const HK_DEFAULT = { id: 'main', name: 'Hackathon Rivals — Live Hackathon', starts_at: '2026-10-01T18:00:00+05:30', reg_closes_at: '2026-10-01T18:00:00+05:30', ends_at: null, reg_open: true, lock_main: true, proctor: true, message: 'Team up, pick a problem and build something great. Register before the countdown hits zero.' };
const HB = { remote: false, checked: false, off: 0, tsrc: 'device clock', ev: { ...HK_DEFAULT }, lastReg: null, lastPhase: null, rt: 0 };
function sbToken(){ try { const ref = new URL(HK_URL).hostname.split('.')[0]; const j = JSON.parse(localStorage.getItem('hr-auth-awvcorsw') || localStorage.getItem('sb-' + ref + '-auth-token') || 'null'); return j && (j.access_token || (j.currentSession && j.currentSession.access_token)) || null; } catch(e){ return null; } }
async function pgrest(path, o = {}){
  const tok = sbToken(); const h = { apikey: HK_KEY, 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}), ...(o.headers || {}) };
  const r = await fetch(HK_URL + '/rest/v1/' + path, { method: o.method || 'GET', headers: h, body: o.body !== undefined ? JSON.stringify(o.body) : undefined });
  const t = await r.text(); let d = null; try { d = t ? JSON.parse(t) : null; } catch(e){ d = t; }
  if (!r.ok) { const e = new Error((d && (d.message || d.hint || d.details)) || 'HTTP ' + r.status); e.status = r.status; e.code = d && d.code; throw e; }
  return d;
}
const UPSERT = { Prefer: 'resolution=merge-duplicates,return=minimal' };
async function syncTime(){
  try { const t0 = Date.now(); const r = await pgrest('rpc/hr_now', { method: 'POST', body: {} }); const t1 = Date.now(); const s = new Date(r).getTime(); if (isFinite(s)) { HB.off = s - (t0 + t1) / 2; HB.tsrc = 'database clock'; return; } } catch(e){}
  try { const t0 = Date.now(); const r = await fetch(location.href.split('#')[0], { method: 'HEAD', cache: 'no-store' }); const d = r.headers.get('date'); const t1 = Date.now(); if (d) { HB.off = new Date(d).getTime() - (t0 + t1) / 2; HB.tsrc = 'web-server clock'; return; } } catch(e){}
  HB.off = 0; HB.tsrc = 'device clock';
}
const nowMs = () => Date.now() + HB.off;
async function loadEvent(){
  const ev = { ...HK_DEFAULT };
  try { const rows = await pgrest('hr_events?id=eq.main&select=*'); HB.remote = true; if (rows && rows[0]) Object.keys(rows[0]).forEach(k => { if (rows[0][k] !== null || k === 'ends_at') ev[k] = rows[0][k]; }); }
  catch(e){ HB.remote = false; const l = store.get('hk:ev', null); if (l) Object.assign(ev, l); }
  HB.ev = ev; HB.checked = true; return ev;
}
async function saveEvent(ev){
  const row = { id: 'main', name: ev.name, starts_at: ev.starts_at, reg_closes_at: ev.reg_closes_at, ends_at: ev.ends_at || null, reg_open: !!ev.reg_open, lock_main: !!ev.lock_main, message: ev.message || '', updated_at: new Date().toISOString() };
  row.proctor = ev.proctor !== false; row.proctor_zero = ev.proctor_zero === true; row.proctor_retry = ev.proctor_retry === true; row.quiz_retry = Math.max(0, Math.min(5, Math.floor(+ev.quiz_retry || 0)));
  if (HB.remote) { try { await pgrest('hr_events?on_conflict=id', { method: 'POST', headers: UPSERT, body: [row] }); } catch(e){ if (/proctor|quiz_retry/i.test(e.message || '')) { const r2 = { ...row }; delete r2.proctor; delete r2.proctor_zero; delete r2.proctor_retry; delete r2.quiz_retry; await pgrest('hr_events?on_conflict=id', { method: 'POST', headers: UPSERT, body: [r2] }); throw new Error('Saved, but the exam-guard switch needs the updated SQL: run Admin → Setup SQL once (adds the "proctor" column).'); } throw e; } } else store.set('hk:ev', row);
  HB.ev = { ...HB.ev, ...row };
}
/* hooks so the Site Content "Event dates" card drives this live countdown too */
window.__hrSetHackTimes = async function(p){
  await saveEvent({ ...HB.ev, ...p });
  try { renderHackathon(); applyMainLock(); updateOldBox(); } catch(e){}
};
window.__hrGetHackTimes = function(){
  try {
    const e = HB.ev, f = ms => new Date(ms + 19800000).toISOString(), s = Date.parse(e.starts_at), c = Date.parse(e.reg_closes_at), en = e.ends_at ? Date.parse(e.ends_at) : 0;
    return { start: f(s).slice(0,10), time: f(s).slice(11,16), end: en ? f(en).slice(0,10) : '', deadline: (c && c !== s) ? f(c).slice(0,10) : '' };
  } catch(e){ return null; }
};
function evState(){
  const e = HB.ev, n = nowMs(), s = Date.parse(e.starts_at), c = Date.parse(e.reg_closes_at), en = e.ends_at ? Date.parse(e.ends_at) : 0;
  const regOpen = e.reg_open !== false && n < c; const phase = en && n >= en ? 'ended' : n >= s ? 'live' : 'upcoming'; return { n, s, c, en, regOpen, phase };
}
const fmtIST = ms => new Date(ms).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) + ' IST';
const hkEl = id => document.getElementById(id);

/* ---- retarget the site's existing countdown to this hackathon ---- */
const OLDCD = {};
feat('Existing countdown box now counts down to the live hackathon', () => {
  [['d', 'cd-days'], ['h', 'cd-hours'], ['m', 'cd-mins'], ['s', 'cd-secs']].forEach(([k, id]) => { const e = document.getElementById(id); if (e) { OLDCD[k] = e; e.id = id + '-hk'; } });
});
function cdWrite(units, left){
  const d = Math.floor(left / 864e5), h = Math.floor(left % 864e5 / 36e5), m = Math.floor(left % 36e5 / 6e4), s = Math.floor(left % 6e4 / 1e3);
  const v = { d: pad(d), h: pad(h), m: pad(m), s: pad(s) }; Object.keys(v).forEach(k => { if (units[k] && units[k].textContent !== v[k]) units[k].textContent = v[k]; });
}
window.__hrpHackPill = () => { const st = evState(); const e = HB.ev; if (st.phase === 'ended') return null;
  if (st.phase === 'live') return '🔴 ' + e.name + ' is LIVE'; const l = Math.max(0, st.s - st.n); const d = Math.floor(l / 864e5), h = Math.floor(l % 864e5 / 36e5), m = Math.floor(l % 36e5 / 6e4), s = Math.floor(l % 6e4 / 1e3);
  return `⏳ ${d ? d + 'd ' : ''}${pad(h)}h ${pad(m)}m ${pad(s)}s to hackathon` + (st.regOpen ? ' · register' : ' · registration closed'); };

/* ---- hackathon section on the page ---- */
function myReg(){ return store.get('hk:mine', null); }
function hkSectionHTML(){
  const st = evState(), e = HB.ev, mine = myReg();
  const status = st.phase === 'live' ? '<span class="hk-pill live">🔴 LIVE NOW</span>' : st.phase === 'ended' ? '<span class="hk-pill">Ended</span>' : '<span class="hk-pill">⏳ Starts soon</span>';
  const reg = st.regOpen ? '<span class="hk-pill ok">🟢 Registration open</span>' : '<span class="hk-pill bad">🔒 Registration closed</span>';
  const times = `Starts <b>${fmtIST(st.s)}</b>${st.c !== st.s ? ` · Registration closes <b>${fmtIST(st.c)}</b>` : ' · Registration closes when the countdown ends'}`;
  let body;
  if (mine && mine.event === (e.starts_at)) body = `<div class="hk-card ok"><h3>✅ You are registered</h3><p>Team <b>${esc(mine.team_name)}</b> (${esc(mine.email)}) is registered${mine.via === 'formspree' ? ' — the organisers received your details by email' : ''}. Keep an eye on your email for the joining details.</p></div>`;
  else if (st.regOpen) body = `<form class="hk-form" id="hkForm" novalidate><h3>Register your team</h3><div class="hk-grid">
    <label>Team name *<input name="team_name" maxlength="60" required autocomplete="organization"></label>
    <label>Team leader name *<input name="leader_name" maxlength="80" required autocomplete="name"></label>
    <label>Email *<input name="email" type="email" maxlength="120" required autocomplete="email" inputmode="email"></label>
    <label>Phone / WhatsApp *<input name="phone" type="tel" maxlength="16" required autocomplete="tel" inputmode="tel"></label>
    <label>College / organisation *<input name="college" maxlength="120" required autocomplete="organization"></label>
    <label>Team size *<select name="team_size">${[1, 2, 3, 4, 5, 6].map(n => `<option${n === 4 ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="wide">Other team members (names, one per line)<textarea name="members" rows="3" maxlength="600"></textarea></label>
    <label class="wide">Preferred track / problem statement (optional)<input name="track" maxlength="120"></label>
    <label class="wide">Anything else we should know? (optional)<textarea name="notes" rows="2" maxlength="400"></textarea></label></div>
    <div class="hk-msg" id="hkMsg" role="alert"></div><button class="btn btn-primary btn-lg" id="hkSubmit" type="submit">Register team →</button>
    <p class="hk-note">Registration closes automatically at the deadline — nobody can submit after the timer ends. Time is checked against ${esc(HB.tsrc)}.</p></form>`;
  else body = `<div class="hk-card bad"><h3>🔒 Registration is closed</h3><p>The registration window ended on <b>${fmtIST(st.c)}</b>. Thank you for your interest — follow our channels for the next event.</p></div>`;
  return `<div class="wrap"><div class="hk-box"><div class="hk-top"><div><div class="eyebrow">Live hackathon</div><h2>${esc(e.name)}</h2><p class="hk-sub">${esc(e.message || '')}</p><p class="hk-times">${times}</p><div class="hk-pills">${status}${reg}</div></div>
  <div class="hk-timer" aria-live="off"><div><b id="hkD">00</b><i>Days</i></div><div><b id="hkH">00</b><i>Hours</i></div><div><b id="hkM">00</b><i>Min</i></div><div><b id="hkS">00</b><i>Sec</i></div></div></div>
  ${body}<div class="hk-admin" id="hkAdminBtn" style="display:none"><button class="hrp-btn" data-hk="manage" type="button">🛡️ Manage hackathon (admin)</button></div></div></div>`;
}
function renderHackathon(){
  let sec = hkEl('hackathon'); const anchor = document.querySelector('.countdown-sec');
  if (!sec) { sec = el('section', { class: 'sec hk-sec', id: 'hackathon' }); (anchor || document.querySelector('main') || document.body).insertAdjacentElement(anchor ? 'afterend' : 'afterbegin', sec); }
  sec.innerHTML = hkSectionHTML(); bindHackathon(sec); renderQuizList(); tickHack();
}
function bindHackathon(sec){
  const f = $('#hkForm', sec);
  if (f) f.addEventListener('submit', async ev => {
    ev.preventDefault(); const msg = $('#hkMsg', sec), btn = $('#hkSubmit', sec); const fd = Object.fromEntries(new FormData(f).entries());
    Object.keys(fd).forEach(k => fd[k] = String(fd[k]).trim().replace(/\s{3,}/g, '  '));
    const bad = m => { msg.textContent = m; msg.className = 'hk-msg err'; };
    if (!fd.team_name || !fd.leader_name || !fd.email || !fd.phone || !fd.college) return bad('Please fill every required field (*).');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(fd.email)) return bad('Please enter a valid email address.');
    if (!/^\+?[\d\s-]{10,16}$/.test(fd.phone)) return bad('Enter a valid phone number (10–15 digits).');
    fd.team_size = Math.min(6, Math.max(1, parseInt(fd.team_size, 10) || 1)); fd.email = fd.email.toLowerCase();
    btn.disabled = true; btn.textContent = 'Checking time…'; msg.textContent = ''; msg.className = 'hk-msg';
    await syncTime(); if (!evState().regOpen) { renderHackathon(); applyMainLock(); return; }
    btn.textContent = 'Submitting…';
    try { const via = await submitReg(fd); store.set('hk:mine', { event: HB.ev.starts_at, team_name: fd.team_name, email: fd.email, via }); confetti(90); toast('Team registered! 🎉', 'success', '✅'); renderHackathon(); }
    catch(err){ btn.disabled = false; btn.textContent = 'Register team →'; if (/closed/i.test(err.message)) { await loadEvent(); renderHackathon(); applyMainLock(); } else bad(err.message || 'Something went wrong — please try again.'); }
  });
  const ab = $('[data-hk=manage]', sec); if (ab) ab.addEventListener('click', () => { store.set('adminSub', 'hack'); openHub('admin'); });
}
async function submitReg(p){
  if (!evState().regOpen) throw new Error('Registration is closed');
  if (HB.remote) {
    try { await pgrest('rpc/hr_register', { method: 'POST', body: { p } }); return 'database'; }
    catch(e){ if (/REGISTRATION_CLOSED/.test(e.message)) throw new Error('Registration is closed'); if (/duplicate|already|unique/i.test(e.message)) throw new Error('This email is already registered for this hackathon.'); if (e.status !== 404) throw new Error(e.message || 'Could not submit — please try again.'); }
  }
  const r = await fetch(HK_FORM, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ _subject: 'Hackathon registration: ' + p.team_name, event: HB.ev.name, ...p }) });
  if (!r.ok) throw new Error('Could not submit — please try again.'); return 'formspree';
}

/* ---- lock the site's own registration form when time is up ---- */
function applyMainLock(){
  const st = evState(), lock = HB.ev.lock_main !== false && !st.regOpen; const reg = hkEl('register'); if (!reg) return;
  reg.classList.toggle('hk-locked', lock);
  let card = $('.hk-closed', reg); const wrap = $('#rhTeamBody', reg) || $('.wrap', reg);
  if (lock && !card && wrap) { card = el('div', { class: 'hk-closed hk-card bad' }, `<h3>🔒 Registration is closed</h3><p>The registration deadline (${fmtIST(st.c)}) has passed, so new registrations can no longer be submitted.</p>`); wrap.prepend(card); }
  if (!lock && card) card.remove();
  syncRegButtons(); updateRegHub();
}
document.addEventListener('click', e => { if (evState().regOpen || HB.ev.lock_main === false) return; if (e.target.closest('#nextBtn, #regShell')) { e.stopImmediatePropagation(); e.preventDefault(); toast('Registration is closed', 'warn', '🔒'); } }, true);
feat('Registration form locks automatically when the countdown ends', () => {});
feat('Server-time check (database or web-server clock) so changing the device clock does not re-open registration', () => {});

/* ---- the 1-second ticker ---- */
function tickHack(){
  if (!HB.checked) return;
  const st = evState(); const target = st.phase === 'upcoming' ? st.s : (st.phase === 'live' && st.en ? st.en : 0), left = Math.max(0, target - st.n);
  cdWrite({ d: hkEl('hkD'), h: hkEl('hkH'), m: hkEl('hkM'), s: hkEl('hkS') }, left); cdWrite(OLDCD, left);
  if (st.regOpen !== HB.lastReg || st.phase !== HB.lastPhase) { const first = HB.lastReg === null; HB.lastReg = st.regOpen; HB.lastPhase = st.phase; if (!first) renderHackathon(); applyMainLock(); updateOldBox(); if (!first && !st.regOpen) toast('Registration is now closed', 'warn', '🔒'); }
}
function updateOldBox(){
  const st = evState(), e = HB.ev, box = document.querySelector('.countdown-info'); if (!box) return;
  const eb = $('.eyebrow', box), h2 = $('h2', box), p = $('p', box), a = $('a.btn', box);
  if (eb) eb.textContent = st.phase === 'live' ? '🔴 Live now' : 'Hackathon countdown';
  if (h2) h2.textContent = e.name; if (p) p.textContent = st.regOpen ? `Starts ${fmtIST(st.s)}. Registration is open until the timer hits zero.` : `Starts ${fmtIST(st.s)}. Registration is closed.`;
  if (a) { a.setAttribute('href', '#hackathon'); if (a.dataset.hkT === undefined) a.dataset.hkT = 'Register now →'; a.textContent = st.regOpen ? 'Register now →' : '🔒 Registration closed'; a.classList.toggle('hk-off', !st.regOpen); }
}
feat('Hackathon section with live countdown, status pills and registration form', () => {});
feat('"Hackathon" link added to the top navigation', () => {
  const nav = hkEl('navLinks'); if (nav && !$('a[href="#hackathon"]', nav)) { const a = el('a', { href: '#hackathon' }, '🚀 Hackathon'); nav.insertBefore(a, nav.children[1] || null); }
});

/* ---- quizzes (participant side) ---- */
const HQ = { list: [], cur: null, papers: {}, sig: '' };
const HK_BUCKET = 'hr-quiz-files', PDF_MAX = 5 * 1024 * 1024;
async function pdfCheck(f){
  if (!f) return 'Choose a PDF file first.';
  if (!(f.type === 'application/pdf' || /\.pdf$/i.test(f.name))) return 'Only PDF files are allowed.';
  if (f.size === 0) return 'This file is empty.';
  if (f.size > PDF_MAX) return 'File is too large — maximum is 5 MB (yours is ' + (f.size / 1048576).toFixed(1) + ' MB).';
  try { if ((await f.slice(0, 5).text()) !== '%PDF-') return 'This does not look like a valid PDF file.'; } catch(e){}
  return '';
}
async function uploadPdf(path, file){
  if (!HB.remote) throw new Error('PDF upload needs the database setup (Admin → Setup).');
  const tok = sbToken(); const url = HK_URL + '/storage/v1/object/' + HK_BUCKET + '/' + path.split('/').map(encodeURIComponent).join('/');
  const r = await fetch(url, { method: 'POST', headers: { apikey: HK_KEY, ...(tok ? { Authorization: 'Bearer ' + tok } : {}), 'Content-Type': 'application/pdf', 'cache-control': '3600' }, body: file });
  if (!r.ok) { let m = ''; try { const j = await r.json(); m = j.message || j.error || ''; } catch(e){} if (/bucket not found/i.test(m)) m = 'PDF upload is not set up yet — the organiser must run the updated SQL (Admin → Setup).'; else if (/size|exceed|too large/i.test(m)) m = 'File is too large — maximum is 5 MB.'; else if (/mime|type/i.test(m)) m = 'Only PDF files are allowed.'; else if (r.status === 401 || r.status === 403 || /row-level|policy|unauthor/i.test(m)) m = 'Upload is not permitted yet — the organiser must run the updated SQL (Admin → Setup).'; throw new Error(m || 'Upload failed (HTTP ' + r.status + ').'); }
  return { path, name: file.name.slice(0, 150), size: file.size };
}
async function removeObject(path){ try { const tok = sbToken(); await fetch(HK_URL + '/storage/v1/object/' + HK_BUCKET + '/' + String(path).split('/').map(encodeURIComponent).join('/'), { method: 'DELETE', headers: { apikey: HK_KEY, ...(tok ? { Authorization: 'Bearer ' + tok } : {}) } }); } catch(e){} }
async function fetchQuizzesBase(){
  if (HB.remote) { try { HQ.list = await pgrest('hr_quizzes?published=eq.true&select=*&order=created_at.desc'); return; } catch(e){} }
  HQ.list = store.get('hk:lq', []).filter(q => q.published);
}
function quizState(q){ const n = nowMs(), o = q.opens_at ? Date.parse(q.opens_at) : 0, c = q.closes_at ? Date.parse(q.closes_at) : 0; return n < o ? 'upcoming' : (c && n >= c) ? 'closed' : 'open'; }
const needReg = q => !!q.reg_closes_at;
const regState = q => { const n = nowMs(), o = q.reg_opens_at ? Date.parse(q.reg_opens_at) : 0, c = Date.parse(q.reg_closes_at); return n < o ? 'upcoming' : n >= c ? 'closed' : 'open'; };
const isReg = q => !!store.get('hk:regq', {})[q.id];
function regLine(q){ if (!needReg(q)) return ''; const s = regState(q); return `<p class="hrp-muted">📝 Registration: ${q.reg_opens_at ? 'opens ' + fmtIST(Date.parse(q.reg_opens_at)) + ' · ' : ''}closes ${fmtIST(Date.parse(q.reg_closes_at))} · ${s === 'open' ? '🟢 Open' : s === 'upcoming' ? '⏳ Not open yet' : '🔒 Closed'}${isReg(q) ? ' · ✅ You are registered' : ''}</p><p class="hrp-muted">🕒 Exam: ${q.opens_at ? fmtIST(Date.parse(q.opens_at)) : '—'}${q.closes_at ? ' to ' + fmtIST(Date.parse(q.closes_at)) : ''}</p>`; }
function regBtn(q){ if (!needReg(q)) return ''; const s = regState(q); return `<button class="hrp-btn pri" data-q="${esc(q.id)}" data-a="reg" ${s !== 'open' || isReg(q) ? 'disabled' : ''}>${isReg(q) ? 'Registered ✔' : 'Register'}</button>`; }
function openQuizReg(q){
  const m = qzModal(), B = $('#hkQB', m); $('#hkQT', m).textContent = 'Register — ' + q.title; m.classList.add('open'); const me = store.get('hk:me', { name: '', email: '' });
  B.innerHTML = `<p class="hrp-muted">Registration closes ${fmtIST(Date.parse(q.reg_closes_at))}. Use the same email when you take the exam.</p><input class="hrp-in" id="rgN" placeholder="Full name" value="${esc(me.name)}" maxlength="80" style="margin-bottom:8px"><input class="hrp-in" id="rgE" type="email" placeholder="Email" value="${esc(me.email)}" maxlength="120" style="margin-bottom:8px"><input class="hrp-in" id="rgP" type="tel" placeholder="Phone" maxlength="16" style="margin-bottom:8px"><input class="hrp-in" id="rgC" placeholder="College" maxlength="120"><div class="hk-msg" id="rgM"></div><div class="hrp-row"><button class="hrp-btn pri" data-a="rg">Register</button><button class="hrp-btn" data-a="close">Cancel</button></div>`;
  m.onclick = async e => { const a = e.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'close') { m.classList.remove('open'); return; } if (a.dataset.a !== 'rg') return;
    const g = id => $(id, m).value.trim(), name = g('#rgN'), email = g('#rgE').toLowerCase(), phone = g('#rgP'), college = g('#rgC'), msg = $('#rgM', m);
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) || phone.length < 8 || !college) { msg.textContent = 'Fill name, a valid email, phone and college.'; msg.className = 'hk-msg err'; return; }
    try { await syncTime(); if (regState(q) !== 'open') throw new Error('Registration is not open.');
      if (HB.remote) await pgrest('rpc/hr_quiz_register', { method: 'POST', body: { p_quiz: q.id, p_name: name, p_email: email, p_phone: phone, p_college: college } });
      const r = store.get('hk:regq', {}); r[q.id] = email; store.set('hk:regq', r); store.set('hk:me', { name, email }); msg.textContent = 'Registered ✔'; msg.className = 'hk-msg ok'; renderQuizList(); setTimeout(() => m.classList.remove('open'), 900); }
    catch(err){ msg.textContent = /CLOSED/.test(err.message) ? 'Registration is closed.' : err.message; msg.className = 'hk-msg err'; } };
}
async function fetchQuizzes(){
  await fetchQuizzesBase(); HQ.papers = {};
  if (HB.remote && HQ.list.length) { try { const rows = await pgrest('rpc/hr_papers_present', { method: 'POST', body: {} }); (rows || []).forEach(r => { HQ.papers[r.quiz_id] = { present: true }; }); } catch(e){} }
}
const paperUrl = p => HK_URL + '/storage/v1/object/public/' + HK_BUCKET + '/' + String(p).split('/').map(encodeURIComponent).join('/');
const fmtSize = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
function paperLine(q){ if (!(HQ.papers || {})[q.id]) return ''; return '<p class="hrp-muted">📄 The question paper opens inside the exam, after you register, verify your email and the quiz starts.</p>'; }
/* the real link is fetched from the server only inside the running exam */
async function loadPaper(q, email){
  const el = document.getElementById('hqPaper'); if (!el || !(HQ.papers || {})[q.id]) return;
  const retry = txt => { el.innerHTML = txt + ' <button class="hrp-mini" id="hqPR" type="button">Retry</button>'; const b = el.querySelector('#hqPR'); if (b) b.onclick = () => { el.textContent = '📄 Loading question paper…'; loadPaper(q, email); }; };
  try {
    const rows = await pgrest('rpc/hr_quiz_paper', { method: 'POST', headers: vtHdr(email), body: { p_quiz: q.id, p_email: email } });
    const f = rows && rows[0];
    if (!f) return retry('📄 The question paper is not available yet.');
    el.innerHTML = '📄 <a href="' + esc(paperUrl(f.file_path)) + '" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">Question paper — ' + esc(f.file_name || 'PDF') + (f.file_size ? ' (' + fmtSize(f.file_size) + ')' : '') + '</a>';
  } catch(e){ retry('📄 Could not load the question paper.'); }
}
function quizSig(){ const done = store.get('hk:done', {}); return (HQ.list || []).map(q => [q.id, quizState(q), needReg(q) ? regState(q) : '-', isReg(q) ? 1 : 0, done[q.id] ? 1 : 0, (HQ.papers || {})[q.id] ? 1 : 0].join(':')).join('|'); }
async function renderQuizList(){
  const box = hkEl('hkQuizBox'); if (!box) return; await fetchQuizzes(); paintQuizList();
}
function paintQuizList(){
  const b2 = hkEl('hkQuizBox'); if (!b2) return; HQ.sig = quizSig();
  if (!HQ.list.length) { b2.innerHTML = '<div class="hk-card bad"><h3>🔒 Quiz registration is closed</h3><p>No quiz is open for registration right now. Check back soon — new exams are announced here.</p></div>'; updateRegHub(); return; }
  const done = store.get('hk:done', {});
  b2.innerHTML = `<div class="hk-quizzes">${HQ.list.map(q => { const s = quizState(q), d = done[q.id];
    return `<div class="hk-card"><b>${esc(q.title)}</b><p class="hk-sub">${esc(q.description || '')}</p><p class="hrp-muted">${q.duration_min} min · ${s === 'open' ? '🟢 Open' : s === 'upcoming' ? '⏳ Opens ' + fmtIST(Date.parse(q.opens_at)) : '🔒 Closed'}${d ? ` · Your score ${d.score}/${d.max}` : ''}</p>
    ${regLine(q)}${paperLine(q)}<div class="hrp-row">${regBtn(q)}<button class="hrp-btn pri" data-q="${esc(q.id)}" data-a="start" ${s !== 'open' || d ? 'disabled' : ''}>${d ? 'Submitted ✔' : 'Start quiz'}</button><button class="hrp-btn" data-q="${esc(q.id)}" data-a="lb">🏆 Leaderboard</button>${d && d.rt > 0 ? `<button class="hrp-btn" data-q="${esc(q.id)}" data-a="retry">🔁 Re-attempt with time left (${fmtClock(d.rt)})</button>` : ''}${d && quizState(q) === 'open' && window.__hrRtLeft && window.__hrRtLeft(q) > 0 ? `<button class="hrp-btn" data-q="${esc(q.id)}" data-a="again">🔁 Fresh re-attempt from 0 (${window.__hrRtLeft(q)} left)</button>` : ''}</div></div>`; }).join('')}</div>`;
  b2.onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; const q = HQ.list.find(x => x.id === b.dataset.q); if (q) (b.dataset.a === 'start' ? (HQ.rtMode = false, openQuiz(q)) : b.dataset.a === 'retry' ? (HQ.rtMode = true, openQuiz(q)) : b.dataset.a === 'again' ? (HQ.rtMode = 'gen', openQuiz(q)) : b.dataset.a === 'reg' ? openQuizReg(q) : openBoard(q)); };
  updateRegHub();
}
let qzEl = null;
function qzModal(){ if (!qzEl) { qzEl = el('div', { class: 'hrp-bg', id: 'hkQuizBg', role: 'dialog', 'aria-modal': 'true', 'data-noesc': '1' }, '<div class="hrp-modal"><div class="hrp-head"><h3 id="hkQT">Quiz</h3><button class="hrp-x" type="button" aria-label="Close" data-a="close">✕</button></div><div class="hrp-body" id="hkQB"></div></div>'); document.body.appendChild(qzEl); }
  return qzEl; }
async function openQuiz(q){
  const m = qzModal(), B = $('#hkQB', m); $('#hkQT', m).textContent = q.title; m.classList.add('open'); const me = store.get('hk:me', { name: '', email: '' });
  B.innerHTML = `<p class="hrp-muted">${esc(q.description || '')}</p><p><b>${q.duration_min} minutes</b> · one attempt per email. Once you start, the timer runs.</p>${paperLine(q)}<p class="hrp-muted">You can pick an option <b>or type your answer</b>, and you may also upload an answer sheet as a <b>PDF (max 5 MB)</b>.</p><label class="hrp-muted">Your name</label><input class="hrp-in" id="hqN" value="${esc(me.name)}" maxlength="80" style="margin-bottom:8px"><label class="hrp-muted">Email (same as registration — we will email a 6-digit code to verify it)</label><input class="hrp-in" id="hqE" type="email" value="${esc(me.email)}" maxlength="120"><div class="hk-msg" id="hqM"></div><div class="hrp-row"><button class="hrp-btn pri" data-a="go">Start now</button><button class="hrp-btn" data-a="close">Cancel</button></div>`;
  m.onclick = async e => { const a = e.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'close') { if (HQ.cur && !confirm('Leave the quiz? Your answers will be lost.')) return; clearInterval(HQ.iv); HQ.cur = null; m.classList.remove('open'); return; }
    if (a.dataset.a === 'go') { const name = $('#hqN', m).value.trim(), email = $('#hqE', m).value.trim().toLowerCase(), msg = $('#hqM', m); if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) { msg.textContent = 'Enter your name and a valid email.'; msg.className = 'hk-msg err'; return; }
      store.set('hk:me', { name, email }); if (!(await ensureVerified(msg, email))) return; await syncTime(); if (quizState(q) !== 'open') { msg.textContent = 'This quiz is not open right now.'; msg.className = 'hk-msg err'; return; }
      if (needReg(q) && HB.remote) { let ok = true; try { ok = await pgrest('rpc/hr_quiz_registered', { method: 'POST', body: { p_quiz: q.id, p_email: email } }); } catch(_){} if (ok === false) { msg.textContent = 'This email is not registered for this exam.'; msg.className = 'hk-msg err'; return; } }
      try { if (HQ.rtMode) { const rm = HQ.rtMode; HQ.rtMode = false; await window.__hrRetry(q, email, rm); } const qs = await quizQuestions(q); if (!qs.length && !HQ.papers[q.id]) throw new Error('This quiz has no questions yet.'); runQuiz(q, qs, name, email); } catch(err){ msg.textContent = err.message; msg.className = 'hk-msg err'; } } };
}
async function quizQuestions(q){
  if (HB.remote) return await pgrest(`hr_quiz_questions?quiz_id=eq.${encodeURIComponent(q.id)}&select=id,pos,text,options,points&order=pos`);
  return (store.get('hk:lqq:' + q.id, [])).map(x => ({ id: x.id, pos: x.pos, text: x.text, options: x.options, points: x.points }));
}
function qOrder(qs, key){ if (!qs || qs.length < 2) return qs; let h = 2166136261; for (const ch of key) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } const r = seeded(h), a = qs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function runQuiz(q, qs, name, email){
  if (guardOn()) qs = qOrder(qs, 'uphr_rnd_' + email + '_' + q.id);
  const m = qzModal(), B = $('#hkQB', m); const ans = {}, typed = {}; let file = null; const t0 = Date.now(), end = t0 + (HQ.retrySecs > 0 ? HQ.retrySecs * 1000 : q.duration_min * 60000); HQ.cur = { q, ans }; HQ.retry = 0; HQ.retrySecs = 0;
  const paperMode = !qs.length;
  setTimeout(() => loadPaper(q, email), 60);
  const fileBlock = `<div class="hrp-card hq-file" style="margin:10px 0"><b>📎 Upload answer sheet (PDF, max 5 MB)</b> <span class="hrp-muted">— optional</span>${HB.remote ? `<input type="file" id="hqF" accept="application/pdf,.pdf"><div class="hk-msg" id="hqFi"></div>` : '<p class="hrp-muted">PDF upload becomes available once the organiser finishes the database setup.</p>'}</div>`;
  B.innerHTML = `<div class="hrp-row" style="justify-content:space-between"><b>${paperMode ? 'Paper-based exam' : qs.length + ' questions'}</b><span class="hrp-kbd" id="hqT">--:--</span></div><div id="hqPaper" class="hrp-muted" style="margin:6px 0">${HQ.papers[q.id] ? '📄 Loading question paper…' : ''}</div>
  ${paperMode ? `<div class="hrp-card" style="margin:10px 0"><b>✍️ Type your answers</b><textarea class="hrp-ta hq-type" data-t="_paper" maxlength="20000" style="min-height:180px" placeholder="Write your answers here…"></textarea></div>` : qs.map((x, i) => `<div class="hrp-card" style="margin:10px 0"><b>${i + 1}. ${esc(x.text)}</b> <span class="hrp-muted">(${x.points || 1} pt)</span>${x.options.map((o, k) => `<label class="hrp-check"><input type="radio" name="hq${i}" data-q="${esc(x.id)}" value="${k}"><span>${esc(o)}</span></label>`).join('')}<div class="hq-or">…or type your answer (A / B / C / D, or in your own words):</div><textarea class="hrp-ta hq-type" data-t="${esc(x.id)}" maxlength="2000" rows="2" placeholder="✍️ Type your answer here"></textarea></div>`).join('')}
  ${fileBlock}<div class="hk-msg" id="hqM"></div><div class="hrp-row"><button class="hrp-btn pri" data-a="sub">Submit answers</button></div>`;
  const setMsg = (t, c) => { const msg = $('#hqM', m); if (msg) { msg.textContent = t; msg.className = 'hk-msg' + (c ? ' ' + c : ''); } };
  const tick = () => { const l = Math.max(0, (end - Date.now()) / 1000), t = $('#hqT', m); if (t) t.textContent = '⏱ ' + fmtClock(l); if (l <= 0) { toast('Time is up — submitting', 'warn', '⏰'); submit(true); } };
  const startTimer = () => { clearInterval(HQ.iv); HQ.iv = setInterval(tick, 500); };
  const submit = async auto => {
    clearInterval(HQ.iv); const secs = Math.round((Date.now() - t0) / 1000); setMsg('Submitting…');
    /* typed "A/B/C/D" or exact option text counts as that option when nothing was clicked */
    qs.forEach(x => { const t = (typed[x.id] || '').trim(); if (t && ans[x.id] === undefined) { const L = 'ABCD'.indexOf(t.toUpperCase()); const k = (t.length === 1 && L >= 0 && L < x.options.length) ? L : x.options.findIndex(o => String(o).trim().toLowerCase() === t.toLowerCase()); if (k >= 0) ans[x.id] = k; } });
    const typedClean = {}; Object.keys(typed).forEach(k => { const v = (typed[k] || '').trim(); if (v) typedClean[k] = v.slice(0, 20000); });
    let up = null, warn = '';
    if (file) { try { setMsg('Uploading PDF…'); up = await uploadPdf('answers/' + q.id + '/' + uid() + '.pdf', file); } catch(err){ if (!auto) { setMsg(err.message + ' You can remove the file and submit without it.', 'err'); startTimer(); return; } warn = 'Your PDF could not be uploaded: ' + err.message; } }
    try { setMsg('Submitting…'); const r = await submitAttempt(q, qs, ans, name, email, secs); const d = store.get('hk:done', {}); d[q.id] = { score: r.score, max: r.max }; store.set('hk:done', d);
      if (Object.keys(typedClean).length || up) { try { await saveExtras(q, name, email, typedClean, up); } catch(e){ warn = warn || ('Your typed answers / PDF could not be saved: ' + (e.message || e)); } }
      HQ.cur = null; showQuizResult(q, r, auto, { typed: Object.keys(typedClean).length, pdf: up ? up.name : '', warn }); renderQuizList(); }
    catch(err){ setMsg(err.message, 'err'); if (/already/i.test(err.message)) HQ.cur = null; else if (!auto) startTimer(); else if ((HQ.retry = (HQ.retry || 0) + 1) <= 20) setTimeout(() => { if (HQ.cur && HQ.cur.submit) HQ.cur.submit(true); }, 3000); }
  };
  m.onclick = e => { const a = e.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'sub') { const answered = new Set([...Object.keys(ans), ...Object.keys(typed).filter(k => (typed[k] || '').trim())]); const un = paperMode ? 0 : qs.filter(x => !answered.has(x.id)).length; if (!un || confirm(un + ' question(s) unanswered. Submit anyway?')) submit(false); } else if (a.dataset.a === 'close') { if (confirm('Leave the quiz? Your answers will be lost.')) { clearInterval(HQ.iv); HQ.cur = null; m.classList.remove('open'); } } };
  m.oninput = e => { const t = e.target; if (t && t.dataset && t.dataset.t) typed[t.dataset.t] = t.value; };
  m.onchange = async e => { const t = e.target; if (t.type === 'radio') ans[t.dataset.q] = +t.value; else if (t.id === 'hqF') { const f = t.files && t.files[0]; if (!f) { file = null; const i0 = $('#hqFi', m); if (i0) { i0.textContent = ''; } return; } const err = await pdfCheck(f); const info = $('#hqFi', m); if (err) { file = null; t.value = ''; if (info) { info.textContent = '❌ ' + err; info.className = 'hk-msg err'; } return; } file = f; if (info) { info.textContent = '✅ ' + f.name + ' (' + fmtSize(f.size) + ') — will be uploaded when you submit'; info.className = 'hk-msg ok'; } } };
  if (HQ.cur) { HQ.cur.submit = submit; HQ.cur.t0 = Date.now(); HQ.cur.left = () => Math.max(0, Math.round((end - Date.now()) / 1000)); }
  startTimer();
}
async function saveExtras(q, name, email, typed, up){
  if (HB.remote) {
    try { await pgrest('rpc/hr_save_extra', { method: 'POST', headers: vtHdr(email), body: { p_quiz: q.id, p_email: email, p_name: name, p_typed: typed, p_path: up ? up.path : null, p_fname: up ? up.name : null, p_size: up ? up.size : null } }); return; }
    catch(e){ if (/EMAIL_NOT_VERIFIED/.test(e.message)) throw new Error('Email verification expired. Verify again and resubmit.'); if (e.status === 404) throw new Error('the organiser must run the updated SQL (Admin → Setup) first.'); throw e; }
  }
  const l = store.get('hk:lx:' + q.id, []); l.push({ name, email, typed, created_at: new Date().toISOString() }); store.set('hk:lx:' + q.id, l);
}
async function submitAttempt(q, qs, ans, name, email, secs){
  if (HB.remote) {
    try { return await pgrest('rpc/hr_submit_attempt', { method: 'POST', headers: vtHdr(email), body: { p_quiz: q.id, p_email: email, p_name: name, p_answers: ans, p_secs: secs } }); }
    catch(e){ if (/EMAIL_NOT_VERIFIED/.test(e.message)) { store.set('hk:vt', null); throw new Error('Email verification expired. Verify your email again, then submit.'); } if (/ALREADY_SUBMITTED|duplicate|unique/i.test(e.message)) throw new Error('This email has already submitted this quiz.'); if (/QUIZ_CLOSED/.test(e.message)) throw new Error('The quiz has closed.'); if (/NOT_REGISTERED/.test(e.message)) throw new Error('This email is not registered for this exam.'); throw new Error(e.message || 'Could not submit'); }
  }
  const keys = store.get('hk:lqq:' + q.id, []); let score = 0, max = 0, correct = 0; const review = [];
  keys.forEach(k => { max += k.points || 1; const ok = ans[k.id] === k.answer; if (ok) { score += k.points || 1; correct++; } review.push({ id: k.id, answer: k.answer, explanation: k.explanation || '' }); });
  const lb = store.get('hk:latt:' + q.id, []); lb.push({ name, email, score, max_score: max, secs }); lb.sort((x, y) => y.score - x.score || x.secs - y.secs); store.set('hk:latt:' + q.id, lb);
  return { score, max, correct, total: keys.length, review };
}
function showQuizResult(q, r, auto, ex){
  const m = qzModal(), B = $('#hkQB', m); confetti(50); setTimeout(() => fillMyRank(q), 80);
  const qs = store.get('hk:lqq:' + q.id, []);
  ex = ex || {}; m.oninput = null; m.onchange = null;
  B.innerHTML = `<div class="hrp-card" style="text-align:center">${r.total ? `<div class="hrp-big" style="margin:0">${r.score}/${r.max}</div>` : ''}<b>${auto ? 'Time is up — answers submitted' : 'Answers submitted'}</b>${r.total ? ' ' + r.correct + '/' + r.total + ' correct' : ''}</div>${ex.typed ? `<p class="hrp-muted">✍️ ${ex.typed} typed answer(s) saved for the organisers to review.</p>` : ''}${ex.pdf ? `<p class="hrp-muted">📎 PDF uploaded: ${esc(ex.pdf)}</p>` : ''}${ex.warn ? `<p class="hk-msg err">⚠️ ${esc(ex.warn)}</p>` : ''}<p class="hrp-muted" id="hqRank">Your score is recorded. Finding your rank…</p><div class="hrp-row"><button class="hrp-btn pri" data-a="lb">🏆 Leaderboard</button><button class="hrp-btn" data-a="close">Close</button></div>`;
  m.onclick = e => { const a = e.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'close') m.classList.remove('open'); else if (a.dataset.a === 'lb') openBoard(q); };
}
/* ---- v2: students see their rank, live quiz rankings on the home page ---- */
/* ---- email verification: 6-digit code before a quiz can be started / submitted ---- */
const vtGet = email => { const v = store.get('hk:vt', null); return v && v.email === email && v.exp > Date.now() ? v.token : ''; };
const vtHdr = email => { const k = vtGet(email); return k ? { 'x-quiz-token': k } : {}; };
async function verifyApi(body){
  const r = await fetch('/api/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(j.error || (r.status === 404 ? 'Email verification is not installed yet (organiser: deploy api/verify-email.js).' : 'Verification failed'));
  return j;
}
async function ensureVerified(box, email){
  if (!HB.remote || vtGet(email)) return true;
  if (box.dataset.pending === email) return new Promise(() => {});
  const say = (x, ok) => { box.className = 'hk-msg' + (ok === true ? ' ok' : ok === false ? ' err' : ''); box.textContent = x; };
  say('Sending a 6-digit code to ' + email + '…');
  try { await verifyApi({ action: 'send', email }); } catch(e){ say(e.message, false); return false; }
  return new Promise(done => {
    box.dataset.pending = email; box.className = 'hk-msg';
    box.innerHTML = '✉️ Enter the 6-digit code we emailed to <b>' + esc(email) + '</b> (valid 10 minutes — check spam too).<input class="hrp-in" id="hqC" inputmode="numeric" maxlength="6" placeholder="123456" style="margin:8px 0"><div class="hrp-row"><button class="hrp-btn pri" id="hqCv">Verify &amp; start</button><button class="hrp-mini" id="hqCr">Resend code</button></div><div id="hqCm" class="hrp-muted"></div>';
    const cm = box.querySelector('#hqCm'), inp = box.querySelector('#hqC');
    box.querySelector('#hqCv').onclick = async () => {
      try {
        cm.textContent = 'Checking…';
        const j = await verifyApi({ action: 'check', email, code: inp.value });
        try { await pgrest('rpc/hr_now', { method: 'POST', body: {}, headers: { 'x-quiz-token': j.token } }); }
        catch(e){ cm.textContent = '❌ Your browser could not reach the quiz server with the verification header. Tell the organiser.'; return; }
        store.set('hk:vt', { email, token: j.token, exp: Date.parse(j.expires_at) }); box.dataset.pending = ''; done(true);
      } catch(e){ cm.textContent = '❌ ' + e.message; }
    };
    box.querySelector('#hqCr').onclick = async () => { try { cm.textContent = 'Sending…'; await verifyApi({ action: 'send', email }); cm.textContent = '✅ New code sent.'; } catch(e){ cm.textContent = '❌ ' + e.message; } };
  });
}
const LQ = { id: '', iv: 0 };
const LB_COL = ['#7c5cff', '#22d3ee', '#ff4d9d', '#4ade80', '#fbbf24'];
async function boardRows(q, email){
  const me = String(email || '').trim().toLowerCase();
  if (!HB.remote) return store.get('hk:latt:' + q.id, []).map((r, i) => ({ pos: i + 1, name: r.name, score: r.score, max_score: r.max_score, secs: r.secs, is_me: !!me && String(r.email || '').toLowerCase() === me, final: false }));
  let rows;
  try { rows = await pgrest('rpc/hr_leaderboard', { method: 'POST', body: { p_quiz: q.id, p_email: me || null } }); }
  catch(e){ rows = await pgrest('rpc/hr_leaderboard', { method: 'POST', body: { p_quiz: q.id } }); }
  return (rows || []).map((r, i) => ({ ...r, pos: r.pos ?? i + 1, final: r.final ?? !!q.results_published }));
}
function rankLine(rows){
  const m = rows.find(r => r.is_me); if (!m) return '';
  return 'Your rank: <b>#' + m.pos + '</b> of ' + (rows.length >= 50 ? '50+' : rows.length) + ' · <b>' + m.score + (m.max_score ? '/' + m.max_score : '') + '</b> marks · ' + (m.final ? '✅ final' : '⏳ provisional — changes as typed answers get marked');
}
async function fillMyRank(q){
  const p = document.getElementById('hqRank'); if (!p) return; const me = (store.get('hk:me', {}) || {}).email;
  try { const l = rankLine(await boardRows(q, me)); p.innerHTML = l || 'Your score is recorded. Open the leaderboard to see the rankings.'; }
  catch(e){ p.textContent = 'Your score is recorded. Open the leaderboard to see your rank.'; }
}
async function openBoard(q){
  const m = qzModal(), B = $('#hkQB', m); $('#hkQT', m).textContent = '🏆 ' + q.title; m.classList.add('open');
  B.innerHTML = '<div id="hqBW" data-q="' + esc(q.id) + '"><p class="hrp-muted">Loading…</p></div>';
  clearInterval(LQ.iv2);
  m.onclick = e => { if (e.target.closest('[data-a=close]')) { clearInterval(LQ.iv2); m.classList.remove('open'); } };
  const draw = async () => {
    const w = $('#hqBW', B); if (!m.classList.contains('open') || !w || w.dataset.q !== q.id) { clearInterval(LQ.iv2); return; }
    const me = (store.get('hk:me', {}) || {}).email; let rows;
    try { rows = await boardRows(q, me); } catch(e){ w.innerHTML = '<p class="hrp-muted">Leaderboard is not available yet.</p>'; return; }
    if (!rows.length) { w.innerHTML = '<p class="hrp-muted">No submissions yet.</p>'; return; }
    const l = rankLine(rows);
    w.innerHTML = '<p class="hrp-muted">' + (rows[0].final ? '✅ Final results' : '⏳ Live — updates automatically as marks are added') + '</p>' + (l ? '<div class="hrp-card" style="margin:8px 0">' + l + '</div>' : '') + table(rows.map(r => [String(r.pos) + (r.is_me ? ' ◀' : ''), r.name + (r.is_me ? ' (You)' : ''), r.score + (r.max_score ? '/' + r.max_score : ''), fmtClock(r.secs || 0)]), ['#', 'Name', 'Marks', 'Time']);
  };
  await draw(); LQ.iv2 = setInterval(draw, 15000);
}
window.__hkQuizBoard = async function(host){
  host = host || document.getElementById('boardRows'); if (!host) return;
  const note = x => { host.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">' + x + '</div>'; };
  try {
    await fetchQuizzesBase(); const list = HQ.list || [];
    if (!list.length) return note('No quiz has been published yet.');
    if (!list.some(x => x.id === LQ.id)) LQ.id = list[0].id;
    const q = list.find(x => x.id === LQ.id), me = (store.get('hk:me', {}) || {}).email;
    const rows = await boardRows(q, me), l = rankLine(rows);
    const head = '<div style="padding:12px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;border-bottom:1px solid var(--border)"><select id="lqSel" class="hrp-sel" style="width:auto;max-width:100%">' + list.map(x => '<option value="' + esc(x.id) + '"' + (x.id === q.id ? ' selected' : '') + '>' + esc(x.title) + '</option>').join('') + '</select><span style="font-size:12px;color:var(--muted)">' + (rows[0] && rows[0].final ? '✅ Final results' : '⏳ Live · updates as marks are added') + '</span></div>' + (l ? '<div style="padding:10px 16px;font-size:13px">' + l + '</div>' : '');
    const top = rows.filter(r => r.pos <= 10 || r.is_me);
    host.innerHTML = head + (top.length ? top.map((r, i) => '<div class="row ' + (r.pos <= 3 ? 'top3' : '') + '"' + (r.is_me ? ' style="outline:1px solid var(--cyan);outline-offset:-1px"' : '') + '><div class="rank ' + (r.pos === 1 ? 'gold' : r.pos === 2 ? 'silver' : r.pos === 3 ? 'bronze' : '') + '">' + (['🥇', '🥈', '🥉'][r.pos - 1] || '#' + r.pos) + '</div><div class="team"><span class="avatar" style="background:' + LB_COL[i % 5] + '">' + esc((r.name || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()) + '</span><div>' + esc(r.name) + (r.is_me ? ' (You)' : '') + '<small>' + fmtClock(r.secs || 0) + '</small></div></div><div class="pts">' + r.score + (r.max_score ? '/' + r.max_score : '') + '</div><div class="trend flat">' + (r.final ? 'final' : 'live') + '</div></div>').join('') : '<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">No submissions yet.</div>');
    const s = host.querySelector('#lqSel'); if (s) s.onchange = () => { LQ.id = s.value; window.__hkQuizBoard(host); };
  } catch(e){ note('Could not load quiz rankings.'); }
};
setInterval(() => { const a = document.querySelector('[data-board].active'); if (a && a.dataset.board === 'quiz' && !document.hidden) window.__hkQuizBoard(); }, 20000);
(function(){
  const m = document.getElementById('navLoginM'), b = document.getElementById('loginBtn');
  if (!m || !b) return;
  const sync = () => { const x = (b.textContent || '').trim(); m.textContent = '👤 ' + (x && !/^log ?in$/i.test(x) ? x : 'Log in / Sign up'); };
  const bg = document.getElementById('burger'); if (bg) bg.addEventListener('click', sync);
  m.addEventListener('click', e => { e.preventDefault(); const nl = document.getElementById('navLinks'); if (nl) nl.classList.remove('open'); b.click(); });
  sync();
})();
feat('Quiz ranks: students see their own rank, a "Quizzes" tab in Live Rankings, auto-refreshing', () => {});
feat('Hackathon quizzes: participants can take timed quizzes and see a leaderboard', () => {});
/* ---- combined registration hub: Team + Quiz in one place ---- */
function teamLocked(){ return HB.ev.lock_main !== false && !evState().regOpen; }
function quizRegOpenAny(){ try { return (HQ.list || []).some(q => needReg(q) && regState(q) === 'open'); } catch(e){ return false; } }
function quizExamLive(){ try { const done = store.get('hk:done', {}); return (HQ.list || []).some(q => quizState(q) === 'open' && !done[q.id] && (!needReg(q) || isReg(q))); } catch(e){ return false; } }
function quizAnyOpen(){ return quizRegOpenAny() || quizExamLive(); }
function rhExpand(it, on){ if (!it) return; it.classList.toggle('expanded', !!on); const b = it.querySelector('.rh-head'); if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false'); }
function rhSet(id, state, cls, txt, sub){
  const it = hkEl(id); if (!it) return; const was = it.dataset.state; it.dataset.state = state;
  const p = hkEl(id + 'Pill'); if (p) { p.className = 'hk-pill ' + cls; p.textContent = txt; }
  const s = hkEl(id + 'Sub'); if (s && sub) s.innerHTML = sub;
  if (was !== state) rhExpand(it, state === 'open');
}
function updateRegHub(){
  if (!HB.checked || !hkEl('regHub')) return; const st = evState();
  const locked = teamLocked();
  rhSet('rhTeam', locked ? 'closed' : 'open', locked ? 'bad' : 'ok', locked ? '🔒 Closed' : '🟢 Open', locked ? `Registration closed on ${fmtIST(st.c)}` : `Register your team in 4 steps · closes ${fmtIST(st.c)}`);
  const list = HQ.list || [], regOpen = quizRegOpenAny(), live = quizExamLive();
  if (!list.length) rhSet('rhQuiz', 'closed', 'bad', '🔒 Closed', 'No quiz is open for registration right now');
  else if (regOpen) { const n = list.filter(q => needReg(q) && regState(q) === 'open').length; rhSet('rhQuiz', 'open', 'ok', '🟢 Open', `${n} quiz registration${n > 1 ? 's' : ''} open`); }
  else if (live) rhSet('rhQuiz', 'open', '', '🟡 Exam live', 'Registration is closed — registered participants can start their exam');
  else rhSet('rhQuiz', 'closed', 'bad', '🔒 Closed', 'Quiz registration is closed');
  syncRegButtons();
}
function syncRegButtons(){
  const lock = teamLocked() && !quizAnyOpen();
  $$('a.btn[href="#register"], a.btn[href="#hackathon"]').forEach(a => {
    if (a.dataset.hkT === undefined) { a.dataset.hkT = a.textContent; a.dataset.hkH = a.getAttribute('href'); }
    if (lock) { a.textContent = '🔒 Registration closed'; a.classList.add('hk-off'); a.setAttribute('href', '#hackathon'); } else { a.textContent = a.dataset.hkT; a.setAttribute('href', a.dataset.hkH); a.classList.remove('hk-off'); }
  });
}
document.addEventListener('click', e => { const b = e.target.closest('.rh-head'); if (!b) return; const it = b.closest('.rh-item'); rhExpand(it, !it.classList.contains('expanded')); });
setInterval(() => { if (!HB.checked || document.hidden) return; if (HQ.list && quizSig() !== HQ.sig) paintQuizList(); else updateRegHub(); }, 4000);
feat('One Registration hub: Team and Quiz registration together — open ones expand, closed ones stay locked', () => {});


/* ---- load admin-managed question bank ---- */
const BK = { rows: [], remote: false };
function applyBank(rows){
  QB.length = 0; Object.keys(QM).forEach(k => delete QM[k]);
  BUILTIN_Q.forEach(q => { const c = { ...q, o: q.o.slice() }; QB.push(c); QM[c.id] = c; });
  (rows || []).forEach(r => {
    if (r.deleted) { const i = QB.findIndex(q => q.id === r.id); if (i >= 0) QB.splice(i, 1); delete QM[r.id]; return; }
    const o = Array.isArray(r.opts) ? r.opts : []; if (o.length !== 4 || !r.text || !r.subj) return;
    if (r.subj_name) SUBJ[r.subj] = r.subj_name; if (!SUBJ[r.subj]) SUBJ[r.subj] = r.subj;
    const q = { id: r.id, s: r.subj, d: Math.min(3, Math.max(1, +r.lvl || 2)), t: String(r.text), o: o.map(String), a: Math.min(3, Math.max(0, +r.ans || 0)), e: String(r.expl || ''), b: 1, sem: Math.max(0, +r.sem || 0), br: r.br || 'all' };
    const i = QB.findIndex(x => x.id === r.id); if (i >= 0) QB[i] = q; else QB.push(q); QM[r.id] = q;
  });
}
async function loadBank(){
  let rows = [];
  try { rows = await (async () => { let a = [], o = 0; for (;;) { const r = await pgrest('hr_bank?select=*&order=updated_at,id&limit=1000&offset=' + o); a = a.concat(r || []); if (!r || r.length < 1000) break; o += 1000; } return a; })(); BK.remote = true; } catch(e){ BK.remote = false; rows = store.get('bankLocal', []); }
  BK.rows = rows || []; applyBank(BK.rows); if (EXS.c && EXS.c.isConnected && ['home', 'setup', 'browse', 'stats'].includes(EXS.view)) exDraw();
}
feat('Question bank loads admin edits, additions and deletions from the database', () => {});

/* ---- init ---- */
(async function initHackathon(){
  await syncTime(); await loadEvent(); renderHackathon(); applyMainLock(); updateOldBox(); tickHack(); loadBank();
  setInterval(tickHack, 1000);
  setInterval(async () => { const before = JSON.stringify(HB.ev); await syncTime(); await loadEvent(); if (JSON.stringify(HB.ev) !== before) { renderHackathon(); applyMainLock(); updateOldBox(); } loadBank(); }, 60000);
  setInterval(() => { const b = hkEl('hkAdminBtn'); if (b) b.style.display = isAdminUI() ? '' : 'none'; }, 1500);
})();
function isAdminUI(){ if (document.getElementById('ddAdmin')) return true; const a = document.getElementById('admin'); return !!(a && a.style.display !== 'none' && getComputedStyle(a).display !== 'none'); }

/* ============ ADMIN CONSOLE ============ */
const HK_SQL = "-- ============================================================\n-- Hackathon Rivals \u2014 hackathon, quizzes & question-bank backend\n-- Run once in: Supabase \u2192 SQL Editor \u2192 New query \u2192 Run.\n-- Safe to run again (uses IF NOT EXISTS / DROP POLICY IF EXISTS).\n-- Assumes your existing table public.profiles(id uuid, role text)\n-- where role = 'Admin' marks administrators (same as your site).\n-- ============================================================\n\ncreate extension if not exists pgcrypto;\n\n-- Who is an admin? (checked by every write policy below)\ncreate or replace function public.hr_is_admin() returns boolean\nlanguage sql stable security definer set search_path = public as $$\n  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Admin');\n$$;\ngrant execute on function public.hr_is_admin() to anon, authenticated;\n\n-- Trusted server clock (used by the page so changing a phone clock cannot re-open registration)\ncreate or replace function public.hr_now() returns timestamptz\nlanguage sql stable as $$ select now(); $$;\ngrant execute on function public.hr_now() to anon, authenticated;\n\n-- ---------- event settings (one row: id = 'main') ----------\ncreate table if not exists public.hr_events (\n  id text primary key default 'main',\n  name text not null,\n  starts_at timestamptz not null,\n  reg_closes_at timestamptz not null,\n  ends_at timestamptz,\n  reg_open boolean not null default true,\n  lock_main boolean not null default true,\n  message text,\n  updated_at timestamptz not null default now()\n);\nalter table public.hr_events enable row level security;\ndrop policy if exists hr_events_read on public.hr_events;\ndrop policy if exists hr_events_write on public.hr_events;\ncreate policy hr_events_read on public.hr_events for select using (true);\ncreate policy hr_events_write on public.hr_events for all using (public.hr_is_admin()) with check (public.hr_is_admin());\n\n-- Default event: 1 Oct 2026, 6:00 PM IST (change it later from the Admin console)\ninsert into public.hr_events (id, name, starts_at, reg_closes_at, message)\nvalues ('main', 'Hackathon Rivals \u2014 Live Hackathon', '2026-10-01 18:00:00+05:30', '2026-10-01 18:00:00+05:30',\n        'Team up, pick a problem and build something great. Register before the countdown hits zero.')\non conflict (id) do nothing;\n\n-- exam guard switch (auto-submit on tab switch / screenshot)\nalter table public.hr_events add column if not exists proctor boolean not null default true;\n\n-- ---------- registrations ----------\ncreate table if not exists public.hr_registrations (\n  id uuid primary key default gen_random_uuid(),\n  event_id text not null default 'main',\n  team_name text not null,\n  leader_name text not null,\n  email text not null,\n  phone text not null,\n  college text not null,\n  team_size int not null check (team_size between 1 and 6),\n  members text,\n  track text,\n  notes text,\n  created_at timestamptz not null default now()\n);\ncreate unique index if not exists hr_registrations_email_uq on public.hr_registrations (event_id, lower(email));\nalter table public.hr_registrations enable row level security;\ndrop policy if exists hr_reg_admin on public.hr_registrations;\ncreate policy hr_reg_admin on public.hr_registrations for all using (public.hr_is_admin()) with check (public.hr_is_admin());\n-- (no INSERT policy on purpose: the only way in is hr_register(), which enforces the deadline)\n\ncreate or replace function public.hr_register(p jsonb) returns jsonb\nlanguage plpgsql security definer set search_path = public as $$\ndeclare ev public.hr_events%rowtype; rid uuid; sz int;\nbegin\n  select * into ev from public.hr_events where id = 'main';\n  if not found or not ev.reg_open or now() >= ev.reg_closes_at then\n    raise exception 'REGISTRATION_CLOSED';\n  end if;\n  if coalesce(trim(p->>'team_name'), '') = '' or coalesce(trim(p->>'leader_name'), '') = ''\n     or coalesce(trim(p->>'email'), '') = '' or coalesce(trim(p->>'phone'), '') = ''\n     or coalesce(trim(p->>'college'), '') = '' then\n    raise exception 'MISSING_FIELDS';\n  end if;\n  sz := least(6, greatest(1, coalesce(nullif(p->>'team_size', '')::int, 1)));\n  insert into public.hr_registrations (event_id, team_name, leader_name, email, phone, college, team_size, members, track, notes)\n  values ('main', left(trim(p->>'team_name'), 60), left(trim(p->>'leader_name'), 80), lower(left(trim(p->>'email'), 120)),\n          left(trim(p->>'phone'), 20), left(trim(p->>'college'), 120), sz,\n          left(p->>'members', 600), left(p->>'track', 120), left(p->>'notes', 400))\n  returning id into rid;\n  return jsonb_build_object('ok', true, 'id', rid);\nend $$;\ngrant execute on function public.hr_register(jsonb) to anon, authenticated;\n\n-- ---------- question bank edits (built-in question overrides, hidden questions, new questions) ----------\ncreate table if not exists public.hr_bank (\n  id text primary key,\n  subj text, subj_name text, sem int, br text, lvl int,\n  text text, opts jsonb, ans int, expl text,\n  deleted boolean not null default false,\n  updated_at timestamptz not null default now()\n);\nalter table public.hr_bank enable row level security;\ndrop policy if exists hr_bank_read on public.hr_bank;\ndrop policy if exists hr_bank_write on public.hr_bank;\ncreate policy hr_bank_read on public.hr_bank for select using (true);\ncreate policy hr_bank_write on public.hr_bank for all using (public.hr_is_admin()) with check (public.hr_is_admin());\n\n-- ---------- hackathon quizzes ----------\ncreate table if not exists public.hr_quizzes (\n  id uuid primary key,\n  title text not null,\n  description text,\n  duration_min int not null default 30 check (duration_min between 1 and 600),\n  opens_at timestamptz,\n  closes_at timestamptz,\n  published boolean not null default false,\n  created_at timestamptz not null default now()\n);\ncreate table if not exists public.hr_quiz_questions (\n  id uuid primary key,\n  quiz_id uuid not null references public.hr_quizzes(id) on delete cascade,\n  pos int not null default 1,\n  text text not null,\n  options jsonb not null,\n  points int not null default 1 check (points between 1 and 100)\n);\n-- answers live in a separate admin-only table so participants can never read them\ncreate table if not exists public.hr_quiz_keys (\n  question_id uuid primary key references public.hr_quiz_questions(id) on delete cascade,\n  answer int not null check (answer between 0 and 3),\n  explanation text\n);\ncreate table if not exists public.hr_attempts (\n  id uuid primary key default gen_random_uuid(),\n  quiz_id uuid not null references public.hr_quizzes(id) on delete cascade,\n  email text not null,\n  name text not null,\n  score int not null,\n  max_score int not null,\n  answers jsonb,\n  secs int,\n  created_at timestamptz not null default now()\n);\ncreate unique index if not exists hr_attempts_once on public.hr_attempts (quiz_id, lower(email));\n\nalter table public.hr_quizzes enable row level security;\nalter table public.hr_quiz_questions enable row level security;\nalter table public.hr_quiz_keys enable row level security;\nalter table public.hr_attempts enable row level security;\n\ndrop policy if exists hr_quizzes_read on public.hr_quizzes;\ndrop policy if exists hr_quizzes_write on public.hr_quizzes;\ncreate policy hr_quizzes_read on public.hr_quizzes for select using (published or public.hr_is_admin());\ncreate policy hr_quizzes_write on public.hr_quizzes for all using (public.hr_is_admin()) with check (public.hr_is_admin());\n\ndrop policy if exists hr_qq_read on public.hr_quiz_questions;\ndrop policy if exists hr_qq_write on public.hr_quiz_questions;\ncreate policy hr_qq_read on public.hr_quiz_questions for select\n  using (public.hr_is_admin() or exists (select 1 from public.hr_quizzes z where z.id = quiz_id and z.published));\ncreate policy hr_qq_write on public.hr_quiz_questions for all using (public.hr_is_admin()) with check (public.hr_is_admin());\n\ndrop policy if exists hr_keys_admin on public.hr_quiz_keys;\ncreate policy hr_keys_admin on public.hr_quiz_keys for all using (public.hr_is_admin()) with check (public.hr_is_admin());\n\ndrop policy if exists hr_attempts_admin on public.hr_attempts;\ncreate policy hr_attempts_admin on public.hr_attempts for all using (public.hr_is_admin()) with check (public.hr_is_admin());\n\ncreate or replace function public.hr_submit_attempt(p_quiz uuid, p_email text, p_name text, p_answers jsonb, p_secs int)\nreturns jsonb language plpgsql security definer set search_path = public as $$\ndeclare q public.hr_quizzes%rowtype; sc int := 0; mx int := 0; cr int := 0; tot int := 0; r record; rev jsonb := '[]'::jsonb; a text;\nbegin\n  select * into q from public.hr_quizzes where id = p_quiz and published;\n  if not found then raise exception 'QUIZ_CLOSED'; end if;\n  if (q.opens_at is not null and now() < q.opens_at)\n     or (q.closes_at is not null and now() >= q.closes_at + make_interval(mins => q.duration_min + 1)) then\n    raise exception 'QUIZ_CLOSED';\n  end if;\n  if coalesce(trim(p_email), '') = '' or coalesce(trim(p_name), '') = '' then raise exception 'MISSING_FIELDS'; end if;\n  if exists (select 1 from public.hr_attempts where quiz_id = p_quiz and lower(email) = lower(trim(p_email))) then\n    raise exception 'ALREADY_SUBMITTED';\n  end if;\n  for r in select qq.id, qq.points, k.answer, k.explanation\n           from public.hr_quiz_questions qq join public.hr_quiz_keys k on k.question_id = qq.id\n           where qq.quiz_id = p_quiz order by qq.pos loop\n    tot := tot + 1; mx := mx + r.points;\n    a := p_answers ->> r.id::text;\n    if a is not null and a ~ '^[0-3]$' and a::int = r.answer then sc := sc + r.points; cr := cr + 1; end if;\n    rev := rev || jsonb_build_array(jsonb_build_object('id', r.id, 'answer', r.answer, 'explanation', r.explanation));\n  end loop;\n  insert into public.hr_attempts (quiz_id, email, name, score, max_score, answers, secs)\n  values (p_quiz, lower(trim(p_email)), left(trim(p_name), 80), sc, mx, p_answers, least(greatest(coalesce(p_secs, 0), 0), 86400));\n  return jsonb_build_object('score', sc, 'max', mx, 'correct', cr, 'total', tot, 'review', rev);\nend $$;\ngrant execute on function public.hr_submit_attempt(uuid, text, text, jsonb, int) to anon, authenticated;\n\ncreate or replace function public.hr_leaderboard(p_quiz uuid)\nreturns table (name text, score int, secs int) language sql stable security definer set search_path = public as $$\n  select a.name, a.score, a.secs from public.hr_attempts a\n  where a.quiz_id = p_quiz order by a.score desc, a.secs asc limit 50;\n$$;\ngrant execute on function public.hr_leaderboard(uuid) to anon, authenticated;\n\n-- ---------- OPTIONAL: also close the site's own team-registration table at the deadline ----------\n-- Only installed if public.team_registrations exists. Remove this block if you do not want that.\ndo $$\nbegin\n  if to_regclass('public.team_registrations') is not null then\n    execute $f$\n      create or replace function public.hr_lock_team_registrations() returns trigger\n      language plpgsql security definer set search_path = public as $b$\n      declare ev public.hr_events%rowtype;\n      begin\n        select * into ev from public.hr_events where id = 'main';\n        if found and ev.lock_main and (not ev.reg_open or now() >= ev.reg_closes_at) then\n          raise exception 'REGISTRATION_CLOSED';\n        end if;\n        return new;\n      end $b$;\n    $f$;\n    execute 'drop trigger if exists hr_lock_team_reg on public.team_registrations';\n    execute 'create trigger hr_lock_team_reg before insert on public.team_registrations for each row execute function public.hr_lock_team_registrations()';\n  end if;\nend $$;\n";
function parseCSV(t){
  const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) { const ch = t[i];
    if (q) { if (ch === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (ch === '"') q = false; else f += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { r.push(f); f = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(f); f = ''; rows.push(r); r = []; } else f += ch; }
  if (f !== '' || r.length) { r.push(f); rows.push(r); } return rows.filter(x => x.some(v => String(v).trim() !== ''));
}
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24) || 'general';
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
const HK_SQL_FILES = `
-- ============================================================
-- PART 2 — typed answers + PDF uploads (max 5 MB) for quizzes
-- Safe to run again.
-- ============================================================

-- Storage bucket for PDFs (public links, PDF only, 5 MB limit)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hr-quiz-files', 'hr-quiz-files', true, 5242880, array['application/pdf'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['application/pdf'];

drop policy if exists hr_files_insert_answers on storage.objects;
create policy hr_files_insert_answers on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'hr-quiz-files' and name like 'answers/%');
drop policy if exists hr_files_admin_all on storage.objects;
create policy hr_files_admin_all on storage.objects for all to authenticated
  using (bucket_id = 'hr-quiz-files' and public.hr_is_admin())
  with check (bucket_id = 'hr-quiz-files' and public.hr_is_admin());

-- One row per question paper (kind = 'paper') and per participant submission (kind = 'answer')
create table if not exists public.hr_quiz_files (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.hr_quizzes(id) on delete cascade,
  kind text not null check (kind in ('paper', 'answer')),
  email text,
  name text,
  typed jsonb,
  file_path text,
  file_name text,
  file_size int check (file_size is null or file_size <= 5242880),
  created_at timestamptz not null default now()
);
create unique index if not exists hr_quiz_files_paper_uq on public.hr_quiz_files (quiz_id) where kind = 'paper';
create unique index if not exists hr_quiz_files_answer_uq on public.hr_quiz_files (quiz_id, lower(email)) where kind = 'answer';
alter table public.hr_quiz_files enable row level security;
drop policy if exists hr_qf_read_paper on public.hr_quiz_files;
drop policy if exists hr_qf_admin on public.hr_quiz_files;
-- (paper rows are admin-only; students get the link through hr_quiz_paper(), see Part 6)
create policy hr_qf_admin on public.hr_quiz_files for all using (public.hr_is_admin()) with check (public.hr_is_admin());

-- Participants save typed answers / PDF only AFTER a real quiz attempt exists for their email
create or replace function public.hr_save_extra(p_quiz uuid, p_email text, p_name text, p_typed jsonb, p_path text, p_fname text, p_size int)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.hr_attempts where quiz_id = p_quiz and lower(email) = lower(trim(p_email))) then
    raise exception 'NO_ATTEMPT';
  end if;
  if p_path is not null and (p_path not like ('answers/' || p_quiz::text || '/%') or coalesce(p_size, 0) > 5242880) then
    raise exception 'BAD_FILE';
  end if;
  insert into public.hr_quiz_files (quiz_id, kind, email, name, typed, file_path, file_name, file_size)
  values (p_quiz, 'answer', lower(trim(p_email)), left(trim(p_name), 80), p_typed, p_path, left(p_fname, 150), p_size)
  on conflict (quiz_id, lower(email)) where kind = 'answer' do nothing;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.hr_save_extra(uuid, text, text, jsonb, text, text, int) to anon, authenticated;
`;
const HK_SQL_MARKS = `
-- ============================================================
-- PART 3 — typed-answer marks, "upload results", live ranks for students
-- Safe to run again.
-- ============================================================
alter table public.hr_quizzes add column if not exists results_published boolean not null default false;
alter table public.hr_quizzes add column if not exists results_published_at timestamptz;
alter table public.hr_attempts add column if not exists marks jsonb not null default '{}'::jsonb;
alter table public.hr_attempts add column if not exists bonus int not null default 0;
alter table public.hr_attempts add column if not exists emailed_at timestamptz;

-- Ranking = auto score + marks the admin added for typed answers. Anyone can read it (names only, no emails).
drop function if exists public.hr_leaderboard(uuid);
drop function if exists public.hr_leaderboard(uuid, text);
create or replace function public.hr_leaderboard(p_quiz uuid, p_email text default null)
returns table (pos bigint, name text, score int, max_score int, secs int, is_me boolean, final boolean)
language sql stable security definer set search_path = public as $$
  with r as (
    select a.name, (a.score + coalesce(a.bonus, 0))::int as sc, a.max_score, a.secs,
           lower(a.email) = lower(trim(coalesce(p_email, ''))) as me,
           rank() over (order by (a.score + coalesce(a.bonus, 0)) desc, a.secs asc) as rk
    from public.hr_attempts a
    where a.quiz_id = p_quiz and exists (select 1 from public.hr_quizzes z where z.id = p_quiz and z.published)
  )
  select r.rk, r.name, r.sc, r.max_score, r.secs, r.me,
         coalesce((select z.results_published from public.hr_quizzes z where z.id = p_quiz), false)
  from r where r.rk <= 50 or r.me order by r.rk, r.secs;
$$;
grant execute on function public.hr_leaderboard(uuid, text) to anon, authenticated;
`;
const HK_EDGE = `// File: api/send-results.js  (Vercel serverless function, same style as api/send-email.js)
// Vercel env vars needed: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    const k = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    return res.status(200).json({
      version: 'v4', RESEND_API_KEY: !!process.env.RESEND_API_KEY, SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!k, keyType: !k ? 'missing' : k.startsWith('eyJ') ? 'legacy service_role (ok)' : k.startsWith('sb_secret_') ? 'new secret key (ok)' : k.startsWith('sb_publishable_') ? 'WRONG: publishable key' : 'unknown format'
    });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const API_KEY = process.env.RESEND_API_KEY;
    const SB_URL = process.env.SUPABASE_URL;
    const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY not set' });
    if (!SB_URL || !SRV) return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set' });

    // 1) caller must be a logged-in Admin (checked with the caller's own login token)
    const token = String(req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Login required' });
    const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_6GqdbyBWEX7cIkTzcp9yvw_WYNp5GJh';
    const ar = await fetch(SB_URL + '/rest/v1/rpc/hr_is_admin', {
      method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: '{}'
    });
    if (ar.status === 401) return res.status(401).json({ error: 'Login expired - log in again' });
    const av = ar.ok ? await ar.json() : null;
    if (av !== true) return res.status(403).json({ error: 'Admins only', detail: 'hr_is_admin status ' + ar.status + ', result ' + JSON.stringify(av) });

    // service key: legacy service_role (eyJ...) or new secret key (sb_secret_...) both work
    const sbH = { apikey: SRV, 'Content-Type': 'application/json' };
    if (SRV.startsWith('eyJ')) sbH.Authorization = 'Bearer ' + SRV;
    const sb = (path, opt) => fetch(SB_URL + '/rest/v1/' + path, Object.assign({}, opt, {
      headers: Object.assign({}, sbH, (opt && opt.headers) || {})
    }));

    // 2) quiz + attempts
    const body = req.body || {};
    const quizId = String(body.quiz_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(quizId)) return res.status(400).json({ error: 'quiz_id required' });
    const qr = await (await sb('hr_quizzes?id=eq.' + quizId + '&select=title,results_published')).json();
    if (!Array.isArray(qr)) return res.status(500).json({ error: 'Database read failed - check SUPABASE_SERVICE_ROLE_KEY (' + (qr && qr.message || 'unknown') + ')' });
    const quiz = qr[0];
    if (!quiz || !quiz.results_published) return res.status(400).json({ error: 'Upload the results first' });
    const att = await (await sb('hr_attempts?quiz_id=eq.' + quizId + '&select=id,name,email,score,bonus,max_score,secs,emailed_at')).json();

    if (!Array.isArray(att)) return res.status(500).json({ error: 'Database read failed: ' + (att && att.message || 'unknown') });
    const rows = att.map(a => Object.assign({}, a, { total: a.score + (a.bonus || 0), pos: 0 }))
      .sort((a, b) => b.total - a.total || (a.secs || 0) - (b.secs || 0));
    let pos = 0, last = '';
    rows.forEach((r, i) => { const k = r.total + ':' + r.secs; if (k !== last) { pos = i + 1; last = k; } r.pos = pos; });

    const FROM = 'Hackathon Rivals <noreply@hackathonrivals.in>';
    const goodMail = e => { const s = String(e || '').trim(), a = s.indexOf('@'); return a > 0 && s.indexOf('.', a) > a + 1 && s.indexOf(' ') < 0 && s.length > 5; };
    const wanted = rows.filter(r => body.force || !r.emailed_at);
    const todo = wanted.filter(r => goodMail(r.email));          // one bad address would fail the whole batch, so skip it
    const bad = wanted.filter(r => !goodMail(r.email));
    let sent = 0; const errors = bad.slice(0, 3).map(r => 'invalid email skipped: ' + String(r.email || '(empty)').slice(0, 40));

    // 3) send in batches of 100 (one Resend call per batch = fast enough for Vercel)
    for (let i = 0; i < todo.length; i += 100) {
      if (i > 0) await new Promise(ok => setTimeout(ok, 600));   // stay under Resend's rate limit
      const chunk = todo.slice(i, i + 100);
      const mails = chunk.map(r => ({
        from: FROM, to: [String(r.email).trim()], subject: 'Your result - ' + quiz.title,
        html: '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f1119;color:#e9ebf2;border-radius:12px">'
          + '<h1 style="color:#7c5cff">Results are out! 🏆</h1>'
          + '<p>Hi <b>' + esc(r.name) + '</b>,</p>'
          + '<p>The results for <b style="color:#22d3ee">' + esc(quiz.title) + '</b> are final.</p>'
          + '<p><b>Your marks:</b> ' + r.total + (r.max_score ? ' / ' + r.max_score : '') + '<br><b>Your rank:</b> #' + r.pos + ' of ' + rows.length + '</p>'
          + '<p>You can also see the live rankings on the website.</p><p><b>— Team Hackathon Rivals</b></p></div>'
      }));
      const rr = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY }, body: JSON.stringify(mails)
      });
      if (rr.ok) {
        sent += chunk.length;
        await sb('hr_attempts?id=in.(' + chunk.map(r => r.id).join(',') + ')', {
          method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ emailed_at: new Date().toISOString() })
        });
      } else {
        let m = ''; try { m = (await rr.json()).message; } catch (e) {}
        errors.push('batch ' + (i / 100 + 1) + ': ' + (m || 'HTTP ' + rr.status));
      }
    }
    return res.status(200).json({ sent, failed: wanted.length - sent, errors: errors.slice(0, 5), total: wanted.length });
  } catch (err) {
    console.error('send-results error:', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
`;
const HK_SQL_VERIFY = `-- ============================================================
-- PART 4 — email verification for quizzes. Safe to run again.
-- RUN THIS LAST: deploy api/verify-email.js and the new index.html first,
-- because after this runs, quiz submissions need a verified email.
-- To switch it off again:
--   drop trigger if exists hr_attempts_verify on public.hr_attempts;
--   drop trigger if exists hr_quiz_files_verify on public.hr_quiz_files;
-- ============================================================
create table if not exists public.hr_email_codes (
  id bigserial primary key,
  email text not null,
  code_hash text not null,
  tries int not null default 0,
  used boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists hr_email_codes_email_idx on public.hr_email_codes (email, created_at desc);
create table if not exists public.hr_verified (
  token_hash text primary key,
  email text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.hr_email_codes enable row level security;
alter table public.hr_verified enable row level security;
revoke all on public.hr_email_codes from anon, authenticated;
revoke all on public.hr_verified from anon, authenticated;
grant all on public.hr_email_codes to service_role;
grant all on public.hr_verified to service_role;
grant usage, select on sequence public.hr_email_codes_id_seq to service_role;

create or replace function public.hr_token_ok(p_email text, p_token text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.hr_verified v
    where v.token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'utf8')), 'hex')
      and v.email = lower(trim(coalesce(p_email, '')))
      and v.expires_at > now());
$$;
revoke all on function public.hr_token_ok(text, text) from public, anon, authenticated;

create or replace function public.hr_require_verified()
returns trigger language plpgsql security definer set search_path = public as $$
declare tok text;
begin
  if public.hr_is_admin() then return new; end if;
  begin
    tok := (nullif(current_setting('request.headers', true), '')::json) ->> 'x-quiz-token';
  exception when others then tok := null;
  end;
  if tok is null then tok := current_setting('request.header.x-quiz-token', true); end if;
  if not public.hr_token_ok(new.email, tok) then raise exception 'EMAIL_NOT_VERIFIED'; end if;
  return new;
end $$;

drop trigger if exists hr_attempts_verify on public.hr_attempts;
create trigger hr_attempts_verify before insert on public.hr_attempts
  for each row execute function public.hr_require_verified();

do $do$
begin
  if to_regclass('public.hr_quiz_files') is not null then
    execute 'drop trigger if exists hr_quiz_files_verify on public.hr_quiz_files';
    execute 'create trigger hr_quiz_files_verify before insert on public.hr_quiz_files for each row when (new.kind = ''answer'') execute function public.hr_require_verified()';
  end if;
end $do$;
`;
const HK_SQL_REMIND = `-- ============================================================
-- PART 5 — quiz reminder / schedule-change emails. Safe to run again.
-- ============================================================
alter table public.hr_quizzes add column if not exists remind_sent_for timestamptz;
alter table public.hr_quizzes add column if not exists start_sent_for timestamptz;
alter table public.hr_quizzes add column if not exists time_changed_at timestamptz;
alter table public.hr_quizzes add column if not exists change_notified_at timestamptz;

-- remember when the exam schedule was edited (start, end or duration)
create or replace function public.hr_quiz_time_changed()
returns trigger language plpgsql as $$
begin
  if new.opens_at is distinct from old.opens_at
     or new.closes_at is distinct from old.closes_at
     or new.duration_min is distinct from old.duration_min then
    new.time_changed_at := now();
  end if;
  return new;
end $$;
drop trigger if exists hr_quiz_time_changed on public.hr_quizzes;
create trigger hr_quiz_time_changed before update on public.hr_quizzes
  for each row execute function public.hr_quiz_time_changed();
`;
const HK_SQL_LOCK = `-- ============================================================
-- PART 6 — question-paper link is hidden until the student is registered,
-- email-verified (OTP) and the quiz has started. Safe to run again.
-- Needs Part 2 (quiz-files.sql) and Part 4 step A (verify tables + hr_token_ok).
-- ============================================================
create or replace function public.hr_req_token() returns text language plpgsql stable as $$
declare tok text;
begin
  begin
    tok := (nullif(current_setting('request.headers', true), '')::json) ->> 'x-quiz-token';
  exception when others then tok := null;
  end;
  if tok is null then tok := current_setting('request.header.x-quiz-token', true); end if;
  return tok;
end $$;

-- nobody but the admin can read paper rows (and so the file path) directly any more
drop policy if exists hr_qf_read_paper on public.hr_quiz_files;

-- tells the quiz list only WHETHER a paper exists (no link)
create or replace function public.hr_papers_present()
returns table (quiz_id uuid) language sql stable security definer set search_path = public as $$
  select f.quiz_id from public.hr_quiz_files f join public.hr_quizzes z on z.id = f.quiz_id
  where f.kind = 'paper' and z.published;
$$;
grant execute on function public.hr_papers_present() to anon, authenticated;

-- the link itself: only for a registered, verified student after the quiz start time
create or replace function public.hr_quiz_paper(p_quiz uuid, p_email text)
returns table (file_path text, file_name text, file_size int)
language plpgsql stable security definer set search_path = public as $$
declare q record;
begin
  if not public.hr_is_admin() then
    select * into q from public.hr_quizzes z where z.id = p_quiz and z.published;
    if not found then return; end if;
    if q.opens_at is not null and now() < q.opens_at then return; end if;
    if q.closes_at is not null and now() > q.closes_at + make_interval(mins => coalesce(q.duration_min, 0)) then return; end if;
    if to_jsonb(q) ->> 'reg_closes_at' is not null and not exists (
         select 1 from public.hr_quiz_regs r
         where r.quiz_id = p_quiz and lower(r.email) = lower(trim(coalesce(p_email, '')))) then
      return;
    end if;
    if not public.hr_token_ok(p_email, public.hr_req_token()) then return; end if;
  end if;
  return query select f.file_path, f.file_name, f.file_size from public.hr_quiz_files f
    where f.quiz_id = p_quiz and f.kind = 'paper' limit 1;
end $$;
grant execute on function public.hr_quiz_paper(uuid, text) to anon, authenticated;
`;
const HK_SQL_CERT = `-- ============================================================
-- PART 7 — certificates (issue, view, verify). Safe to run again.
-- Needs: Part 4 step A (hr_token_ok) and Part 6 (hr_req_token).
-- ============================================================
create table if not exists public.hr_certificates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  quiz_id uuid not null references public.hr_quizzes(id) on delete cascade,
  email text not null,
  name text not null,
  kind text not null default 'participation' check (kind in ('participation', 'winner')),
  pos int,
  score int,
  max_score int,
  issued_at timestamptz not null default now(),
  emailed_at timestamptz,
  revoked boolean not null default false,
  unique (quiz_id, email)
);
alter table public.hr_certificates enable row level security;
drop policy if exists hr_cert_admin on public.hr_certificates;
create policy hr_cert_admin on public.hr_certificates for all using (public.hr_is_admin()) with check (public.hr_is_admin());
grant all on public.hr_certificates to service_role;

-- admin: issue (or update) certificates for a quiz whose results are published.
-- p_top  = how many top ranks are "winner" certificates
-- p_only_top = true  -> ONLY the top p_top students (ties included) get a certificate
--              false -> everyone gets one (top p_top = winner, the rest = participation)
-- Running it again keeps every certificate ID and link, and refreshes name / rank / score.
drop function if exists public.hr_issue_certificates(uuid, int);
create or replace function public.hr_issue_certificates(p_quiz uuid, p_top int default 3, p_only_top boolean default false)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.hr_is_admin() then raise exception 'ADMIN_ONLY'; end if;
  if not exists (select 1 from public.hr_quizzes z where z.id = p_quiz and z.results_published) then
    raise exception 'PUBLISH_RESULTS_FIRST';
  end if;
  with r as (
    select a.name, lower(trim(a.email)) as em, (a.score + coalesce(a.bonus, 0)) as sc, a.max_score,
           rank() over (order by (a.score + coalesce(a.bonus, 0)) desc, a.secs asc) as rk
    from public.hr_attempts a where a.quiz_id = p_quiz
  )
  insert into public.hr_certificates (code, quiz_id, email, name, kind, pos, score, max_score)
  select 'HR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)), p_quiz, r.em, r.name,
         case when r.rk <= greatest(coalesce(p_top, 0), 0) then 'winner' else 'participation' end,
         r.rk, r.sc, r.max_score
  from r
  where (not coalesce(p_only_top, false)) or r.rk <= greatest(coalesce(p_top, 0), 0)
  on conflict (quiz_id, email) do update
    set name = excluded.name, kind = excluded.kind, pos = excluded.pos, score = excluded.score, max_score = excluded.max_score;
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.hr_issue_certificates(uuid, int, boolean) to authenticated;

-- admin: delete the certificates of every student who is NOT in the current top p_top
create or replace function public.hr_prune_certificates(p_quiz uuid, p_top int)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.hr_is_admin() then raise exception 'ADMIN_ONLY'; end if;
  with r as (
    select lower(trim(a.email)) as em,
           rank() over (order by (a.score + coalesce(a.bonus, 0)) desc, a.secs asc) as rk
    from public.hr_attempts a where a.quiz_id = p_quiz
  )
  delete from public.hr_certificates c using r
  where c.quiz_id = p_quiz and c.email = r.em and r.rk > greatest(coalesce(p_top, 0), 0);
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.hr_prune_certificates(uuid, int) to authenticated;

-- signer name / title / logo / signature used on every certificate (set from Admin -> Results -> Design)
create table if not exists public.hr_cert_settings (
  id int primary key default 1 check (id = 1),
  signer_name text,
  signer_title text,
  logo text,
  signature text
);
alter table public.hr_cert_settings enable row level security;
drop policy if exists hr_cs_admin on public.hr_cert_settings;
create policy hr_cs_admin on public.hr_cert_settings for all using (public.hr_is_admin()) with check (public.hr_is_admin());
grant all on public.hr_cert_settings to service_role;
insert into public.hr_cert_settings (id) values (1) on conflict (id) do nothing;

-- certificates for HACKATHON TEAMS (the admin picks which teams and which award)
create table if not exists public.hr_team_certs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  reg_id text not null,
  event_title text not null,
  team_name text not null,
  holder text,
  college text,
  email text not null,
  award text not null default 'Participation'
    check (award in ('Participation', 'Winner', 'First Runner-up', 'Second Runner-up', 'Special Mention')),
  issued_at timestamptz not null default now(),
  emailed_at timestamptz,
  revoked boolean not null default false,
  unique (reg_id, event_title)
);
alter table public.hr_team_certs enable row level security;
drop policy if exists hr_tc_admin on public.hr_team_certs;
create policy hr_tc_admin on public.hr_team_certs for all using (public.hr_is_admin()) with check (public.hr_is_admin());
grant all on public.hr_team_certs to service_role;

-- admin: p_items = [{"reg_id": "...", "award": "Winner"}, ...]. Issues new ones, updates the award of existing ones.
create or replace function public.hr_issue_team_certificates(p_event text, p_items jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0;
begin
  if not public.hr_is_admin() then raise exception 'ADMIN_ONLY'; end if;
  if coalesce(trim(p_event), '') = '' then raise exception 'EVENT_REQUIRED'; end if;
  with it as (
    select (x ->> 'reg_id') as rid, coalesce(nullif(x ->> 'award', ''), 'Participation') as aw
    from jsonb_array_elements(p_items) x
  ), ins as (
    insert into public.hr_team_certs (code, reg_id, event_title, team_name, holder, college, email, award)
    select 'HR-T' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 11)), r.id::text, trim(p_event),
           left(r.team_name, 80), left(r.spoc_name, 80), left(r.college_name, 120), lower(trim(r.spoc_email)), it.aw
    from it join public.team_registrations r on r.id::text = it.rid
    on conflict (reg_id, event_title) do update
      set award = excluded.award, team_name = excluded.team_name, holder = excluded.holder,
          college = excluded.college, email = excluded.email
    returning 1
  )
  select count(*) into n from ins;
  return n;
end $$;
grant execute on function public.hr_issue_team_certificates(text, jsonb) to authenticated;

-- public: look up ONE certificate (quiz or team) by its code - used for the e-mail link and verification
drop function if exists public.hr_get_certificate(text);
create or replace function public.hr_get_certificate(p_code text)
returns table (code text, name text, kind text, pos int, score int, max_score int, issued_at timestamptz, revoked boolean,
               quiz_title text, signer_name text, signer_title text, logo text, signature text,
               award text, holder text, college text)
language sql stable security definer set search_path = public as $$
  with u as (
    select c.code, c.name, c.kind, c.pos, c.score, c.max_score, c.issued_at, c.revoked, z.title as quiz_title,
           null::text as award, null::text as holder, null::text as college
    from public.hr_certificates c join public.hr_quizzes z on z.id = c.quiz_id
    where c.code = upper(trim(p_code))
    union all
    select t.code, t.team_name, case when t.award = 'Participation' then 'participation' else 'winner' end,
           null::int, null::int, null::int, t.issued_at, t.revoked, t.event_title, t.award, t.holder, t.college
    from public.hr_team_certs t
    where t.code = upper(trim(p_code))
  )
  select u.code, u.name, u.kind, u.pos, u.score, u.max_score, u.issued_at, u.revoked, u.quiz_title,
         s.signer_name, s.signer_title, s.logo, s.signature, u.award, u.holder, u.college
  from u left join public.hr_cert_settings s on s.id = 1
  limit 1;
$$;
grant execute on function public.hr_get_certificate(text) to anon, authenticated;

-- public, only for an OTP-verified email: list that person's certificates (quiz + team)
drop function if exists public.hr_my_certificates(text);
create or replace function public.hr_my_certificates(p_email text)
returns table (code text, quiz_title text, kind text, issued_at timestamptz, award text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.hr_token_ok(p_email, public.hr_req_token()) then raise exception 'EMAIL_NOT_VERIFIED'; end if;
  return query
    select c.code, z.title, c.kind, c.issued_at, null::text
    from public.hr_certificates c join public.hr_quizzes z on z.id = c.quiz_id
    where c.email = lower(trim(p_email)) and not c.revoked
    union all
    select t.code, t.event_title, case when t.award = 'Participation' then 'participation' else 'winner' end, t.issued_at, t.award
    from public.hr_team_certs t
    where t.email = lower(trim(p_email)) and not t.revoked
    order by 4 desc;
end $$;
grant execute on function public.hr_my_certificates(text) to anon, authenticated;
`;
const HK_SQL_ANN = `-- ============================================================
-- PART 11 — announcement e-mails to ALL signed-up users (new quiz published / hackathon). Safe to run again.
-- Needs the scheduler secret table from quiz-reminders-scheduler.sql (hr_cron_secret).
-- ============================================================
alter table public.hr_quizzes add column if not exists announce_all boolean not null default false;

create table if not exists public.hr_broadcasts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('quiz', 'quiz_start', 'hackathon')),
  ref text not null,
  status text not null default 'queued' check (status in ('queued', 'sending', 'done', 'cancelled')),
  send_after timestamptz not null default now(),
  next_try_at timestamptz,
  total int not null default 0,
  sent int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  unique (kind, ref)
);
create table if not exists public.hr_broadcast_rcpt (
  broadcast_id uuid not null references public.hr_broadcasts(id) on delete cascade,
  email text not null,
  sent_at timestamptz,
  primary key (broadcast_id, email)
);
create index if not exists hr_broadcast_rcpt_pending on public.hr_broadcast_rcpt (broadcast_id) where sent_at is null;
create table if not exists public.hr_mail_optout (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.hr_broadcasts enable row level security;
alter table public.hr_broadcast_rcpt enable row level security;
alter table public.hr_mail_optout enable row level security;
drop policy if exists hr_bc_admin on public.hr_broadcasts;
create policy hr_bc_admin on public.hr_broadcasts for all using (public.hr_is_admin()) with check (public.hr_is_admin());
grant all on public.hr_broadcasts to service_role;
grant all on public.hr_broadcast_rcpt to service_role;
grant all on public.hr_mail_optout to service_role;

-- allow the "quiz has started" announcement kind (older installs had only quiz / hackathon)
alter table public.hr_broadcasts drop constraint if exists hr_broadcasts_kind_check;
alter table public.hr_broadcasts add constraint hr_broadcasts_kind_check check (kind in ('quiz', 'quiz_start', 'hackathon'));

-- when a quiz with "e-mail all users" ticked becomes published, queue ONE announcement (sent ~10 min later,
-- cancelled automatically if the quiz is unpublished before that)
create or replace function public.hr_quiz_announce()
returns trigger language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  if tg_op = 'INSERT' then
    ok := new.published and new.announce_all;
  else
    ok := new.published and new.announce_all and (not coalesce(old.published, false) or not coalesce(old.announce_all, false));
  end if;
  if ok then
    insert into public.hr_broadcasts (kind, ref, send_after) values ('quiz', new.id::text, now() + interval '10 minutes')
    on conflict (kind, ref) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists hr_quiz_announce_trg on public.hr_quizzes;
create trigger hr_quiz_announce_trg after insert or update on public.hr_quizzes
  for each row execute function public.hr_quiz_announce();

-- admin button: queue an announcement now. 'already_sent' = it was announced before (p_force = send again)
create or replace function public.hr_queue_broadcast(p_kind text, p_ref text default null, p_force boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare r text; n int;
begin
  if not public.hr_is_admin() then raise exception 'ADMIN_ONLY'; end if;
  if p_kind = 'quiz' then
    if not exists (select 1 from public.hr_quizzes z where z.id::text = p_ref and z.published) then
      raise exception 'QUIZ_NOT_PUBLISHED';
    end if;
    r := p_ref;
  elsif p_kind = 'hackathon' then
    select 'main:' || extract(epoch from e.starts_at)::bigint::text into r from public.hr_events e where e.id = 'main';
    if r is null then raise exception 'NO_EVENT'; end if;
  else
    raise exception 'BAD_KIND';
  end if;
  if p_force then r := r || '#' || extract(epoch from now())::bigint::text; end if;
  insert into public.hr_broadcasts (kind, ref, send_after) values (p_kind, r, now()) on conflict (kind, ref) do nothing;
  get diagnostics n = row_count;
  return case when n = 1 then 'queued' else 'already_sent' end;
end $$;
grant execute on function public.hr_queue_broadcast(text, text, boolean) to authenticated;

-- every minute Supabase calls /api/broadcast, which sends the next 100 e-mails of any queued announcement
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule(jobid) from cron.job where jobname = 'hr-broadcast';
select cron.schedule(
  'hr-broadcast', '* * * * *',
  $job$
  select net.http_get(
    url := 'https://hackathonrivals.in/api/broadcast?key=' || (select secret from public.hr_cron_secret where id = 1)
  );
  $job$
);
`;
const HK_SQL_ALL = HK_SQL + '\n' + HK_SQL_FILES + '\n' + HK_SQL_MARKS + '\n' + HK_SQL_VERIFY + '\n' + HK_SQL_REMIND + '\n' + HK_SQL_LOCK + '\n' + HK_SQL_CERT + '\n' + HK_SQL_ANN;

const AD = { sub: store.get('adminSub', 'hack'), c: null, qz: null, bank: { subj: 'all', sem: '-1', lvl: '0', q: '', lim: 25, edit: null, imp: null } };
const ADV = {};
const admErr = e => (e && e.status === 401 || e && e.status === 403 || /permission|policy|jwt|row-level/i.test(e && e.message || '')) ? 'Permission denied — log in as an Admin and make sure the SQL policies are installed.' : (e && e.message) || 'Something went wrong';

function adRender(){
  const c = AD.c; if (!c || !c.isConnected) return;
  if (!isAdminUI()) { c.innerHTML = '<p class="hrp-muted">Admin login required. Log in with an Admin account to manage the hackathon and question bank.</p>'; return; }
  const subs = [['hack', '🚀 Hackathon'], ['regs', '📋 Registrations'], ['quiz', '📝 Quizzes'], ['tcert', '🏅 Team certs'], ['bank', '🗂️ Question bank'], ['setup', '🔧 Setup'], ['gov', '📊 Insights'], ['proc', '🎥 Proctoring'], ['snaps', '📸 Snapshots']];
  c.innerHTML = `<div class="hrp-card" style="border-color:${HB.remote ? 'var(--green)' : 'var(--orange)'};margin-bottom:10px">${HB.remote ? '🟢 <b>Connected to the database</b> — changes are shared with every visitor.' : '🟠 <b>Local mode</b> — the database tables are not set up yet, so changes are saved only in this browser. Open <b>Setup</b> and run the SQL.'}<br><span class="hrp-muted">Time source: ${esc(HB.tsrc)} · admin rights are enforced by database policies, not by this screen.</span></div>
  <div class="hrp-row">${subs.map(([k, l]) => `<button class="hrp-tab${AD.sub === k ? ' active' : ''}" data-ad="nav" data-k="${k}">${l}</button>`).join('')}</div><div id="adB"></div>`;
  const f = ADV[AD.sub]; if (f) f($('#adB', c));
}
const adAct = {};
/* ---- Module 10: Insights — KPIs, proctoring violations, audit log ---- */
const xr = (fn, body) => pgrest('rpc/' + fn, { method: 'POST', body: body || {} });
const xAudit = (action, detail) => { if (HB.remote) xr('hr_x_audit_add', { p_action: action, p_detail: String(detail || '').slice(0, 300) }).catch(() => {}); };
document.addEventListener('click', e => { if (!isAdminUI()) return; const b = e.target.closest('[data-ad],#adminExportCSV,#adminExport,#adminDigest'); if (!b) return; const k = b.dataset.ad || b.id; if (/csv|export|xls|digest|announce/i.test(k)) xAudit('export', k); }, true);
ADV.gov = async box => {
  if (!HB.remote) { const L = store.get('x:viol', []); box.innerHTML = '<p class="hrp-muted">Database not connected — showing violations recorded in this browser only.</p>' + (L.map(v => `<div class="hrp-card" style="margin:4px 0">${esc(v.email || '—')} · ${esc(v.kind)} · ${esc(v.reason)}<br><span class="hrp-muted">${new Date(v.at).toLocaleString()}</span></div>`).join('') || '<p class="hrp-muted">None.</p>'); return; }
  box.innerHTML = '<p class="hrp-muted">Loading…</p>'; let K, V, A;
  try { [K, V, A] = await Promise.all([xr('hr_x_kpis'), xr('hr_x_viol_list'), xr('hr_x_audit_list')]); } catch(e){ box.innerHTML = '<p class="hrp-muted">' + esc(admErr(e)) + ' (Run hr-x-setup.sql in Supabase if you have not yet.)</p>'; return; }
  window.__gv = V; const kp = [['users', '👤 Users'], ['submissions', '🧪 Arena submissions'], ['quiz_attempts', '📝 Quiz attempts'], ['hack_regs', '🚀 Hackathon regs'], ['teams', '👥 Teams'], ['tickets', '🎟️ Tickets'], ['pending_colleges', '🏫 Pending proposals'], ['violations', '🚨 Violations']];
  box.innerHTML = `<div class="hrp-row" style="flex-wrap:wrap">${kp.map(([k, l]) => `<div class="hrp-card" style="min-width:130px"><div class="hrp-muted">${l}</div><b style="font-size:22px">${K && K[k] != null ? K[k] : '—'}</b></div>`).join('')}</div>`
    + (() => { const f = window.__gvf || '', RS = { new: '🆕 New', reviewing: '🔎 Reviewing', confirmed: '✅ Confirmed', dismissed: '🚫 Dismissed' }, st = v => v.review_status || 'new';
      return '<div class="hrp-h">🚨 Proctoring violations</div>' + (V.length ? '<div class="hrp-row" style="flex-wrap:wrap"><button class="hrp-btn" data-ad="gvcsv">⬇ CSV</button>' + [['', 'All']].concat(Object.entries(RS)).map(([k, l]) => `<button class="hrp-mini${f === k ? ' pri' : ''}" data-ad="gvf" data-s="${k}">${l}${k ? ' ' + V.filter(v => st(v) === k).length : ''}</button>`).join('') + '</div>' + (V.filter(v => !f || st(v) === f).slice(0, 50).map(v => `<div class="hrp-card" style="margin:4px 0"><b>${esc(v.email)}</b> · ${esc(v.kind)}${v.category ? ' · <i>' + esc(v.category) + '</i>' : ''} · ${esc(v.reason)}<br><span class="hrp-muted">${new Date(v.at).toLocaleString()} · ${esc(String(v.ref))}${v.zero ? ' · 🚫 zero mode' : ''} · ${RS[st(v)] || esc(st(v))}</span>${v.dq ? ' <b>· score 0 applied</b>' : ''}<div class="hrp-row" style="margin-top:6px"><select class="hrp-in sm" aria-label="Review status">${Object.entries(RS).map(([k, l]) => `<option value="${k}" ${st(v) === k ? 'selected' : ''}>${l}</option>`).join('')}</select><input class="hrp-in sm" maxlength="500" placeholder="Reviewer note" aria-label="Reviewer note" value="${esc(v.review_note || '')}"><button class="hrp-mini" data-ad="gvrev" data-id="${v.id}">Save review</button></div>${v.kind === 'quiz' && !v.dq ? `<div class="hrp-row"><button class="hrp-btn" data-ad="gdq" data-id="${v.id}">Set score 0</button></div>` : ''}</div>`).join('') || '<p class="hrp-muted">Nothing in this filter.</p>') : '<p class="hrp-muted">No violations recorded.</p>'); })()
    + '<div class="hrp-h">🧾 Audit log</div>' + (A.length ? A.slice(0, 30).map(a => `<div class="hrp-muted" style="margin:3px 0">${new Date(a.at).toLocaleString()} · ${esc(a.action)} · ${esc(a.detail || '')}</div>`).join('') : '<p class="hrp-muted">Nothing logged yet.</p>');
};
adAct.gvcsv = () => { const V = window.__gv || []; download('violations.csv', toCSV([['When', 'Email', 'Kind', 'Category', 'Quiz/ref', 'Reason', 'Zero mode', 'Score 0 applied', 'Review status', 'Reviewer note']].concat(V.map(v => [v.at, v.email, v.kind, v.category || '', v.ref, v.reason, v.zero, v.dq, v.review_status || 'new', v.review_note || '']))), 'text/csv'); };
adAct.gvf = b => { window.__gvf = b.dataset.s || ''; adRender(); };
adAct.gvrev = async b => { const c = b.closest('.hrp-card'); try { await xr('hr_x_review_set', { p_id: b.dataset.id, p_status: c.querySelector('select').value, p_note: c.querySelector('input').value.trim().slice(0, 500) }); toast('Review saved', 'success', '✅'); } catch(e){ toast(admErr(e) + ' (Run hr-x-fix-5.sql if you have not yet.)', 'warn', '⚠️'); return; } adRender(); };
adAct.gdq = async b => { if (!confirm('Set this student’s quiz score to 0?')) return; try { const n = await xr('hr_x_dq', { p_id: b.dataset.id }); toast(n ? 'Score set to 0' : 'Marked — no attempt row found yet', 'success', '✅'); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } adRender(); };

/* ---- Admin: Exam Proctoring Settings ---- */
const PD = { master: false, mode: 'off', quiz: true, mock: true, face: true, multi: true, voice_alert: true, autosubmit: true, face_grace: 8, multi_secs: 4, voice_secs: 5, cooldown: 30, max_warnings: 3, policy: 'allow', snaps: false, snap_secs: 60, retention_days: 7 };
ADV.proc = box => {
  const c = Object.assign({}, PD, (HB.ev && HB.ev.proctor_cfg) || {}), ck = (id, v, t) => `<label class="hrp-check"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}><span>${t}</span></label>`, num = (id, v, t, a, b) => `<label class="hrp-muted" style="display:block;margin-top:8px">${t} (${a}–${b})</label><input class="hrp-in" type="number" id="${id}" min="${a}" max="${b}" value="${v}">`;
  box.innerHTML = '<p class="hrp-muted">Camera/microphone checks run on the student\'s device only. Nothing is recorded or uploaded. Needs hr-x-fix-3.sql.</p>' + ck('pcM', c.master, '<b>Proctoring ON</b> — master switch (OFF disables every camera / microphone check)')
    + '<div class="hrp-h">Monitoring mode</div>' + [['video', '🎥 Video only'], ['voice', '🎤 Voice only'], ['both', '🎥🎤 Video + Voice'], ['off', '🚫 Both OFF']].map(([v, t]) => `<label class="hrp-check"><input type="radio" name="pcMode" value="${v}" ${c.mode === v ? 'checked' : ''}><span>${t}</span></label>`).join('')
    + '<div class="hrp-h">Applies to</div>' + ck('pcQ', c.quiz, 'Hackathon quizzes') + ck('pcK', c.mock, 'Mock exams / tests') + '<div class="hrp-h">Checks</div>' + ck('pcF', c.face, 'Face-missing alerts') + ck('pcMu', c.multi, 'Multiple-face alerts') + ck('pcV', c.voice_alert, 'Voice / sound-activity alerts (loudness only, cannot tell what is said)')
    + '<div class="hrp-h">Snapshots</div>' + ck('pcSn', c.snaps, 'Consent-based periodic snapshots (video modes; private; admins only)') + num('pcSS', c.snap_secs, 'Snapshot every, seconds', 30, 300) + num('pcRD', c.retention_days, 'Keep snapshots for, days', 1, 90)
    + num('pcFG', c.face_grace, 'Face-missing grace, seconds', 3, 60) + num('pcMS', c.multi_secs, 'Multiple faces for, seconds', 2, 30) + num('pcVS', c.voice_secs, 'Sustained sound for, seconds', 3, 30) + num('pcCD', c.cooldown, 'Cooldown between alerts, seconds', 10, 300) + num('pcMW', c.max_warnings, 'Warning limit', 1, 10)
    + ck('pcAS', c.autosubmit, 'Auto-submit once when the warning limit is reached (never sets a zero score)') + '<label class="hrp-muted" style="display:block;margin-top:8px">If a student declines camera/microphone</label><select class="hrp-in" id="pcPol"><option value="allow">Continue (logged)</option><option value="review">Continue and flag for admin review</option></select>'
    + '<div class="hrp-row" style="margin-top:10px"><button class="hrp-btn pri" data-ad="pcsave">💾 Save</button><button class="hrp-btn" data-ad="pccancel">Cancel</button><button class="hrp-btn" data-ad="pcreset">↩ Reset to default</button></div><div class="hk-msg" id="pcMsg"></div>';
  $('#pcPol', box).value = c.policy;
};
const pcSay = (t, ok) => { const m = $('#pcMsg', AD.c); if (m) { m.textContent = t; m.className = 'hk-msg ' + (ok ? 'ok' : 'err'); } };
const pcPut = async cfg => { if (!HB.remote) return pcSay('Needs the database connection.'); try { const r = await xr('hr_x_cfg_set', { p_cfg: cfg }); HB.ev = Object.assign({}, HB.ev, { proctor_cfg: r }); ADV.proc($('#adB', AD.c)); pcSay('✅ Saved. Applies to the next exam a student starts.', true); } catch(e){ pcSay(admErr(e) + ' (Run hr-x-fix-3.sql if you have not yet.)'); } };
adAct.pcsave = () => { const b = $('#adB', AD.c), v = id => $('#' + id, b), n = id => +v(id).value;
  pcPut({ master: v('pcM').checked, mode: (b.querySelector('input[name=pcMode]:checked') || {}).value || 'off', quiz: v('pcQ').checked, mock: v('pcK').checked, face: v('pcF').checked, multi: v('pcMu').checked, voice_alert: v('pcV').checked, autosubmit: v('pcAS').checked, face_grace: n('pcFG'), multi_secs: n('pcMS'), voice_secs: n('pcVS'), cooldown: n('pcCD'), max_warnings: n('pcMW'), policy: v('pcPol').value, snaps: v('pcSn').checked, snap_secs: n('pcSS'), retention_days: n('pcRD') }); };
adAct.pccancel = () => { ADV.proc($('#adB', AD.c)); pcSay('Changes discarded.', true); };
adAct.pcreset = () => pcPut(PD);

/* ---- Admin: private snapshots review ---- */
ADV.snaps = async box => {
  if (!HB.remote) { box.innerHTML = '<p class="hrp-muted">Needs the database connection.</p>'; return; }
  box.innerHTML = '<p class="hrp-muted">Loading…</p>'; let L; try { L = await xr('hr_x_snap_list', { p_limit: 60 }); } catch(e){ box.innerHTML = '<p class="hrp-muted">' + esc(admErr(e)) + ' (Run hr-x-fix-4.sql if you have not yet.)</p>'; return; }
  const okImg = s => /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(s.img || '');
  box.innerHTML = '<p class="hrp-muted">Private snapshots, visible to admins only and deleted automatically after the retention period.</p>' + (L.length ? '<div class="hrp-row" style="flex-wrap:wrap">' + L.filter(okImg).map(s => `<div class="hrp-card" style="width:150px"><img src="${s.img}" alt="snapshot" data-ad="snapbig" style="width:100%;border-radius:8px;cursor:pointer"><div class="hrp-muted" style="font-size:11px">${esc(s.email)}<br>${esc(s.ref || '')} · ${new Date(s.at).toLocaleString()}</div><button class="hrp-mini" data-ad="snapdel" data-e="${esc(s.email)}" data-r="${esc(s.ref || '')}">Delete this student's</button></div>`).join('') + '</div>' : '<p class="hrp-muted">No snapshots.</p>');
};
adAct.snapbig = b => { const w = document.createElement('div'); w.style.cssText = 'position:fixed;inset:0;z-index:100002;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:14px'; w.innerHTML = '<img alt="snapshot" style="max-width:100%;max-height:100%;border-radius:10px">'; w.querySelector('img').src = b.src; w.onclick = () => w.remove(); document.body.appendChild(w); };
adAct.snapdel = async b => { if (!confirm('Delete this student\'s snapshots for this exam?')) return; try { await xr('hr_x_snap_del', { p_email: b.dataset.e, p_ref: b.dataset.r }); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } ADV.snaps($('#adB', AD.c)); };

TABS.push(['admin', '🛡️ Admin', c => { AD.c = c; adRender(); c.onclick = e => { const b = e.target.closest('[data-ad]'); if (!b || b.disabled) return; const f = adAct[b.dataset.ad]; if (f) f(b, e); };
  c.onchange = c.oninput = e => { const f = adAct['chg:' + (e.target.dataset.ch || '')]; if (f) f(e.target, e); }; }, isAdminUI]);
adAct.nav = b => { AD.sub = b.dataset.k; store.set('adminSub', AD.sub); AD.bank.edit = null; AD.qz = null; adRender(); };
feat('Admin console tab (visible only when an Admin is logged in)', () => {});
window.__hrMountAdmin = c => { const t = TABS.find(x => x[0] === 'admin'); if (t) t[2](c); };
{ const t = TABS.find(x => x[0] === 'admin'); if (t) t[3] = () => false; }

/* ---------- Hackathon settings ---------- */
ADV.hack = box => {
  const e = HB.ev, st = evState(); const s = Date.parse(e.starts_at), c = Date.parse(e.reg_closes_at), en = e.ends_at ? Date.parse(e.ends_at) : 0;
  box.innerHTML = `<div class="hrp-card"><b>Status now:</b> ${st.phase === 'live' ? '🔴 Live' : st.phase === 'ended' ? 'Ended' : '⏳ Upcoming'} · registration ${st.regOpen ? '<b style="color:var(--green)">open</b>' : '<b style="color:var(--pink)">closed</b>'}</div>
  <label class="hrp-muted">Event name</label><input class="hrp-in" id="adName" value="${esc(e.name)}" maxlength="100" style="margin-bottom:8px">
  <div class="hrp-row"><label>Starts <input type="datetime-local" class="hrp-in" id="adStart" value="${localInput(new Date(s))}" style="width:auto"></label><label>Registration closes <input type="datetime-local" class="hrp-in" id="adClose" value="${localInput(new Date(c))}" style="width:auto"></label><label>Ends (optional) <input type="datetime-local" class="hrp-in" id="adEnd" value="${en ? localInput(new Date(en)) : ''}" style="width:auto"></label></div>
  <p class="hrp-muted">Times use your device time zone: ${esc(Intl.DateTimeFormat().resolvedOptions().timeZone)}. Visitors always see IST.</p>
  <label class="hrp-muted">Message shown on the page</label><textarea class="hrp-ta" id="adMsg" style="min-height:70px;font-family:inherit">${esc(e.message || '')}</textarea>
  <label class="hrp-check"><input type="checkbox" id="adOpen" ${e.reg_open !== false ? 'checked' : ''}><span>Registration switch is ON (untick to close registration immediately)</span></label>
  <label class="hrp-check"><input type="checkbox" id="adLock" ${e.lock_main !== false ? 'checked' : ''}><span>Also lock the site’s main team-registration form when time is up</span></label>
  <label class="hrp-check"><input type="checkbox" id="adProctor" ${e.proctor !== false ? 'checked' : ''}><span>🛡️ Exam guard ON — during a test/quiz, switching tab/app or a screenshot/print attempt auto-submits it</span></label>
  <label class="hrp-check"><input type="checkbox" id="adProctorZero" ${e.proctor_zero === true ? 'checked' : ''}><span>🚫 Also score a hackathon quiz 0 (disqualify) when a violation happens — run hr-x-setup.sql once</span></label>
  <label class="hrp-check"><input type="checkbox" id="adProctorRetry" ${e.proctor_retry === true ? 'checked' : ''}><span>🔁 After a rule-break (score 0) let the student re-attempt ONCE, with the same time that was left — run hr-x-fix-2.sql once</span></label>
  <label class="hrp-muted" style="display:block;margin-top:8px">🔁 Quiz re-attempts allowed per student (0 = off, max 5). A re-attempt starts from 0 marks and replaces the old attempt — run hr-x-fix-6.sql once</label><input class="hrp-in" type="number" id="adQuizRetry" min="0" max="5" value="${Math.max(0, +e.quiz_retry || 0)}">
  <div class="hrp-row"><button class="hrp-btn pri" data-ad="hsave">Save changes</button><button class="hrp-btn" data-ad="hclose">Close registration now</button><button class="hrp-btn" data-ad="hopen">Reopen (switch ON)</button><button class="hrp-btn" data-ad="hannounce">📣 Announce to all users</button></div><div class="hk-msg" id="adMsgOut"></div>
  <div class="hrp-h">📣 Announcements to all signed-up users</div><div id="bcStatus" class="hrp-muted">Loading…</div>`;
  setTimeout(bcStatusLoad, 80);
};
async function adSaveEvent(patch, okMsg){
  const out = $('#adMsgOut', AD.c);
  try { await saveEvent({ ...HB.ev, ...patch }); await syncTime(); renderHackathon(); applyMainLock(); updateOldBox(); tickHack(); toast(okMsg || 'Saved', 'success', '✅'); adRender(); }
  catch(e){ if (out) { out.textContent = admErr(e); out.className = 'hk-msg err'; } }
}
adAct.hsave = () => { const c = AD.c, out = $('#adMsgOut', c); const s = new Date($('#adStart', c).value).getTime(); let cl = new Date($('#adClose', c).value).getTime(); const en = $('#adEnd', c).value ? new Date($('#adEnd', c).value).getTime() : null;
  if (!isFinite(s)) { out.textContent = 'Pick a valid start time.'; out.className = 'hk-msg err'; return; } if (!isFinite(cl)) cl = s;
  adSaveEvent({ name: $('#adName', c).value.trim() || HK_DEFAULT.name, starts_at: new Date(s).toISOString(), reg_closes_at: new Date(cl).toISOString(), ends_at: en ? new Date(en).toISOString() : null, message: $('#adMsg', c).value.trim(), reg_open: $('#adOpen', c).checked, proctor: $('#adProctor', c).checked, proctor_zero: $('#adProctorZero', c).checked, proctor_retry: $('#adProctorRetry', c).checked, quiz_retry: Math.max(0, Math.min(5, Math.floor(+$('#adQuizRetry', c).value || 0))), lock_main: $('#adLock', c).checked }, 'Hackathon settings saved'); };
adAct.hclose = () => adSaveEvent({ reg_open: false }, 'Registration closed');
adAct.hopen = () => { const st = evState(); adSaveEvent({ reg_open: true }, st.n >= st.c ? 'Switch is ON, but the closing time has already passed — move “Registration closes” to a later time' : 'Registration reopened'); };

/* ---------- Registrations ---------- */
ADV.regs = async box => {
  if (!HB.remote) { box.innerHTML = '<div class="hrp-card"><b>Registrations are arriving by email</b>The database is not connected, so each hackathon registration is being sent to your Formspree inbox (the same one used by the contact form). Run the SQL in <b>Setup</b> to store and manage registrations here.</div>'; return; }
  box.innerHTML = '<p class="hrp-muted">Loading…</p>';
  try { const rows = await pgrest('hr_registrations?select=*&order=created_at.desc'); AD.regs = rows;
    box.innerHTML = `<div class="hrp-row"><b>${rows.length} team${rows.length === 1 ? '' : 's'} registered</b><input class="hrp-in sm" data-ch="rs" placeholder="Search…" aria-label="Search"><button class="hrp-btn" data-ad="rcsv">⬇ CSV</button></div><div id="rgT" style="overflow:auto"></div>`; adRegTable(''); }
  catch(e){ box.innerHTML = `<p class="hrp-muted">❌ ${esc(admErr(e))}</p>`; }
};
function adRegTable(q){ const rows = (AD.regs || []).filter(r => !q || JSON.stringify(r).toLowerCase().includes(q)); const t = $('#rgT', AD.c); if (!t) return;
  t.innerHTML = `<table class="hrp-table"><tr><th>Team</th><th>Leader</th><th>Email</th><th>Phone</th><th>College</th><th>Size</th><th>When</th><th></th></tr>${rows.map(r => `<tr><td>${esc(r.team_name)}</td><td>${esc(r.leader_name)}</td><td>${esc(r.email)}</td><td>${esc(r.phone)}</td><td>${esc(r.college)}</td><td>${esc(r.team_size)}</td><td>${new Date(r.created_at).toLocaleString()}</td><td><button class="hrp-x" data-ad="rdel" data-id="${esc(r.id)}" aria-label="Delete">✕</button></td></tr>`).join('')}</table>`; }
adAct['chg:rs'] = t => adRegTable(t.value.trim().toLowerCase());
adAct.rcsv = () => { const r = AD.regs || []; download('hackathon-registrations.csv', toCSV([['Team', 'Leader', 'Email', 'Phone', 'College', 'Team size', 'Members', 'Track', 'Notes', 'Registered at']].concat(r.map(x => [x.team_name, x.leader_name, x.email, x.phone, x.college, x.team_size, x.members, x.track, x.notes, x.created_at]))), 'text/csv'); };
adAct.rdel = async b => { if (!confirm('Delete this registration?')) return; try { await pgrest('hr_registrations?id=eq.' + encodeURIComponent(b.dataset.id), { method: 'DELETE' }); AD.regs = AD.regs.filter(r => r.id !== b.dataset.id); adRegTable($('[data-ch=rs]', AD.c).value.toLowerCase()); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } };

/* ---------- Hackathon quizzes ---------- */
const QZ = {
  async list(){ if (HB.remote) return await pgrest('hr_quizzes?select=*&order=created_at.desc'); return store.get('hk:lq', []); },
  async save(q){ if (HB.remote) await pgrest('hr_quizzes?on_conflict=id', { method: 'POST', headers: UPSERT, body: [q] }); else { const l = store.get('hk:lq', []).filter(x => x.id !== q.id); l.unshift(q); store.set('hk:lq', l); } },
  async del(id){ if (HB.remote) await pgrest('hr_quizzes?id=eq.' + encodeURIComponent(id), { method: 'DELETE' }); else { store.set('hk:lq', store.get('hk:lq', []).filter(x => x.id !== id)); store.del('hk:lqq:' + id); } },
  async qs(id){
    if (!HB.remote) return store.get('hk:lqq:' + id, []);
    const qs = await pgrest(`hr_quiz_questions?quiz_id=eq.${encodeURIComponent(id)}&select=*&order=pos`); if (!qs.length) return [];
    const keys = await pgrest(`hr_quiz_keys?question_id=in.(${qs.map(x => x.id).join(',')})&select=*`); const km = {}; keys.forEach(k => km[k.question_id] = k);
    return qs.map(x => ({ ...x, answer: (km[x.id] || {}).answer ?? 0, explanation: (km[x.id] || {}).explanation || '' }));
  },
  async saveQ(quizId, arr){
    if (!HB.remote) { const cur = store.get('hk:lqq:' + quizId, []); arr.forEach(a => { const i = cur.findIndex(x => x.id === a.id); if (i >= 0) cur[i] = a; else cur.push(a); }); cur.sort((a, b) => a.pos - b.pos); store.set('hk:lqq:' + quizId, cur); return; }
    await pgrest('hr_quiz_questions?on_conflict=id', { method: 'POST', headers: UPSERT, body: arr.map(a => ({ id: a.id, quiz_id: quizId, pos: a.pos, text: a.text, options: a.options, points: a.points })) });
    await pgrest('hr_quiz_keys?on_conflict=question_id', { method: 'POST', headers: UPSERT, body: arr.map(a => ({ question_id: a.id, answer: a.answer, explanation: a.explanation || '' })) });
  },
  async delQ(quizId, id){ if (HB.remote) await pgrest('hr_quiz_questions?id=eq.' + encodeURIComponent(id), { method: 'DELETE' }); else store.set('hk:lqq:' + quizId, store.get('hk:lqq:' + quizId, []).filter(x => x.id !== id)); },
  async attempts(id){ if (HB.remote) return await pgrest(`hr_attempts?quiz_id=eq.${encodeURIComponent(id)}&select=*&order=score.desc,secs.asc`); return store.get('hk:latt:' + id, []); }
};
ADV.quiz = async box => {
  if (AD.qz && AD.qz.mode === 'edit') return adQuizEditor(box);
  if (AD.qz && AD.qz.mode === 'results') return adQuizResults(box);
  box.innerHTML = '<p class="hrp-muted">Loading…</p>';
  try { const list = await QZ.list(); AD.qzList = list; AD.papers = {}; if (HB.remote) { try { (await pgrest('hr_quiz_files?kind=eq.paper&select=quiz_id,file_name')).forEach(r => { AD.papers[r.quiz_id] = r; }); } catch(e){} }
    box.innerHTML = `<div class="hrp-row"><button class="hrp-btn pri" data-ad="qnew">➕ New quiz</button></div>${list.map(q => `<div class="hrp-card" style="margin:8px 0"><b>${esc(q.title)}</b> ${q.published ? '<span class="hk-pill ok">published</span>' : '<span class="hk-pill">draft</span>'}<div class="hrp-muted">${q.duration_min} min${AD.papers[q.id] ? ' · 📄 paper attached' : ''}${q.opens_at ? ' · opens ' + new Date(q.opens_at).toLocaleString() : ''}${q.closes_at ? ' · closes ' + new Date(q.closes_at).toLocaleString() : ''}${q.reg_closes_at ? ' · registration ' + (q.reg_opens_at ? new Date(q.reg_opens_at).toLocaleString() + ' → ' : 'until ') + new Date(q.reg_closes_at).toLocaleString() : ''}</div>
    <div class="hrp-row" style="margin:8px 0 0"><button class="hrp-mini" data-ad="qopen" data-id="${esc(q.id)}">✏️ Edit & questions</button><button class="hrp-mini" data-ad="qpub" data-id="${esc(q.id)}">${q.published ? 'Unpublish' : 'Publish'}</button><button class="hrp-mini" data-ad="qres" data-id="${esc(q.id)}">📊 Results</button><button class="hrp-mini" data-ad="qregs" data-id="${esc(q.id)}">📋 Registrations CSV</button><button class="hrp-mini" data-ad="qmailnow" data-id="${esc(q.id)}">📧 Send start email</button><button class="hrp-mini" data-ad="qannounce" data-id="${esc(q.id)}">📣 Announce to all users</button><button class="hrp-mini" data-ad="qdel" data-id="${esc(q.id)}">🗑 Delete</button></div></div>`).join('') || '<p class="hrp-muted">No quizzes yet. Click “New quiz” to create one for your hackathon.</p>'}`; }
  catch(e){ box.innerHTML = `<p class="hrp-muted">❌ ${esc(admErr(e))}</p>`; }
};
adAct.qnew = () => { AD.qz = { mode: 'edit', quiz: { id: uid(), title: '', description: '', duration_min: 30, opens_at: null, closes_at: null, published: false, isNew: true }, qs: [], editQ: null }; adRender(); };
adAct.qopen = async b => { const q = AD.qzList.find(x => x.id === b.dataset.id); try { AD.qz = { mode: 'edit', quiz: { ...q }, qs: await QZ.qs(q.id), editQ: null, paper: await FILES.paper(q.id) }; adRender(); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } };
adAct.qpub = async b => { const q = AD.qzList.find(x => x.id === b.dataset.id); try { await QZ.save({ ...q, published: !q.published }); renderQuizList(); adRender(); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } };
adAct.qdel = async b => { if (!confirm('Delete this quiz and all its questions and results?')) return; try { await QZ.del(b.dataset.id); renderQuizList(); adRender(); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } };
adAct.qres = async b => { const q = AD.qzList.find(x => x.id === b.dataset.id); try { AD.qz = { mode: 'results', quiz: q, rows: await QZ.attempts(q.id), files: await FILES.answers(q.id), qs: await QZ.qs(q.id).catch(() => []) }; adRender(); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } };
adAct.qmailnow = async b => {
  const q = AD.qzList.find(x => x.id === b.dataset.id); if (!q) return;
  if (!confirm('Email the start notice for "' + q.title + '" to every registered student who has not attempted it yet?')) return;
  const tok = sbToken();
  try {
    const r = await fetch('/api/quiz-reminders', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: JSON.stringify({ quiz_id: q.id, kind: 'start' }) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 404) throw new Error('api/quiz-reminders.js is not deployed');
    if (!r.ok || !j.ok) throw new Error(j.error || 'HTTP ' + r.status);
    toast(j.sent + ' email(s) sent · ' + j.registered + ' registered' + (j.failed ? ' · ' + j.failed + ' failed' : ''), j.sent ? 'success' : 'warn', '📧');
  } catch(e){ toast(e.message || String(e), 'warn', '⚠️'); }
};
adAct.qback = () => { AD.qz = null; adRender(); };
function adQuizEditor(box){
  const { quiz, qs, editQ } = AD.qz;
  const form = editQ ? `<div class="hrp-card" style="margin:10px 0"><b>${editQ.isNew ? 'New question' : 'Edit question'}</b><textarea class="hrp-ta" id="aqT" style="min-height:70px;font-family:inherit;margin:6px 0" placeholder="Question">${esc(editQ.text)}</textarea>${[0, 1, 2, 3].map(i => `<input class="hrp-in" id="aqO${i}" placeholder="Option ${'ABCD'[i]}" value="${esc((editQ.options || [])[i] || '')}" style="margin-bottom:6px">`).join('')}
    <div class="hrp-row"><label>Correct <select class="hrp-sel hrp-in" id="aqA" style="width:auto">${[0, 1, 2, 3].map(i => `<option value="${i}"${editQ.answer === i ? ' selected' : ''}>${'ABCD'[i]}</option>`).join('')}</select></label><label>Points <input class="hrp-in" id="aqP" type="number" min="1" max="100" value="${editQ.points || 1}" style="width:90px"></label></div>
    <textarea class="hrp-ta" id="aqE" style="min-height:50px;font-family:inherit" placeholder="Explanation (optional)">${esc(editQ.explanation || '')}</textarea><div class="hk-msg" id="aqM"></div><div class="hrp-row"><button class="hrp-btn pri" data-ad="qqsave">Save question</button><button class="hrp-btn" data-ad="qqcancel">Cancel</button></div></div>` : '';
  box.innerHTML = `<div class="hrp-row"><button class="hrp-tab" data-ad="qback">← Quizzes</button><b>${quiz.isNew ? 'New quiz' : 'Edit quiz'}</b></div>
  <input class="hrp-in" id="aqTitle" placeholder="Quiz title" value="${esc(quiz.title)}" maxlength="120" style="margin-bottom:8px"><textarea class="hrp-ta" id="aqDesc" style="min-height:60px;font-family:inherit" placeholder="Short description / instructions">${esc(quiz.description || '')}</textarea>
  <div class="hrp-row"><label>Duration (min) <input class="hrp-in" id="aqDur" type="number" min="1" max="600" value="${quiz.duration_min}" style="width:90px"></label><label>Opens <input class="hrp-in" id="aqOp" type="datetime-local" value="${quiz.opens_at ? localInput(new Date(quiz.opens_at)) : ''}" style="width:auto"></label><label>Closes <input class="hrp-in" id="aqCl" type="datetime-local" value="${quiz.closes_at ? localInput(new Date(quiz.closes_at)) : ''}" style="width:auto"></label></div>
  <div class="hrp-row"><label>Registration opens <input class="hrp-in" id="aqRo" type="datetime-local" value="${quiz.reg_opens_at ? localInput(new Date(quiz.reg_opens_at)) : ''}" style="width:auto"></label><label>Registration closes <input class="hrp-in" id="aqRc" type="datetime-local" value="${quiz.reg_closes_at ? localInput(new Date(quiz.reg_closes_at)) : ''}" style="width:auto"></label></div><p class="hrp-muted">Leave both empty if no registration is needed. Exam can only be taken by registered emails when a registration deadline is set.</p>
  <label class="hrp-check"><input type="checkbox" id="aqPub" ${quiz.published ? 'checked' : ''}><span>Published (visible to participants inside its open window)</span></label>
  <label class="hrp-check"><input type="checkbox" id="aqAnn" ${quiz.isNew || quiz.announce_all ? 'checked' : ''}><span>📣 Email ALL signed-up users when this quiz is published (about 10 minutes later) and again when it starts. Each only once. Untick for test quizzes.</span></label><div class="hk-msg" id="aqMsg"></div><div class="hrp-row"><button class="hrp-btn pri" data-ad="qsave">Save quiz</button></div>
  <div class="hrp-h">Question paper / file upload</div>${paperCardHtml()}
  <div class="hrp-h">Questions (${qs.length})</div><div class="hrp-row"><button class="hrp-btn" data-ad="qqnew">➕ Add question</button><button class="hrp-btn" data-ad="qqimp">⬆ Bulk import</button></div>${form}
  ${qs.map((x, i) => `<div class="hrp-card" style="margin:8px 0"><b>${i + 1}. ${esc(x.text)}</b><div class="hrp-muted">${(x.options || []).map((o, k) => (k === x.answer ? '✅ ' : '') + 'ABCD'[k] + ') ' + esc(o)).join('  ·  ')} · ${x.points} pt</div><div class="hrp-row" style="margin:6px 0 0"><button class="hrp-mini" data-ad="qqedit" data-id="${esc(x.id)}">Edit</button><button class="hrp-mini" data-ad="qqdel" data-id="${esc(x.id)}">Delete</button></div></div>`).join('')}
  <div id="qImp"></div>`;
  if (AD.qz.imp) { const im = $('#qImp', box); im.innerHTML = `<div class="hrp-card"><b>Bulk import questions</b><p class="hrp-muted">CSV columns: <code>question, A, B, C, D, answer, points, explanation</code> (answer = A–D). Or a JSON array of objects with the same keys.</p><textarea class="hrp-ta" id="qImpT" style="min-height:120px"></textarea><div class="hrp-row"><button class="hrp-btn pri" data-ad="qimpgo">Import</button><button class="hrp-btn" data-ad="qimpx">Cancel</button></div><div class="hk-msg" id="qImpM"></div></div>`; }
}
adAct.qsave = async () => { const c = AD.c, m = $('#aqMsg', c), q = AD.qz.quiz; const t = $('#aqTitle', c).value.trim(); if (!t) { m.textContent = 'Give the quiz a title.'; m.className = 'hk-msg err'; return; }
  const op = $('#aqOp', c).value, cl = $('#aqCl', c).value; const o = { id: q.id, title: t, description: $('#aqDesc', c).value.trim(), duration_min: Math.min(600, Math.max(1, +$('#aqDur', c).value || 30)), opens_at: op ? new Date(op).toISOString() : null, closes_at: cl ? new Date(cl).toISOString() : null, published: $('#aqPub', c).checked };
  if (await annSupported()) o.announce_all = $('#aqAnn', c).checked;
  { const ro = $('#aqRo', c).value, rc = $('#aqRc', c).value; if (ro || rc || q.reg_opens_at || q.reg_closes_at) { o.reg_opens_at = ro ? new Date(ro).toISOString() : null; o.reg_closes_at = rc ? new Date(rc).toISOString() : null; } }
  try { await QZ.save(o); AD.qz.quiz = { ...o }; renderQuizList(); m.textContent = 'Quiz saved ✔ — now add questions below.'; m.className = 'hk-msg ok'; } catch(e){ m.textContent = admErr(e); m.className = 'hk-msg err'; } };
adAct.qregs = async b => { try { const rows = await pgrest('hr_quiz_regs?quiz_id=eq.' + encodeURIComponent(b.dataset.id) + '&select=name,email,phone,college,created_at&order=created_at'); download('exam-registrations.csv', toCSV([['name', 'email', 'phone', 'college', 'registered_at'], ...rows.map(r => [r.name, r.email, r.phone, r.college, r.created_at])]), 'text/csv'); toast(rows.length + ' registration(s) exported', 'success', '⬇'); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } };
adAct.qqnew = () => { AD.qz.editQ = { id: uid(), text: '', options: ['', '', '', ''], answer: 0, points: 1, explanation: '', isNew: true }; adRender(); };
adAct.qqedit = b => { AD.qz.editQ = { ...AD.qz.qs.find(x => x.id === b.dataset.id) }; adRender(); };
adAct.qqcancel = () => { AD.qz.editQ = null; adRender(); };
adAct.qqsave = async () => { const c = AD.c, m = $('#aqM', c), e = AD.qz.editQ; const text = $('#aqT', c).value.trim(), opts = [0, 1, 2, 3].map(i => $('#aqO' + i, c).value.trim());
  if (!text || opts.some(x => !x)) { m.textContent = 'Fill the question and all four options.'; m.className = 'hk-msg err'; return; }
  const item = { id: e.id, pos: e.pos ?? (AD.qz.qs.length ? Math.max(...AD.qz.qs.map(x => x.pos ?? 0)) + 1 : 1), text, options: opts, answer: +$('#aqA', c).value, points: Math.min(100, Math.max(1, +$('#aqP', c).value || 1)), explanation: $('#aqE', c).value.trim() };
  try { const ex = await QZ.list(); if (!ex.some(x => x.id === AD.qz.quiz.id)) await QZ.save({ id: AD.qz.quiz.id, title: AD.qz.quiz.title || 'Untitled quiz', description: AD.qz.quiz.description || '', duration_min: AD.qz.quiz.duration_min || 30, opens_at: AD.qz.quiz.opens_at, closes_at: AD.qz.quiz.closes_at, published: false });
    await QZ.saveQ(AD.qz.quiz.id, [item]); AD.qz.qs = await QZ.qs(AD.qz.quiz.id); AD.qz.editQ = null; adRender(); } catch(er){ m.textContent = admErr(er); m.className = 'hk-msg err'; } };
adAct.qqdel = async b => { if (!confirm('Delete this question?')) return; try { await QZ.delQ(AD.qz.quiz.id, b.dataset.id); AD.qz.qs = await QZ.qs(AD.qz.quiz.id); adRender(); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } };
adAct.qqimp = () => { AD.qz.imp = true; adRender(); }; adAct.qimpx = () => { AD.qz.imp = false; adRender(); };
adAct.qimpgo = async () => { const c = AD.c, m = $('#qImpM', c), raw = $('#qImpT', c).value.trim(); if (!raw) return; let items = [];
  try { if (/^[\[{]/.test(raw)) { const j = JSON.parse(raw); items = (Array.isArray(j) ? j : [j]).map(o => ({ text: o.question || o.text, options: o.options || [o.A, o.B, o.C, o.D], ans: o.answer, points: o.points, expl: o.explanation })); }
    else { const rows = parseCSV(raw); const h = rows[0].map(x => x.trim().toLowerCase()); const has = h.includes('question'); const body = has ? rows.slice(1) : rows; const ix = k => has ? h.indexOf(k) : ['question', 'a', 'b', 'c', 'd', 'answer', 'points', 'explanation'].indexOf(k);
      items = body.map(r => ({ text: r[ix('question')], options: ['a', 'b', 'c', 'd'].map(k => r[ix(k)]), ans: r[ix('answer')], points: r[ix('points')], expl: r[ix('explanation')] })); }
    const base = AD.qz.qs.length ? Math.max(...AD.qz.qs.map(x => x.pos ?? 0)) : 0; const arr = []; const bad = [];
    items.forEach((o, i) => { const opts = (o.options || []).map(x => String(x ?? '').trim()); let a = String(o.ans ?? '').trim().toUpperCase(); a = 'ABCD'.includes(a) && a ? 'ABCD'.indexOf(a) : (+a >= 1 && +a <= 4 ? +a - 1 : -1);
      if (!o.text || opts.length !== 4 || opts.some(x => !x) || a < 0) { bad.push(i + 1); return; } arr.push({ id: uid(), pos: base + arr.length + 1, text: String(o.text).trim(), options: opts, answer: a, points: Math.min(100, Math.max(1, parseInt(o.points, 10) || 1)), explanation: String(o.expl || '').trim() }); });
    if (!arr.length) { m.textContent = 'No valid questions found.' + (bad.length ? ' Check rows: ' + bad.join(', ') : ''); m.className = 'hk-msg err'; return; }
    const ex = await QZ.list(); if (!ex.some(x => x.id === AD.qz.quiz.id)) await QZ.save({ id: AD.qz.quiz.id, title: AD.qz.quiz.title || 'Untitled quiz', description: AD.qz.quiz.description || '', duration_min: AD.qz.quiz.duration_min || 30, opens_at: AD.qz.quiz.opens_at, closes_at: AD.qz.quiz.closes_at, published: false });
    await QZ.saveQ(AD.qz.quiz.id, arr); AD.qz.qs = await QZ.qs(AD.qz.quiz.id); AD.qz.imp = false; adRender(); toast(`Imported ${arr.length} question(s)` + (bad.length ? `, skipped ${bad.length}` : ''), 'success', '⬆'); }
  catch(e){ m.textContent = admErr(e); m.className = 'hk-msg err'; } };
feat('Admin: create hackathon quizzes, add questions one by one or by CSV/JSON import, publish, view results', () => {});
/* ---------- Quiz files: question paper (admin upload) + participant typed answers / PDFs ---------- */
const FILES = {
  async paper(id){ if (!HB.remote) return null; try { const r = await pgrest(`hr_quiz_files?quiz_id=eq.${encodeURIComponent(id)}&kind=eq.paper&select=*`); return (r && r[0]) || null; } catch(e){ return null; } },
  async answers(id){ if (!HB.remote) return []; try { return await pgrest(`hr_quiz_files?quiz_id=eq.${encodeURIComponent(id)}&kind=eq.answer&select=*&order=created_at`); } catch(e){ return []; } }
};
function paperCardHtml(){
  const p = AD.qz.paper;
  const cur = p ? `<p>📄 <a href="${esc(paperUrl(p.file_path))}" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">${esc(p.file_name || 'Question paper')}</a> <span class="hrp-muted">(${p.file_size ? fmtSize(p.file_size) : 'PDF'})</span> <button class="hrp-mini" data-ad="pdel" type="button">🗑 Remove</button></p>` : '<p class="hrp-muted">No question paper uploaded yet.</p>';
  return `<div class="hrp-card" id="aqPaper">${cur}${HB.remote ? `<input type="file" id="aqPF" accept="application/pdf,.pdf" style="display:block;margin:8px 0;max-width:100%;color:var(--text)"><div class="hrp-row"><button class="hrp-btn pri" data-ad="pupload" type="button">⬆ ${p ? 'Replace PDF' : 'Upload PDF'}</button></div>` : '<p class="hrp-muted">PDF upload needs the database — run the SQL in the Setup tab first.</p>'}<div class="hk-msg" id="aqPM"></div><p class="hrp-muted">PDF only, max 5 MB. Participants can open it from the quiz card and inside the exam. Participants can answer by choosing an option, typing, or uploading their own PDF (max 5 MB). A quiz with only a paper and no questions works as a paper-based exam.</p></div>`;
}
async function ensureQuizSaved(){
  const q = AD.qz.quiz; const ex = await QZ.list(); if (ex.some(x => x.id === q.id)) return;
  await QZ.save({ id: q.id, title: q.title || 'Untitled quiz', description: q.description || '', duration_min: q.duration_min || 30, opens_at: q.opens_at, closes_at: q.closes_at, published: false });
}
adAct.pupload = async () => {
  const c = AD.c, m = $('#aqPM', c), f = ($('#aqPF', c).files || [])[0]; const say = (t, k) => { m.textContent = t; m.className = 'hk-msg' + (k ? ' ' + k : ''); };
  const err = await pdfCheck(f); if (err) { say(err, 'err'); return; }
  try { say('Uploading…'); await ensureQuizSaved(); const quiz = AD.qz.quiz, old = AD.qz.paper;
    const path = 'papers/' + quiz.id + '/' + Date.now() + '-' + uid() + '.pdf'; await uploadPdf(path, f);
    const row = { id: uid(), quiz_id: quiz.id, kind: 'paper', file_path: path, file_name: f.name.slice(0, 150), file_size: f.size };
    if (old) await pgrest('hr_quiz_files?id=eq.' + encodeURIComponent(old.id), { method: 'DELETE' });
    await pgrest('hr_quiz_files', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: [row] });
    if (old) removeObject(old.file_path);
    AD.qz.paper = row; renderQuizList(); adRender(); toast('Question paper uploaded', 'success', '📄'); }
  catch(e){ say(admErr(e), 'err'); }
};
adAct.pdel = async () => {
  const p = AD.qz.paper; if (!p || !confirm('Remove this question paper?')) return;
  try { await pgrest('hr_quiz_files?id=eq.' + encodeURIComponent(p.id), { method: 'DELETE' }); removeObject(p.file_path); AD.qz.paper = null; renderQuizList(); adRender(); } catch(e){ toast(admErr(e), 'warn', '⚠️'); }
};
function typedHtml(r){
  const qm = {}; ((AD.qz && AD.qz.qs) || []).forEach((x, i) => { qm[x.id] = i + 1; }); const t = r.typed || {}; const keys = Object.keys(t); if (!keys.length) return '<span class="hrp-muted">—</span>';
  return `<details><summary>${keys.length} answer(s)</summary>${keys.map(k => `<div style="margin:4px 0"><b>${k === '_paper' ? 'Answer' : 'Q' + (qm[k] || '?')}:</b> ${esc(t[k])}</div>`).join('')}</details>`;
}
function filesResultsHtml(){
  const files = (AD.qz && AD.qz.files) || []; if (!files.length) return '<div class="hrp-h">✍️ Typed answers &amp; 📎 PDF uploads</div><p class="hrp-muted">No typed answers or PDFs submitted yet.</p>';
  return `<div class="hrp-h">✍️ Typed answers &amp; 📎 PDF uploads (${files.length})</div><div class="hrp-row"><button class="hrp-btn" data-ad="fcsv" type="button">⬇ Typed answers CSV</button></div><div style="overflow:auto"><table class="hrp-table"><tr><th>Name</th><th>Email</th><th>Typed answers</th><th>PDF</th><th>When</th></tr>${files.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${typedHtml(r)}</td><td>${r.file_path ? `<a href="${esc(paperUrl(r.file_path))}" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">📎 ${esc(r.file_name || 'PDF')}</a> <span class="hrp-muted">${r.file_size ? fmtSize(r.file_size) : ''}</span>` : '<span class="hrp-muted">—</span>'}</td><td>${new Date(r.created_at).toLocaleString()}</td></tr>`).join('')}</table></div>`;
}
adAct.fcsv = () => { const qm = {}; (AD.qz.qs || []).forEach((x, i) => { qm[x.id] = i + 1; }); const rows = (AD.qz.files || []).map(r => [r.name, r.email, Object.keys(r.typed || {}).map(k => (k === '_paper' ? 'Answer' : 'Q' + (qm[k] || '?')) + ': ' + r.typed[k]).join(' | '), r.file_path ? paperUrl(r.file_path) : '', r.created_at]); download('typed-answers.csv', toCSV([['Name', 'Email', 'Typed answers', 'PDF link', 'Submitted']].concat(rows)), 'text/csv'); };
feat('Admin: upload a question-paper PDF per quiz (max 5 MB) and review participants’ typed answers & PDF uploads', () => {});
feat('Quiz: answer by option, by typing, or by uploading a PDF (max 5 MB)', () => {});

feat('Quiz answers stay on the server — participants only receive the score after submitting', () => {});
/* ---- v2 admin: marks for typed answers, upload results, email everyone ---- */
const MK_PAPER = 100;
const mkTotal = r => (r.score || 0) + (r.bonus || 0);
const mkMapped = (q, x) => { const L = 'ABCD'.indexOf(x.toUpperCase()); return (x.length === 1 && L >= 0 && L < (q.options || []).length) || (q.options || []).some(o => String(o).trim().toLowerCase() === x.toLowerCase()); };
function mkNeed(r){
  const qs = (AD.qz && AD.qz.qs) || [], em = String(r.email || '').toLowerCase();
  const f = ((AD.qz && AD.qz.files) || []).find(x => String(x.email || '').toLowerCase() === em); if (!f) return [];
  const t = f.typed || {}, a = r.answers || {}, need = [];
  Object.keys(t).forEach(k => { const x = String(t[k] || '').trim(); if (!x) return;
    if (k === '_paper') { need.push({ k, label: 'Typed answer sheet', text: x, max: MK_PAPER, pdf: f.file_path ? f : null }); return; }
    const i = qs.findIndex(z => z.id === k); if (i < 0) return; const q = qs[i];
    if ((a[k] !== undefined && +a[k] === q.answer) || mkMapped(q, x)) return;
    need.push({ k, label: 'Q' + (i + 1) + '. ' + q.text, text: x, max: q.points || 1 }); });
  if (f.file_path && !need.some(n => n.k === '_paper')) need.push({ k: '_paper', label: 'PDF answer sheet', text: '', max: MK_PAPER, pdf: f });
  return need;
}
const mkPending = r => mkNeed(r).filter(n => (r.marks || {})[n.k] == null).length;
const mkSorted = () => AD.qz.rows.slice().sort((a, b) => mkTotal(b) - mkTotal(a) || (a.secs || 0) - (b.secs || 0));
function adQuizResults(box){
  const { quiz } = AD.qz, rows = mkSorted(), pend = rows.reduce((s, r) => s + mkPending(r), 0), who = rows.filter(r => mkPending(r)).length, pub = !!quiz.results_published;
  const status = pub ? '✅ <b>Results uploaded</b> — rankings are final.' : pend ? '✍️ <b>' + pend + ' typed answer(s)</b> from ' + who + ' participant(s) still need marks. Add them below; the live rankings update on every save.' : '✅ All typed answers are marked — you can upload the results now.';
  const btns = pub ? '<button class="hrp-btn pri" data-ad="mkmail">📧 Email remaining</button><button class="hrp-btn" data-ad="mkmail" data-force="1">📧 Email everyone again</button><button class="hrp-mini" data-ad="mkunpub">↩ Mark as not final</button><button class="hrp-btn" data-ad="certissue">🎓 Issue certificates</button><button class="hrp-btn" data-ad="certmail">📧 Email certificates</button><button class="hrp-mini" data-ad="certreset">🗑 Reset certificates</button><button class="hrp-mini" data-ad="certdesign">🎨 Design</button><span id="certInfo" class="hrp-muted"></span>' : '<button class="hrp-btn pri" data-ad="mkpublish"' + (pend ? ' disabled' : '') + '>⬆ Upload results &amp; email everyone</button><button class="hrp-mini" data-ad="certdesign">🎨 Certificate design</button>';
  const marking = rows.filter(r => mkNeed(r).length).map(r => { const need = mkNeed(r), mk = r.marks || {}, p = mkPending(r);
    return '<details class="hrp-card" style="margin:6px 0" data-mkc="' + esc(r.id) + '"' + (AD.qz.open === r.id ? ' open' : '') + '><summary><b>' + esc(r.name) + '</b> <span class="hrp-muted">' + esc(r.email) + ' · ' + (p ? '⏳ ' + p + ' pending' : '✅ marked') + '</span></summary>'
      + need.map(n => '<div style="margin:10px 0"><div><b>' + esc(n.label) + '</b></div>' + (n.text ? '<div class="hrp-muted" style="white-space:pre-wrap">' + esc(n.text) + '</div>' : '') + (n.pdf ? '<a href="' + esc(paperUrl(n.pdf.file_path)) + '" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">📎 Open PDF</a>' : '') + '<div><label class="hrp-muted">Marks (0–' + n.max + ') <input class="hrp-in mk-in" data-k="' + esc(n.k) + '" data-max="' + n.max + '" type="number" min="0" max="' + n.max + '" step="1" value="' + (mk[n.k] ?? '') + '" style="width:90px;display:inline-block"></label></div></div>').join('')
      + '<button class="hrp-btn pri" data-ad="mksave" data-id="' + esc(r.id) + '">💾 Save marks</button></details>'; }).join('');
  box.innerHTML = '<div class="hrp-row"><button class="hrp-tab" data-ad="qback">← Quizzes</button><b>' + esc(quiz.title) + ' — results (' + rows.length + ')</b><button class="hrp-btn" data-ad="qcsv">⬇ CSV</button></div>'
    + '<div class="hrp-card" style="margin:8px 0">' + (HB.remote ? status : '⚠️ Marks, upload and email need the database (Setup tab).') + '<div class="hrp-row" style="margin-top:8px">' + (HB.remote ? btns : '') + '<button class="hrp-mini" data-ad="mkcopy">📋 Copy emails</button></div><div class="hk-msg" id="mkMsg"></div></div>'
    + (rows.length ? table(rows.map((r, i) => [String(i + 1), r.name, r.email, String(r.score), String(r.bonus || 0), mkTotal(r) + (r.max_score ? '/' + r.max_score : ''), fmtClock(r.secs || 0), mkNeed(r).length ? (mkPending(r) ? '⏳ ' + mkPending(r) + ' pending' : '✅ marked') : '—']), ['#', 'Name', 'Email', 'Auto', 'Typed marks', 'Total', 'Time', 'Marking']) : '<p class="hrp-muted">No submissions yet.</p>')
    + (HB.remote && marking ? '<div class="hrp-h">✍️ Add marks for typed answers</div>' + marking : '') + filesResultsHtml();
  setTimeout(loadCertInfo, 60);
}
adAct.qcsv = () => { download('quiz-results.csv', toCSV([['Rank', 'Name', 'Email', 'Auto score', 'Typed-answer marks', 'Total', 'Max', 'Seconds', 'Submitted']].concat(mkSorted().map((r, i) => [i + 1, r.name, r.email, r.score, r.bonus || 0, mkTotal(r), r.max_score, r.secs, r.created_at]))), 'text/csv'); };
adAct.mkcopy = () => copy(AD.qz.rows.map(r => r.email).join(', '));
adAct.mksave = async b => {
  const r = AD.qz.rows.find(x => x.id === b.dataset.id); if (!r) return; const card = b.closest('[data-mkc]'), marks = { ...(r.marks || {}) }; let bad = '';
  $$('.mk-in', card).forEach(i => { if (i.value === '') { delete marks[i.dataset.k]; return; } const v = Math.round(+i.value), mx = +i.dataset.max; if (!isFinite(v) || v < 0 || v > mx) bad = 'Marks must be between 0 and ' + mx + '.'; else marks[i.dataset.k] = v; });
  if (bad) { toast(bad, 'warn', '⚠️'); return; }
  const need = new Set(mkNeed(r).map(n => n.k)); Object.keys(marks).forEach(k => { if (!need.has(k)) delete marks[k]; });
  const bonus = Object.values(marks).reduce((s, v) => s + (+v || 0), 0);
  try { await pgrest('hr_attempts?id=eq.' + encodeURIComponent(r.id), { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { marks, bonus } }); Object.assign(r, { marks, bonus }); AD.qz.open = r.id; adRender(); toast('Marks saved — live rankings updated', 'success', '✅'); }
  catch(e){ toast(/column|marks|bonus/i.test(e.message || '') ? 'Run the updated SQL first (Admin → Setup).' : admErr(e), 'warn', '⚠️'); }
};
async function mkSendMails(quizId, force){
  const tok = sbToken();
  try { const r = await fetch('/api/send-results', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: JSON.stringify({ quiz_id: quizId, force: !!force }) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 404) return { ok: false, msg: 'Results are uploaded, but the /api/send-results file is not deployed yet (Admin → Setup → Copy email function → save as api/send-results.js). Use “Copy emails” meanwhile.' };
    if (!r.ok) return { ok: false, msg: 'Results are uploaded, but emails failed: ' + (j.error || 'HTTP ' + r.status) + (j.detail ? ' [' + j.detail + ']' : '') };
    return { ok: !j.failed, msg: '📧 Emails sent: ' + j.sent + ' of ' + j.total + (j.failed ? ' · failed: ' + j.failed + ' (' + (j.errors || []).join('; ') + ')' : '') }; }
  catch(e){ return { ok: false, msg: 'Results are uploaded, but the email service could not be reached: ' + (e.message || e) }; }
}
const mkSay = (t, ok) => { const m = $('#mkMsg', AD.c); if (m) { m.textContent = t; m.className = 'hk-msg' + (ok === true ? ' ok' : ok === false ? ' err' : ''); } };
adAct.mkpublish = async () => {
  const q = AD.qz.quiz; if (AD.qz.rows.some(r => mkPending(r))) { mkSay('Add marks for every typed answer first.', false); return; }
  if (!confirm('Upload the final results and email every participant their marks and rank?')) return;
  try { mkSay('Publishing…'); const o = { ...q, results_published: true, results_published_at: new Date().toISOString() }; await QZ.save(o); AD.qz.quiz = o; renderQuizList(); adRender(); mkSay('Sending emails…');
    const r = await mkSendMails(q.id, false); toast('Results uploaded', 'success', '🏆'); mkSay(r.msg, r.ok); }
  catch(e){ mkSay(/column|results_published/i.test(e.message || '') ? 'Run the updated SQL first (Admin → Setup).' : admErr(e), false); }
};
adAct.mkmail = async b => { mkSay('Sending…'); const r = await mkSendMails(AD.qz.quiz.id, b.dataset.force === '1'); mkSay(r.msg, r.ok); };
adAct.mkunpub = async () => { if (!confirm('Mark these results as not final? Rankings will show as live again.')) return; try { const o = { ...AD.qz.quiz, results_published: false, results_published_at: null }; await QZ.save(o); AD.qz.quiz = o; renderQuizList(); adRender(); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } };
feat('Admin: add marks to typed / PDF answers, upload final results, email every participant', () => {});
/* ---- certificates: admin issues them, anyone can open by link or verify by code ---- */
const certDate = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
const verifyUrl = code => location.origin + '/?verify=' + encodeURIComponent(code);
const okImg = s => /^data:image\/(png|jpeg);base64,[A-Za-z0-9+\/=]+$/.test(String(s || ''));
function qrPath(text, x, y, size){
  if (!window.qrcode) return '';
  try {
    const q = window.qrcode(0, 'M'); q.addData(text); q.make();
    const n = q.getModuleCount(), cell = size / (n + 4), o = 2 * cell; let d = '';
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) {
        if (!q.isDark(r, c)) { c++; continue; }
        const s = c; while (c < n && q.isDark(r, c)) c++;
        const w = ((c - s) * cell).toFixed(2);
        d += 'M' + (x + o + s * cell).toFixed(2) + ' ' + (y + o + r * cell).toFixed(2) + 'h' + w + 'v' + cell.toFixed(2) + 'h-' + w + 'z';
      }
    }
    return '<rect x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" fill="#fff" stroke="#ddd"/><path d="' + d + '" fill="#1a1a2e" shape-rendering="crispEdges"/>';
  } catch(e){ return ''; }
}
function certSvg(c){
  const e = s => esc(String(s == null ? '' : s)), win = c.kind === 'winner';
  const name = String(c.name || '').slice(0, 60), fs = name.length > 34 ? 38 : name.length > 24 ? 50 : 64;
  const qt0 = String(c.quiz_title || ''), qt = qt0.length > 56 ? qt0.slice(0, 55) + '…' : qt0;
  const sc = c.max_score ? 'Score: ' + c.score + ' / ' + c.max_score : (c.score ? 'Score: ' + c.score : '');
  const label = { 1: '1st Position — Winner', 2: '2nd Position — First Runner-up', 3: '3rd Position — Second Runner-up' }[c.pos] || ('Rank #' + c.pos);
  const sName = String(c.signer_name || '').slice(0, 60), sTitle = String(c.signer_title || '').slice(0, 60);
  const tsp = x => '<tspan font-weight="700" fill="#7c5cff">' + e(x) + '</tspan>';
  const phrase = !win ? 'successfully participated in'
    : c.award ? (c.award === 'Special Mention' ? 'received a ' + tsp(c.award) + ' in' : 'secured the ' + tsp(c.award) + ' position in')
    : 'secured ' + tsp(label) + ' in';
  const rep = c.holder ? 'Represented by ' + String(c.holder).slice(0, 50) + (c.college ? ', ' + String(c.college).slice(0, 60) : '') : '';
  return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 850" width="1200" height="850" style="width:100%;height:auto;display:block" font-family="Georgia, \'Times New Roman\', serif">'
    + '<rect width="1200" height="850" fill="#fffdf7"/>'
    + '<rect x="30" y="30" width="1140" height="790" fill="none" stroke="#7c5cff" stroke-width="8"/>'
    + '<rect x="52" y="52" width="1096" height="746" fill="none" stroke="#22d3ee" stroke-width="2"/>'
    + (okImg(c.logo) ? '<image xlink:href="' + c.logo + '" x="85" y="80" width="130" height="110" preserveAspectRatio="xMidYMid meet"/>' : '')
    + '<text x="600" y="150" text-anchor="middle" font-size="30" letter-spacing="8" fill="#7c5cff" font-weight="700">HACKATHON RIVALS</text>'
    + '<text x="600" y="245" text-anchor="middle" font-size="58" fill="#1a1a2e" font-weight="700">' + (win ? 'Certificate of Achievement' : 'Certificate of Participation') + '</text>'
    + '<text x="600" y="320" text-anchor="middle" font-size="26" fill="#555" font-style="italic">This is to certify that</text>'
    + '<text x="600" y="425" text-anchor="middle" font-size="' + fs + '" fill="#1a1a2e" font-weight="700">' + e(name) + '</text>'
    + '<line x1="260" y1="448" x2="940" y2="448" stroke="#7c5cff" stroke-width="2"/>'
    + (rep ? '<text x="600" y="482" text-anchor="middle" font-size="20" fill="#555">' + e(rep) + '</text>' : '')
    + '<text x="600" y="510" text-anchor="middle" font-size="28" fill="#333">' + phrase + '</text>'
    + '<text x="600" y="578" text-anchor="middle" font-size="38" fill="#1a1a2e" font-weight="700">' + e(qt) + '</text>'
    + (sc ? '<text x="600" y="635" text-anchor="middle" font-size="26" fill="#555">' + e(sc) + '</text>' : '')
    + '<text x="110" y="740" font-size="22" fill="#333">Date: ' + e(certDate(c.issued_at)) + '</text>'
    + (okImg(c.signature) ? '<image xlink:href="' + c.signature + '" x="490" y="640" width="220" height="78" preserveAspectRatio="xMidYMax meet"/>' : '')
    + '<line x1="480" y1="722" x2="720" y2="722" stroke="#333" stroke-width="1.5"/>'
    + '<text x="600" y="747" text-anchor="middle" font-size="21" fill="#333" font-weight="700">' + e(sName || 'Team Hackathon Rivals') + '</text>'
    + (sName && sTitle ? '<text x="600" y="770" text-anchor="middle" font-size="17" fill="#555">' + e(sTitle) + '</text>' : '')
    + qrPath(verifyUrl(c.code), 975, 600, 120)
    + '<text x="1095" y="752" text-anchor="end" font-size="18" fill="#333">ID: ' + e(c.code) + '</text>'
    + '<text x="600" y="800" text-anchor="middle" font-size="16" fill="#777">Verify at ' + e(verifyUrl(c.code).replace('https://', '').replace('http://', '')) + '</text>'
    + '</svg>';
}
function certPng(svg, name){
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas'); cv.width = 2400; cv.height = 1700;
    const cx = cv.getContext('2d'); cx.fillStyle = '#fffdf7'; cx.fillRect(0, 0, 2400, 1700); cx.drawImage(img, 0, 0, 2400, 1700);
    cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png');
  };
  img.onerror = () => toast('Could not create the image. Use Print / Save PDF.', 'warn', '⚠️');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function certPrint(svg){
  const w = window.open('', '_blank');
  if (!w) { toast('Allow pop-ups to print the certificate', 'warn', '⚠️'); return; }
  w.document.write('<!doctype html><title>Certificate</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0;background:#fff}svg{width:100vw;height:auto;display:block}</style>' + svg + '<scr' + 'ipt>setTimeout(function(){window.print()},400)</scr' + 'ipt>');
  w.document.close();
}
function certModal(title){
  const m = qzModal(); $('#hkQT', m).textContent = title; m.classList.add('open');
  m.onclick = e => { if (e.target.closest('[data-a=close]')) m.classList.remove('open'); };
  return $('#hkQB', m);
}
async function waitRemote(){ for (let i = 0; i < 10 && !HB.remote; i++) await new Promise(r => setTimeout(r, 400)); }
async function showCert(code){
  const B = certModal('🎓 Certificate'); B.innerHTML = '<p class="hrp-muted">Checking…</p>';
  await waitRemote();
  if (!HB.remote) { B.innerHTML = '<div class="hk-msg err">Certificates need the online database.</div>'; return; }
  let c;
  try { const rows = await pgrest('rpc/hr_get_certificate', { method: 'POST', body: { p_code: String(code || '').trim() } }); c = rows && rows[0]; }
  catch(e){ B.innerHTML = '<div class="hk-msg err">Could not check the certificate right now. Try again in a moment.</div>'; return; }
  if (!c) { B.innerHTML = '<div class="hk-msg err">❌ No certificate found for the code <b>' + esc(code) + '</b>.</div>'; return; }
  if (c.revoked) { B.innerHTML = '<div class="hk-msg err">⚠️ Certificate <b>' + esc(c.code) + '</b> has been revoked.</div>'; return; }
  try { await window.loadLib('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js', 'qrcode'); } catch(e){}
  const svg = certSvg(c);
  B.innerHTML = '<div class="hk-msg ok">✅ <b>Valid certificate</b> — issued to <b>' + esc(c.name) + '</b> for <b>' + esc(c.quiz_title) + '</b> on ' + esc(certDate(c.issued_at)) + (c.award ? ' · ' + esc(c.award) : c.kind === 'winner' ? ' · Rank #' + esc(c.pos) : ' · Participation') + '.</div>'
    + '<div style="margin:10px 0;border:1px solid var(--border);border-radius:8px;overflow:hidden">' + svg + '</div>'
    + '<div class="hrp-row"><button class="hrp-btn pri" id="hcPng" type="button">⬇ Download image</button><button class="hrp-btn" id="hcPr" type="button">🖨 Print / Save PDF</button></div>'
    + '<p class="hrp-muted" style="word-break:break-all">Verify link: ' + esc(verifyUrl(c.code)) + '</p>';
  $('#hcPng', B).onclick = () => certPng(svg, 'certificate-' + c.code + '.png');
  $('#hcPr', B).onclick = () => certPrint(svg);
}
function openCertHub(){
  const B = certModal('🎓 Certificates'), me = store.get('hk:me', { email: '' }) || {};
  B.innerHTML = '<div class="hrp-h">Verify a certificate</div><div class="hrp-row"><input class="hrp-in" id="chC" placeholder="Certificate ID, e.g. HR-1A2B3C4D5E6F" style="flex:1"><button class="hrp-btn pri" id="chV" type="button">Verify</button></div>'
    + '<div class="hrp-h" style="margin-top:18px">Get my certificate</div><input class="hrp-in" id="chE" type="email" placeholder="Email you used for the quiz" value="' + esc(me.email || '') + '">'
    + '<div class="hrp-row" style="margin-top:8px"><button class="hrp-btn" id="chG" type="button">Send me a code</button></div><div id="chM" class="hk-msg"></div><div id="chL"></div>';
  $('#chV', B).onclick = () => { const v = $('#chC', B).value.trim(); if (v) showCert(v); };
  $('#chG', B).onclick = async () => {
    const email = $('#chE', B).value.trim().toLowerCase(), box = $('#chM', B);
    if (email.indexOf('@') < 1) { box.className = 'hk-msg err'; box.textContent = 'Enter a valid email.'; return; }
    if (!(await ensureVerified(box, email))) return;
    try {
      const rows = await pgrest('rpc/hr_my_certificates', { method: 'POST', headers: vtHdr(email), body: { p_email: email } });
      box.className = 'hk-msg ok'; box.textContent = rows.length ? 'Your certificates (tap to open):' : 'No certificate found for this email yet.';
      $('#chL', B).innerHTML = rows.map(r => '<button class="hrp-btn" type="button" style="display:block;margin:6px 0;width:100%;text-align:left" data-code="' + esc(r.code) + '">🎓 ' + esc(r.quiz_title) + ' — ' + esc(r.award || (r.kind === 'winner' ? 'Winner' : 'Participation')) + '</button>').join('');
      $$('#chL [data-code]', B).forEach(b => { b.onclick = () => showCert(b.dataset.code); });
    } catch(e){ box.className = 'hk-msg err'; box.textContent = /EMAIL_NOT_VERIFIED/.test(e.message || '') ? 'Please verify your email again.' : 'Could not load certificates. The organiser may need to run certificates.sql.'; }
  };
}
(function(){
  const link = document.getElementById('hrCertLink');
  if (link) link.addEventListener('click', e => { e.preventDefault(); openCertHub(); });
  const q = new URLSearchParams(location.search), c = q.get('cert') || q.get('verify');
  if (c) setTimeout(() => showCert(c), 700);
})();

/* admin side */
async function loadCertInfo(){
  const el = $('#certInfo', AD.c); if (!el || !AD.qz) return;
  try { const rows = await pgrest('hr_certificates?quiz_id=eq.' + AD.qz.quiz.id + '&select=id,emailed_at'); el.textContent = '🎓 ' + rows.length + ' issued · ' + rows.filter(r => r.emailed_at).length + ' emailed'; }
  catch(e){ el.textContent = ''; }
}
adAct.certissue = () => {
  const q = AD.qz.quiz, B = certModal('🎓 Issue certificates');
  B.innerHTML = '<p class="hrp-muted">Who should get a certificate?</p>'
    + '<label style="display:block;margin:10px 0"><input type="radio" name="ciW" value="top" checked> Only the <b>top</b> <input type="number" id="ciN" class="hrp-in" min="1" max="500" value="3" style="width:80px;display:inline-block"> students</label>'
    + '<label style="display:block;margin:10px 0"><input type="radio" name="ciW" value="all"> <b>Everyone</b> — the top <input type="number" id="ciA" class="hrp-in" min="0" max="500" value="3" style="width:80px;display:inline-block"> get a Winner certificate, the rest get Participation</label>'
    + '<p class="hrp-muted">Students with the same score and time share a rank, so a few more than N can qualify. Running this again never changes existing certificate IDs or links; it only refreshes name, rank and score.</p>'
    + '<div class="hrp-row"><button class="hrp-btn pri" id="ciGo" type="button">🎓 Issue</button></div><div id="ciM" class="hk-msg"></div>';
  $('#ciGo', B).onclick = async () => {
    const onlyTop = B.querySelector('input[name=ciW]:checked').value === 'top', m = $('#ciM', B);
    const n = Math.max(onlyTop ? 1 : 0, parseInt($(onlyTop ? '#ciN' : '#ciA', B).value, 10) || 0);
    m.className = 'hk-msg'; m.textContent = 'Working…';
    try {
      let removed = 0;
      if (onlyTop) {
        const have = await pgrest('hr_certificates?quiz_id=eq.' + encodeURIComponent(q.id) + '&select=id,emailed_at');
        if (have.length && !confirm('Certificates of students outside the top ' + n + ' will be DELETED' + (have.some(r => r.emailed_at) ? ' (some were already emailed, their links will stop working)' : '') + '. Continue?')) { m.textContent = 'Cancelled.'; return; }
        if (have.length) removed = await pgrest('rpc/hr_prune_certificates', { method: 'POST', body: { p_quiz: q.id, p_top: n } });
      }
      const done = await pgrest('rpc/hr_issue_certificates', { method: 'POST', body: { p_quiz: q.id, p_top: n, p_only_top: onlyTop } });
      m.className = 'hk-msg ok'; m.textContent = '🎓 ' + done + ' certificate(s) issued or refreshed' + (removed ? ' · ' + removed + ' removed' : '') + '. Now close this and use "Email certificates" (only students not emailed yet get a mail).';
      mkSay('🎓 Certificates updated: ' + done + ' issued or refreshed' + (removed ? ', ' + removed + ' removed' : '') + '.', true); loadCertInfo();
    } catch(e){
      const x = e.message || ''; m.className = 'hk-msg err';
      m.textContent = /PUBLISH_RESULTS_FIRST/.test(x) ? 'Upload (publish) the results first.' : /ADMIN_ONLY/.test(x) ? 'Only an admin can issue certificates.' : e.status === 404 || /hr_issue_certificates|hr_prune_certificates|does not exist/.test(x) ? 'Run certificates-top.sql first (Supabase SQL Editor).' : admErr(e);
    }
  };
};
adAct.certmail = async () => {
  const q = AD.qz.quiz, tok = sbToken(); mkSay('Sending…');
  try {
    const r = await fetch('/api/send-certificates', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: JSON.stringify({ quiz_id: q.id }) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 404) throw new Error('api/send-certificates.js is not deployed yet.');
    if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
    mkSay('📧 Certificate emails sent: ' + j.sent + ' of ' + j.total + (j.failed ? ' · failed: ' + j.failed + ' (' + (j.errors || []).join('; ') + ')' : ''), !j.failed); loadCertInfo();
  } catch(e){ mkSay(e.message || String(e), false); }
};
adAct.certreset = async () => {
  const q = AD.qz.quiz;
  if (!confirm('Delete ALL certificates of this quiz? Old certificate links and IDs will stop working. You can issue new ones afterwards.')) return;
  try { await pgrest('hr_certificates?quiz_id=eq.' + encodeURIComponent(q.id), { method: 'DELETE', headers: { Prefer: 'return=minimal' } }); mkSay('Certificates deleted. You can issue them again.', true); loadCertInfo(); }
  catch(e){ mkSay(admErr(e), false); }
};
function imgToDataUrl(file, maxW, maxH){
  return new Promise((ok, no) => {
    const fr = new FileReader();
    fr.onerror = () => no(new Error('Could not read the file'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => no(new Error('That file is not a valid image'));
      img.onload = () => {
        let k = Math.min(1, maxW / img.width, maxH / img.height), out = '';
        for (let i = 0; i < 6; i++) {
          const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(img.width * k)); cv.height = Math.max(1, Math.round(img.height * k));
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          out = cv.toDataURL('image/png'); if (out.length < 160000) break; k *= 0.7;
        }
        if (out.length < 160000) ok(out); else no(new Error('Image is too big, use a smaller one'));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
adAct.certdesign = async () => {
  const B = certModal('🎨 Certificate design'); B.innerHTML = '<p class="hrp-muted">Loading…</p>';
  let s = {};
  try { const rows = await pgrest('hr_cert_settings?id=eq.1&select=signer_name,signer_title,logo,signature'); s = (rows && rows[0]) || {}; }
  catch(e){ B.innerHTML = '<div class="hk-msg err">Run certificates-design.sql first (Supabase SQL Editor).</div>'; return; }
  const cur = (v, id, lab) => okImg(v) ? '<div class="hrp-muted">Current ' + lab + ':</div><img src="' + v + '" alt="" style="max-height:60px;background:#fff;border:1px solid var(--border);border-radius:6px;padding:4px"><label class="hrp-muted" style="display:block"><input type="checkbox" id="' + id + '"> remove ' + lab + '</label>' : '<div class="hrp-muted">No ' + lab + ' yet.</div>';
  B.innerHTML = '<label class="hrp-muted">Signer name</label><input class="hrp-in" id="cdN" maxlength="60" value="' + esc(s.signer_name || '') + '" placeholder="e.g. Abhishek Yadav">'
    + '<label class="hrp-muted" style="margin-top:8px;display:block">Signer title</label><input class="hrp-in" id="cdT" maxlength="60" value="' + esc(s.signer_title || '') + '" placeholder="e.g. Founder, Hackathon Rivals">'
    + '<div style="margin-top:12px">' + cur(s.logo, 'cdLX', 'logo') + '<label class="hrp-muted" style="display:block">Logo (PNG/JPG, shown top-left)</label><input type="file" id="cdL" accept="image/*"></div>'
    + '<div style="margin-top:12px">' + cur(s.signature, 'cdSX', 'signature') + '<label class="hrp-muted" style="display:block">Signature image (PNG with transparent background looks best)</label><input type="file" id="cdS" accept="image/*"></div>'
    + '<div class="hrp-row" style="margin-top:12px"><button class="hrp-btn pri" id="cdSave" type="button">💾 Save design</button></div><div id="cdM" class="hk-msg"></div>';
  $('#cdSave', B).onclick = async () => {
    const m = $('#cdM', B); m.className = 'hk-msg'; m.textContent = 'Saving…';
    try {
      const body = { signer_name: $('#cdN', B).value.trim().slice(0, 60) || null, signer_title: $('#cdT', B).value.trim().slice(0, 60) || null };
      const lf = $('#cdL', B).files[0], sf = $('#cdS', B).files[0], lx = $('#cdLX', B), sx = $('#cdSX', B);
      if (lf) body.logo = await imgToDataUrl(lf, 300, 300); else if (lx && lx.checked) body.logo = null;
      if (sf) body.signature = await imgToDataUrl(sf, 480, 200); else if (sx && sx.checked) body.signature = null;
      await pgrest('hr_cert_settings?id=eq.1', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body });
      m.className = 'hk-msg ok'; m.textContent = '✅ Saved. Every certificate view now uses this design.';
    } catch(e){ m.className = 'hk-msg err'; m.textContent = e.message || 'Could not save'; }
  };
};
feat('Certificates: issue, e-mail, open by link, download and verify by code', () => {});
/* ---------- team certificates: the admin ticks the teams and picks an award ---------- */
const TC_AWARDS = ['Participation', 'Winner', 'First Runner-up', 'Second Runner-up', 'Special Mention'];
const tcEv = () => String(store.get('hk:tcEvent', '') || (HB.ev && HB.ev.name) || 'Hackathon Rivals').trim();
const tcSay = (x, ok) => { const m = $('#tcMsg', AD.c); if (m) { m.textContent = x; m.className = 'hk-msg' + (ok === true ? ' ok' : ok === false ? ' err' : ''); } };
ADV.tcert = async box => {
  if (!HB.remote) { box.innerHTML = '<p class="hrp-muted">Team certificates need the database (Setup tab).</p>'; return; }
  box.innerHTML = '<p class="hrp-muted">Loading teams…</p>';
  const ev = tcEv(); let teams, certs;
  try { teams = await pgrest('team_registrations?select=id,team_name,spoc_name,spoc_email,college_name&order=created_at'); }
  catch(e){ try { teams = await pgrest('team_registrations?select=id,team_name,spoc_name,spoc_email,college_name'); } catch(e2){ box.innerHTML = '<div class="hk-msg err">Could not read the team registrations.</div>'; return; } }
  try { certs = await pgrest('hr_team_certs?select=reg_id,code,award,emailed_at,revoked&event_title=eq.' + encodeURIComponent(ev)); }
  catch(e){ box.innerHTML = '<div class="hk-msg err">Run team-certificates.sql first (Supabase SQL Editor).</div>'; return; }
  const by = {}; (certs || []).forEach(c => { by[String(c.reg_id)] = c; });
  const td = 'style="padding:6px;border-bottom:1px solid var(--border);vertical-align:top"';
  const rows = (teams || []).map(t => {
    const c = by[String(t.id)];
    return '<tr data-id="' + esc(t.id) + '"><td ' + td + '><input type="checkbox" class="tc-chk"></td>'
      + '<td ' + td + '><b>' + esc(t.team_name) + '</b><br><span class="hrp-muted">' + esc(t.college_name || '') + '</span></td>'
      + '<td ' + td + ' class="hrp-muted">' + esc(t.spoc_name || '') + '<br>' + esc(t.spoc_email || '') + '</td>'
      + '<td ' + td + '><select class="hrp-in tc-aw" style="width:auto">' + TC_AWARDS.map(a => '<option' + (((c && c.award) || 'Participation') === a ? ' selected' : '') + '>' + a + '</option>').join('') + '</select></td>'
      + '<td ' + td + '>' + (c ? (c.revoked ? '⛔ revoked' : '✅ ' + esc(c.code) + (c.emailed_at ? ' · 📧 sent' : '')) : '—') + '</td></tr>';
  }).join('');
  const issued = (certs || []).length, mailed = (certs || []).filter(c => c.emailed_at).length;
  box.innerHTML = '<div class="hrp-card"><label class="hrp-muted">Event name shown on the certificates</label>'
    + '<input class="hrp-in" id="tcEv" data-ch="tcev" maxlength="100" value="' + esc(ev) + '" style="margin-bottom:8px">'
    + '<div class="hrp-row"><button class="hrp-mini" data-ad="tcall" type="button">☑ Select all</button><button class="hrp-mini" data-ad="tcnone" type="button">☐ Clear</button>'
    + '<button class="hrp-btn pri" data-ad="tcissue" type="button">🎓 Issue / update for selected</button><button class="hrp-btn" data-ad="tcmail" type="button">📧 Email certificates</button><button class="hrp-btn" data-ad="certdesign" type="button">🎨 Certificate design (signature, logo)</button>'
    + '<button class="hrp-mini" data-ad="tcreset" type="button">🗑 Reset all</button></div>'
    + '<div class="hrp-muted" style="margin-top:6px">' + (teams || []).length + ' teams · ' + issued + ' certificates issued · ' + mailed + ' emailed. Tick teams, choose each award, then Issue.</div><div id="tcMsg" class="hk-msg"></div></div>'
    + ((teams || []).length ? '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th></th><th align="left">Team</th><th align="left">SPOC</th><th align="left">Award</th><th align="left">Certificate</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="hrp-muted">No team registrations yet.</p>');
};
adAct['chg:tcev'] = el => { const v = el.value.trim(); if (v) { store.set('hk:tcEvent', v); ADV.tcert($('#adB', AD.c)); } };
adAct.tcall = () => $$('.tc-chk', AD.c).forEach(x => { x.checked = true; });
adAct.tcnone = () => $$('.tc-chk', AD.c).forEach(x => { x.checked = false; });
adAct.tcissue = async () => {
  const items = []; $$('tr[data-id]', AD.c).forEach(tr => { if ($('.tc-chk', tr).checked) items.push({ reg_id: tr.dataset.id, award: $('.tc-aw', tr).value }); });
  if (!items.length) { tcSay('Tick at least one team first.', false); return; }
  try { const n = await pgrest('rpc/hr_issue_team_certificates', { method: 'POST', body: { p_event: tcEv(), p_items: items } }); await ADV.tcert($('#adB', AD.c)); tcSay('🎓 ' + n + ' certificate(s) issued or updated. Use "Email certificates" to send the new ones.', true); }
  catch(e){ const m = e.message || ''; tcSay(/ADMIN_ONLY/.test(m) ? 'Only an admin can issue certificates.' : e.status === 404 || /hr_issue_team_certificates|does not exist/.test(m) ? 'Run team-certificates.sql first (Supabase SQL Editor).' : admErr(e), false); }
};
adAct.tcmail = async () => {
  const tok = sbToken(); tcSay('Sending…');
  try {
    const r = await fetch('/api/send-team-certificates', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: JSON.stringify({ event: tcEv() }) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 404) throw new Error('api/send-team-certificates.js is not deployed yet.');
    if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
    await ADV.tcert($('#adB', AD.c)); tcSay('📧 Emails sent: ' + j.sent + ' of ' + j.total + (j.failed ? ' · failed: ' + j.failed + ' (' + (j.errors || []).join('; ') + ')' : ''), !j.failed);
  } catch(e){ tcSay(e.message || String(e), false); }
};
adAct.tcreset = async () => {
  if (!confirm('Delete ALL team certificates of "' + tcEv() + '"? Old links and IDs will stop working.')) return;
  try { await pgrest('hr_team_certs?event_title=eq.' + encodeURIComponent(tcEv()), { method: 'DELETE', headers: { Prefer: 'return=minimal' } }); await ADV.tcert($('#adB', AD.c)); tcSay('Team certificates deleted.', true); }
  catch(e){ tcSay(admErr(e), false); }
};
feat('Team certificates: the admin picks teams and awards, e-mails them, anyone can verify', () => {});
/* ---- announcements: e-mail every signed-up user about a new quiz / the hackathon ---- */
async function annSupported(){
  if (AD.annOk === undefined) { try { await pgrest('hr_quizzes?select=announce_all&limit=1'); AD.annOk = true; } catch(e){ AD.annOk = false; } }
  return AD.annOk;
}
async function bcApi(action){
  const tok = sbToken();
  const r = await fetch('/api/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: JSON.stringify({ action }) });
  const j = await r.json().catch(() => ({}));
  if (r.status === 404) throw new Error('api/broadcast.js is not deployed yet.');
  if (!r.ok || j.ok === false) throw new Error(j.error || 'HTTP ' + r.status);
  return j;
}
async function bcStatusLoad(){
  const el = $('#bcStatus', AD.c); if (!el) return;
  try {
    const j = await bcApi('status');
    el.innerHTML = j.rows.length ? j.rows.map(r => '<div style="margin:4px 0">• ' + esc(r.label) + ' — <b>' + esc(r.status) + '</b> (' + r.sent + '/' + r.total + ' sent)' + (r.last_error ? ' <span style="color:var(--pink)">⚠️ ' + esc(r.last_error) + '</span>' : '')
      + (r.status === 'queued' || r.status === 'sending' ? ' <button class="hrp-mini" type="button" data-ad="bccancel" data-id="' + esc(r.id) + '">✖ Cancel</button>' : '') + '</div>').join('') : 'Nothing announced yet.';
  } catch(e){ el.textContent = e.message; }
}
async function bcAnnounce(kind, ref, name){
  const label = kind === 'quiz' ? 'Quiz announced: ' + name : 'Hackathon';
  try { const st = await bcApi('status'); if (st.rows.some(r => r.label === label && (r.status === 'queued' || r.status === 'sending'))) { toast('An announcement for this is already in progress. Cancel it first if you want to start over.', 'warn', '⚠️'); bcStatusLoad(); return; } } catch(e){}
  let n;
  try { n = (await bcApi('count')).users; } catch(e){ toast(e.message, 'warn', '⚠️'); return; }
  if (!confirm('Email "' + name + '" to ' + n + ' signed-up users? Emails go out about 100 per minute. People who unsubscribed are skipped.')) return;
  try {
    let r = await pgrest('rpc/hr_queue_broadcast', { method: 'POST', body: { p_kind: kind, p_ref: ref || null, p_force: false } });
    if (r === 'already_sent') {
      if (!confirm('This was already announced. Send it to everyone again?')) return;
      r = await pgrest('rpc/hr_queue_broadcast', { method: 'POST', body: { p_kind: kind, p_ref: ref || null, p_force: true } });
    }
    toast('📣 Queued for ' + n + ' users. Progress: Hackathon tab → Announcements.', 'success', '📣'); bcStatusLoad();
  } catch(e){
    const m = e.message || '';
    toast(/QUIZ_NOT_PUBLISHED/.test(m) ? 'Publish the quiz first.' : e.status === 404 || /hr_queue_broadcast|does not exist/.test(m) ? 'Run announcements.sql first (Supabase SQL Editor).' : admErr(e), 'warn', '⚠️');
  }
}
adAct.bccancel = async b => {
  if (!confirm('Cancel this announcement? Emails already sent cannot be taken back, but no more will go out.')) return;
  try { await pgrest('hr_broadcasts?id=eq.' + encodeURIComponent(b.dataset.id) + '&status=in.(queued,sending)', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { status: 'cancelled', finished_at: new Date().toISOString(), last_error: 'cancelled by admin' } }); toast('Announcement cancelled', 'success', '✖'); bcStatusLoad(); }
  catch(e){ toast(admErr(e), 'warn', '⚠️'); }
};
adAct.qannounce = b => { const q = AD.qzList.find(x => x.id === b.dataset.id); if (q) bcAnnounce('quiz', q.id, q.title); };
adAct.hannounce = () => bcAnnounce('hackathon', null, (HB.ev && HB.ev.name) || 'the hackathon');
feat('Announcements: e-mail all signed-up users about a new quiz or the hackathon (queued, 100 per minute, unsubscribe link)', () => {});

/* ---------- Question bank manager ---------- */
const lvlNum = v => { v = String(v ?? '').trim().toLowerCase(); return ({ easy: 1, medium: 2, moderate: 2, hard: 3, difficult: 3, '1': 1, '2': 2, '3': 3 })[v] || 0; };
function subjKeyFor(name){ name = String(name || '').trim(); const f = Object.keys(SUBJ).find(k => SUBJ[k].toLowerCase() === name.toLowerCase() || k === name.toLowerCase()); return f ? { key: f, name: SUBJ[f] } : { key: 'x_' + slug(name), name }; }
async function bankSave(rows){
  const clean = rows.map(r => ({ id: r.id, subj: r.subj || null, subj_name: r.subj_name || null, sem: r.sem ?? null, br: r.br || null, lvl: r.lvl ?? null, text: r.text ?? null, opts: r.opts ?? null, ans: r.ans ?? null, expl: r.expl ?? null, deleted: !!r.deleted, updated_at: new Date().toISOString() }));
  if (BK.remote) { for (let i = 0; i < clean.length; i += 200) await pgrest('hr_bank?on_conflict=id', { method: 'POST', headers: UPSERT, body: clean.slice(i, i + 200) }); }
  const ids = new Set(clean.map(r => r.id)); BK.rows = BK.rows.filter(r => !ids.has(r.id)).concat(clean); if (!BK.remote) store.set('bankLocal', BK.rows); applyBank(BK.rows);
}
async function bankRemove(id){ if (BK.remote) await pgrest('hr_bank?id=eq.' + encodeURIComponent(id), { method: 'DELETE' }); BK.rows = BK.rows.filter(r => r.id !== id); if (!BK.remote) store.set('bankLocal', BK.rows); applyBank(BK.rows); }
const isBuiltin = id => BUILTIN_Q.some(q => q.id === id);
ADV.bank = box => {
  const S = AD.bank;
  if (S.edit) return adBankEdit(box); if (S.imp) return adBankImport(box);
  const semOk = q => S.sem === '-1' || q.sem === +S.sem, m = QB.filter(q => (S.subj === 'all' || q.s === S.subj) && semOk(q) && (!+S.lvl || q.d === +S.lvl) && (!S.q || (q.t + ' ' + q.o.join(' ')).toLowerCase().includes(S.q.toLowerCase())));
  const over = new Set(BK.rows.map(r => r.id));
  box.innerHTML = `<div class="hrp-card"><b>${QB.length} questions in the bank</b> · ${BK.rows.filter(r => !r.deleted).length} added/edited by admins · ${BK.rows.filter(r => r.deleted).length} hidden</div>
  <div class="hrp-row"><button class="hrp-btn pri" data-ad="bnew">➕ Add question</button><button class="hrp-btn" data-ad="bimp">⬆ Import CSV / JSON</button><button class="hrp-btn" data-ad="bexp">⬇ Export JSON</button><button class="hrp-btn" data-ad="btpl">⬇ CSV template</button></div>
  <div class="hrp-row"><select class="hrp-sel hrp-in sm" data-ch="bf" data-k="subj"><option value="all">All subjects</option>${Object.keys(SUBJ).map(k => `<option value="${k}"${S.subj === k ? ' selected' : ''}>${esc(SUBJ[k])}</option>`).join('')}</select>
  <select class="hrp-sel hrp-in sm" data-ch="bf" data-k="sem"><option value="-1">All semesters</option>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(s => `<option value="${s}"${S.sem === String(s) ? ' selected' : ''}>${semName(s)}</option>`).join('')}</select>
  <select class="hrp-sel hrp-in sm" data-ch="bf" data-k="lvl"><option value="0">All levels</option>${[1, 2, 3].map(l => `<option value="${l}"${S.lvl === String(l) ? ' selected' : ''}>${LV[l]}</option>`).join('')}</select>
  <input class="hrp-in sm" data-ch="bf" data-k="q" placeholder="Search text…" value="${esc(S.q)}"></div><div class="hrp-muted">${m.length} match${m.length === 1 ? '' : 'es'}</div>
  ${m.slice(0, S.lim).map(q => `<div class="hrp-card" style="margin:8px 0"><div class="hrp-muted">${esc(SUBJ[q.s] || q.s)} · ${semName(q.sem)} · ${LV[q.d]} ${isBuiltin(q.id) ? (over.has(q.id) ? '· ✏️ edited' : '· built-in') : '· ➕ custom'}</div><b>${esc(q.t.length > 140 ? q.t.slice(0, 140) + '…' : q.t)}</b><div class="hrp-muted">✅ ${esc(q.o[q.a])}</div>
  <div class="hrp-row" style="margin:6px 0 0"><button class="hrp-mini" data-ad="bedit" data-id="${esc(q.id)}">Edit</button><button class="hrp-mini" data-ad="bdel" data-id="${esc(q.id)}">${isBuiltin(q.id) ? 'Hide' : 'Delete'}</button>${over.has(q.id) && isBuiltin(q.id) ? `<button class="hrp-mini" data-ad="brest" data-id="${esc(q.id)}">Restore original</button>` : ''}</div></div>`).join('')}
  ${m.length > S.lim ? '<div class="hrp-row"><button class="hrp-btn" data-ad="bmore">Show more</button></div>' : ''}
  ${BK.rows.some(r => r.deleted) ? '<div class="hrp-row"><button class="hrp-btn" data-ad="bunhide">Show all hidden built-in questions again</button></div>' : ''}`;
};
adAct['chg:bf'] = (t, e) => { AD.bank[t.dataset.k] = t.value; AD.bank.lim = 25; if (t.dataset.k === 'q') { clearTimeout(AD.bt); AD.bt = setTimeout(() => { adRender(); const i = $('[data-k=q]', AD.c); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); } else adRender(); };
adAct.bmore = () => { AD.bank.lim += 25; adRender(); };
adAct.bnew = () => { AD.bank.edit = { id: 'u' + uid().replace(/-/g, '').slice(0, 12), isNew: true, subj: 'dsa', sem: 3, br: 'cse', lvl: 2, text: '', opts: ['', '', '', ''], ans: 0, expl: '' }; adRender(); };
adAct.bedit = b => { const q = QM[b.dataset.id]; AD.bank.edit = { id: q.id, subj: q.s, sem: q.sem, br: q.br, lvl: q.d, text: q.t, opts: q.o.slice(), ans: q.a, expl: q.e }; adRender(); };
adAct.bdel = async b => { const id = b.dataset.id; if (!confirm(isBuiltin(id) ? 'Hide this built-in question from all quizzes?' : 'Delete this question permanently?')) return;
  try { if (isBuiltin(id)) await bankSave([{ id, deleted: true }]); else await bankRemove(id); adRender(); toast('Done', 'success', '✅'); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } };
adAct.brest = async b => { try { await bankRemove(b.dataset.id); adRender(); toast('Original restored', 'success', '↩'); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } };
adAct.bunhide = async () => { try { for (const r of BK.rows.filter(x => x.deleted && isBuiltin(x.id))) await bankRemove(r.id); adRender(); } catch(e){ toast(admErr(e), 'warn', '⚠️'); } };
function adBankEdit(box){
  const e = AD.bank.edit; const sub = Object.keys(SUBJ);
  box.innerHTML = `<div class="hrp-row"><button class="hrp-tab" data-ad="bcancel">← Back</button><b>${e.isNew ? 'Add question' : 'Edit question'}</b></div>
  <label class="hrp-muted">Subject</label><select class="hrp-sel" id="beS">${sub.map(k => `<option value="${k}"${e.subj === k ? ' selected' : ''}>${esc(SUBJ[k])}</option>`).join('')}<option value="__new">➕ New subject…</option></select><input class="hrp-in" id="beSN" placeholder="New subject name" style="display:none;margin-top:6px" maxlength="60">
  <div class="hrp-row"><label>Semester <select class="hrp-sel hrp-in" id="beSem" style="width:auto">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(s => `<option value="${s}"${e.sem === s ? ' selected' : ''}>${semName(s)}</option>`).join('')}</select></label>
  <label>Branch <select class="hrp-sel hrp-in" id="beBr" style="width:auto">${Object.keys(BRANCHES).concat(['ece', 'eee', 'mech', 'civil'].filter(x => !BRANCHES[x])).map(k => `<option value="${k}"${e.br === k ? ' selected' : ''}>${esc(BRANCHES[k] || k.toUpperCase())}</option>`).join('')}</select></label>
  <label>Level <select class="hrp-sel hrp-in" id="beLv" style="width:auto">${[1, 2, 3].map(l => `<option value="${l}"${e.lvl === l ? ' selected' : ''}>${LV[l]}</option>`).join('')}</select></label></div>
  <textarea class="hrp-ta" id="beT" style="min-height:80px;font-family:inherit;margin:6px 0" placeholder="Question">${esc(e.text)}</textarea>${[0, 1, 2, 3].map(i => `<input class="hrp-in" id="beO${i}" placeholder="Option ${'ABCD'[i]}" value="${esc(e.opts[i] || '')}" style="margin-bottom:6px">`).join('')}
  <div class="hrp-row"><label>Correct answer <select class="hrp-sel hrp-in" id="beA" style="width:auto">${[0, 1, 2, 3].map(i => `<option value="${i}"${e.ans === i ? ' selected' : ''}>${'ABCD'[i]}</option>`).join('')}</select></label></div>
  <textarea class="hrp-ta" id="beE" style="min-height:60px;font-family:inherit" placeholder="Explanation shown after answering">${esc(e.expl)}</textarea><div class="hk-msg" id="beM"></div><div class="hrp-row"><button class="hrp-btn pri" data-ad="bsave">Save</button><button class="hrp-btn" data-ad="bcancel">Cancel</button></div>`;
  $('#beS', box).addEventListener('change', ev => { $('#beSN', box).style.display = ev.target.value === '__new' ? '' : 'none'; });
}
adAct.bcancel = () => { AD.bank.edit = null; AD.bank.imp = null; adRender(); };
adAct.bsave = async () => { const c = AD.c, m = $('#beM', c), e = AD.bank.edit; const text = $('#beT', c).value.trim(), opts = [0, 1, 2, 3].map(i => $('#beO' + i, c).value.trim());
  let subj = $('#beS', c).value, sname = null; if (subj === '__new') { const nm = $('#beSN', c).value.trim(); if (!nm) { m.textContent = 'Enter the new subject name.'; m.className = 'hk-msg err'; return; } const k = subjKeyFor(nm); subj = k.key; sname = k.name; }
  if (!text || opts.some(x => !x)) { m.textContent = 'Fill the question and all four options.'; m.className = 'hk-msg err'; return; } if (new Set(opts).size !== 4) { m.textContent = 'Options must all be different.'; m.className = 'hk-msg err'; return; }
  try { await bankSave([{ id: e.id, subj, subj_name: sname || SUBJ[subj], sem: +$('#beSem', c).value, br: $('#beBr', c).value, lvl: +$('#beLv', c).value, text, opts, ans: +$('#beA', c).value, expl: $('#beE', c).value.trim() }]); AD.bank.edit = null; adRender(); toast('Question saved', 'success', '✅'); }
  catch(er){ m.textContent = admErr(er); m.className = 'hk-msg err'; } };
function bankParse(raw){
  let items = [];
  if (/^[\[{]/.test(raw)) { const j = JSON.parse(raw); items = (Array.isArray(j) ? j : [j]).map(o => ({ subject: o.subject, sem: o.semester ?? o.sem, br: o.branch ?? o.br, lvl: o.level ?? o.difficulty, text: o.question ?? o.text, opts: o.options || [o.optionA ?? o.A, o.optionB ?? o.B, o.optionC ?? o.C, o.optionD ?? o.D], ans: o.answer, expl: o.explanation })); }
  else { const rows = parseCSV(raw); const h = rows[0].map(x => x.trim().toLowerCase().replace(/[\s_]/g, '')); const ix = (...ks) => { for (const k of ks) { const i = h.indexOf(k); if (i >= 0) return i; } return -1; };
    if (ix('question', 'text') < 0) throw new Error('The first row must be a header with a “question” column'); const I = { s: ix('subject'), sem: ix('semester', 'sem'), br: ix('branch'), l: ix('level', 'difficulty'), q: ix('question', 'text'), a: ix('optiona', 'a'), b: ix('optionb', 'b'), c: ix('optionc', 'c'), d: ix('optiond', 'd'), ans: ix('answer', 'correct'), e: ix('explanation', 'expl') };
    items = rows.slice(1).map(r => ({ subject: r[I.s], sem: r[I.sem], br: r[I.br], lvl: r[I.l], text: r[I.q], opts: [r[I.a], r[I.b], r[I.c], r[I.d]], ans: r[I.ans], expl: r[I.e] })); }
  const out = [], bad = [];
  items.forEach((o, i) => { const opts = (o.opts || []).map(x => String(x ?? '').trim()); let a = String(o.ans ?? '').trim(); const up = a.toUpperCase(); let ai = up.length === 1 && 'ABCD'.includes(up) ? 'ABCD'.indexOf(up) : (/^[1-4]$/.test(a) ? +a - 1 : opts.findIndex(x => x && x.toLowerCase() === a.toLowerCase()));
    const sem = /^gen|^0$|placement/i.test(String(o.sem ?? '')) ? 0 : parseInt(String(o.sem ?? '').replace(/\D/g, ''), 10); const lv = lvlNum(o.lvl) || 2; const sn = String(o.subject || '').trim();
    if (!o.text || !sn || opts.length !== 4 || opts.some(x => !x) || ai < 0 || new Set(opts).size !== 4 || !(sem >= 0 && sem <= 8)) { bad.push(i + 2); return; }
    const k = subjKeyFor(sn); out.push({ id: 'u' + uid().replace(/-/g, '').slice(0, 12), subj: k.key, subj_name: k.name, sem, br: String(o.br || 'all').trim().toLowerCase() || 'all', lvl: lv, text: String(o.text).trim(), opts, ans: ai, expl: String(o.expl || '').trim() }); });
  return { out, bad };
}
adAct.bimp = () => { AD.bank.imp = { rows: null }; adRender(); };
function adBankImport(box){
  const prompt = 'Generate 30 multiple-choice questions for B.Tech (CSE) — subject: <SUBJECT>, semester: <NUMBER>, level mix: 10 easy, 10 medium, 10 hard. Output ONLY CSV with this header row and no other text:\nsubject,semester,branch,level,question,optionA,optionB,optionC,optionD,answer,explanation\nRules: level is easy/medium/hard; answer is A, B, C or D; exactly one correct option; put fields containing commas in double quotes; numerical answers must be verified; no duplicate options.';
  box.innerHTML = `<div class="hrp-row"><button class="hrp-tab" data-ad="bcancel">← Back</button><b>Import questions</b></div><p class="hrp-muted">Paste CSV or JSON, or choose a file. Columns: <code>subject, semester, branch, level, question, optionA, optionB, optionC, optionD, answer, explanation</code>. Semester 0 or “general” = placement / aptitude.</p>
  <textarea class="hrp-ta" id="biT" style="min-height:160px" placeholder="Paste here…"></textarea><div class="hrp-row"><label class="hrp-btn" style="cursor:pointer">📁 Choose file<input type="file" accept=".csv,.json,text/csv,application/json" hidden id="biF"></label><button class="hrp-btn pri" data-ad="bigo">Import</button><button class="hrp-btn" data-ad="btpl">⬇ CSV template</button><button class="hrp-btn" data-ad="bprompt">📋 Copy AI prompt</button></div><div class="hk-msg" id="biM"></div>`;
  $('#biF', box).addEventListener('change', ev => { const f = ev.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $('#biT', box).value = String(r.result); }; r.readAsText(f); });
  AD.aiPrompt = prompt;
}
adAct.bprompt = () => copy(AD.aiPrompt || '');
adAct.bigo = async () => { const c = AD.c, m = $('#biM', c), raw = $('#biT', c).value.trim(); if (!raw) return;
  try { const { out, bad } = bankParse(raw); if (!out.length) { m.textContent = 'No valid rows found.' + (bad.length ? ' Check rows: ' + bad.slice(0, 15).join(', ') : ''); m.className = 'hk-msg err'; return; }
    await bankSave(out); AD.bank.imp = null; adRender(); toast(`Imported ${out.length} question(s)` + (bad.length ? `, skipped ${bad.length} invalid row(s)` : ''), 'success', '⬆'); }
  catch(e){ m.textContent = admErr(e); m.className = 'hk-msg err'; } };
adAct.btpl = () => download('question-template.csv', toCSV([['subject', 'semester', 'branch', 'level', 'question', 'optionA', 'optionB', 'optionC', 'optionD', 'answer', 'explanation'], ['Data Structures', 3, 'cse', 'medium', 'Which structure follows LIFO?', 'Queue', 'Stack', 'Heap', 'Graph', 'B', 'A stack removes the newest element first.']]), 'text/csv');
adAct.bexp = () => download('question-bank.json', JSON.stringify(QB.map(q => ({ id: q.id, subject: SUBJ[q.s] || q.s, semester: q.sem, branch: q.br, level: LV[q.d].toLowerCase(), question: q.t, options: q.o, answer: 'ABCD'[q.a], explanation: q.e })), null, 2), 'application/json');
feat('Admin: add, edit, hide, delete and restore any question (built-in or custom)', () => {});
feat('Admin: bulk import questions from CSV / JSON with validation', () => {});
feat('Admin: export the question bank as JSON, download a CSV template, copy an AI prompt to generate more questions', () => {});
feat('Admin: create new subjects and choose semester, branch and level for each question', () => {});

/* ---------- Setup / SQL ---------- */
ADV.setup = async box => {
  box.innerHTML = '<p class="hrp-muted">Checking the database…</p>';
  const probes = [['hr_events', 'Event settings'], ['hr_registrations', 'Registrations'], ['hr_bank', 'Question bank'], ['hr_quizzes', 'Quizzes'], ['hr_quiz_questions', 'Quiz questions'], ['hr_quiz_keys', 'Quiz answer keys (admin only)'], ['hr_attempts', 'Quiz attempts (admin only)'], ['hr_quiz_files', 'Quiz PDFs & typed answers']]; const res = [];
  for (const [t, l] of probes) { try { await pgrest(t + '?select=*&limit=1'); res.push([l, '✅ ready']); } catch(e){ res.push([l, '❌ ' + (e.status === 404 ? 'not created' : admErr(e))]); } }
  let fn = '✅ ready'; try { await pgrest('rpc/hr_now', { method: 'POST', body: {} }); } catch(e){ fn = '❌ not created'; }
  res.push(['Server clock (hr_now)', fn]);
  { let mk = '✅ ready'; try { await pgrest('hr_attempts?select=marks,bonus,emailed_at&limit=1'); await pgrest('hr_quizzes?select=results_published&limit=1'); } catch(e){ mk = '❌ run the updated SQL (Part 3)'; } res.push(['Marks & results upload (Part 3)', mk]); }
  { let vf = '✅ ready'; try { await pgrest('hr_verified?select=token_hash&limit=1'); } catch(e){ if (e.status !== 401 && e.status !== 403) vf = '❌ run Part 4 SQL (email verification)'; } res.push(['Email verification (Part 4)', vf]); }
  { let rm = '✅ ready'; try { await pgrest('hr_quizzes?select=remind_sent_for,start_sent_for,time_changed_at,change_notified_at&limit=1'); } catch(e){ rm = '❌ run Part 5 SQL (quiz reminders)'; } res.push(['Quiz reminder emails (Part 5)', rm]); }
  { let ce = '✅ ready'; try { await pgrest('hr_certificates?select=id&limit=1'); } catch(e){ ce = '❌ run certificates.sql (Part 7)'; } res.push(['Certificates (Part 7)', ce]); }
  { let tc = '✅ ready'; try { await pgrest('hr_team_certs?select=id&limit=1'); } catch(e){ tc = '❌ run team-certificates.sql (Part 9)'; } res.push(['Team certificates (Part 9)', tc]); }
  { let an = '✅ ready'; try { await pgrest('hr_broadcasts?select=id&limit=1'); await pgrest('hr_quizzes?select=announce_all&limit=1'); } catch(e){ an = '❌ run announcements.sql (Part 11)'; } res.push(['Announcements to all users (Part 11)', an]); }
  { let st = '✅ ready'; try { const r = await fetch(HK_URL + '/storage/v1/object/public/' + HK_BUCKET + '/_probe', { headers: { apikey: HK_KEY } }); const j = await r.json().catch(() => ({})); if (/bucket not found/i.test(j.message || j.error || '')) st = '❌ not created'; } catch(e){ st = '❌ ' + (e.message || 'unreachable'); } res.push(['PDF storage bucket (hr-quiz-files)', st]); }
  box.innerHTML = `${table(res, ['Item', 'Status'])}<div class="hrp-h">How to set up (2 minutes)</div><ol class="hrp-muted" style="padding-left:18px;line-height:1.7"><li>Open your Supabase project → <b>SQL Editor</b> → New query.</li><li>Tap <b>Copy SQL</b> below, paste it and press <b>Run</b>.</li><li>Come back here and reopen this tab — every row should show ✅.</li></ol>
  <div class="hrp-row"><button class="hrp-btn pri" data-ad="sqlcopy">📋 Copy SQL</button><button class="hrp-btn" data-ad="sqldl">⬇ Download .sql</button><button class="hrp-btn" data-ad="setupre">↻ Re-check</button><button class="hrp-btn" data-ad="edgecopy">✉️ Copy email function</button></div>
  <p class="hrp-muted">Result emails: save the copied code as <b>api/send-results.js</b> in your project (next to send-email.js) and add the Vercel env vars <b>SUPABASE_URL</b> and <b>SUPABASE_SERVICE_ROLE_KEY</b> (RESEND_API_KEY you already have), then redeploy.</p>
  <p class="hrp-muted">Until the SQL is installed: registrations are emailed through Formspree, admin edits are saved only in this browser, and quizzes are visible only to you. The SQL creates the tables, secure row-level policies (only Admins can write) and the server-side deadline check.</p>`;
};
adAct.edgecopy = () => copy(HK_EDGE); adAct.sqlcopy = () => copy(HK_SQL_ALL); adAct.sqldl = () => download('supabase-hackathon.sql', HK_SQL_ALL, 'text/plain'); adAct.setupre = async () => { await loadEvent(); await loadBank(); adRender(); };
feat('Admin: Setup tab checks every database table and gives one-click SQL', () => {});

/* ---------- final wiring ---------- */
ORDER.splice(1, 0, 'admin'); TABS.sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]));
feat('Command palette: hackathon & admin shortcuts', () => {
  const cm = window.__hrpCmds; if (!cm) return;
  cm.push(['🚀 Go to Hackathon', 'g k', () => { const t = hkEl('hackathon'); if (t) t.scrollIntoView({ behavior: 'smooth' }); }], ['📚 Browse questions by semester', '', () => { EXS.view = 'browse'; openHub('exam'); }], ['🛡️ Admin console', '', () => { if (isAdminUI()) openHub('admin'); else toast('Log in as an Admin first', 'warn', '🛡️'); }]);
});

/* ============ INIT ============ */
feat('Daily visit tracking (streak, night-owl & early-bird badges)', () => {
  const today = ymd(new Date()); if (!G.days.includes(today)) { G.days.push(today); G.days = G.days.slice(-90); store.set('days', G.days); addXP(3); }
  award('early'); if (new Date().getHours() < 5) award('night'); if (streak() >= 3) award('streak3');
});
window.HRPlus = { count: F.length, features: F.slice(), open: openHub, qb: QB, decks: DECKS, hb: HB, evState: evState, bank: BK };
console.info('%cHR+ loaded: ' + F.length + ' features', 'color:#7c5cff;font-weight:bold');

} catch (err) { console.error('[HR+] fatal', err); }
})();
