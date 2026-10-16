(function()
{
  'use strict';
  const $  = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  $('#year').textContent = new Date().getFullYear();

  /* ============ HELPERS ============ */
  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  const esc = escapeHtml;
  function scoreCls(s){ return s >= 75 ? 'good' : s >= 50 ? 'mid' : 'low'; }

  /* ============ SUPABASE ============ */
  const SUPABASE_URL = 'https://awvcorswnzbxsrrzepto.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_6GqdbyBWEX7cIkTzcp9yvw_WYNp5GJh';
  const { createClient } = window.supabase;
 const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'hr-auth-awvcorsw'
  }
});
  const FORMSPREE_URL = 'https://formspree.io/f/mppwlbwq';
 

  /* ============ THEME ============ */
  const themeToggle = $('#themeToggle');
  const savedTheme = localStorage.getItem('hr-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('hr-theme', next);
    showToast(next === 'dark' ? 'Dark mode on' : 'Light mode on', 'info', '🌓');
  });

  /* ============ TOASTS ============ */
  const toastWrap = $('#toastWrap');
  function showToast(msg, type='info', icon='ℹ️'){
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const ic = document.createElement('div'); ic.className = 'icn'; ic.textContent = icon;
    const tx = document.createElement('div'); tx.textContent = msg;
    t.append(ic, tx);
    toastWrap.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
  }
  window.showToast = showToast;

  /* ============ HEADER + MOBILE ============ */
  const header = $('#header');
  const backTop = $('#backTop'); let __sq = false;
  const onScroll = () => { __sq = false; const y = window.scrollY; header.classList.toggle('scrolled', y > 10); backTop.classList.toggle('show', y > 600); };
  window.addEventListener('scroll', () => { if (!__sq) { __sq = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll();
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  $('#burger').addEventListener('click', () => $('#navLinks').classList.toggle('open'));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => $('#navLinks').classList.remove('open')));

  /* ============ REVEAL ============ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) { setTimeout(() => e.target.classList.add('in'), i * 60); io.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ============ COUNTERS ============ */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const decimals = parseInt(el.dataset.decimal || '0', 10);
      const duration = 1600, start = performance.now();
      function tick(now){
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = target * eased;
        el.textContent = (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString()) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick); cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(c => cio.observe(c));

  /* ============ MOCK BARS ============ */
  const bio = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.style.width = e.target.dataset.fill; bio.unobserve(e.target); }});
  }, { threshold: 0.3 });
  $$('.mock-bar i').forEach(b => bio.observe(b));

  /* ============ COUNTDOWN ============ */
  let targetDate = new Date('2026-11-15T09:00:00+05:30').getTime();
  function updateCountdown(){
    const now = Date.now();
    let diff = Math.max(0, targetDate - now);
    const days = Math.floor(diff / 86400000); diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
    const mins = Math.floor(diff / 60000); diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);
    const pad = n => String(n).padStart(2, '0');
    if ($('#cd-days')) {
      $('#cd-days').textContent = pad(days);
      $('#cd-hours').textContent = pad(hours);
      $('#cd-mins').textContent = pad(mins);
      $('#cd-secs').textContent = pad(secs);
    }
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ===== Admin-editable event dates (stored in site_content key 'event') ===== */
  window.__hrApplyEvent = function(ev){
    try{
      if(!ev || typeof ev !== 'object') return;
      const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const parse = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v||''); return m ? {y:+m[1], m:+m[2]-1, d:+m[3]} : null; };
      const one = d => d.d + ' ' + MON[d.m] + ' ' + d.y;
      const set = (id, txt) => { const e = document.getElementById(id); if(e && txt) e.textContent = txt; };
      const a = parse(ev.start), b = parse(ev.end);
      if(a){
        let range = one(a);
        if(b && (b.y !== a.y || b.m !== a.m || b.d !== a.d)){
          range = (b.y === a.y && b.m === a.m) ? a.d + '–' + b.d + ' ' + MON[a.m] + ' ' + a.y
                : (b.y === a.y) ? a.d + ' ' + MON[a.m] + ' – ' + b.d + ' ' + MON[b.m] + ' ' + a.y
                : one(a) + ' – ' + one(b);
        }
        set('evDatesMq', range); set('evDatesHof', range);
        const t = /^\d{2}:\d{2}$/.test(ev.time || '') ? ev.time : '09:00';
        const ts = new Date(ev.start + 'T' + t + ':00+05:30').getTime();
        if(!isNaN(ts)){ targetDate = ts; updateCountdown(); }
      }
      if(ev.venue){ set('evVenueMq', ev.venue); set('evVenueHof', ev.venue); }
      const dl = parse(ev.deadline);
      if(dl){ set('evDeadlineMq', one(dl)); set('evDeadlineTxt', dl.d + ' ' + MON[dl.m] + (dl.y !== (a ? a.y : dl.y) ? ' ' + dl.y : '')); }
    }catch(e){ console.warn('[event dates]', e); }
  };

  /* ============ PROBLEM STATEMENTS ============ */
  const PS = [
    { id:'PS-2026-001', title:'AI-powered crop disease detection for small farmers', ministry:'Ministry of Agriculture', theme:'Smart Automation', cat:'software', tag:'Software', catCls:'',
      desc:'Small and marginal farmers in India lose up to 30% of their yield to undetected crop diseases. Build a low-cost, offline-capable mobile solution.',
      outcomes:['On-device image classification','Support for 10+ crop diseases','Regional language support','Actionable treatment recommendations'] },
    { id:'PS-2026-014', title:'Low-cost portable ventilator for rural healthcare', ministry:'Ministry of Health', theme:'MedTech', cat:'hardware', tag:'Hardware', catCls:'hardware',
      desc:'Design a rugged, portable, battery-operated ventilator under ₹25,000 for rural ICUs.',
      outcomes:['Portable (<5 kg)','8+ hour battery','Tidal volume 200–800 ml','Monitoring dashboard'] },
    { id:'PS-2026-027', title:'Blockchain-based land records verification system', ministry:'Ministry of Rural Development', theme:'Blockchain', cat:'software', tag:'Software', catCls:'',
      desc:'Permissioned blockchain where land records and ownership transfers are immutable and accessible.',
      outcomes:['Immutable records','Smart contract transfers','District nodes','Public verification portal'] },
    { id:'PS-2026-041', title:'Smart railway track monitoring using IoT sensors', ministry:'Ministry of Railways', theme:'Smart Automation', cat:'hardware', tag:'Hardware', catCls:'hardware',
      desc:'Low-power IoT sensors monitoring track vibration, temperature, and geometry in real time.',
      outcomes:['Vibration + temp sensing','Long-range low-power comms','Alert dashboard','5+ year battery'] },
    { id:'PS-2026-058', title:'Open innovation in assistive tech for the disabled', ministry:'Student Innovation', theme:'Any Theme', cat:'student', tag:'Student', catCls:'student',
      desc:'Propose an original assistive tech solution that improves independence for PwD.',
      outcomes:['Working prototype','User-tested','Cost-effective','Open-source docs'] }
  ];

  let starred = JSON.parse(localStorage.getItem('hr-stars') || '[]');
  let currentFilter = 'all';

  function renderPS(){
    const psList = $('#psList');
    let list = PS.filter(p => {
      if (currentFilter === 'starred') return starred.includes(p.id);
      if (currentFilter === 'all') return true;
      return p.cat === currentFilter;
    });
    if (list.length === 0){
      psList.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);font-size:14px">No problem statements found. Try a different filter.</div>`;
      return;
    }
    psList.innerHTML = list.map(p => {
      const isStarred = starred.includes(p.id);
      return `
        <div class="ps-row" data-id="${p.id}">
          <button class="ps-star ${isStarred?'active':''}" data-star="${p.id}" aria-label="Bookmark">${isStarred?'★':'☆'}</button>
          <div class="ps-id">${p.id}</div>
          <div><div class="ps-title">${p.title}</div><div class="ps-meta">${p.ministry} · ${p.theme}</div></div>
          <div class="ps-theme ${p.catCls}">${p.tag}</div>
          <div class="ps-view">View details →</div>
        </div>`;
    }).join('');
  }
  renderPS();

  $('#psList').addEventListener('click', e => {
    const star = e.target.closest('.ps-star');
    if (star){
      e.stopPropagation();
      const id = star.dataset.star;
      const idx = starred.indexOf(id);
      if (idx >= 0){ starred.splice(idx, 1); showToast('Removed from bookmarks', 'info', '☆'); }
      else { starred.push(id); showToast('Saved to bookmarks', 'success', '⭐'); }
      localStorage.setItem('hr-stars', JSON.stringify(starred));
      renderPS();
      return;
    }
    const row = e.target.closest('.ps-row');
    if (row){
      const p = PS.find(x => x.id === row.dataset.id);
      if (p) openModal(p);
    }
  });

  const modal = $('#psModal');
  let lastFocused = null;
  function openModal(p){
    lastFocused = document.activeElement;
    $('#mId').textContent = p.id;
    $('#mTitle').textContent = p.title;
    $('#mDesc').textContent = p.desc;
    $('#mTags').innerHTML = `<span class="m-tag">${esc(p.tag)}</span><span class="m-tag hardware">${esc(p.theme)}</span><span class="m-tag ministry">${esc(p.ministry)}</span>`;
    $('#mOutcomes').innerHTML = p.outcomes.map(o => `<li>${esc(o)}</li>`).join('');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    $('#modalClose').focus();
  }
  function closeModal(){
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  $('#applyBtn').addEventListener('click', () => { closeModal(); document.querySelector('#register').scrollIntoView({behavior:'smooth'}); });

  $$('[data-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('[data-filter]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderPS();
    });
  });

  /* ============ LEADERBOARD — REAL DATA ============ */
const rowsEl = $('#boardRows');
const inits = n => escapeHtml((n || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??');

const __qc = {}; const sharedQ = (key, run) => __qc[key] || (__qc[key] = Promise.resolve(run()).finally(() => setTimeout(() => { delete __qc[key]; }, 15000)));
const rpcOrNull = async (fn, args) => { try { const { data, error } = await supabase.rpc(fn, args); return error ? null : data; } catch(_) { return null; } };
async function loadLeaderboard(period = 'live'){
  if (period === 'quiz' && window.__hkQuizBoard){ rowsEl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">Loading quiz rankings…</div>'; return window.__hkQuizBoard(rowsEl); }
  rowsEl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">Loading leaderboard…</div>';

  try {
    let list = null;
    const __rows = await sharedQ('lb:' + period, () => rpcOrNull('hr_pub_leaderboard', { p_period: period, p_limit: 5 }));
    if (Array.isArray(__rows)) list = __rows.map(r => ({ email: r.email || 'unknown', name: r.name || '', total: Number(r.total) || 0, count: Number(r.cnt) || 0 }));
    else {
    let query = supabase.from('arena_submissions').select('email, full_name, score, created_at');
    if (period === 'week'){
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', weekAgo);
    }

    const { data, error } = await (period === 'live' ? sharedQ('subs', () => query) : query);
    if (error) throw error;

    // Aggregate by email
    const agg = {};
    (data || []).forEach(r => {
      const key = r.email || 'unknown';
      if (!agg[key]) agg[key] = { email: key, name: r.full_name || '', total: 0, count: 0 };
      agg[key].total = Math.max(agg[key].total, (r.score || 0));
      agg[key].count++;
    });

    if (period === 'submissions'){
      list = Object.values(agg).sort((a, b) => b.count - a.count).slice(0, 5);
    } else {
      list = Object.values(agg).sort((a, b) => b.total - a.total).slice(0, 5);
    }
    }

    if (!list.length){
      rowsEl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">No submissions yet. Be the first one!</div>';
      return;
    }

    const colors = ['#7c5cff', '#22d3ee', '#ff4d9d', '#4ade80', '#fbbf24'];
    const medals = ['🥇', '🥈', '🥉', '', ''];

    rowsEl.innerHTML = list.map((u, i) => {
      const rank = i + 1;
      const rankCls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
      const val = period === 'submissions' ? u.count : u.total;
      const meta = period === 'submissions' ? ' submissions' : ' pts';
      return `
        <div class="row ${rank <= 3 ? 'top3' : ''}">
          <div class="rank ${rankCls}">${medals[i] || '#' + rank}</div>
          <div class="team">
            <span class="avatar" style="background:${colors[i]}">${inits(u.name || u.email)}</span>
            <div>${escapeHtml(u.name || u.email.split('@')[0])}<small>${escapeHtml(u.email.replace(/^(.{2}).*(@.*)$/,'$1***$2'))}</small></div>
          </div>
          <div class="pts">${val.toLocaleString()}</div>
          <div class="trend flat">${meta}</div>
        </div>`;
    }).join('');

  } catch (e){
    console.error('Leaderboard error:', e);
    rowsEl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">Could not load leaderboard.</div>';
  }
}

$$('[data-board]').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('[data-board]').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loadLeaderboard(tab.dataset.board);
  });
});

loadLeaderboard('live');
/* ============ FULL LEADERBOARD MODAL ============ */
let lbCurrentPeriod = 'all';

async function loadFullLeaderboard(period = 'all'){
  const content = document.getElementById('lbContent');
  const sub     = document.getElementById('lbSub');
  if (!content) return;

  lbCurrentPeriod = period;
  content.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Loading…</div>';

  try {
    let list = null;
    const __rows = await rpcOrNull('hr_pub_leaderboard_full', { p_period: period, p_limit: 50 });
    if (Array.isArray(__rows)) list = __rows.map(r => ({ email: r.email || 'unknown', name: r.name || '', total: Number(r.total) || 0, count: Number(r.cnt) || 0 }));
    else {
    let query = supabase.from('arena_submissions')
      .select('email, full_name, score, created_at, lang');

    if (period === 'week'){
      const wk = new Date(Date.now() - 7*24*60*60*1000).toISOString();
      query = query.gte('created_at', wk);
    } else if (period === 'month'){
      const mo = new Date(Date.now() - 30*24*60*60*1000).toISOString();
      query = query.gte('created_at', mo);
    }

    const { data, error } = await query;
    if (error) throw error;

    const agg = {};
    (data || []).forEach(r => {
      const key = r.email || 'unknown';
      if (!agg[key]) agg[key] = { email: key, name: r.full_name || '', total: 0, count: 0 };
      agg[key].total += r.score || 0;
      agg[key].count++;
    });

    list = Object.values(agg).sort((a,b) => b.total - a.total).slice(0, 50);
    }

    if (sub){
      const labels = { all: 'All-time rankings', week: 'Last 7 days', month: 'Last 30 days' };
      sub.textContent = `${labels[period] || ''} · ${list.length} participant${list.length > 1 ? 's' : ''}`;
    }

    if (!list.length){
      content.innerHTML = '<div class="ana-empty" style="text-align:center;padding:60px 20px">No submissions in this period yet.</div>';
      return;
    }

    const colors = ['#7c5cff','#22d3ee','#ff4d9d','#4ade80','#fbbf24'];
    const initials = n => escapeHtml((n||'?').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase() || '??');

    content.innerHTML = list.map((u, i) => {
      const rank = i + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank;
      const rankCls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
      const name = u.name || u.email.split('@')[0];
      return `
        <div class="row ${rank <= 3 ? 'top3' : ''}">
          <div class="rank ${rankCls}">${medal}</div>
          <div class="team">
            <span class="avatar" style="background:${colors[i % colors.length]}">${initials(name)}</span>
            <div>${escapeHtml(name)}<small>${escapeHtml(u.email)}</small></div>
          </div>
          <div class="pts">${u.total.toLocaleString()}</div>
          <div class="trend flat">${u.count} sub${u.count > 1 ? 's' : ''}</div>
        </div>`;
    }).join('');
  } catch (e){
    console.error('Full leaderboard error:', e);
    content.innerHTML = `<div class="ana-empty" style="text-align:center;padding:40px;color:var(--red)">Failed: ${escapeHtml(e.message)}</div>`;
  }
}

function openFullLb(){
  const modal = document.getElementById('lbModal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  loadFullLeaderboard('all');
  // reset tabs
  document.querySelectorAll('[data-lb]').forEach(t => t.classList.remove('active'));
  const firstTab = document.querySelector('[data-lb="all"]');
  if (firstTab) firstTab.classList.add('active');
}

document.addEventListener('click', (e) => {
  // Open button
  if (e.target.closest('#viewFullLbBtn')){
    openFullLb();
    return;
  }
  // Close
  if (e.target.closest('#lbClose')){
    document.getElementById('lbModal')?.classList.remove('open');
    document.body.style.overflow = '';
    return;
  }
  // Backdrop
  const lbModal = document.getElementById('lbModal');
  if (lbModal && e.target === lbModal){
    lbModal.classList.remove('open');
    document.body.style.overflow = '';
    return;
  }
  // Filter tabs
  const lbTab = e.target.closest('[data-lb]');
  if (lbTab && lbModal && lbModal.classList.contains('open')){
    document.querySelectorAll('[data-lb]').forEach(t => t.classList.remove('active'));
    lbTab.classList.add('active');
    loadFullLeaderboard(lbTab.dataset.lb);
  }
});
async function loadHeroStats(){
  try {
    let colleges = 0, totalMembers = 0;
    const __st = await sharedQ('stats', () => rpcOrNull('hr_pub_stats', {})); const __s = Array.isArray(__st) ? __st[0] : null;
    if (__s) { colleges = Number(__s.colleges) || 0; totalMembers = Number(__s.members) || 0; }
    else {
    const { data, error } = await sharedQ('teams', () => supabase.from('team_registrations').select('college_name, members'));
    if (error) throw error;

    const teams = data || [];
    colleges = new Set(
      teams.map(t => (t.college_name || '').trim().toLowerCase()).filter(Boolean)
    ).size;

    teams.forEach(t => {
      if (Array.isArray(t.members) && t.members.length) totalMembers += t.members.length;
      else totalMembers += 1;
    });

    }

    const studentsEl = document.getElementById('statStudents');
    const collegesEl = document.getElementById('statColleges');

    if (studentsEl) {
      studentsEl.dataset.count = totalMembers || 0;
      // re-animate if observer already ran
      animateCounter(studentsEl, totalMembers, '+');
    }
    if (collegesEl) {
      collegesEl.dataset.count = colleges;
      animateCounter(collegesEl, colleges, '+');
    }
  } catch (e) {
    console.warn('Hero stats load failed:', e);
  }
}

function animateCounter(el, target, suffix){
  const duration = 1600, start = performance.now();
  function tick(now){
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const v = target * eased;
    el.textContent = Math.round(v).toLocaleString() + (suffix || '');
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

loadHeroStats();
async function loadMarquee(){
  try {
    let teams, colleges;
    const __st = await sharedQ('stats', () => rpcOrNull('hr_pub_stats', {})); const __s = Array.isArray(__st) ? __st[0] : null;
    if (__s) { teams = { length: Number(__s.teams) || 0 }; colleges = Number(__s.colleges) || 0; }
    else {
    const { data, error } = await sharedQ('teams', () => supabase.from('team_registrations').select('college_name, members'));
    if (error) throw error;

    teams = data || [];
    colleges = new Set(
      teams.map(t => (t.college_name || '').trim().toLowerCase()).filter(Boolean)
    ).size;

    }

    const elTeams    = document.getElementById('mqTeams');
    const elColleges = document.getElementById('mqColleges');
    const elLive     = document.getElementById('mqLive');

    if (elTeams)    elTeams.textContent    = teams.length.toLocaleString();
    if (elColleges) elColleges.textContent = colleges.toLocaleString();
    if (elLive)     elLive.textContent     = teams.length.toLocaleString();
  const elPill = document.getElementById('pillTeams');
    if (elPill) { elPill.textContent = teams.length.toLocaleString(); const pw = document.getElementById('pillTeamsWrap'); if (pw) pw.hidden = false; }
    const elLbTotal = document.getElementById('lbTotalTeams');
if (elLbTotal) elLbTotal.textContent = teams.length.toLocaleString();
  } catch (e){
   console.warn('Marquee load failed:', e);
  }
}

loadMarquee();

async function loadHeroMockup(){
  const container = document.getElementById('heroMockupRows');
  if (!container) return;

  try {
    let top3;
    const __rows = await sharedQ('lb:live', () => rpcOrNull('hr_pub_leaderboard', { p_period: 'live', p_limit: 5 }));
    if (Array.isArray(__rows)) top3 = __rows.slice(0, 3).map(r => ({ email: r.email || 'unknown', name: r.name || '', total: Number(r.total) || 0 }));
    else {
    const { data, error } = await sharedQ('subs', () => supabase.from('arena_submissions').select('email, full_name, score, created_at'));
    if (error) throw error;

    // Aggregate by email
    const agg = {};
    (data || []).forEach(r => {
      const key = r.email || 'unknown';
      if (!agg[key]) agg[key] = { email: key, name: r.full_name || '', total: 0 };
      agg[key].total = Math.max(agg[key].total, (r.score || 0));
    });

    top3 = Object.values(agg)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
    }

    // If no data, show placeholder
    if (!top3.length){
      container.innerHTML = `
        <div style="padding:60px 20px;text-align:center;color:var(--muted);font-size:13px">
          No submissions yet — be the first! 🚀
        </div>`;
      return;
    }

    const colors = ['#7c5cff', '#22d3ee', '#ff4d9d'];
    const barColors = [
      'linear-gradient(90deg,#7c5cff,#9b7fff)',
      'linear-gradient(90deg,#22d3ee,#4ade80)',
      'linear-gradient(90deg,#ff4d9d,#fbbf24)'
    ];
    const maxScore = top3[0].total || 1;

    const initials = n => escapeHtml((n || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??');

    container.innerHTML = top3.map((u, i) => {
      const pct = Math.round((u.total / maxScore) * 100);
      const name = u.name || u.email.split('@')[0];
      const isFirst = i === 0;
      return `
        <div class="mock-team ${isFirst ? 'win' : ''}" ${i > 0 ? 'style="margin-top:12px"' : ''}>
          <span class="mock-avatar" style="background:${colors[i]}">${initials(name)}</span>
          <span class="mock-name">${escapeHtml(name)} </span>
          <span class="mock-pts">${u.total.toLocaleString()}</span>
        </div>
        <div class="mock-bar"><i data-fill="${pct}%" style="background:${barColors[i]}"></i></div>`;
    }).join('');

    // Trigger bars animation
    requestAnimationFrame(() => {
      container.querySelectorAll('.mock-bar i').forEach((b, idx) => {
        setTimeout(() => { b.style.width = b.dataset.fill; }, 200 + idx * 200);
      });
    });

  } catch (e) {
    console.warn('Hero mockup load failed:', e);
    container.innerHTML = `
      <div style="padding:60px 20px;text-align:center;color:var(--muted);font-size:13px">
        Leaderboard loading…
      </div>`;
  }
}
async function loadTestimonials(){
  const grid = document.getElementById('testiGrid');
  if (!grid) return;

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('name, role, quote, rating, avatar_color, display_order')
      .eq('published', true)
      .order('display_order', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;
    const list = data || [];

    if (!list.length){
      grid.innerHTML = `
        <div class="testi-empty">
          <div class="ic">💬</div>
          <h3>Testimonials coming soon</h3>
          <p>Real participant feedback will appear here once the season kicks off.</p>
        </div>`;
      return;
    }

    const initials = n => escapeHtml((n || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??');
    const colorFromIdx = i => ['#7c5cff','#22d3ee','#ff4d9d','#4ade80','#fbbf24','#ff9f43'][i % 6];

    grid.innerHTML = list.map((t, i) => {
      const stars = '★'.repeat(Math.max(1, Math.min(5, t.rating || 5)));
      const color = t.avatar_color || colorFromIdx(i);
      return `
        <div class="testi-card reveal in">
          <div class="stars">${stars}</div>
          <p>${escapeHtml(t.quote || '')}</p>
          <div class="testi-author">
            <div class="testi-avatar" style="background:${color}">${initials(t.name)}</div>
            <div>
              <div class="testi-name">${escapeHtml(t.name || 'Anonymous')}</div>
              <div class="testi-role">${escapeHtml(t.role || '')}</div>
            </div>
          </div>
        </div>`;
    }).join('');

  } catch (e){
    console.warn('Testimonials load failed:', e);
    grid.innerHTML = `
      <div class="testi-empty">
        <div class="ic">⚠️</div>
        <h3>Could not load testimonials</h3>
        <p>Please refresh the page.</p>
      </div>`;
  }
}

loadTestimonials();
/* ============ ADMIN — CONTACT MESSAGES ============ */
let msgState = { rows: [], current: null };

async function loadAdminMessages(){
  const tbody = document.getElementById('msgTbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="admin-empty">Loading…</td></tr>';

  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    msgState.rows = data || [];
    renderAdminMessages();
  } catch (e){
    tbody.innerHTML = `<tr><td colspan="6" class="admin-empty">Failed: ${escapeHtml(e.message)}</td></tr>`;
  }
}

function renderAdminMessages(){
  const tbody = document.getElementById('msgTbody');
  const count = document.getElementById('msgCount');
  if (!tbody) return;

  const search = (document.getElementById('msgSearch')?.value || '').trim().toLowerCase();
  const statusF = document.getElementById('msgFilterStatus')?.value || '';

  let rows = msgState.rows.filter(m => {
    if (statusF && m.status !== statusF) return false;
    if (search){
      const hay = `${m.name||''} ${m.email||''} ${m.subject||''} ${m.message||''}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  if (count){
    const newCount = msgState.rows.filter(m => m.status === 'new').length;
    count.textContent = `${rows.length} shown · ${newCount} new`;
  }

  if (!rows.length){
    tbody.innerHTML = '<tr><td colspan="6" class="admin-empty">No messages found.</td></tr>';
    return;
  }

  const statusLabel = {
    new: '🆕 New',
    read: '👁 Read',
    replied: '✅ Replied',
    archived: '📦 Archived'
  };

  tbody.innerHTML = rows.map(m => {
    const when = new Date(m.created_at).toLocaleString('en-IN', {
      day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'
    });
    return `
      <tr data-id="${m.id}" class="${m.status === 'new' ? 'flagged-row' : ''}">
        <td>
          <div class="u-email">${escapeHtml(m.name || '—')}</div>
          <div class="u-name">${escapeHtml(m.email || '')}</div>
        </td>
        <td class="hide-sm"><span class="role-pill">${escapeHtml(m.category || 'General')}</span></td>
        <td>${escapeHtml((m.subject || '').slice(0, 50))}</td>
        <td class="hide-sm"><span class="team-status-pill ${m.status || 'new'}">${statusLabel[m.status] || m.status}</span></td>
        <td class="hide-sm" style="color:var(--muted);font-size:12px">${when}</td>
        <td class="actions-cell">
          <button class="rowbtn" data-msg-act="view" data-id="${m.id}">View</button>
          <button class="rowbtn danger" data-msg-act="del" data-id="${m.id}">Delete</button>
        </td>
      </tr>`;
  }).join('');
}

function openMsgModal(msg){
  msgState.current = msg;
  document.getElementById('msgModalTitle').textContent = msg.subject || 'Message';
  document.getElementById('msgModalSub').textContent = `From ${msg.name} · ${msg.email}`;
  document.getElementById('msgModalNote').textContent = 
    `Received ${new Date(msg.created_at).toLocaleString('en-IN')} · Status: ${msg.status || 'new'}`;

  document.getElementById('msgModalBody').innerHTML = `
    <div class="field" style="margin-bottom:14px">
      <label style="font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Contact Info</label>
      <div style="padding:12px;background:rgba(0,0,0,.25);border:1px solid var(--border);border-radius:10px;font-size:13.5px;line-height:1.7">
        <div><b>Name:</b> ${escapeHtml(msg.name || '—')}</div>
        <div><b>Email:</b> <a href="mailto:${escapeHtml(msg.email)}" style="color:var(--violet)">${escapeHtml(msg.email)}</a></div>
        ${msg.phone ? `<div><b>Phone:</b> ${escapeHtml(msg.phone)}</div>` : ''}
        ${msg.org ? `<div><b>Organization:</b> ${escapeHtml(msg.org)}</div>` : ''}
        <div><b>Category:</b> ${escapeHtml(msg.category || 'General')}</div>
      </div>
    </div>
    <div class="field">
      <label style="font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Message</label>
      <div style="padding:14px;background:rgba(0,0,0,.25);border:1px solid var(--border);border-radius:10px;font-size:13.5px;line-height:1.7;white-space:pre-wrap">${escapeHtml(msg.message || '')}</div>
    </div>
  `;

  // Mark as read automatically
  if (msg.status === 'new'){
    supabase.from('contact_messages').update({ 
      status: 'read', read_at: new Date().toISOString() 
    }).eq('id', msg.id).then(() => {
      msg.status = 'read';
      renderAdminMessages();
    });
  }

  document.getElementById('msgModal').classList.add('open');
}

async function updateMsgStatus(newStatus){
  if (!msgState.current) return;
  const id = msgState.current.id;
  const upd = { status: newStatus };
  if (newStatus === 'read') upd.read_at = new Date().toISOString();
  if (newStatus === 'replied') upd.replied_at = new Date().toISOString();

  const { error } = await supabase.from('contact_messages').update(upd).eq('id', id);
  if (error){ showToast('Update failed: ' + error.message, 'warn', '⚠️'); return; }

  const local = msgState.rows.find(m => m.id === id);
  if (local) Object.assign(local, upd);
  showToast(`Marked as ${newStatus}`, 'success', '✅');
  document.getElementById('msgModal').classList.remove('open');
  renderAdminMessages();
}

document.addEventListener('click', async (e) => {
  // Tab button (handled elsewhere but ensure section shows)
  // Refresh
  if (e.target.closest('#msgRefresh')){
    loadAdminMessages();
    return;
  }
  // Close modal
  if (e.target.closest('#msgModalClose')){
    document.getElementById('msgModal').classList.remove('open');
    return;
  }
  // Backdrop
  const msgModal = document.getElementById('msgModal');
  if (msgModal && e.target === msgModal){
    msgModal.classList.remove('open');
    return;
  }
  // Archive
  if (e.target.closest('#msgModalArchive')){
    updateMsgStatus('archived');
    return;
  }
  // Reply (mark replied)
  if (e.target.closest('#msgModalReply')){
    if (msgState.current){
      window.location.href = `mailto:${msgState.current.email}?subject=Re: ${encodeURIComponent(msgState.current.subject || '')}`;
      setTimeout(() => updateMsgStatus('replied'), 800);
    }
    return;
  }
  // Row actions
  const actBtn = e.target.closest('[data-msg-act]');
  if (actBtn){
    const id = actBtn.dataset.id;
    const row = msgState.rows.find(m => m.id === id);
    if (!row) return;
    if (actBtn.dataset.msgAct === 'view'){
      openMsgModal(row);
    } else if (actBtn.dataset.msgAct === 'del'){
      if (!confirm('Delete this message?')) return;
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error){ showToast('Delete failed: ' + error.message, 'warn', '⚠️'); return; }
      msgState.rows = msgState.rows.filter(m => m.id !== id);
      renderAdminMessages();
      showToast('Message deleted', 'success', '🗑️');
    }
  }
});

// Wire search + filter
setTimeout(() => {
  document.getElementById('msgSearch')?.addEventListener('input', renderAdminMessages);
  document.getElementById('msgFilterStatus')?.addEventListener('change', renderAdminMessages);
}, 500);
/* ============ ADMIN — TESTIMONIALS ============ */
let tmState = { rows: [], editing: null };

async function loadAdminTestimonials(){
  const tbody = document.getElementById('tmTbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">Loading…</td></tr>';
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    tmState.rows = data || [];
    renderAdminTestimonials();
  } catch (e){
    tbody.innerHTML = `<tr><td colspan="7" class="admin-empty">Failed: ${escapeHtml(e.message)}</td></tr>`;
  }
}

function renderAdminTestimonials(){
  const tbody = document.getElementById('tmTbody');
  const count = document.getElementById('tmCount');
  if (!tbody) return;
  const rows = tmState.rows;
  if (count) count.textContent = `${rows.length} total`;
  if (!rows.length){
    tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">No testimonials yet. Click "Add Testimonial".</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(t => `
    <tr data-id="${t.id}">
      <td><div class="u-email">${escapeHtml(t.name || '—')}</div></td>
      <td class="hide-sm">${escapeHtml(t.role || '—')}</td>
      <td>${escapeHtml((t.quote || '').slice(0, 60))}${(t.quote || '').length > 60 ? '…' : ''}</td>
      <td class="hide-sm">${'★'.repeat(t.rating || 5)}</td>
      <td class="hide-sm">${t.display_order || 0}</td>
      <td class="hide-sm">${t.published ? '✅ Yes' : '❌ No'}</td>
      <td class="actions-cell">
        <button class="rowbtn" data-tm-act="edit" data-id="${t.id}">Edit</button>
        <button class="rowbtn danger" data-tm-act="del" data-id="${t.id}">Delete</button>
      </td>
    </tr>
  `).join('');
}



async function saveTmModal(){
  const name  = document.getElementById('tmName').value.trim();
  const quote = document.getElementById('tmQuote').value.trim();
  const note  = document.getElementById('tmModalNote');
  if (!name){ note.textContent = 'Name is required'; return; }
  if (!quote){ note.textContent = 'Quote is required'; return; }

  const payload = {
    name,
    role: document.getElementById('tmRole').value.trim() || null,
    quote,
    rating: parseInt(document.getElementById('tmRating').value, 10) || 5,
    avatar_color: document.getElementById('tmColor').value || '#7c5cff',
    display_order: parseInt(document.getElementById('tmOrder').value, 10) || 0,
    published: document.getElementById('tmPublished').checked
  };

  const btn = document.getElementById('tmSave');
  btn.disabled = true; btn.textContent = 'Saving…';

  try {
    if (tmState.editing){
      const { error } = await supabase.from('testimonials').update(payload).eq('id', tmState.editing);
      if (error) throw error;
      showToast('Testimonial updated', 'success', '✅');
    } else {
      const { error } = await supabase.from('testimonials').insert([payload]);
      if (error) throw error;
      showToast('Testimonial added', 'success', '✅');
    }
    document.getElementById('tmModal').classList.remove('open');
    await loadAdminTestimonials();
    loadTestimonials();
  } catch (e){
    note.textContent = 'Error: ' + e.message;
  } finally {
    btn.disabled = false; btn.textContent = 'Save Testimonial';
  }
}
function openTmModal(row){
  tmState.editing = row ? row.id : null;
  document.getElementById('tmModalTitle').textContent = row ? 'Edit Testimonial' : 'Add Testimonial';
  document.getElementById('tmName').value  = row?.name || '';
  document.getElementById('tmRole').value  = row?.role || '';
  document.getElementById('tmQuote').value = row?.quote || '';
  document.getElementById('tmRating').value= String(row?.rating || 5);
  document.getElementById('tmColor').value = row?.avatar_color || '#7c5cff';
  document.getElementById('tmOrder').value = row?.display_order || 0;
  document.getElementById('tmPublished').checked = row ? !!row.published : true;
  document.getElementById('tmModalNote').textContent = '';
  document.getElementById('tmModal').classList.add('open');
}
document.addEventListener('click', async (e) => {
  if (e.target.closest('#tmAddBtn')){ openTmModal(null); return; }
  if (e.target.closest('#tmRefresh')){ loadAdminTestimonials(); return; }
  if (e.target.closest('#tmCancel') || e.target.closest('#tmModalClose')){
    document.getElementById('tmModal').classList.remove('open');
    return;
  }
  if (e.target.closest('#tmSave')){ saveTmModal(); return; }
  const tmModal = document.getElementById('tmModal');
  if (tmModal && e.target === tmModal){
    tmModal.classList.remove('open');
    return;
  }
  const actBtn = e.target.closest('[data-tm-act]');
  if (actBtn){
    const id = actBtn.dataset.id;
    const row = tmState.rows.find(t => t.id === id);
    if (!row) return;
    if (actBtn.dataset.tmAct === 'edit'){
      openTmModal(row);
    } else if (actBtn.dataset.tmAct === 'del'){
      if (!confirm('Delete this testimonial?')) return;
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error){ showToast('Delete failed: ' + error.message, 'warn', '⚠️'); return; }
      showToast('Testimonial deleted', 'success', '🗑️');
      await loadAdminTestimonials();
      loadTestimonials();
    }
  }
});

loadHeroMockup();
 
  /* ============ FAQ ============ */
  $$('.faq-item').forEach(item => {
    item.querySelector('.faq-q').addEventListener('click', () => item.classList.toggle('open'));
  });

  /* ============ CONTACT ============ */
  let selectedCat = 'General';
  $$('#catPills .cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('#catPills .cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedCat = pill.dataset.cat;
    });
  });
     
  $('#qSubmit').addEventListener('click', () => {
    const name = $('#qName').value.trim();
    const email = $('#qEmail').value.trim();
    const subject = $('#qSubject').value.trim();
    const message = $('#qMessage').value.trim();

    if (!name || name.length < 2) { showToast('Please enter your full name', 'warn', '⚠️'); $('#qName').focus(); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Please enter a valid email', 'warn', '⚠️'); $('#qEmail').focus(); return; }
    if (!subject) { showToast('Please enter a subject', 'warn', '⚠️'); $('#qSubject').focus(); return; }
    if (!message || message.length < 20) { showToast('Message must be at least 20 characters', 'warn', '⚠️'); $('#qMessage').focus(); return; }

    const btn = $('#qSubmit');
    const orig = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    // Save to Supabase (admin console ke liye)
const dbP = supabase.from('contact_messages').insert([{
  name, email,
  phone: $('#qPhone').value.trim() || null,
  org: $('#qOrg').value.trim() || null,
  category: selectedCat || 'General',
  subject, message
}]).then(({ error }) => { if (error) console.warn('Contact save failed:', error); return !error; })
  .catch(() => false);

    const fsP = fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name, email, phone: $('#qPhone').value.trim(),
        org: $('#qOrg').value.trim(), category: selectedCat, subject, message })
    }).then(r => r.ok).catch(() => false);

    Promise.all([dbP, fsP]).then(([dbOk, fsOk]) => {
     if (!dbOk && !fsOk) {
      btn.textContent = orig;
      btn.disabled = false;
      showToast('Could not send your message. Please try again or email us directly.', 'warn', '⚠️');
      return;
     }
     setTimeout(() => {
      btn.textContent = 'Message Sent ✓';
      btn.style.background = 'linear-gradient(135deg,#3ddc84,#22d3ee)';
      showToast(`Query submitted! We'll reply to ${email} within 24 hours.`, 'success', '✓');
      ['qName','qEmail','qPhone','qOrg','qSubject','qMessage'].forEach(id => $('#'+id).value = '');
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.background = '';
        btn.disabled = false;
      }, 2500);
    }, 300);
    });
  });

  /* ============ NEWSLETTER ============ */
  $('#newsletterForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#newsletterEmail').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email', 'warn', '⚠️');
      return;
    }
    const nlBtn = e.target.querySelector('button[type="submit"]');
    if (nlBtn) nlBtn.disabled = true;
    fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, subject: 'Newsletter subscription', category: 'Newsletter', message: 'Newsletter signup: ' + email })
    }).then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      showToast("Subscribed! We'll keep you posted.", 'success', '📬');
      $('#newsletterEmail').value = '';
    }).catch(() => {
      showToast('Could not subscribe right now. Please try again.', 'warn', '⚠️');
    }).finally(() => { if (nlBtn) nlBtn.disabled = false; });
  });

  /* ============ AI CHAT ============ */
  const aiFab = $('#aiFab');
  const aiPanel = $('#aiPanel');
  const aiClose = $('#aiClose');
  const aiMessages = $('#aiMessages');
  const aiInput = $('#aiInput');
  const aiSend = $('#aiSend');
  const aiSuggestions = $('#aiSuggestions');

  function toggleAI(open){
    aiPanel.classList.toggle('open', open);
    aiFab.classList.toggle('hidden', open);
    if (open) setTimeout(() => aiInput.focus(), 200);
  }
  aiFab.addEventListener('click', () => toggleAI(true));
  aiClose.addEventListener('click', () => toggleAI(false));
let aiHistory = [];

async function getAIResponse(msg){
  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history: aiHistory })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    return data.reply;
  } catch (e) {
    console.warn('AI error:', e);
    return "⚠️ AI se connect nahi ho paya. Internet check karo ya thodi der baad try karo.";
  }
}

  function addAIMessage(text, isUser=false){
    const div = document.createElement('div');
    div.className = `ai-msg ${isUser?'user':''}`;
    const safe = escapeHtml(String(text ?? '')).replace(/\n/g, '<br>');
    div.innerHTML = isUser
      ? `<div class="mini-avatar">You</div><div class="bubble">${safe}</div>`
      : `<div class="mini-avatar">🤖</div><div class="bubble">${safe}</div>`;
    aiMessages.appendChild(div);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }
  function showTyping(){
    const div = document.createElement('div');
    div.className = 'ai-msg'; div.id = 'aiTyping';
    div.innerHTML = `<div class="mini-avatar">🤖</div><div class="ai-typing"><span></span><span></span><span></span></div>`;
    aiMessages.appendChild(div);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }
  function hideTyping(){ const t = $('#aiTyping'); if (t) t.remove(); }

 async function sendAI(){
  const msg = aiInput.value.trim();
  if (!msg) return;
  addAIMessage(msg, true);
  aiInput.value = '';
  aiSuggestions.style.display = 'none';
  showTyping();

  const reply = await getAIResponse(msg);
  hideTyping();
  addAIMessage(reply);

  aiHistory.push({ role: 'user', text: msg });
  aiHistory.push({ role: 'assistant', text: reply });
  if (aiHistory.length > 12) aiHistory = aiHistory.slice(-12);
}
  aiSend.addEventListener('click', sendAI);
  aiInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendAI(); }
  });
  aiInput.addEventListener('input', () => {
    aiInput.style.height = 'auto';
    aiInput.style.height = Math.min(aiInput.scrollHeight, 120) + 'px';
  });
  aiSuggestions.addEventListener('click', e => {
    const btn = e.target.closest('.ai-sugg');
    if (!btn) return;
    aiInput.value = btn.textContent;
    sendAI();
  });

  /* ============ AUTH ============ */
  const loginModal = $('#loginModal');
  const loginBtn = $('#loginBtn');
  const loginClose = $('#loginClose');
  const loginSubmit = $('#loginSubmit');
  const loginError = $('#loginError');
  const loginErrorText = $('#loginErrorText');
  const loginEmail = $('#loginEmail');
  const loginPassword = $('#loginPassword');
  const pwToggle = $('#pwToggle');
  const rolePicker = $('#rolePicker');
  const authToggle = $('#authToggle');
  const authSwitchLink = $('#authSwitchLink');
  const authSwitchText = $('#authSwitchText');
  const loginTitle = $('#loginTitle');
  const loginSub = $('#loginSub');
  const loginRow = $('#loginRow');
  const socialLogin = document.querySelector('.social-login');
  const divider = document.querySelector('.divider');

  const signupFields = {
    name: $('#fieldName'), college: $('#fieldCollege'), designation: $('#fieldDesignation'),
    org: $('#fieldOrg'), expertise: $('#fieldExpertise'), invite: $('#fieldInvite'), terms: $('#fieldTerms')
  };
  const signupInputs = {
    name: $('#signupName'), college: $('#signupCollege'), designation: $('#signupDesignation'),
    org: $('#signupOrg'), expertise: $('#signupExpertise'), invite: $('#signupInvite'), terms: $('#signupTerms')
  };

  let selectedRole = 'Student';
  let authMode = 'login';

   async function getCurrentUser(){
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    
    // Pehle profile table, fir auth metadata, fir fallback Student
    const metaRole = user.user_metadata?.role;
    const safeMetaRole = (metaRole === 'Admin' || metaRole === 'Judge') ? 'Student' : metaRole;
    const role = profile?.role || safeMetaRole || 'Student';
    const name = profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0];
    const college = profile?.college || user.user_metadata?.college || '';

    return {
      id: user.id, 
      email: user.email,
      name: name,
      role: role,
      college: college,
      created_at: user.created_at
    };
  } catch(e){ console.warn('Auth check failed:', e); return null; }
}

  async function updateAuthUI(){
    const user = await getCurrentUser();
    const navCta = document.querySelector('.nav-cta');
    const loginBtnEl = document.getElementById('loginBtn');
    const regLock = document.getElementById('regLock');
    const regShell = document.getElementById('regShell');
    const regHead = document.getElementById('regHead');
    const adminSection = document.getElementById('admin');

    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) existingMenu.remove();

    if (user){
      if (loginBtnEl) loginBtnEl.style.display = 'none';
      const initials = escapeHtml((user.name || user.email).split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase());
      const menuHTML = `
        <div class="user-menu" id="userMenu">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="un">${escapeHtml((user.name || user.email).split('@')[0])}</div>
            <div class="ur">${escapeHtml(user.role)}</div>
          </div>
          <div class="user-dropdown">
            <button id="ddProfile">👤 My Profile</button>
            <button id="ddDashboard">📊 Dashboard</button>
            <button id="ddRegister">📝 My Registration</button>
            <div class="divider-h"></div>
            <button class="danger" id="ddLogout">🚪 Log out</button>
          </div>
        </div>`;
      if (navCta) navCta.insertAdjacentHTML('afterbegin', menuHTML);

      if (regLock) regLock.style.display = 'none';
      if (regHead) regHead.style.display = '';
      if (regShell) regShell.style.display = '';

      const userMenu = document.getElementById('userMenu');
      userMenu.addEventListener('click', (e) => {
        if (!e.target.closest('.user-dropdown')) userMenu.classList.toggle('open');
      });
      document.getElementById('ddLogout').addEventListener('click', async () => {
        await supabase.auth.signOut();
        showToast('Logged out successfully', 'info', '👋');
        updateAuthUI();
        window.scrollTo({top: 0, behavior: 'smooth'});
      });
      document.getElementById('ddProfile').addEventListener('click', () => {
        userMenu.classList.remove('open');
        showToast(`Email: ${user.email} | Role: ${user.role}`, 'info', '👤');
      });
     document.getElementById('ddDashboard').addEventListener('click', () => {
  userMenu.classList.remove('open');
  showDashboard();
});
     document.getElementById('ddRegister').addEventListener('click', () => {
  userMenu.classList.remove('open');
  showMyRegistration();
});
      // Admin menu injection
      if (user.role === 'Admin'){
        const dd = userMenu.querySelector('.user-dropdown');
        if (dd && !dd.querySelector('#ddAdmin')){
          const btn = document.createElement('button');
          btn.id = 'ddAdmin';
          btn.innerHTML = '🛡️ Admin Console';
          btn.addEventListener('click', () => {
            userMenu.classList.remove('open');
            if (adminSection){
              adminSection.style.display = '';
              adminSection.scrollIntoView({ behavior:'smooth' });
              loadAdminData();
            }
          });
          const dividerH = dd.querySelector('.divider-h');
          if (dividerH) dividerH.insertAdjacentElement('beforebegin', btn);
          else dd.appendChild(btn);
        }
        if (adminSection) adminSection.style.display = '';
      } else {
        if (adminSection) adminSection.style.display = 'none';
      }
    } else {
      if (loginBtnEl) loginBtnEl.style.display = '';
      if (regLock) regLock.style.display = '';
      if (regHead) regHead.style.display = 'none';
      if (regShell) regShell.style.display = 'none';
      if (adminSection) adminSection.style.display = 'none';
    }

    // Arena gate
    const arenaLock = document.getElementById('arenaLock');
    const arenaApp = document.getElementById('arenaApp');
    if (user){
      if (arenaLock) arenaLock.style.display = 'none';
      if (arenaApp) arenaApp.style.display = 'flex';
      if (typeof renderHistory === 'function') renderHistory();
    } else {
      if (arenaLock) arenaLock.style.display = '';
      if (arenaApp) arenaApp.style.display = 'none';
    }
  }

  function openLogin(){
    loginModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => loginEmail.focus(), 200);
  }
  function closeLogin(){
    loginModal.classList.remove('open');
    document.body.style.overflow = '';
    loginError.classList.remove('show');
    loginEmail.value = '';
    loginPassword.value = '';
    Object.values(signupInputs).forEach(el => {
      if (el && el.type === 'checkbox') el.checked = false;
      else if (el) el.value = '';
    });
  }

  loginBtn.addEventListener('click', openLogin);
  loginClose.addEventListener('click', closeLogin);
  loginModal.addEventListener('click', (e) => { if (e.target === loginModal) closeLogin(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && loginModal.classList.contains('open')) closeLogin();
  });

  function updateFormFields(){
    loginPassword.setAttribute('autocomplete', authMode === 'signup' ? 'new-password' : 'current-password');
    const isSignup = authMode === 'signup';
    Object.values(signupFields).forEach(el => {
      if (el) el.style.display = isSignup ? 'flex' : 'none';
    });
    if (signupFields.college)
      signupFields.college.style.display = (isSignup && (selectedRole === 'Student' || selectedRole === 'SPOC')) ? 'flex' : 'none';
    if (signupFields.designation)
      signupFields.designation.style.display = (isSignup && selectedRole === 'SPOC') ? 'flex' : 'none';
    if (signupFields.org)
      signupFields.org.style.display = (isSignup && selectedRole === 'Judge') ? 'flex' : 'none';
    if (signupFields.expertise)
      signupFields.expertise.style.display = (isSignup && selectedRole === 'Judge') ? 'flex' : 'none';
    if (signupFields.invite){
      const needsInvite = isSignup && (selectedRole === 'Admin' || selectedRole === 'Judge');
      signupFields.invite.style.display = needsInvite ? 'flex' : 'none';
      const inviteLabel = document.getElementById('inviteLabel');
      const inviteHint = document.getElementById('inviteHint');
      const inviteInput = signupInputs.invite;
      if (inviteLabel) inviteLabel.textContent = selectedRole === 'Admin' ? 'Admin Invite Code' : 'Judge Invite Code';
      if (inviteHint) inviteHint.textContent = selectedRole === 'Admin' ? 'Only for authorized administrators' : 'Provided by Hackathon Rivals team';
      if (inviteInput) inviteInput.placeholder = selectedRole === 'Admin' ? 'Enter admin code' : 'Enter judge code';
    }
    if (signupFields.terms) signupFields.terms.style.display = isSignup ? 'flex' : 'none';
    if (loginRow) loginRow.style.display = isSignup ? 'none' : 'flex';
    if (socialLogin) socialLogin.style.display = isSignup ? 'none' : 'grid';
    if (divider) divider.style.display = isSignup ? 'none' : 'flex';

    if (isSignup){
      loginTitle.textContent = `Create ${selectedRole} account`;
      loginSub.textContent = `Sign up to get started with Hackathon Rivals`;
      loginSubmit.textContent = `Create account →`;
      authSwitchText.textContent = 'Already have an account?';
      authSwitchLink.textContent = 'Log in →';
    } else {
      loginTitle.textContent = 'Welcome back';
      loginSub.textContent = 'Log in to continue to your dashboard';
      loginSubmit.textContent = 'Log in →';
      authSwitchText.textContent = "Don't have an account?";
      authSwitchLink.textContent = 'Create one →';
    }
  }

  authToggle.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      authToggle.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      authMode = tab.dataset.mode;
      loginError.classList.remove('show');
      updateFormFields();
    });
  });

  authSwitchLink.addEventListener('click', () => {
    authMode = authMode === 'login' ? 'signup' : 'login';
    authToggle.querySelectorAll('.auth-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.mode === authMode);
    });
    loginError.classList.remove('show');
    updateFormFields();
  });

  rolePicker.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      rolePicker.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedRole = btn.dataset.role;
      loginError.classList.remove('show');
      updateFormFields();
    });
  });

  pwToggle.addEventListener('click', () => {
    const isPw = loginPassword.type === 'password';
    loginPassword.type = isPw ? 'text' : 'password';
    pwToggle.textContent = isPw ? '🙈' : '👁️';
  });

  /* Register links now open the combined Team + Quiz registration hub.
     The Team panel shows its own "login required" card when the visitor is signed out. */

  const lockLoginBtn = document.getElementById('lockLoginBtn');
  const lockSignupBtn = document.getElementById('lockSignupBtn');
  const lockSignupLink = document.getElementById('lockSignupLink');
  if (lockLoginBtn) lockLoginBtn.addEventListener('click', () => {
    authMode = 'login';
    authToggle.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === 'login'));
    updateFormFields(); openLogin();
  });
  [lockSignupBtn, lockSignupLink].forEach(el => {
    if (el) el.addEventListener('click', () => {
      authMode = 'signup';
      authToggle.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === 'signup'));
      updateFormFields(); openLogin();
    });
  });

  loginSubmit.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const pw = loginPassword.value.trim();
    const isSignup = authMode === 'signup';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      loginErrorText.textContent = 'Please enter a valid email address';
      loginError.classList.add('show'); loginEmail.focus(); return;
    }
    if (!pw || pw.length < 6){
      loginErrorText.textContent = 'Password must be at least 6 characters';
      loginError.classList.add('show'); loginPassword.focus(); return;
    }

    if (isSignup && (window.__hrWeakPw ? window.__hrWeakPw(pw, email) : pw.length < 8)){
      loginErrorText.textContent = 'Use a stronger password: at least 8 characters with letters and numbers (not a common one like 123456).';
      loginError.classList.add('show'); loginPassword.focus(); return;
    }

    if (isSignup){
      const name = signupInputs.name?.value.trim();
      if (!name){ loginErrorText.textContent = 'Please enter your full name';
        loginError.classList.add('show'); signupInputs.name.focus(); return; }
      if ((selectedRole === 'Student' || selectedRole === 'SPOC') && !signupInputs.college?.value.trim()){
        loginErrorText.textContent = 'Please enter your college name';
        loginError.classList.add('show'); signupInputs.college.focus(); return;
      }
      if (selectedRole === 'SPOC' && !signupInputs.designation?.value.trim()){
        loginErrorText.textContent = 'Please enter your designation';
        loginError.classList.add('show'); signupInputs.designation.focus(); return;
      }
     if (selectedRole === 'Judge'){
  if (!signupInputs.invite?.value.trim()){
    loginErrorText.textContent = 'Judge invite code is required';
    loginError.classList.add('show'); signupInputs.invite.focus(); return;
  }
  const verifyRes = await fetch('/api/verify-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: signupInputs.invite.value.trim(), role: 'Judge' })
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.ok){
    loginErrorText.textContent = 'Invalid judge invite code';
    loginError.classList.add('show'); signupInputs.invite.focus(); return;
  }
}
     if (selectedRole === 'Admin'){
  if (!signupInputs.invite?.value.trim()){
    loginErrorText.textContent = 'Admin invite code is required';
    loginError.classList.add('show'); signupInputs.invite.focus(); return;
  }
  const verifyRes = await fetch('/api/verify-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: signupInputs.invite.value.trim(), role: 'Admin' })
  });
  const verifyData = await verifyRes.json();
 if (!verifyData.ok){
    loginErrorText.textContent = 'Invalid admin invite code';
    loginError.classList.add('show'); signupInputs.invite.focus(); return;
  }
}
      if (!signupInputs.terms?.checked){
        loginErrorText.textContent = 'Please accept the Terms & Conditions';
        loginError.classList.add('show'); return;
      }
    }

    loginError.classList.remove('show');
    loginSubmit.textContent = isSignup ? 'Creating account...' : 'Logging in...';
    loginSubmit.disabled = true;

    try {
      if (isSignup){
        const { error } = await supabase.auth.signUp({
          email, password: pw,
          options: { data: {
            full_name: signupInputs.name?.value.trim() || '',
            role: selectedRole,
            invite_code: (selectedRole === 'Admin' || selectedRole === 'Judge') ? (signupInputs.invite?.value.trim() || '') : '',
            college: signupInputs.college?.value.trim() || ''
          }}
        });
        if (error) throw error;
        showToast(`${selectedRole} account created!`, 'success', '✓');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        showToast(`Welcome back!`, 'success', '✓');
        if (window.__hrWeakPw && window.__hrWeakPw(pw, email)) setTimeout(() => showToast('Your password is weak. Please change it: Profile → Change password.', 'warn', '🔐'), 1800);
      }

      loginSubmit.textContent = isSignup ? 'Account created ✓' : 'Logged in ✓';
      loginSubmit.style.background = 'linear-gradient(135deg,#3ddc84,#22d3ee)';

      fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ _subject: `${selectedRole} ${isSignup ? 'Signup' : 'Login'}`,
          type: isSignup ? 'SIGNUP' : 'LOGIN', role: selectedRole, email,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) })
      }).catch(()=>{});

      setTimeout(async () => {
        closeLogin();
        loginSubmit.textContent = isSignup ? 'Create account →' : 'Log in →';
        loginSubmit.style.background = '';
        loginSubmit.disabled = false;
        await updateAuthUI();
      }, 1200);

    } catch(err){
      console.error('Auth error:', err);
      loginErrorText.textContent = err.message || 'Something went wrong';
      loginError.classList.add('show');
      loginSubmit.textContent = isSignup ? 'Create account →' : 'Log in →';
      loginSubmit.style.background = '';
      loginSubmit.disabled = false;
    }
});

  [loginEmail, loginPassword].forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter'){ e.preventDefault(); loginSubmit.click(); }
    });
  });

  const forgotLink = $('#forgotLink');
  if (forgotLink){
    forgotLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = loginEmail.value.trim();
      if (!email){ showToast('Enter your email first', 'warn', '📧'); loginEmail.focus(); return; }
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error){ showToast(error.message, 'warn', '⚠️'); return; }
      showToast('Password reset link sent to your email', 'success', '📧');
    });
  }

  document.querySelectorAll('.social-login-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const provider = btn.dataset.provider.toLowerCase();
      if (provider === 'google' || provider === 'github'){
        const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.href } });
        if (error) showToast(error.message, 'warn', '⚠️');
      } else {
        showToast(`${btn.dataset.provider} signup coming soon!`, 'info', '🔐');
      }
    });
  });
  /* ============ LOAD REGISTRATION FOR EDIT ============ */
async function loadRegistrationForEdit(reg){
  if (!reg) return;

  editingRegistrationId = reg.id;

  // Populate SPOC fields
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('regSpocName', reg.spoc_name);
  setVal('regSpocDesignation', reg.spoc_designation);
  setVal('regSpocEmail', reg.spoc_email);
  setVal('regSpocMobile', reg.spoc_mobile);
  setVal('regCollegeName', reg.college_name);
  setVal('regCollegeCity', reg.college_city);
  setVal('regCollegeAddress', reg.college_address);

  setVal('regTeamName', reg.team_name);
  setVal('regTeamSize', String(reg.team_size || 1));
  setVal('regTheme', reg.theme);
  setVal('regCategory', reg.category);
  setVal('regProblemStatement', reg.problem_statement);
  setVal('regIdeaSummary', reg.idea_summary);

  // Populate members
  const membersList = document.getElementById('membersList');
  if (membersList && Array.isArray(reg.members) && reg.members.length){
    membersList.innerHTML = '';
    reg.members.forEach((m, i) => {
      addMember();
      const card = membersList.querySelectorAll('.member-card')[i];
      if (!card) return;
      const inputs = card.querySelectorAll('input, select');
      if (inputs[0]) inputs[0].value = m.name || '';
      if (inputs[1] && m.role) inputs[1].value = m.role;
      if (inputs[2] && m.gender) inputs[2].value = m.gender;
    });
    syncMembers();
  }

  // Change submit button text
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn && currentStep === totalSteps){
    nextBtn.textContent = 'Update Registration ✓';
  }

  // Scroll to register section
  document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
  setStep(1);

  showToast('✏️ Edit mode — update your details and re-submit', 'info', '✏️');
}
/* ============ DASHBOARD ============ */
async function showDashboard(){
  const modal = document.getElementById('dashboardModal');
  const body = document.getElementById('dbBody');
  const welcome = document.getElementById('dbWelcome');
  const sub = document.getElementById('dbSub');
  if (!modal) return;

  const user = await getCurrentUser();
  if (!user){
    showToast('Please log in first', 'warn', '🔒');
    return;
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  welcome.innerHTML = `Welcome back, <span class="grad">${escapeHtml((user.name || user.email).split('@')[0])}</span>!`;
  sub.textContent = 'Loading your dashboard…';
  body.innerHTML = '<div class="ana-empty">Fetching your data…</div>';

  try {
    // Parallel fetches
    const [regRes, subRes] = await Promise.all([
      supabase.from('team_registrations').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('arena_submissions').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    ]);

    const registration = regRes.data?.[0] || null;
    const submissions = subRes.data || [];

    // Stats
    const totalSubs = submissions.length;
    const avgScore = totalSubs
      ? Math.round(submissions.reduce((a, s) => a + (s.score || 0), 0) / totalSubs)
      : 0;
    const bestScore = totalSubs
      ? Math.max(...submissions.map(s => s.score || 0))
      : 0;

    sub.textContent = `Member since ${new Date(user.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;

    // Registration section HTML
    let regHtml = '';
    if (registration){
      const status = (registration.status || 'submitted').toLowerCase();
      const statusLabels = {
        submitted: '🟣 Submitted',
        approved: '✅ Approved',
        rejected: '❌ Rejected'
      };
      regHtml = `
        <div class="db-card">
          <div class="db-reg-summary">
            <div class="info">
              <h3>${escapeHtml(registration.team_name || 'Your Team')}</h3>
              <div class="meta">${escapeHtml(registration.college_name || '')} · ${escapeHtml(registration.theme || '')}</div>
            </div>
            <span class="team-status-pill ${status}">${statusLabels[status] || status}</span>
          </div>
        </div>`;
    } else {
      regHtml = `
        <div class="db-card">
          <div class="db-empty">
            <span class="ic">📝</span>
            <div class="msg">You haven't registered a team yet.</div>
            <button class="btn btn-primary" id="dbRegisterBtn">Register Now →</button>
          </div>
        </div>`;
    }

    // Recent submissions HTML
    let subsHtml = '';
    if (submissions.length === 0){
      subsHtml = `
        <div class="db-card">
          <div class="db-empty">
            <span class="ic">⚔️</span>
            <div class="msg">No arena submissions yet.</div>
            <button class="btn btn-primary" id="dbArenaBtn">Try Code Arena →</button>
          </div>
        </div>`;
    } else {
      subsHtml = '<div class="db-subs">' + submissions.slice(0, 5).map(s => {
        const score = s.score || 0;
        const cls = score >= 75 ? 'good' : score >= 50 ? 'mid' : 'low';
        return `
          <div class="db-sub-row">
            <div class="title">${escapeHtml((s.title || 'Untitled').slice(0, 60))}
              <small>${new Date(s.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })} · ${s.lang || '—'}</small>
            </div>
            <span class="lang-chip">${escapeHtml(s.lang || '—')}</span>
            <span class="score ${cls}">${score}</span>
          </div>`;
      }).join('') + '</div>';
    }

    body.innerHTML = `
      <div class="db-hero">
        <div class="greeting">
          ${escapeHtml(user.name || user.email.split('@')[0])}
          <span class="role-chip">${escapeHtml(user.role || 'Student')}</span>
        </div>
        <div class="sub">${escapeHtml(user.email)} · Hackathon Rivals Season 2026</div>
      </div>

      <div class="db-stats">
        <div class="db-stat accent">
          <span class="ic">📝</span>
          <div class="v">${registration ? 1 : 0}</div>
          <div class="l">Team Registered</div>
        </div>
        <div class="db-stat">
          <span class="ic">⚔️</span>
          <div class="v">${totalSubs}</div>
          <div class="l">Arena Submissions</div>
        </div>
        <div class="db-stat">
          <span class="ic">🏆</span>
          <div class="v">${bestScore}</div>
          <div class="l">Best Score</div>
        </div>
      </div>

      <div class="db-section">
        <div class="db-section-head">
          <h4>📝 My Registration</h4>
          <button class="link" id="dbViewRegBtn">View Details →</button>
        </div>
        ${regHtml}
      </div>

      <div class="db-section">
        <div class="db-section-head">
          <h4>⚔️ Recent Submissions</h4>
          ${submissions.length ? `<button class="link" id="dbViewArenaBtn">View All →</button>` : ''}
        </div>
        ${subsHtml}
      </div>

      <div class="db-section">
        <div class="db-section-head">
          <h4>⚡ Quick Actions</h4>
        </div>
        <div class="db-actions">
          <button class="db-action" id="dbActRegister">
            <span class="ic">📝</span>
            <span class="t">${registration ? 'View Registration' : 'Register Team'}</span>
            <span class="s">${registration ? 'See your team details' : 'Enter Hackathon Rivals 2026'}</span>
          </button>
          <button class="db-action" id="dbActArena">
            <span class="ic">⚔️</span>
            <span class="t">Code Arena</span>
            <span class="s">Solve problems & earn score</span>
          </button>
          <button class="db-action" id="dbActLab">
            <span class="ic">💻</span>
            <span class="t">Code Lab</span>
            <span class="s">39 languages playground</span>
          </button>
        </div>
      </div>
    `;

    // Wire action buttons
    const closeAndGo = (id) => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    document.getElementById('dbViewRegBtn')?.addEventListener('click', () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      showMyRegistration();
    });

    document.getElementById('dbRegisterBtn')?.addEventListener('click', () => closeAndGo('register'));
    document.getElementById('dbArenaBtn')?.addEventListener('click', () => closeAndGo('arena'));

    document.getElementById('dbViewArenaBtn')?.addEventListener('click', () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      document.getElementById('arena')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('dbActRegister')?.addEventListener('click', () => {
      if (registration){
        modal.classList.remove('open');
        document.body.style.overflow = '';
        showMyRegistration();
      } else {
        closeAndGo('register');
      }
    });
    document.getElementById('dbActArena')?.addEventListener('click', () => closeAndGo('arena'));
    document.getElementById('dbActLab')?.addEventListener('click', () => closeAndGo('playground'));

  } catch (err){
    console.error('Dashboard error:', err);
    body.innerHTML = `
      <div class="db-empty">
        <span class="ic">⚠️</span>
        <div class="msg">Could not load dashboard: ${escapeHtml(err.message || 'Unknown error')}</div>
      </div>`;
  }
}

// Close handlers
document.addEventListener('click', (e) => {
  if (e.target.closest('#dbClose')){
    document.getElementById('dashboardModal')?.classList.remove('open');
    document.body.style.overflow = '';
  }
});
document.addEventListener('click', (e) => {
  const m = document.getElementById('dashboardModal');
  if (m && e.target === m){
    m.classList.remove('open');
    document.body.style.overflow = '';
  }
});
/* ============ MY REGISTRATION ============ */
async function showMyRegistration(){
  const modal = document.getElementById('myRegModal');
  const body = document.getElementById('myRegBody');
  const title = document.getElementById('myRegTitle');
  const sub = document.getElementById('myRegSub');
  if (!modal) return;

  const user = await getCurrentUser();
  if (!user){
    showToast('Please log in first', 'warn', '🔒');
    return;
  }

  // Open modal + show loading
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  title.textContent = 'My Registration';
  sub.textContent = 'Loading…';
  body.innerHTML = '<div class="ana-empty">Fetching your registration…</div>';

  try {
    const { data, error } = await supabase
      .from('team_registrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0){
      // No registration found
      title.textContent = 'No Registration Yet';
      sub.textContent = 'You haven\'t registered any team';
      body.innerHTML = `
        <div class="myreg-empty">
          <div class="ic">📝</div>
          <h3>You haven't registered a team yet</h3>
          <p>Register your team for Hackathon Rivals Season 2026. It's free and takes just 4 steps!</p>
          <button class="btn btn-primary btn-lg" id="myRegGoBtn">Register Now →</button>
        </div>`;
      const goBtn = document.getElementById('myRegGoBtn');
      if (goBtn) goBtn.addEventListener('click', () => {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
      });
      return;
    }

    const r = data[0];

    // Status label
    const status = (r.status || 'submitted').toLowerCase();
    const statusLabel = {
      submitted: '✓ Submitted',
      approved: '✅ Approved',
      rejected: '✕ Rejected',
      draft: '● Draft'
    }[status] || '✓ Submitted';

    const submittedDate = new Date(r.created_at).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    title.textContent = 'My Registration';
    sub.textContent = `Submitted on ${submittedDate}`;

    // Members
    const members = Array.isArray(r.members) ? r.members : [];
    const membersHtml = members.length
      ? members.map((m, i) => `
          <div class="myreg-member">
            <div class="num">${i + 1}</div>
            <div class="nm">${esc(m.name || '—')}${i === 0 ? ' <span style="color:var(--violet);font-size:11px;font-weight:600">(Leader)</span>' : ''}</div>
            ${m.role ? `<div class="rl">${esc(m.role)}</div>` : ''}
          </div>`).join('')
      : '<div style="color:var(--muted);font-size:13px">No members added</div>';

    body.innerHTML = `
      <div class="myreg-hero">
        <div>
          <h3>${esc(r.team_name || 'Untitled Team')}</h3>
          <div class="team-sub">${esc(r.college_name || '')} ${r.college_city ? '· ' + esc(r.college_city) : ''}</div>
        </div>
        <div class="myreg-status ${status}">${statusLabel}</div>
      </div>

      <div class="myreg-grid">
        <div class="myreg-box">
          <h4>🎯 Team & Theme</h4>
          <div class="row"><span class="lbl">Team Name</span><span class="val">${esc(r.team_name || '—')}</span></div>
          <div class="row"><span class="lbl">Team Size</span><span class="val">${r.team_size || 1} member${(r.team_size || 1) > 1 ? 's' : ''}</span></div>
          <div class="row"><span class="lbl">Theme</span><span class="val">${esc(r.theme || '—')}</span></div>
          <div class="row"><span class="lbl">Category</span><span class="val">${esc(r.category || '—')}</span></div>
          <div class="row"><span class="lbl">Problem</span><span class="val" style="font-size:12px">${esc((r.problem_statement || '—').slice(0, 60))}</span></div>
        </div>

        <div class="myreg-box">
          <h4>🏫 SPOC Details</h4>
          <div class="row"><span class="lbl">Name</span><span class="val">${esc(r.spoc_name || '—')}</span></div>
          <div class="row"><span class="lbl">Designation</span><span class="val">${esc(r.spoc_designation || '—')}</span></div>
          <div class="row"><span class="lbl">Email</span><span class="val" style="font-size:12px">${esc(r.spoc_email || '—')}</span></div>
          <div class="row"><span class="lbl">Mobile</span><span class="val">${esc(r.spoc_mobile || '—')}</span></div>
          <div class="row"><span class="lbl">College</span><span class="val" style="font-size:12px">${esc(r.college_name || '—')}</span></div>
        </div>
      </div>

      <div class="myreg-box" style="margin-bottom:22px">
        <h4>💡 Idea Summary</h4>
        <p style="font-size:13.5px;line-height:1.7;margin:0;color:var(--text)">${esc(r.idea_summary || 'No summary provided.')}</p>
      </div>

      <div class="myreg-box">
        <h4>👥 Team Members (${members.length})</h4>
        <div class="myreg-members">${membersHtml}</div>
      </div>

      <div class="myreg-foot">
        <button class="btn btn-ghost" id="myRegCloseBtn2">Close</button>
        <button class="btn btn-ghost" id="myRegEditBtn">✏️ Edit & Re-submit</button>
      </div>
    `;

    // Close button
    document.getElementById('myRegCloseBtn2').addEventListener('click', () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    });

    // Edit → scroll to register section
   document.getElementById('myRegEditBtn').addEventListener('click', () => {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  loadRegistrationForEdit(r);
});

  } catch (err){
    console.error('My registration fetch error:', err);
    body.innerHTML = `
      <div class="myreg-empty">
        <div class="ic">⚠️</div>
        <h3>Could not load registration</h3>
        <p>${esc(err.message || 'Something went wrong. Please try again.')}</p>
      </div>`;
  }
}

// Attach to close button
document.addEventListener('click', (e) => {
  if (e.target.closest('#myRegClose')){
    document.getElementById('myRegModal')?.classList.remove('open');
    document.body.style.overflow = '';
  }
});
document.addEventListener('click', (e) => {
  const m = document.getElementById('myRegModal');
  if (m && e.target === m){
    m.classList.remove('open');
    document.body.style.overflow = '';
  }
});
  supabase.auth.onAuthStateChange(() => { updateAuthUI(); });
  window.__hrLoadAdmin = loadAdminData;
  setTimeout(updateAuthUI, 500);
async function submitTeamRegistration(){
  const user = await getCurrentUser();
  if (!user){ showToast('Please log in first', 'warn', '🔒'); return; }

  const spoc = {
    spoc_name: ($('#regSpocName')?.value || '').trim(),
    spoc_designation: ($('#regSpocDesignation')?.value || '').trim(),
    spoc_email: ($('#regSpocEmail')?.value || '').trim(),
    spoc_mobile: ($('#regSpocMobile')?.value || '').trim(),
    college_name: ($('#regCollegeName')?.value || '').trim(),
    college_city: ($('#regCollegeCity')?.value || '').trim(),
    college_address: ($('#regCollegeAddress')?.value || '').trim(),
  };

  const team = {
    team_name: ($('#regTeamName')?.value || '').trim(),
    team_size: parseInt($('#regTeamSize')?.value || '1', 10),
    theme: ($('#regTheme')?.value || '').trim(),
    category: ($('#regCategory')?.value || '').trim(),
    problem_statement: ($('#regProblemStatement')?.value || '').trim(),
    idea_summary: ($('#regIdeaSummary')?.value || '').trim(),
  };

  if (!spoc.spoc_name) return showToast('SPOC name required', 'warn', '⚠️');
  if (!spoc.spoc_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(spoc.spoc_email))
    return showToast('Valid SPOC email required', 'warn', '⚠️');
  if (spoc.spoc_mobile && !/^[+0-9\s-]{10,15}$/.test(spoc.spoc_mobile))
    return showToast('Enter a valid mobile number', 'warn', '⚠️');
  if (!spoc.college_name) return showToast('College name required', 'warn', '⚠️');
  if (!team.team_name) return showToast('Team name required', 'warn', '⚠️');
  if (!team.theme || team.theme === 'Select a theme')
    return showToast('Please select a theme', 'warn', '⚠️');
  if (!team.category) return showToast('Please select a category', 'warn', '⚠️');

  const members = [];
  document.querySelectorAll('.member-card').forEach(card => {
    const inputs = card.querySelectorAll('input, select');
    const name = inputs[0]?.value?.trim();
    const role = inputs[1]?.value || '';
    const gender = inputs[2]?.value || '';
    if (name) members.push({ name, role, gender });
  });

  const submitBtn = document.getElementById('nextBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
   let dbError = null;

if (editingRegistrationId){
  // UPDATE existing registration
  const { error } = await supabase
    .from('team_registrations')
    .update({
      ...spoc,
      ...team,
      members,
      ...(uploadedPptUrl ? { ppt_url: uploadedPptUrl } : {}),
      updated_at: new Date().toISOString()
    })
    .eq('id', editingRegistrationId)
    .eq('user_id', user.id); // safety check
  dbError = error;
} else {
  // INSERT new registration
  const { error } = await supabase
    .from('team_registrations')
    .insert([{
      user_id: user.id,
      email: user.email,
      ...spoc,
      ...team,
      members,
      status: 'submitted',
      ppt_url: uploadedPptUrl || null,
    }]);
  dbError = error;
}

if (dbError) throw dbError;

const successMsg = editingRegistrationId
  ? '✅ Registration updated successfully!'
  : '🎉 Registration submitted successfully!';

showToast(successMsg, 'success', '✓');

// Send emails (background)
fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ((await supabase.auth.getSession()).data.session?.access_token || '') },
  body: JSON.stringify({
    registration: {
      ...spoc,
      ...team,
      email: user.email,
      team_size: team.team_size
    }
  })
})
.then(r => r.json())
.then(d => {
  if (d && d.ok) {
    if (!d.admin) console.warn('Admin err:', d.adminErr);
    if (!d.user)  console.warn('User err:', d.userErr);
  }
})
.catch(e => console.warn('Email send failed:', e));
    setTimeout(() => {
      editingRegistrationId = null;
      submitBtn.textContent = 'Next →';
      submitBtn.style.background = '';
      submitBtn.disabled = false;
      setStep(1);
    }, 2000);

  } catch (err){
    console.error('Registration error:', err);
    showToast('Failed: ' + (err.message || 'Unknown error'), 'warn', '⚠️');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Application ✓';
  }
}
/* ============ PPT UPLOAD ============ */
let uploadedPptUrl = null;

function initPptUpload(){
  const zone = document.getElementById('pptUploadZone');
  const input = document.getElementById('pptFileInput');
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) handlePptFile(f);
  });
}

async function handlePptFile(file){
  const zone = document.getElementById('pptUploadZone');
  const icon = document.getElementById('pptIcon');
  const title = document.getElementById('pptTitle');
  const sub = document.getElementById('pptSub');

  if (file.size > 10 * 1024 * 1024){
    showToast('File too large (max 10 MB)', 'warn', '⚠️');
    return;
  }
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!['.pdf', '.ppt', '.pptx'].includes(ext)){
    showToast('Only PDF, PPT, or PPTX files allowed', 'warn', '⚠️');
    return;
  }

  zone.classList.add('uploading');
  icon.textContent = '⏳';
  title.textContent = 'Uploading…';
  sub.textContent = file.name;

  try {
    const user = await getCurrentUser();
    if (!user){ showToast('Please log in first', 'warn', '🔒'); return; }

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage
      .from('team-ppts')
      .upload(filePath, file);

    if (upErr) throw upErr;

    const { data: urlData } = supabase.storage
      .from('team-ppts')
      .getPublicUrl(filePath);

    uploadedPptUrl = urlData.publicUrl;

    zone.classList.remove('uploading');
    zone.classList.add('loaded');
    icon.textContent = '📊';
    title.textContent = '✓ PPT uploaded';
    sub.textContent = file.name;

    showToast('PPT uploaded!', 'success', '✓');

  } catch (err){
    console.error('PPT upload error:', err);
    showToast('Upload failed: ' + (err.message || 'Error'), 'warn', '⚠️');
    zone.classList.remove('uploading');
    icon.textContent = '📊';
    title.textContent = 'Upload your idea PPT';
  }
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initPptUpload);
} else {
  initPptUpload();
}

  /* ============ REGISTRATION STEPPER ============ */
  let editingRegistrationId = null;
  let currentStep = 1;
  const totalSteps = 4;
  const stepEls = $$('.reg-step');
  const paneEls = $$('.reg-pane');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const curStepEl = $('#curStep');

function populateReviewSection(){
  const setT = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = (val && String(val).trim()) || '—';
  };
  setT('rvSpocName', $('#regSpocName')?.value);
  setT('rvSpocCollege', $('#regCollegeName')?.value);
  setT('rvSpocEmail', $('#regSpocEmail')?.value);
  setT('rvSpocCity', $('#regCollegeCity')?.value);
  setT('rvTeamName', $('#regTeamName')?.value);
  setT('rvTeamTheme', $('#regTheme')?.value);
  setT('rvTeamProblem', $('#regProblemStatement')?.value);
  const members = $$('.member-card').length;
  setT('rvTeamMembers', String(members || 1));
}

  function setStep(n){
    currentStep = Math.max(1, Math.min(totalSteps, n));
    stepEls.forEach(el => {
      const s = parseInt(el.dataset.step, 10);
      el.classList.toggle('active', s === currentStep);
      el.classList.toggle('done', s < currentStep);
    });
    paneEls.forEach(p => p.classList.toggle('active', parseInt(p.dataset.pane,10) === currentStep));
    curStepEl.textContent = currentStep;
    prevBtn.disabled = currentStep === 1;
   nextBtn.textContent = currentStep === totalSteps 
  ? (editingRegistrationId ? 'Update Registration ✓' : 'Submit Application ✓')
  : 'Next →';
  if (currentStep === 4) populateReviewSection();
  }
  prevBtn.addEventListener('click', () => setStep(currentStep - 1));
 nextBtn.addEventListener('click', () => {
  if (currentStep === totalSteps){
    submitTeamRegistration();
    return;
  }
  setStep(currentStep + 1);
});
  stepEls.forEach(el => el.addEventListener('click', () => setStep(parseInt(el.dataset.step,10))));

  /* ============ TEAM MEMBERS ============ */
  const membersList = $('#membersList');
  const MAX_MEMBERS = 6;
  function syncMembers(){
    const cards = $$('.member-card');
    cards.forEach((c,i) => c.querySelector('.member-num').textContent = i + 1);
    const rm = $('#reviewMembers');
    if (rm) rm.textContent = cards.length;
  }
  function addMember(){
    if ($$('.member-card').length >= MAX_MEMBERS) { showToast('Maximum 6 members allowed', 'warn', '⚠️'); return; }
    const idx = $$('.member-card').length + 1;
    const div = document.createElement('div');
    div.className = 'member-card';
    div.innerHTML = `
      <div class="member-num">${idx}</div>
      <div class="field"><label>Full Name ${idx===1?'(Team Leader)':''}</label><input type="text" placeholder="Member ${idx} name" /></div>
      <div class="field"><label>Role</label>
        <select><option>Developer</option><option>Designer</option><option>Hardware</option><option>Presenter</option><option>Researcher</option></select>
      </div>
      <div class="field"><label>Gender</label>
        <select><option>Male</option><option>Female</option><option>Other</option></select>
      </div>
      <button class="member-remove" aria-label="Remove member">✕</button>`;
    div.querySelector('.member-remove').addEventListener('click', () => {
      div.remove(); syncMembers();
    });
    membersList.appendChild(div);
    syncMembers();
  }
  addMember();
  $('#addMember').addEventListener('click', addMember);

  /* ============================================================
     CODE PLAYGROUND (Judge0 CE + live HTML/React preview)
     ============================================================ */
  const PG_SAMPLES = {
    web: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Code Lab</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0d14; color: #e9ebf2;
           display: grid; place-items: center; min-height: 100vh; margin: 0; }
    .card { text-align: center; padding: 40px 46px; border-radius: 22px;
            background: linear-gradient(135deg,#7c5cff,#22d3ee); color: #08090d; }
    h1 { margin: 0 0 8px; }
    button { margin-top: 16px; padding: 10px 22px; border: none; border-radius: 10px;
             font-weight: 700; cursor: pointer; }
    #out { margin-top: 14px; font-weight: 700; }
    /* ===== DASHBOARD ===== */
.db-hero{
  background:linear-gradient(135deg,rgba(124,92,255,.15),rgba(34,211,238,.10),rgba(255,77,157,.06));
  border:1px solid rgba(124,92,255,.25);border-radius:16px;
  padding:24px 26px;margin-bottom:22px;
}
.db-hero .greeting{font-size:22px;font-weight:700;font-family:'Space Grotesk';margin:0 0 6px}
.db-hero .greeting .grad{background:linear-gradient(110deg,var(--violet),var(--cyan));-webkit-background-clip:text;background-clip:text;color:transparent}
.db-hero .sub{font-size:13.5px;color:var(--muted);margin:0}
.db-hero .role-chip{
  display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:3px 10px;
  border-radius:7px;background:rgba(124,92,255,.15);color:var(--violet);
  border:1px solid rgba(124,92,255,.3);font-weight:700;text-transform:uppercase;
  letter-spacing:.04em;margin-left:10px;vertical-align:middle;
}

.db-stats{
  display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px;
}
.db-stat{
  background:rgba(0,0,0,.25);border:1px solid var(--border);border-radius:12px;
  padding:16px 18px;transition:.25s;cursor:default;
}
[data-theme="light"] .db-stat{background:rgba(15,17,25,.02)}
.db-stat:hover{border-color:var(--border-strong);transform:translateY(-2px)}
.db-stat .ic{font-size:20px;margin-bottom:8px;display:block;opacity:.7}
.db-stat .v{font-family:'Space Grotesk';font-weight:700;font-size:26px;line-height:1;
  background:linear-gradient(135deg,var(--text),var(--muted));
  -webkit-background-clip:text;background-clip:text;color:transparent}
.db-stat .l{font-size:11px;color:var(--muted);text-transform:uppercase;
  letter-spacing:.08em;margin-top:6px;font-weight:600}
.db-stat.accent .v{background:linear-gradient(135deg,var(--violet),var(--cyan));
  -webkit-background-clip:text;background-clip:text;color:transparent}

.db-section{margin-bottom:22px}
.db-section-head{
  display:flex;justify-content:space-between;align-items:center;
  margin-bottom:12px;gap:10px;
}
.db-section-head h4{
  font-size:12px;text-transform:uppercase;letter-spacing:.1em;
  color:var(--muted);margin:0;font-weight:700;
  display:flex;align-items:center;gap:8px;
}
.db-section-head .link{
  font-size:12px;font-weight:600;color:var(--violet);
  cursor:pointer;background:none;border:none;font-family:inherit;
  transition:.2s;
}
.db-section-head .link:hover{text-decoration:underline}

.db-card{
  background:rgba(0,0,0,.2);border:1px solid var(--border);border-radius:12px;
  padding:16px 18px;
}
[data-theme="light"] .db-card{background:rgba(15,17,25,.02)}

.db-reg-summary{
  display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;
}
.db-reg-summary .info h3{font-size:17px;margin:0 0 4px}
.db-reg-summary .info .meta{font-size:12.5px;color:var(--muted)}

.db-empty{
  text-align:center;padding:28px 20px;color:var(--muted);font-size:13.5px;
}
.db-empty .ic{font-size:32px;margin-bottom:10px;opacity:.6;display:block}
.db-empty .msg{margin-bottom:14px}

.db-subs{display:flex;flex-direction:column;gap:8px}
.db-sub-row{
  display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;
  padding:11px 14px;background:rgba(0,0,0,.2);border:1px solid var(--border);
  border-radius:10px;font-size:13px;transition:.2s;
}
[data-theme="light"] .db-sub-row{background:rgba(15,17,25,.02)}
.db-sub-row:hover{border-color:var(--border-strong)}
.db-sub-row .title{
  font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.db-sub-row .title small{
  display:block;color:var(--muted);font-weight:400;font-size:11px;margin-top:2px;
}
.db-sub-row .lang-chip{
  font-size:10.5px;padding:3px 9px;border-radius:6px;
  background:rgba(34,211,238,.1);color:var(--cyan);
  border:1px solid rgba(34,211,238,.25);font-weight:600;
  font-family:'JetBrains Mono',monospace;
}
.db-sub-row .score{
  font-family:'Space Grotesk';font-weight:700;font-size:15px;
  padding:3px 10px;border-radius:7px;
}
.db-sub-row .score.good{color:var(--green);background:rgba(61,220,132,.12)}
.db-sub-row .score.mid{color:var(--orange);background:rgba(255,159,67,.12)}
.db-sub-row .score.low{color:var(--red);background:rgba(255,107,107,.12)}

.db-actions{
  display:grid;grid-template-columns:repeat(3,1fr);gap:12px;
}
.db-action{
  background:linear-gradient(180deg,var(--surface-2),var(--surface));
  border:1px solid var(--border);border-radius:12px;padding:16px;
  cursor:pointer;transition:.25s;font-family:inherit;
  display:flex;flex-direction:column;align-items:flex-start;gap:6px;
  text-align:left;color:var(--text);
}
.db-action:hover{
  transform:translateY(-3px);border-color:var(--violet);
  background:linear-gradient(180deg,rgba(124,92,255,.1),transparent);
}
.db-action .ic{font-size:22px;margin-bottom:2px}
.db-action .t{font-size:13.5px;font-weight:600}
.db-action .s{font-size:11.5px;color:var(--muted)}

@media (max-width:600px){
  .db-stats{grid-template-columns:1fr 1fr}
  .db-actions{grid-template-columns:1fr}
  .db-hero{padding:18px 16px}
  .db-hero .greeting{font-size:18px}
  .db-sub-row{grid-template-columns:1fr auto;gap:8px}
  .db-sub-row .lang-chip{display:none}
}
    /* ===== MY REGISTRATION ===== */
.myreg-status{
  display:inline-flex;align-items:center;gap:8px;
  padding:6px 14px;border-radius:10px;font-size:12.5px;font-weight:700;
  text-transform:uppercase;letter-spacing:.05em;
}
.myreg-status.submitted{background:rgba(124,92,255,.15);color:var(--violet);border:1px solid rgba(124,92,255,.35)}
.myreg-status.approved{background:rgba(61,220,132,.15);color:var(--green);border:1px solid rgba(61,220,132,.35)}
.myreg-status.rejected{background:rgba(255,107,107,.15);color:var(--red);border:1px solid rgba(255,107,107,.35)}
.myreg-status.draft{background:rgba(139,144,164,.15);color:var(--muted);border:1px solid var(--border-strong)}

.myreg-hero{
  background:linear-gradient(135deg,rgba(124,92,255,.12),rgba(34,211,238,.08));
  border:1px solid rgba(124,92,255,.25);border-radius:16px;
  padding:22px 24px;margin-bottom:22px;
  display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;
}
.myreg-hero h3{font-size:22px;margin:0 0 4px}
.myreg-hero .team-sub{font-size:13px;color:var(--muted)}

.myreg-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px}
.myreg-box{
  background:rgba(0,0,0,.25);border:1px solid var(--border);
  border-radius:12px;padding:16px 18px;
}
[data-theme="light"] .myreg-box{background:rgba(15,17,25,.02)}
.myreg-box h4{
  font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;
  color:var(--muted);margin:0 0 12px;font-weight:700;
}
.myreg-box .row{
  display:flex;justify-content:space-between;gap:12px;
  font-size:13.5px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);
}
.myreg-box .row:last-child{border-bottom:none}
.myreg-box .row .lbl{color:var(--muted);flex-shrink:0}
.myreg-box .row .val{font-weight:600;text-align:right;word-break:break-word}

.myreg-members{display:flex;flex-direction:column;gap:8px}
.myreg-member{
  display:flex;align-items:center;gap:12px;padding:10px 14px;
  background:rgba(0,0,0,.2);border:1px solid var(--border);border-radius:10px;
  font-size:13.5px;
}
[data-theme="light"] .myreg-member{background:rgba(15,17,25,.02)}
.myreg-member .num{
  width:26px;height:26px;border-radius:8px;display:grid;place-items:center;
  font-family:'Space Grotesk';font-weight:700;font-size:11px;
  background:rgba(124,92,255,.15);color:var(--violet);
  border:1px solid rgba(124,92,255,.3);
}
.myreg-member .nm{flex:1;font-weight:600}
.myreg-member .rl{font-size:11.5px;color:var(--muted);padding:3px 10px;
  border-radius:6px;background:rgba(34,211,238,.1);color:var(--cyan);
  border:1px solid rgba(34,211,238,.25);font-weight:600}

.myreg-empty{
  text-align:center;padding:50px 20px;
}
.myreg-empty .ic{font-size:56px;margin-bottom:16px;opacity:.7}
.myreg-empty h3{font-size:20px;margin:0 0 10px}
.myreg-empty p{color:var(--muted);font-size:14px;margin:0 0 22px;max-width:420px;margin-left:auto;margin-right:auto;line-height:1.6}

.myreg-foot{
  display:flex;gap:10px;justify-content:flex-end;
  padding-top:18px;border-top:1px solid var(--border);margin-top:22px;flex-wrap:wrap;
}

@media (max-width:600px){
  .myreg-grid{grid-template-columns:1fr}
  .myreg-hero{padding:18px 16px}
  .myreg-hero h3{font-size:18px}
}
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello, Hacker! 🚀</h1>
    <p>Edit the code and hit Preview to see it live.</p>
    <button onclick="count()">Count to 5</button>
    <div id="out"></div>
  </div>
  <script>
    function count() {
      document.getElementById('out').textContent = '1, 2, 3, 4, 5!';
    }
  <\/script>
</body>
</html>
`,
react: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>React · Code Lab</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0d14; color: #e9ebf2;
           margin: 0; padding: 40px; }
    .card { max-width: 440px; margin: 0 auto; padding: 30px; border-radius: 20px;
            background: linear-gradient(135deg,#7c5cff,#22d3ee); color: #08090d;
            text-align: center; }
    button { margin-top: 14px; padding: 10px 20px; border: none; border-radius: 10px;
             font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    function App() {
      const [count, setCount] = React.useState(0);
      return (
        <div className="card">
          <h1>Hello, Hacker! ⚛️</h1>
          <p>Count is {count}</p>
          <button onClick={() => setCount(c => c + 1)}>Click me</button>
        </div>
      );
    }
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  <\/script>
</body>
</html>
`,
    python: `# Hackathon Rivals Code Lab 🚀
name = "Hacker"

def greet(n):
    return f"Hello, {n}! Let's build something amazing."

print(greet(name))

for i in range(1, 6):
    print(f"Count: {i}")
`,
    javascript: `// Hackathon Rivals Code Lab 🚀
const name = "Hacker";

function greet(n) {
  return \`Hello, \${n}! Let's build something amazing.\`;
}

console.log(greet(name));

for (let i = 1; i <= 5; i++) {
  console.log(\`Count: \${i}\`);
}
`,
    typescript: `// Hackathon Rivals Code Lab 🚀
const name: string = "Hacker";

function greet(n: string): string {
  return \`Hello, \${n}! Let's build something amazing.\`;
}

console.log(greet(name));

for (let i = 1; i <= 5; i++) {
  console.log(\`Count: \${i}\`);
}
`,
    cpp: `// Hackathon Rivals Code Lab 🚀
#include <iostream>
using namespace std;

int main() {
    string name = "Hacker";
    cout << "Hello, " << name << "! Let's build something amazing." << endl;
    for (int i = 1; i <= 5; i++) {
        cout << "Count: " << i << endl;
    }
    return 0;
}
`,
    c: `// Hackathon Rivals Code Lab 🚀
#include <stdio.h>

int main() {
    printf("Hello, Hacker! Let's build something amazing.\\n");
    for (int i = 1; i <= 5; i++) {
        printf("Count: %d\\n", i);
    }
    return 0;
}
`,
    csharp: `// Hackathon Rivals Code Lab 🚀
using System;

class Program {
    static void Main() {
        string name = "Hacker";
        Console.WriteLine($"Hello, {name}! Let's build something amazing.");
        for (int i = 1; i <= 5; i++) {
            Console.WriteLine($"Count: {i}");
        }
    }
}
`,
    java: `// Hackathon Rivals Code Lab 🚀
public class Main {
    public static void main(String[] args) {
        String name = "Hacker";
        System.out.println("Hello, " + name + "! Let's build something amazing.");
        for (int i = 1; i <= 5; i++) {
            System.out.println("Count: " + i);
        }
    }
}
`,
    kotlin: `// Hackathon Rivals Code Lab 🚀
fun main() {
    val name = "Hacker"
    println("Hello, $name! Let's build something amazing.")
    for (i in 1..5) {
        println("Count: $i")
    }
}
`,
    go: `// Hackathon Rivals Code Lab 🚀
package main

import "fmt"

func main() {
    name := "Hacker"
    fmt.Printf("Hello, %s! Let's build something amazing.\\n", name)
    for i := 1; i <= 5; i++ {
        fmt.Printf("Count: %d\\n", i)
    }
}
`,
    rust: `// Hackathon Rivals Code Lab 🚀
fn main() {
    let name = "Hacker";
    println!("Hello, {}! Let's build something amazing.", name);
    for i in 1..=5 {
        println!("Count: {}", i);
    }
}
`,
    swift: `// Hackathon Rivals Code Lab 🚀
import Foundation

let name = "Hacker"
print("Hello, \\(name)! Let's build something amazing.")
for i in 1...5 {
    print("Count: \\(i)")
}
`,
    dart: `// Hackathon Rivals Code Lab 🚀
void main() {
  final name = "Hacker";
  print("Hello, $name! Let's build something amazing.");
  for (int i = 1; i <= 5; i++) {
    print("Count: $i");
  }
}
`,
    ruby: `# Hackathon Rivals Code Lab 🚀
name = "Hacker"

def greet(n)
  "Hello, #{n}! Let's build something amazing."
end

puts greet(name)

(1..5).each do |i|
  puts "Count: #{i}"
end
`,
    php: `<?php
// Hackathon Rivals Code Lab 🚀
$name = "Hacker";

function greet($n) {
    return "Hello, $n! Let's build something amazing.";
}

echo greet($name) . "\\n";

for ($i = 1; $i <= 5; $i++) {
    echo "Count: $i\\n";
}
`,
    lua: `-- Hackathon Rivals Code Lab 🚀
local name = "Hacker"
print("Hello, " .. name .. "! Let's build something amazing.")
for i = 1, 5 do
    print("Count: " .. i)
end
`,
    perl: `# Hackathon Rivals Code Lab 🚀
use strict;
use warnings;

my $name = "Hacker";
print "Hello, $name! Let's build something amazing.\\n";

for my $i (1..5) {
    print "Count: $i\\n";
}
`,
    bash: `#!/bin/bash
# Hackathon Rivals Code Lab 🚀
name="Hacker"
echo "Hello, $name! Let's build something amazing."
for i in {1..5}; do
    echo "Count: $i"
done
`,
    r: `# Hackathon Rivals Code Lab 🚀
name <- "Hacker"
cat(paste("Hello,", name, "! Let's build something amazing.\\n"))
for (i in 1:5) {
  cat(paste("Count:", i, "\\n"))
}
`,
    scala: `// Hackathon Rivals Code Lab 🚀
object Main {
  def main(args: Array[String]): Unit = {
    val name = "Hacker"
    println(s"Hello, $name! Let's build something amazing.")
    for (i <- 1 to 5) {
      println(s"Count: $i")
    }
  }
}
`,
    sqlite3: `-- Hackathon Rivals Code Lab 🚀
CREATE TABLE hackers (id INTEGER, name TEXT);
INSERT INTO hackers VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie');
SELECT * FROM hackers;
`,
    elixir: `# Hackathon Rivals Code Lab 🚀
name = "Hacker"
IO.puts("Hello, #{name}! Let's build something amazing.")

Enum.each(1..5, fn i ->
  IO.puts("Count: #{i}")
end)
`,
    haskell: `-- Hackathon Rivals Code Lab 🚀
main :: IO ()
main = do
    let name = "Hacker"
    putStrLn ("Hello, " ++ name ++ "! Let's build something amazing.")
    mapM_ (\\i -> putStrLn ("Count: " ++ show i)) [1..5]
`,
    erlang: `#!/usr/bin/env escript
%% Hackathon Rivals Code Lab 🚀
main(_) ->
    Name = "Hacker",
    io:format("Hello, ~s! Let's build something amazing.~n", [Name]),
    lists:foreach(fun(I) ->
        io:format("Count: ~p~n", [I])
    end, lists:seq(1, 5)).
`,
    fsharp: `// Hackathon Rivals Code Lab 🚀
let name = "Hacker"
printfn "Hello, %s! Let's build something amazing." name
for i in 1..5 do
    printfn "Count: %d" i
`,
    ocaml: `(* Hackathon Rivals Code Lab 🚀 *)
let () =
  let name = "Hacker" in
  Printf.printf "Hello, %s! Let's build something amazing.\\n" name;
  for i = 1 to 5 do
    Printf.printf "Count: %d\\n" i
  done
`,
    prolog: `% Hackathon Rivals Code Lab 🚀
main :-
    writeln("Hello, Hacker! Let's build something amazing."),
    forall(between(1, 5, I),
           (write('Count: '), writeln(I))).

:- initialization(main).
`,
    commonlisp: `;; Hackathon Rivals Code Lab 🚀
(let ((name "Hacker"))
  (format t "Hello, ~a! Let's build something amazing.~%" name)
  (dotimes (i 5)
    (format t "Count: ~a~%" (1+ i))))
`,
    fortran: `! Hackathon Rivals Code Lab 🚀
program main
    implicit none
    integer :: i
    print *, "Hello, Hacker! Let's build something amazing."
    do i = 1, 5
        print *, "Count:", i
    end do
end program main
`,
    pascal: `{ Hackathon Rivals Code Lab 🚀 }
program Main;
var
  i: Integer;
begin
  writeln('Hello, Hacker! Let''s build something amazing.');
  for i := 1 to 5 do
    writeln('Count: ', i);
end.
`,
    cobol: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. MAIN.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 I PIC 9.
       PROCEDURE DIVISION.
       MAIN-PARA.
           DISPLAY "Hello, Hacker! Let's build something amazing.".
           PERFORM VARYING I FROM 1 BY 1 UNTIL I > 5
               DISPLAY "Count: " I
           END-PERFORM.
           STOP RUN.
`,
    vb: `' Hackathon Rivals Code Lab 🚀
Module Program
    Sub Main()
        Dim name As String = "Hacker"
        Console.WriteLine("Hello, " & name & "! Let's build something amazing.")
        For i As Integer = 1 To 5
            Console.WriteLine("Count: " & i)
        Next
    End Sub
End Module
`,
    objectivec: `// Hackathon Rivals Code Lab 🚀
#import <Foundation/Foundation.h>

int main() {
    @autoreleasepool {
        NSString *name = @"Hacker";
        printf("Hello, %s! Let's build something amazing.\\n", [name UTF8String]);
        for (int i = 1; i <= 5; i++) {
            printf("Count: %d\\n", i);
        }
    }
    return 0;
}
`,
    groovy: `// Hackathon Rivals Code Lab 🚀
def name = "Hacker"
println "Hello, \${name}! Let's build something amazing."
(1..5).each { i ->
    println "Count: \${i}"
}
`,
    d: `// Hackathon Rivals Code Lab 🚀
import std.stdio;

void main() {
    string name = "Hacker";
    writeln("Hello, ", name, "! Let's build something amazing.");
    foreach (i; 1 .. 6) {
        writeln("Count: ", i);
    }
}
`,
    octave: `% Hackathon Rivals Code Lab 🚀
name = "Hacker";
printf("Hello, %s! Let's build something amazing.\\n", name);
for i = 1:5
    printf("Count: %d\\n", i);
end
`,
    assembly: `; Hackathon Rivals Code Lab 🚀
section .data
    hello     db "Hello, Hacker! Let's build something amazing.", 10
    hello_len equ $ - hello
    lbl       db "Count: "
    lbl_len   equ $ - lbl
    nl        db 10

section .bss
    num resb 1

section .text
    global _start

_start:
    mov rax, 1
    mov rdi, 1
    mov rsi, hello
    mov rdx, hello_len
    syscall

    mov r8, 1
.loop:
    cmp r8, 5
    jg  .done
    mov rax, 1
    mov rdi, 1
    mov rsi, lbl
    mov rdx, lbl_len
    syscall
    mov rax, r8
    add rax, '0'
    mov [num], al
    mov rax, 1
    mov rdi, 1
    mov rsi, num
    mov rdx, 1
    syscall
    mov rax, 1
    mov rdi, 1
    mov rsi, nl
    mov rdx, 1
    syscall
    inc r8
    jmp .loop

.done:
    mov rax, 60
    xor rdi, rdi
    syscall
`,
    brainfuck: `Hackathon Rivals Code Lab — prints "Hello World!"
++++++++++[>+++++++>++++++++++>+++>+<<<<-]
>++.>+.+++++++..+++.>++.<<+++++++++++++++.
>.+++.------.--------.>+.>.
`
  };

  const PG_LANG_MAP = {
    web:        { ext: 'html',   render: 'iframe' },
    react:      { ext: 'html',   render: 'iframe' },
    python:     { ext: 'py',     judge0: 71 },
    javascript: { ext: 'js',     judge0: 63 },
    typescript: { ext: 'ts',     judge0: 74 },
    cpp:        { ext: 'cpp',    judge0: 54 },
    c:          { ext: 'c',      judge0: 50 },
    csharp:     { ext: 'cs',     judge0: 51 },
    java:       { ext: 'java',   judge0: 62 },
    kotlin:     { ext: 'kt',     judge0: 78 },
    go:         { ext: 'go',     judge0: 60 },
    rust:       { ext: 'rs',     judge0: 73 },
    swift:      { ext: 'swift',  judge0: 83 },
    dart:       { ext: 'dart',   judge0: 90 },
    ruby:       { ext: 'rb',     judge0: 72 },
    php:        { ext: 'php',    judge0: 68 },
    lua:        { ext: 'lua',    judge0: 64 },
    perl:       { ext: 'pl',     judge0: 85 },
    bash:       { ext: 'sh',     judge0: 46 },
    r:          { ext: 'r',      judge0: 80 },
    scala:      { ext: 'scala',  judge0: 81 },
    sqlite3:    { ext: 'sql',    judge0: 82 },
    elixir:     { ext: 'ex',     judge0: 57 },
    haskell:    { ext: 'hs',     judge0: 61 },
    erlang:     { ext: 'erl',    judge0: 58 },
    fsharp:     { ext: 'fs',     judge0: 59 },
    ocaml:      { ext: 'ml',     judge0: 65 },
    prolog:     { ext: 'pl',     judge0: 69 },
    commonlisp: { ext: 'lisp',   judge0: 55 },
    fortran:    { ext: 'f90',    judge0: 84 },
    pascal:     { ext: 'pas',    judge0: 48 },
    cobol:      { ext: 'cob',    judge0: 88 },
    vb:         { ext: 'vb',     judge0: 75 },
    objectivec: { ext: 'm',      judge0: 79 },
    groovy:     { ext: 'groovy', judge0: 87 },
    d:          { ext: 'd',      judge0: 56 },
    octave:     { ext: 'm',      judge0: 66 },
    assembly:   { ext: 'asm',    judge0: 86 },
    brainfuck:  { ext: 'bf',     judge0: 49 }
  };

  let pgCurrentLang = 'web';
  const pgCode      = document.getElementById('pgCode');
  const pgStdin     = document.getElementById('pgStdin');
  const pgStdinHead = document.getElementById('pgStdinHead');
  const pgOutput    = document.getElementById('pgOutput');
  const pgPreview   = document.getElementById('pgPreview');
  const pgOutName   = document.getElementById('pgOutName');
  const pgStatus    = document.getElementById('pgStatus');
  const pgExt       = document.getElementById('pgExt');
  const pgRun       = document.getElementById('pgRun');
  const pgReset     = document.getElementById('pgReset');
  const pgCopy      = document.getElementById('pgCopy');
  const pgLangTabs  = document.getElementById('pgLangTabs');

  function setPgStatus(text, cls){
    pgStatus.textContent = text;
    pgStatus.className = 'pg-status' + (cls ? ' ' + cls : '');
  }
  function runLabel(){
    return PG_LANG_MAP[pgCurrentLang].render === 'iframe' ? '▶ Preview' : '▶ Run Code';
  }

  function loadLang(key){
    if (!PG_SAMPLES[key]) return;
    pgCurrentLang = key;
    const info  = PG_LANG_MAP[key];
    const isWeb = info.render === 'iframe';

    pgLangTabs.querySelectorAll('.pg-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.lang === key));

    pgCode.value      = PG_SAMPLES[key];
    pgExt.textContent = info.ext;

    pgPreview.classList.remove('show');
    pgPreview.srcdoc = '';
    pgOutput.classList.remove('hide');
    pgOutput.innerHTML = isWeb
      ? '<span class="pg-muted">Click "Preview" to render your page...</span>'
      : '<span class="pg-muted">Click "Run Code" to execute...</span>';

    pgStdinHead.style.display = isWeb ? 'none' : '';
    pgStdin.style.display     = isWeb ? 'none' : '';
    pgOutName.textContent     = isWeb ? 'Live Preview' : 'Output';
    pgRun.disabled            = false;
    pgRun.textContent         = runLabel();

    setPgStatus('Ready', '');
  }

  if (pgLangTabs){
    pgLangTabs.addEventListener('click', e => {
      const tab = e.target.closest('.pg-tab');
      if (tab && tab.dataset.lang) loadLang(tab.dataset.lang);
    });
  }

  async function runCode(){
    const code = pgCode.value;
    if (!code.trim()){
      pgPreview.classList.remove('show');
      pgOutput.classList.remove('hide');
      pgOutput.innerHTML = '<span class="error-line">⚠️ Please write some code first.</span>';
      setPgStatus('Empty', 'error');
      return;
    }
    const langInfo = PG_LANG_MAP[pgCurrentLang];

    if (langInfo.render === 'iframe'){
      setPgStatus('⏳ Rendering...', 'running');
      pgOutput.classList.add('hide');
      pgPreview.classList.add('show');
      pgPreview.srcdoc = code;
      setTimeout(() => setPgStatus('✓ Live preview', 'success'), 450);
      return;
    }

    setPgStatus('⏳ Running...', 'running');
    pgRun.disabled    = true;
    pgRun.textContent = '⏳ Running...';
    pgOutput.classList.remove('hide');
    pgPreview.classList.remove('show');
    pgOutput.innerHTML = '<span class="pg-muted">Submitting your code...</span>';

    try {
      const b64 = s => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
      const submitRes = await fetch(
        'https://ce.judge0.com/submissions?base64_encoded=true&wait=false',
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language_id: langInfo.judge0,
            source_code: b64(code),
            stdin: pgStdin.value ? b64(pgStdin.value) : null
          })});
      if (!submitRes.ok) throw new Error('Submission failed: HTTP ' + submitRes.status);
      const { token } = await submitRes.json();
      if (!token) throw new Error('No token received from Judge0');

      let result = null;
      for (let i = 0; i < 25; i++){
        await new Promise(r => setTimeout(r, 800));
        const pollRes = await fetch('https://ce.judge0.com/submissions/' + token + '?base64_encoded=true');
        if (!pollRes.ok) continue;
        const data = await pollRes.json();
        const sid  = data.status && data.status.id;
        if (sid && sid !== 1 && sid !== 2){ result = data; break; }
      }
      if (!result) throw new Error('Execution timed out');

      const decode = s => s ? decodeURIComponent(escape(atob(s))) : '';
      const stdout     = decode(result.stdout);
      const stderr     = (window.__hrScrub || (x => x))(decode(result.stderr));
      const compileOut = (window.__hrScrub || (x => x))(decode(result.compile_output));

      let out = '';
      if (stdout)     out += '<span class="stdout-line">' + escapeHtml(stdout) + '</span>';
      if (compileOut) out += (out ? '\n' : '') + '<span class="error-line">' + escapeHtml(compileOut) + '</span>';
      if (stderr)     out += (out ? '\n' : '') + '<span class="error-line">' + escapeHtml(stderr) + '</span>';
      if (!out)       out  = '<span class="pg-muted">(No output)</span>';

      pgOutput.innerHTML = out;
      const sid  = result.status && result.status.id;
      const desc = (result.status && result.status.description) || 'Done';
      if (sid === 3)       setPgStatus('✓ Success', 'success');
      else if (sid === 6)  setPgStatus('✕ Compile Error', 'error');
      else if (sid === 11) setPgStatus('✕ Runtime Error', 'error');
      else if (sid === 5)  setPgStatus('✕ Time Limit Exceeded', 'error');
      else                 setPgStatus('✓ Ran (' + desc + ')', 'success');
    } catch (err){
      console.error('Playground error:', err);
      let fb = null; try { fb = window.__hrWandbox ? await window.__hrWandbox(pgCurrentLang, code, pgStdin.value) : null; } catch (e2){ console.warn('Backup runner failed', e2); }
      if (fb){ pgOutput.innerHTML = fb.html; setPgStatus(fb.ok ? '✓ Success (backup runner)' : '✕ Error (backup runner)', fb.ok ? 'success' : 'error'); }
      else { pgOutput.innerHTML = '<span class="error-line">❌ Failed to run code.\n\nError: ' + escapeHtml(err.message) + '</span>';
      setPgStatus('✕ Failed', 'error'); }
    } finally {
      pgRun.disabled    = false;
      pgRun.textContent = runLabel();
    }
  }

  if (pgRun){
    pgRun.addEventListener('click', runCode);
    pgCode.addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); runCode(); }
      if (e.key === 'Tab'){
        e.preventDefault();
        const start = pgCode.selectionStart, end = pgCode.selectionEnd;
        pgCode.value = pgCode.value.substring(0, start) + '    ' + pgCode.value.substring(end);
        pgCode.selectionStart = pgCode.selectionEnd = start + 4;
      }
    });
    pgReset.addEventListener('click', () => { loadLang(pgCurrentLang); showToast('Code reset to sample', 'info', '↺'); });
    pgCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(pgCode.value)
        .then(() => showToast('Code copied!', 'success', '📋'))
        .catch(() => showToast('Copy failed', 'warn', '⚠️'));
    });
  }
  loadLang(pgCurrentLang);

  /* ============================================================
     CODE ARENA
     ============================================================ */
  const ARENA_HISTORY_KEY = 'hr-arena-history';
  const PDF_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const arenaLock     = document.getElementById('arenaLock');
  const arenaApp      = document.getElementById('arenaApp');
  const arenaDrop     = document.getElementById('arenaDrop');
  const arenaFileIn   = document.getElementById('arenaFile');
  const arenaQ        = document.getElementById('arenaQ');
  const tcList        = document.getElementById('tcList');
  const addTcBtn      = document.getElementById('addTc');
  const arenaLangSel  = document.getElementById('arenaLang');
  const arenaCode     = document.getElementById('arenaCode');
  const arenaClear    = document.getElementById('arenaClear');
  const arenaLines    = document.getElementById('arenaLines');
  const arenaResWrap  = document.getElementById('arenaResultWrap');
  const arenaFb       = document.getElementById('arenaFeedback');
  const fbStars       = document.getElementById('fbStars');
  const fbChips       = document.getElementById('fbChips');
  const fbText        = document.getElementById('fbText');
  const fbSubmit      = document.getElementById('fbSubmit');
  const arenaHistory  = document.getElementById('arenaHistory');
  const histList      = document.getElementById('histList');

  let arenaRunBtn = null;
  let arenaTestCases = [];
  let fbRating = 0;
  let fbTags = new Set();
  let arenaHintCount = 0;
  let arenaHintTopic = '';

  /* --- Arena hint rules --- */
  const ARENA_HINT_RULES = [
    { match:/sort|order|arrange|ascending|descending/i, topic:'Sorting & Ordering',
      hints:[
        'Which sorting algorithm fits the input size — O(n log n) merge/heap, or O(n) counting sort for bounded values?',
        'Edge cases to check: empty input, all-equal elements, already-sorted, and fully reversed.',
        'Try sorting in-place to save memory, or state your space complexity clearly if using extra arrays.'
      ]},
    { match:/palindrom|reverse|substring|anagram|string/i, topic:'Strings',
      hints:[
        'Two-pointer from both ends gives O(n) time and O(1) space for most string problems.',
        'Normalise first: lowercase, strip non-alphanumeric characters — Unicode vs ASCII matters.',
        'For substring search, sliding-window or rolling hash beats naive O(n²) badly.'
      ]},
    { match:/array|list|element|index|max|min/i, topic:'Arrays & Sequences',
      hints:[
        'Can you solve it in a single pass instead of nested loops? Track a running state.',
        'Edge cases: single element, negatives, duplicates, and very large inputs (watch overflow).',
        'Max/min subarray problems usually reduce to Kadane or prefix-sum tricks.'
      ]},
    { match:/tree|graph|node|edge|bfs|dfs|travers|path/i, topic:'Trees & Graphs',
      hints:[
        'BFS for shortest path on unweighted graphs; DFS for cycle detection and connectivity.',
        'Keep a visited set — otherwise cyclic graphs will loop forever.',
        'Recursion depth can blow up. Use an explicit stack for very deep or skewed trees.'
      ]},
    { match:/\bdp\b|dynamic program|optimal|minimum|maximum|ways to|count/i, topic:'Dynamic Programming',
      hints:[
        'Define the state clearly: what does dp[i] (or dp[i][j]) actually represent?',
        'Write the recurrence on paper first — base case, then transitions, then answer.',
        'Can you reduce 2D DP to 1D with rolling arrays? Mentioning it often earns extra credit.'
      ]},
    { match:/prime|factorial|fibonacci|gcd|lcm|number theory|modulo/i, topic:'Number Theory',
      hints:[
        'Watch for integer overflow — use long/int64 if values can exceed 2^31.',
        'Sieve of Eratosthenes is O(n log log n) and worth it when you have many prime queries.',
        'Take modulo inside the loop, not after — prevents overflow on big multiplications.'
      ]},
    { match:/matrix|grid|row|column|2d/i, topic:'Matrix & Grid',
      hints:[
        'Row-major iteration is far more cache-friendly than column-major.',
        'Grid path-finding: 4-neighbour vs 8-neighbour changes which algorithm is correct.',
        'Try transposing or rotating mentally — many grid problems collapse into simple array ones.'
      ]},
    { match:/file|read|write|io|input|output|stream/i, topic:'I/O & Files',
      hints:[
        'Buffered reads are 10× faster than line-by-line in most languages.',
        'Always close file handles — use with-statements (Python) or try-with-resources (Java).',
        'Match input format exactly. Extra whitespace breaks most tokenizers.'
      ]},
    { match:/api|request|http|json|fetch|rest|endpoint/i, topic:'APIs & Web',
      hints:[
        'Handle network errors gracefully — timeouts and retries with backoff.',
        'Validate response shape before indexing nested fields; JSON is often malformed.',
        'Rate limits: respect 429 responses and add exponential backoff.'
      ]},
    { match:/recursion|recursive|backtrack|permutation|combination|subset/i, topic:'Recursion & Backtracking',
      hints:[
        'Identify the base case first, then the recursive call — always in that order.',
        'Draw the recursion tree for small N to spot duplicate work; memoize if you see repeats.',
        'Backtracking needs an "undo" step after each recursive call — never forget it.'
      ]}
  ];

  const ARENA_DEFAULT_HINTS = [
    'Break the problem: what is the exact input, and what must the output look like? Restate it in one sentence.',
    'Trace your logic on the smallest meaningful example by hand. Bugs usually surface there first.',
    'Aim for the simplest correct solution first. Optimise only after all tests pass.'
  ];

  function analyzeQuestionHints(question){
    const q = question || '';
    for (const r of ARENA_HINT_RULES){
      if (r.match.test(q)) return { topic: r.topic, hints: r.hints };
    }
    return { topic: 'General', hints: ARENA_DEFAULT_HINTS };
  }
  function deriveArenaTopic(question){
    if (!question) return 'Unknown';
    for (const r of ARENA_HINT_RULES) if (r.match.test(question)) return r.topic;
    return 'General';
  }

  const arenaHintsEl  = document.getElementById('arenaHints');
  const hintHead      = document.getElementById('hintHead');
  const hintTopic     = document.getElementById('hintTopic');
  const hintCountEl   = document.getElementById('hintCount');
  const hintInner     = document.getElementById('hintInner');
  const hintActions   = document.getElementById('hintActions');
  const revealHintBtn = document.getElementById('revealHint');

  if (hintHead && arenaHintsEl){
    hintHead.addEventListener('click', () => {
      arenaHintsEl.classList.toggle('expanded');
      if (arenaHintsEl.classList.contains('expanded')){
        const analysis = analyzeQuestionHints(arenaQ.value);
        arenaHintTopic = analysis.topic;
        hintTopic.textContent = analysis.topic;
        hintTopic.classList.add('show');
      }
    });
  }
  if (revealHintBtn){
    revealHintBtn.addEventListener('click', () => {
      if (arenaHintCount >= 3) return;
      const analysis = analyzeQuestionHints(arenaQ.value);
      arenaHintTopic = analysis.topic;
      const n = arenaHintCount + 1;
      const hintText = analysis.hints[n - 1];
      const empty = hintInner.querySelector('.hint-empty');
      if (empty) empty.remove();
      const item = document.createElement('div');
      item.className = 'hint-item';
      item.innerHTML = `<span class="n">${n}</span><span class="txt">${escapeHtml(hintText)}</span>`;
      hintActions.insertAdjacentElement('beforebegin', item);
      arenaHintCount++;
      hintCountEl.textContent = `${arenaHintCount} / 3 revealed`;
      hintTopic.textContent = analysis.topic;
      hintTopic.classList.add('show');
      if (arenaHintCount >= 3){
        revealHintBtn.disabled = true;
        revealHintBtn.textContent = '✓ All hints revealed';
      } else {
        revealHintBtn.textContent = `🔓 Reveal hint ${arenaHintCount + 1}`;
      }
      showToast(`Hint ${n} revealed — topic: ${analysis.topic}`, 'info', '💡');
    });
  }

  /* --- Arena config --- */
  window.__hrArenaConfig = {
    hintPenalty: [0, 2, 5, 10],
    realtime: true,
    maxRows: 500
  };

  /* --- Language dropdown --- */
  const ARENA_LANGS = Object.keys(PG_LANG_MAP);
  if (arenaLangSel){
    arenaLangSel.innerHTML = ARENA_LANGS.map(k => {
      const label = {
        web:'🌐 HTML / CSS / JS', react:'⚛️ React',
        python:'🐍 Python', javascript:'🟨 JavaScript', typescript:'📗 TypeScript',
        cpp:'⚙️ C++', c:'📘 C', csharp:'🎯 C#', java:'☕ Java', kotlin:'🟣 Kotlin',
        go:'🐹 Go', rust:'🦀 Rust', swift:'🍎 Swift', dart:'🎯 Dart',
        ruby:'💎 Ruby', php:'🐘 PHP', lua:'🌙 Lua', perl:'🐪 Perl',
        bash:'💻 Bash', r:'📊 R', scala:'🔷 Scala', sqlite3:'🗄️ SQLite',
        elixir:'💧 Elixir', haskell:'λ Haskell', erlang:'📞 Erlang',
        fsharp:'🔵 F#', ocaml:'🐫 OCaml', prolog:'🔍 Prolog',
        commonlisp:'🌀 Common Lisp', fortran:'🏛️ Fortran', pascal:'📐 Pascal',
        cobol:'📇 COBOL', vb:'🟦 VB', objectivec:'🍏 Objective-C',
        groovy:'🎸 Groovy', d:'🟥 D', octave:'🔢 Octave',
        assembly:'🔧 Assembly', brainfuck:'🧠 Brainfuck'
      }[k] || k;
      return `<option value="${k}">${label}</option>`;
    }).join('');
    arenaLangSel.value = 'python';
  }

  /* --- Run button --- */
  (function attachRunButton(){
    if (!document.getElementById('arenaStep3')) return;
    const bar = document.createElement('div');
    bar.className = 'arena-actions';
    bar.innerHTML = `
      <span class="arena-hint">Runs remotely on Judge0 CE · HTML/React rendered live in-browser</span>
      <button class="btn btn-primary btn-lg" id="arenaRun" type="button">▶ Run &amp; Score</button>`;
    document.getElementById('arenaStep3').appendChild(bar);
    arenaRunBtn = document.getElementById('arenaRun');
  })();

  function updateArenaLines(){
    if (!arenaLines) return;
    const n = arenaCode.value.split('\n').length;
    arenaLines.textContent = n + (n === 1 ? ' line' : ' lines');
  }

  /* --- File upload --- */
  function setArenaDropLoaded(name){
    arenaDrop.classList.add('loaded');
    arenaDrop.querySelector('.t').textContent = name;
    arenaDrop.querySelector('.s').innerHTML = 'Text extracted · click to replace';
  }
  async function extractPdfText(file){
    try { await window.needPDF(); } catch(e){}
    if (!window.pdfjsLib) throw new Error('PDF library not loaded');
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let out = [];
    for (let p = 1; p <= Math.min(pdf.numPages, 40); p++){
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      out.push(content.items.map(it => it.str).join(' '));
    }
    return out.join('\n\n').trim();
  }
  async function handleArenaFile(file){
    if (!file) return;
    if (file.size > 5 * 1024 * 1024){ showToast('File too large (max 5 MB)', 'warn', '⚠️'); return; }
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const isTxt = file.type.startsWith('text/') || /\.(txt|md)$/i.test(file.name);
    if (!isPdf && !isTxt){ showToast('Only PDF or TXT files supported', 'warn', '⚠️'); return; }

    setArenaDropLoaded(file.name);
    try {
      let text = '';
      if (isPdf){ showToast('Extracting text from PDF…', 'info', '📄'); text = await extractPdfText(file); }
      else       { text = await file.text(); }
      if (!text.trim()){ showToast('No text found in file', 'warn', '⚠️'); return; }
      arenaQ.value = text.slice(0, 20000);
      showToast('Question loaded ✓', 'success', '📄');
    } catch (err){
      console.error('Arena file error:', err);
      showToast('Could not read file — try pasting the text instead', 'warn', '⚠️');
    }
  }
  if (arenaDrop){
    arenaDrop.addEventListener('click', () => arenaFileIn.click());
    arenaDrop.addEventListener('dragover', e => { e.preventDefault(); arenaDrop.classList.add('drag'); });
    arenaDrop.addEventListener('dragleave', () => arenaDrop.classList.remove('drag'));
    arenaDrop.addEventListener('drop', e => {
      e.preventDefault(); arenaDrop.classList.remove('drag');
      const f = e.dataTransfer.files[0]; if (f) handleArenaFile(f);
    });
    arenaFileIn.addEventListener('change', e => {
      const f = e.target.files[0]; if (f) handleArenaFile(f);
    });
  }

  /* --- Test cases --- */
  function renderTC(){
    if (!tcList) return;
    if (arenaTestCases.length === 0){
      tcList.innerHTML = `<div class="arena-hint" style="padding:8px 4px">No test cases yet. Click below to add one.</div>`;
      return;
    }
    tcList.innerHTML = arenaTestCases.map((tc, i) => `
      <div class="tc-row" data-i="${i}">
        <div class="idx">${i + 1}</div>
        <textarea data-k="input" placeholder="Input (stdin)">${escapeHtml(tc.input || '')}</textarea>
        <textarea data-k="output" placeholder="Expected output">${escapeHtml(tc.output || '')}</textarea>
        <button class="rm" type="button" title="Remove">✕</button>
      </div>
    `).join('');
  }
  renderTC();
  if (addTcBtn){
    addTcBtn.addEventListener('click', () => {
      if (arenaTestCases.length >= 5){ showToast('Maximum 5 test cases', 'warn', '⚠️'); return; }
      arenaTestCases.push({ input: '', output: '' });
      renderTC();
    });
  }
  if (tcList){
    tcList.addEventListener('input', e => {
      const row = e.target.closest('.tc-row');
      if (!row) return;
      const i = +row.dataset.i, k = e.target.dataset.k;
      if (arenaTestCases[i] && k) arenaTestCases[i][k] = e.target.value;
    });
    tcList.addEventListener('click', e => {
      const rm = e.target.closest('.rm');
      if (!rm) return;
      const i = +rm.closest('.tc-row').dataset.i;
      arenaTestCases.splice(i, 1); renderTC();
    });
  }

  /* --- Editor --- */
  if (arenaCode){
    arenaCode.addEventListener('input', updateArenaLines);
    arenaCode.addEventListener('keydown', e => {
      if (e.key === 'Tab'){
        e.preventDefault();
        const s = arenaCode.selectionStart, en = arenaCode.selectionEnd;
        arenaCode.value = arenaCode.value.slice(0, s) + '    ' + arenaCode.value.slice(en);
        arenaCode.selectionStart = arenaCode.selectionEnd = s + 4;
        updateArenaLines();
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); arenaRunBtn && arenaRunBtn.click(); }
    });
  }
  if (arenaClear){
    arenaClear.addEventListener('click', () => {
      if (!confirm('Clear your current solution?')) return;
      arenaCode.value = '';
      updateArenaLines();
      arenaResWrap.innerHTML = '';
      arenaFb.style.display = 'none';
      // reset hints
      arenaHintCount = 0;
      if (hintCountEl) hintCountEl.textContent = '0 / 3 revealed';
      if (hintInner){
        hintInner.querySelectorAll('.hint-item').forEach(el => el.remove());
        if (!hintInner.querySelector('.hint-empty')){
          const el = document.createElement('div');
          el.className = 'hint-empty';
          el.textContent = "Reveal hints one by one. They don't affect your score — we just log them for reference.";
          hintInner.insertBefore(el, hintActions);
        }
        if (revealHintBtn){ revealHintBtn.disabled = false; revealHintBtn.textContent = '🔓 Reveal hint 1'; }
      }
      if (arenaHintsEl) arenaHintsEl.classList.remove('expanded');
      if (hintTopic) hintTopic.classList.remove('show');
      showToast('Editor cleared', 'info', '↺');
    });
  }

  /* --- Judge helper --- */
  async function judgeOnce(lang, code, stdin){
    const info = PG_LANG_MAP[lang];
    if (!info || info.render === 'iframe'){
      return { stdout:'', stderr:'', compile_output:'', statusId:3, time:0, skip:true };
    }
    const b64 = str => btoa(String.fromCharCode(...new TextEncoder().encode(str)));
    const submitRes = await fetch(
      'https://ce.judge0.com/submissions?base64_encoded=true&wait=false',
      { method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          language_id: info.judge0,
          source_code: b64(code),
          stdin: stdin ? b64(stdin) : null
        })});
    if (!submitRes.ok) throw new Error('Judge0 HTTP ' + submitRes.status);
    const { token } = await submitRes.json();
    if (!token) throw new Error('No token');
    for (let i = 0; i < 25; i++){
      await new Promise(r => setTimeout(r, 800));
      const p = await fetch('https://ce.judge0.com/submissions/' + token + '?base64_encoded=true');
      if (!p.ok) continue;
      const d = await p.json();
      const sid = d.status && d.status.id;
      if (sid && sid !== 1 && sid !== 2){
        const dec = s => s ? decodeURIComponent(escape(atob(s))) : '';
        return {
          stdout: dec(d.stdout), stderr: dec(d.stderr), compile_output: dec(d.compile_output),
          statusId: sid, time: parseFloat(d.time || 0) * 1000
        };
      }
    }
    throw new Error('Execution timed out');
  }

  /* --- Scoring --- */
  function computeScore({ ran, error, passed, total, timeMs, code, lang, hintCount = 0, topic = '' }){
  const bd = [];
  const hasTestCases = total > 0;
  const tcRatio = hasTestCases ? (passed / total) : 0;

  // ===== CORRECTNESS (60 pts) =====
  let correct = 0;
  if (hasTestCases){
    // Full 60 pts for 100% test pass, scaled down linearly
    correct = Math.round(tcRatio * 60);
    // Bonus: harsh fail penalty for partial passes
    if (tcRatio === 1) correct = 60;
    bd.push({ label:'Correctness', got: correct, max: 60,
      note: `${passed}/${total} test cases passed (${Math.round(tcRatio*100)}%)` });
  } else {
    // No test cases: cap at 24/60 (40% max) — heuristic only
    correct = (ran && !error) ? 24 : 6;
    bd.push({ label:'Correctness', got: correct, max: 60,
      note: '⚠️ No test cases — heuristic cap 40%' });
  }

  // ===== EXECUTION (15 pts) =====
  let exec = 0;
  if (ran) exec += 8;
  if (!error) exec += 7;
  bd.push({ label:'Execution', got: exec, max: 15,
    note: error ? 'Runtime/compile issue' : (ran ? 'Ran cleanly' : 'Did not run') });

  // ===== EFFICIENCY (10 pts) =====
  let eff = 0;
  const lines = code.split('\n').filter(l => l.trim()).length;
  // Infinite loop risk detection
  const loopRisk = /while\s*\(\s*(true|1)\s*\)/.test(code) && !/break|return/.test(code);
  if (!loopRisk) eff += 3;
  // Fast execution
  if (timeMs > 0 && timeMs < 500) eff += 4;
  else if (timeMs > 0 && timeMs < 2000) eff += 3;
  else if (timeMs === 0 && !error) eff += 2;
  // Reasonable code density (not overly verbose)
  if (code.length / Math.max(lines, 1) < 80) eff += 2;
  // Nested loops = complexity penalty for large inputs
  const nestedLoops = (code.match(/for\s*\(/g) || []).length >= 2 || 
                      (code.match(/while\s*\(/g) || []).length >= 2;
  if (!nestedLoops) eff += 1;
  eff = Math.min(eff, 10);
  bd.push({ label:'Efficiency', got: eff, max: 10,
    note: timeMs ? `${Math.round(timeMs)} ms · ${nestedLoops ? 'nested loops' : 'single pass'}` : 'Not measured' });

  // ===== CODE QUALITY (15 pts) =====
  let q = 0;
  const hasComments = /(\/\/|#(?!include)|\/\*|--|%)/.test(code);
  const hasFunctions = /(function |def |class |=>|void |int main|public |fun |fn |proc |module )/i.test(code);
  const hasMeaningfulNames = /[a-zA-Z_]{3,}\s*[=\(]/.test(code); // at least 3-char variable names
  
  if (hasComments) q += 4;
  if (hasFunctions) q += 4;
  if (hasMeaningfulNames) q += 3;
  if (lines >= 3 && lines <= 100) q += 2;
  if (code.length > 100) q += 2;
  q = Math.min(q, 15);
  bd.push({ label:'Code Quality', got: q, max: 15,
    note: hasComments && hasFunctions ? 'Comments + structured' : 'Add comments / structure' });

  // ===== TOTAL =====
  let total_ = bd.reduce((s, x) => s + x.got, 0);

  // ===== NO TEST CASE CAP =====
  const NO_TC_CAP = 65;
  let capped = false;
  if (!hasTestCases && total_ > NO_TC_CAP){
    total_ = NO_TC_CAP;
    capped = true;
    bd.push({ label:'Test Case Bonus', got: 0, max: 0, penalty: true,
      note: `Capped at ${NO_TC_CAP} — add test cases for full score` });
  }

  // ===== HINT PENALTY =====
  const tbl = (window.__hrArenaConfig && window.__hrArenaConfig.hintPenalty) || [0, 2, 5, 10];
  const hc  = Math.min(hintCount || 0, tbl.length - 1);
  const penalty = tbl[hc] || 0;
  if (penalty > 0){
    bd.push({ label:'Hint Usage', got:-penalty, max:0, penalty:true,
      note:`${hc} hint${hc>1?'s':''} revealed` });
  }

  total_ = Math.max(1, Math.min(100, total_ - penalty));
  return { score: total_, breakdown: bd, penalty, topic, capped };
}
  function verdictFor(score){
    if (score >= 90) return { color:'#3ddc84', label:'Excellent — production ready', txt:'Outstanding. Your solution is well-structured and correct.' };
    if (score >= 75) return { color:'#22d3ee', label:'Strong — minor gaps', txt:'Solid solution. Tighten edge cases and comments to reach 90+.' };
    if (score >= 60) return { color:'#7c5cff', label:'Good — needs polish', txt:'You are on the right track. Focus on correctness and structure.' };
    if (score >= 40) return { color:'#ff9f43', label:'Developing — keep iterating', txt:'The idea is there. Debug failing tests and add clarity.' };
    return { color:'#ff6b6b', label:'Needs work', txt:'Revisit the problem, handle edge cases, and try again.' };
  }

  function renderScore(result, tcResults, submittedCode, lang){
    const { score, breakdown } = result;
    const v = verdictFor(score);
    const pct = score;
    const C = 2 * Math.PI * 55;

    const tcHtml = tcResults.length
      ? `<div class="tc-results">
          ${tcResults.map((r, i) => `
            <div class="tc-res ${r.pass ? 'pass' : 'fail'}">
              <div class="ic">${r.pass ? '✓' : '✕'}</div>
              <div class="body">
                <span class="lbl">Test ${i + 1}</span>
                ${r.pass ? 'Output matched expected.'
                  : `Expected: ${escapeHtml(r.expected) || '(empty)'}\nGot:      ${escapeHtml(r.got) || '(empty)'}${r.err ? '\nError:    ' + escapeHtml(r.err) : ''}`}
              </div>
              <span class="verdict">${r.pass ? 'PASS' : 'FAIL'}</span>
            </div>`).join('')}
         </div>`
      : '';

    arenaResWrap.innerHTML = `
      <div class="arena-score">
        <div class="score-top">
          <div class="score-ring">
            <svg viewBox="0 0 120 120">
              <circle class="bgc" cx="60" cy="60" r="55"></circle>
              <circle class="fgc" cx="60" cy="60" r="55" stroke="${v.color}"
                      stroke-dasharray="${C}" stroke-dashoffset="${C}"></circle>
            </svg>
            <div class="val">
              <b style="color:${v.color}">${score}</b>
              <span>/ 100</span>
            </div>
          </div>
          <div class="score-meta">
            <h3 style="color:${v.color}">${v.label}</h3>
            <div class="verdict">${v.txt}</div>
          </div>
        </div>
        <div class="score-breakdown">
          ${breakdown.map(b => {
            if (b.penalty){
              return `
                <div class="bd-row penalty">
                  <div class="bd-lbl">
                    <span>💡 ${b.label}</span>
                    <span class="note">${b.note || ''} · −${Math.abs(b.got)} pts</span>
                  </div>
                </div>`;
            }
            const p = Math.round((b.got / b.max) * 100);
            const col = p >= 75 ? '#3ddc84' : p >= 45 ? '#ff9f43' : '#ff6b6b';
            return `
              <div class="bd-row">
                <div>
                  <div class="bd-lbl">
                    <span>${b.label}</span>
                    <span class="note">${b.note || ''}</span>
                  </div>
                  <div class="bd-bar"><i data-fill="${p}%" style="background:${col}"></i></div>
                </div>
                <div class="bd-pts" style="color:${col}">${b.got}<span style="color:var(--muted);font-size:11px">/${b.max}</span></div>
              </div>`;
          }).join('')}
        </div>
        ${tcHtml}
      </div>`;

    requestAnimationFrame(() => {
      const ring = arenaResWrap.querySelector('.fgc');
      const bars = arenaResWrap.querySelectorAll('.bd-bar i');
      if (ring){
        const off = C - (pct / 100) * C;
        setTimeout(() => { ring.style.strokeDashoffset = off; }, 60);
      }
      bars.forEach((b, i) => setTimeout(() => { b.style.width = b.dataset.fill; }, 120 + i * 80));
    });

    arenaResWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });

    saveHistory({
      ts: Date.now(), score, lang,
      title: (arenaQ.value.trim().split('\n')[0] || 'Untitled challenge').slice(0, 70),
      codePreview: submittedCode.slice(0, 60).replace(/\s+/g, ' ')
    });

    // cloud save
    if (window.__saveArenaToCloud) {
      window.__saveArenaToCloud({
        title: (arenaQ.value.trim().split('\n')[0] || 'Untitled').slice(0, 120),
        question: arenaQ.value.slice(0, 6000),
        code: submittedCode, lang, score,
        hintCount: arenaHintCount,
        penalty: result.penalty || 0,
        topic: result.topic || '',
        testCases: window.__hrLastTC || [],
        breakdown
      });
    }

    arenaFb.style.display = '';
    renderHistory();
  }

  async function arenaRun(){
    if (!arenaCode.value.trim()){ showToast('Write some code first', 'warn', '⚠️'); arenaCode.focus(); return; }
    if (!arenaQ.value.trim()){
      showToast('Load or paste the question first', 'warn', '⚠️');
      document.getElementById('arenaStep1').scrollIntoView({ behavior:'smooth', block:'center' });
      return;
    }

    // Snapshot test cases
    window.__hrLastTC = arenaTestCases
      .filter(t => t.input.trim() || t.output.trim())
      .map(t => ({ input: t.input, output: t.output }));

    const lang = arenaLangSel.value;
    const info = PG_LANG_MAP[lang];
    const code = arenaCode.value;
    const tests = window.__hrLastTC;

    const orig = arenaRunBtn.textContent;
    arenaRunBtn.disabled = true;
    arenaRunBtn.textContent = '⏳ Judging…';
    arenaResWrap.innerHTML = `<div class="arena-score" style="text-align:center;color:var(--muted);font-size:14px">
      Running your solution${tests.length ? ` against ${tests.length} test case${tests.length>1?'s':''}` : ''}…
    </div>`;

    let ran = false, error = false, passed = 0, timeMs = 0;
    const tcResults = [];

    try {
      if (info.render === 'iframe'){
        ran = true;
        const previewId = 'arena-preview-' + Date.now();
        const wrap = document.createElement('div');
        wrap.className = 'arena-score';
        wrap.innerHTML = `<h3 style="margin:0 0 12px;font-size:16px">🖥 Live preview</h3>
          <iframe id="${previewId}" sandbox="allow-scripts allow-modals"
                  style="width:100%;height:340px;border:1px solid var(--border);
                         border-radius:14px;background:#fff"></iframe>`;
        arenaResWrap.appendChild(wrap);
        wrap.querySelector('iframe').srcdoc = code;
      } else {
        if (tests.length === 0){
          const r = await judgeOnce(lang, code, '');
          ran = true; timeMs = r.time || 0;
          error = r.statusId !== 3 && r.statusId !== 4;
        } else {
          for (let i = 0; i < tests.length; i++){
            const tc = tests[i];
            try {
              const r = await judgeOnce(lang, code, tc.input);
              ran = true; timeMs = Math.max(timeMs, r.time || 0);
              const got = (r.stdout || '').trim();
              const exp = (tc.output || '').trim();
              const pass = got === exp && r.statusId === 3;
              if (pass) passed++;
              tcResults.push({ pass, expected: exp, got, err: r.stderr || r.compile_output || '' });
            } catch (e){
              error = true;
              tcResults.push({ pass: false, expected: tc.output, got: '', err: e.message });
            }
          }
        }
      }
    } catch (e){
      error = true;
      console.error('Arena run error:', e);
      showToast('Runner error: ' + e.message, 'warn', '⚠️');
    }

    const result = computeScore({
      ran, error, passed,
      total: tests.length, timeMs, code, lang,
      hintCount: arenaHintCount,
      topic: deriveArenaTopic(arenaQ.value)
    });

    renderScore(result, tcResults, code, lang);
    arenaRunBtn.disabled = false;
    arenaRunBtn.textContent = orig;
  }
  if (arenaRunBtn) arenaRunBtn.addEventListener('click', arenaRun);

  /* --- History --- */
  function loadHistory(){
    try { return JSON.parse(localStorage.getItem(ARENA_HISTORY_KEY) || '[]'); }
    catch { return []; }
  }
  function saveHistory(entry){
    const list = loadHistory();
    list.unshift(entry);
    localStorage.setItem(ARENA_HISTORY_KEY, JSON.stringify(list.slice(0, 8)));
  }
  function renderHistory(){
    const list = loadHistory();
    if (!list.length){ arenaHistory.style.display = 'none'; return; }
    arenaHistory.style.display = '';
    histList.innerHTML = list.map((h, i) => `
      <div class="hist-item" data-i="${i}">
        <div class="t">${escapeHtml(h.title || 'Untitled challenge')}
          <small>${new Date(h.ts).toLocaleString('en-IN')} · ${h.lang}</small>
        </div>
        <div class="hist-score ${scoreCls(h.score)}">${h.score}</div>
        <button class="rm" title="Remove">✕</button>
      </div>
    `).join('');
  }
  if (histList){
    histList.addEventListener('click', e => {
      const rm = e.target.closest('.rm');
      if (!rm) return;
      const i = +rm.closest('.hist-item').dataset.i;
      const list = loadHistory();
      list.splice(i, 1);
      localStorage.setItem(ARENA_HISTORY_KEY, JSON.stringify(list));
      renderHistory();
    });
  }

  /* --- Feedback --- */
  if (fbStars){
    fbStars.addEventListener('click', e => {
      const b = e.target.closest('.fb-star');
      if (!b) return;
      fbRating = +b.dataset.v;
      fbStars.querySelectorAll('.fb-star').forEach(s => {
        s.classList.toggle('active', +s.dataset.v <= fbRating);
      });
    });
  }
  if (fbChips){
    fbChips.addEventListener('click', e => {
      const c = e.target.closest('.fb-chip');
      if (!c) return;
      const t = c.dataset.t;
      if (fbTags.has(t)){ fbTags.delete(t); c.classList.remove('active'); }
      else { fbTags.add(t); c.classList.add('active'); }
    });
  }
  if (fbSubmit){
    fbSubmit.addEventListener('click', async () => {
      if (fbRating === 0 && !fbText.value.trim() && fbTags.size === 0){
        showToast('Add a rating or comment first', 'warn', '⚠️'); return;
      }
      const user = await getCurrentUser();
      fbSubmit.disabled = true;
      fbSubmit.textContent = 'Sending…';
      fetch(FORMSPREE_URL, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Accept':'application/json' },
        body: JSON.stringify({
          _subject: 'Code Arena Feedback',
          type: 'ARENA_FEEDBACK',
          rating: fbRating,
          tags: [...fbTags].join(', '),
          comment: fbText.value.trim(),
          email: user ? user.email : 'anonymous',
          role: user ? user.role : '',
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        })
      }).catch(()=>{});
      setTimeout(() => {
        showToast('Thanks for the feedback! 🙏', 'success', '💬');
        fbRating = 0; fbTags.clear();
        fbStars.querySelectorAll('.fb-star').forEach(s => s.classList.remove('active'));
        fbChips.querySelectorAll('.fb-chip').forEach(c => c.classList.remove('active'));
        fbText.value = '';
        fbSubmit.disabled = false;
        fbSubmit.textContent = 'Send Feedback →';
      }, 900);
    });
  }

  /* --- Arena gate buttons --- */
  const arenaLoginBtn  = document.getElementById('arenaLoginBtn');
  const arenaSignupBtn = document.getElementById('arenaSignupBtn');
  if (arenaLoginBtn) arenaLoginBtn.addEventListener('click', () => {
    authMode = 'login';
    authToggle.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === 'login'));
    updateFormFields(); openLogin();
  });
  if (arenaSignupBtn) arenaSignupBtn.addEventListener('click', () => {
    authMode = 'signup';
    authToggle.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === 'signup'));
    updateFormFields(); openLogin();
  });

  updateArenaLines();

  /* ============================================================
     CLOUD SAVE + HINT PENALTY HOOKS
     ============================================================ */
  const _realSaveArenaToCloud = async function(payload){
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const { error } = await supabase.from('arena_submissions').insert([{
        user_id:    user.id,
        email:      user.email,
        full_name:  user.name,
        role:       user.role,
        title:      payload.title,
        question:   payload.question,
        code:       payload.code,
        lang:       payload.lang,
        score:      payload.score,
        hint_count: payload.hintCount,
        penalty:    payload.penalty || 0,
        topic:      payload.topic || '',
        breakdown:  payload.breakdown,
        test_cases: payload.testCases || [],
        source:     'app'
      }]);
      if (error) console.warn('Cloud save failed:', error.message);
    } catch (e){
      console.warn('Cloud save exception:', e);
    }
  };
  window.__saveArenaToCloud = _realSaveArenaToCloud;

  /* ============================================================
     ADMIN DASHBOARD
     ============================================================ */
  const adminSection  = document.getElementById('admin');
  const adminTbody    = document.getElementById('adminTbody');
  const adminStats    = document.getElementById('adminStats');
  const adminSearch   = document.getElementById('adminSearch');
  const adminRoleF    = document.getElementById('adminFilterRole');
  const adminLangF    = document.getElementById('adminFilterLang');
  const adminScoreF   = document.getElementById('adminFilterScore');
  const adminCount    = document.getElementById('adminCount');
  const adminRefresh  = document.getElementById('adminRefresh');
  const adminExport   = document.getElementById('adminExport');
  const adminExportCSV = document.getElementById('adminExportCSV');
  const adminImport   = document.getElementById('adminImport');
  const codeModal     = document.getElementById('codeModal');

  let adminAllRows = [];

  if (adminLangF){
    adminLangF.innerHTML = '<option value="">All languages</option>' +
      Object.keys(PG_LANG_MAP).map(k => `<option value="${k}">${k}</option>`).join('');
  }

  function applyAdminFilters(rows){
    const q     = (adminSearch.value || '').trim().toLowerCase();
    const role  = adminRoleF.value;
    const lang  = adminLangF.value;
    const score = adminScoreF.value;
    let out = rows.filter(r => {
      if (role && r.role !== role) return false;
      if (lang && r.lang !== lang) return false;
      if (score !== ''){
        const s = r.score || 0;
        if (score === '90' && s < 90) return false;
        if (score === '75' && (s < 75 || s >= 90)) return false;
        if (score === '50' && (s < 50 || s >= 75)) return false;
        if (score === '0'  && s >= 50) return false;
      }
      if (q){
        const hay = ((r.email||'') + ' ' + (r.full_name||'') + ' ' + (r.title||'')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (window.__showFlaggedOnly) out = out.filter(r => r.flagged);
    return out;
  }

  function renderAdminRows(){
    const rows = applyAdminFilters(adminAllRows);
    adminCount.textContent = `${rows.length} / ${adminAllRows.length} shown`;

    if (!rows.length){
      adminTbody.innerHTML = `<tr><td colspan="10" class="admin-empty">No submissions match your filters.</td></tr>`;
      return;
    }

    adminTbody.innerHTML = rows.map(r => {
      const when = new Date(r.created_at).toLocaleString('en-IN', {
        day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'
      });
      const s = r.score || 0;
      const isFlagged = r.flagged ? 'flagged-row' : '';
      return `
        <tr data-id="${r.id}" class="${isFlagged}">
          <td class="col-check"><input type="checkbox" class="row-check" data-id="${r.id}" ${selectedIds.has(r.id) ? 'checked' : ''} /></td>
          <td>
            <div class="u-email">${escapeHtml(r.email || '—')}${r.flagged ? '<span class="flag-badge">🚩 review</span>' : ''}${r.source === 'import' ? '<span class="src-badge import">imported</span>' : ''}</div>
            <div class="u-name">${escapeHtml(r.full_name || '')}</div>
          </td>
          <td class="hide-sm"><span class="role-pill">${escapeHtml(r.role || 'Student')}</span></td>
          <td>${escapeHtml((r.title || 'Untitled').slice(0, 42))}</td>
          <td class="hide-sm"><span class="lang-chip">${escapeHtml(r.lang || '—')}</span></td>
          <td><span class="score-pill ${scoreCls(s)}">${s}</span></td>
          <td class="hide-sm">${r.hint_count || 0}</td>
          <td class="hide-sm">${r.tag ? `<span class="role-pill">${escapeHtml(r.tag)}</span>` : '<span style="color:var(--muted);font-size:11px">—</span>'}</td>
          <td class="hide-sm" style="color:var(--muted);font-size:12px">${when}</td>
          <td class="actions-cell">
            <button class="rowbtn" data-act="view" data-id="${r.id}">View</button>
            <button class="rowbtn danger" data-act="del" data-id="${r.id}">Delete</button>
          </td>
        </tr>`;
    }).join('');

    // wire email click → user history
    adminTbody.querySelectorAll('tr[data-id]').forEach(tr => {
      const emailCell = tr.querySelector('.u-email');
      if (!emailCell || emailCell.dataset.wired) return;
      emailCell.dataset.wired = '1';
      emailCell.style.cursor = 'pointer';
      emailCell.style.textDecoration = 'underline';
      emailCell.style.textDecorationStyle = 'dotted';
      emailCell.title = 'View all submissions from this user';
      emailCell.addEventListener('click', ev => {
        ev.stopPropagation();
        const raw = emailCell.textContent.split('imported')[0].trim();
        openUserHistory(raw);
      });
    });

    updateBulkBar();
    updateFlagCounts();
    renderReviewQueue();
  }

  function renderAdminStats(rows){
    const total = rows.length;
    const avg   = total ? Math.round(rows.reduce((a,r) => a + (r.score||0), 0) / total) : 0;
    const users = new Set(rows.map(r => r.email)).size;
    const top   = total ? Math.max(...rows.map(r => r.score || 0)) : 0;
    const topRow = rows.find(r => (r.score||0) === top);
    document.getElementById('statTotal').textContent    = total;
    document.getElementById('statTotalSub').textContent = total ? `${rows.filter(r => r.hint_count > 0).length} used hints` : 'no data yet';
    document.getElementById('statAvg').textContent      = avg;
    document.getElementById('statUsers').textContent    = users;
    document.getElementById('statTop').textContent      = top;
    document.getElementById('statTopSub').textContent   = topRow ? (topRow.email || '').slice(0, 22) : '—';
    updateFlagCounts();
  }

  /* --- Pagination + infinite scroll --- */
  const adminSentinel = document.getElementById('adminSentinel');
  const ADMIN_PAGE_SIZE = 50;
  let adminOffset = 0, adminHasMore = true, adminLoading = false;

  async function fetchAdminPage(reset){
    if (adminLoading) return;
    if (!adminHasMore && !reset) return;
    adminLoading = true;
    if (reset){
      adminOffset = 0; adminHasMore = true; adminAllRows = [];
      if (adminSentinel) adminSentinel.innerHTML = '<span class="spin"></span>Loading…';
    } else if (adminSentinel){
      adminSentinel.innerHTML = '<span class="spin"></span>Loading more…';
    }
    try {
      const from = adminOffset;
      const to   = adminOffset + ADMIN_PAGE_SIZE - 1;
      const { data, error } = await supabase.from('arena_submissions')
        .select('*').order('created_at', { ascending: false }).range(from, to);
      if (error) throw error;
      const rows = data || [];
      adminAllRows = adminAllRows.concat(rows);
      adminOffset += rows.length;
      adminHasMore = rows.length === ADMIN_PAGE_SIZE;
      if (adminSentinel){
        if (adminHasMore){
          adminSentinel.classList.remove('done');
          adminSentinel.textContent = 'Scroll to load more…';
        } else {
          adminSentinel.classList.add('done');
          adminSentinel.textContent = `— end · ${adminAllRows.length} loaded —`;
        }
      }
      renderAdminStats(adminAllRows);
      renderAdminRows();
      renderAdminAnalytics(adminAllRows);
      updateBulkBar();
    } catch(e){
      console.error('Pagination fetch failed:', e);
      if (adminSentinel) adminSentinel.textContent = '⚠️ Load failed';
    } finally {
      adminLoading = false;
    }
  }

async function loadAdminData(){
  await fetchAdminPage(true);
  startRealtime();
  startImportLogRealtime();
  renderImportLog();
}

  if (adminSentinel && 'IntersectionObserver' in window){
    const sentinelIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting && adminHasMore && !adminLoading){
          fetchAdminPage(false);
        }
      });
    }, { rootMargin: '200px' });
    sentinelIO.observe(adminSentinel);
  }

  [adminSearch, adminRoleF, adminLangF, adminScoreF].forEach(el => {
    if (el) el.addEventListener('input', () => {
      renderAdminRows();
      renderAdminAnalytics(applyAdminFilters(adminAllRows));
    });
  });
  if (adminRefresh) adminRefresh.addEventListener('click', loadAdminData);

  /* --- Row actions --- */
  if (adminTbody){
    adminTbody.addEventListener('click', async e => {
      const btn = e.target.closest('.rowbtn');
      if (!btn) return;
      const id  = btn.dataset.id;
      const row = adminAllRows.find(r => r.id === id);
      if (!row) return;

      if (btn.dataset.act === 'view'){
        document.getElementById('cmTitle').textContent = row.title || 'Untitled challenge';
        document.getElementById('cmMeta').textContent =
          `${row.email || ''} · ${row.role || ''} · ${row.lang || ''} · score ${row.score || 0}/100 · hints used: ${row.hint_count || 0}`;
        document.getElementById('cmQuestion').textContent  = row.question || '(not saved)';
        document.getElementById('cmCode').textContent      = row.code || '(not saved)';
        document.getElementById('cmBreakdown').textContent = row.breakdown ? JSON.stringify(row.breakdown, null, 2) : '(not saved)';
        codeModal.classList.add('open');
        document.body.style.overflow = 'hidden';
        // flag status sync
        const st = document.getElementById('cmFlagStatus');
        const fbtn = document.getElementById('cmToggleFlag');
        if (st) st.textContent = row.flagged ? `Flagged · ${row.flag_reason || 'review'}` : 'Not flagged';
        if (fbtn) fbtn.textContent = row.flagged ? '✅ Unflag' : '🚩 Flag for review';
        fbtn.dataset.currentId = id;
      }
      else if (btn.dataset.act === 'del'){
        if (!confirm('Delete this submission permanently?')) return;
        const { error } = await supabase.from('arena_submissions').delete().eq('id', id);
        if (error){ showToast('Delete failed: ' + error.message, 'warn', '⚠️'); return; }
        adminAllRows = adminAllRows.filter(r => r.id !== id);
        renderAdminStats(adminAllRows);
        renderAdminRows();
        renderAdminAnalytics(adminAllRows);
        showToast('Submission deleted', 'success', '🗑️');
      }
    });
  }

  const cmClose = document.getElementById('cmClose');
  if (cmClose) cmClose.addEventListener('click', () => {
    codeModal.classList.remove('open'); document.body.style.overflow = '';
  });
  if (codeModal) codeModal.addEventListener('click', e => {
    if (e.target === codeModal){ codeModal.classList.remove('open'); document.body.style.overflow = ''; }
  });

  const cmToggleFlag = document.getElementById('cmToggleFlag');
  if (cmToggleFlag) cmToggleFlag.addEventListener('click', async () => {
    const id = cmToggleFlag.dataset.currentId;
    if (!id) return;
    const row = adminAllRows.find(r => r.id === id);
    if (!row) return;
    const next = !row.flagged;
    cmToggleFlag.disabled = true;
    const { error } = await supabase.from('arena_submissions').update({
      flagged: next, flag_reason: next ? 'Manually flagged by admin' : null,
      flagged_at: next ? new Date().toISOString() : null
    }).eq('id', id);
    cmToggleFlag.disabled = false;
    if (error){ showToast('Update failed: ' + error.message, 'warn', '⚠️'); return; }
    row.flagged = next; row.flag_reason = next ? 'Manually flagged by admin' : null;
    const st = document.getElementById('cmFlagStatus');
    if (st) st.textContent = next ? `Flagged · ${row.flag_reason}` : 'Not flagged';
    cmToggleFlag.textContent = next ? '✅ Unflag' : '🚩 Flag for review';
    renderAdminRows();
    showToast(next ? 'Flagged for review' : 'Unflagged', next ? 'warn' : 'success', next ? '🚩' : '✅');
  });

  /* --- Analytics --- */
  const anaTopicList  = document.getElementById('anaTopicList');
  const anaHist       = document.getElementById('anaHist');
  const anaLangList   = document.getElementById('anaLangList');
  const anaLeaderboard= document.getElementById('anaLeaderboard');

  function renderAdminAnalytics(rows){
    if (!anaTopicList) return;

    const byTopic = {};
    rows.forEach(r => {
      const t = r.topic || deriveArenaTopic(r.question);
      if (!byTopic[t]) byTopic[t] = { count:0, sum:0, hints:0 };
      byTopic[t].count++; byTopic[t].sum += r.score || 0; byTopic[t].hints += r.hint_count || 0;
    });
    const topics = Object.entries(byTopic).map(([t,v]) => ({
      topic: t, count: v.count, avg: Math.round(v.sum / v.count),
      avgHints: (v.hints / v.count).toFixed(1)
    })).sort((a,b) => a.avg - b.avg);

    anaTopicList.innerHTML = topics.length
      ? topics.map(t => {
          const col = t.avg >= 75 ? '#3ddc84' : t.avg >= 50 ? '#ff9f43' : '#ff6b6b';
          return `<div class="topic-row">
              <div class="topic-lbl">
                <span>${escapeHtml(t.topic)}</span>
                <span class="meta">${t.count} sub · avg ${t.avg} · 💡 ${t.avgHints}</span>
              </div>
              <div class="topic-bar"><i data-fill="${t.avg}%" style="background:${col};width:0"></i></div>
            </div>`;
        }).join('')
      : '<div class="ana-empty">No data yet.</div>';

    const buckets = [
      { lbl:'0–19', min:0, max:20, col:'#ff6b6b' },
      { lbl:'20–39', min:20, max:40, col:'#ff9f43' },
      { lbl:'40–59', min:40, max:60, col:'#fbbf24' },
      { lbl:'60–79', min:60, max:80, col:'#22d3ee' },
      { lbl:'80–100', min:80, max:101, col:'#3ddc84' }
    ];
    const counts = buckets.map(b => rows.filter(r => {
      const s = r.score || 0; return s >= b.min && s < b.max;
    }).length);
    const peak = Math.max(1, ...counts);
    anaHist.innerHTML = buckets.map((b,i) => {
      const h = Math.round((counts[i] / peak) * 100);
      return `<div class="hist-col">
          <div class="bar" data-h="${h}%" style="background:${b.col};height:0"><span>${counts[i]}</span></div>
          <div class="lbl">${b.lbl}</div>
        </div>`;
    }).join('');

    const byLang = {};
    rows.forEach(r => { const l = r.lang || 'unknown'; byLang[l] = (byLang[l]||0) + 1; });
    const langs = Object.entries(byLang).sort((a,b) => b[1] - a[1]);
    anaLangList.innerHTML = langs.length
      ? langs.map(([l,c]) => `<div class="lang-row"><span class="name">${escapeHtml(l)}</span><span class="cnt">${c}</span></div>`).join('')
      : '<div class="ana-empty">No data yet.</div>';

    const sorted = [...rows].sort((a,b) => (b.score||0) - (a.score||0)).slice(0, 8);
    anaLeaderboard.innerHTML = sorted.length
      ? sorted.map((r, i) => {
          const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
          const s = r.score || 0;
          return `<div class="lead-row">
              <div class="rank">${medal}</div>
              <div class="who">${escapeHtml(r.email || '—')}
                <small>${escapeHtml((r.title||'Untitled').slice(0,40))}</small>
              </div>
              <div class="sc ${scoreCls(s)}">${s}</div>
            </div>`;
        }).join('')
      : '<div class="ana-empty">No submissions yet.</div>';

    requestAnimationFrame(() => {
      document.querySelectorAll('#anaTopicList .topic-bar i').forEach(el => { el.style.width = el.dataset.fill; });
      document.querySelectorAll('#anaHist .bar').forEach(el => { el.style.height = el.dataset.h; });
    });
  }

  /* --- XLSX / CSV export --- */
  function rowsForExport(){ return applyAdminFilters(adminAllRows); }

  function downloadCSV(){
    const rows = rowsForExport();
    if (!rows.length){ showToast('Nothing to export', 'warn', '⚠️'); return; }
    const head = ['email','full_name','role','title','topic','lang','score','penalty','hint_count','tag','created_at'];
    const csv = [head.join(',')].concat(
      rows.map(r => head.map(k => {
        const v = r[k] == null ? '' : String(r[k]);
        return '"' + v.replace(/"/g,'""').replace(/\n/g,' ') + '"';
      }).join(','))
    ).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arena-submissions-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${rows.length} rows`, 'success', '⬇');
  }

  async function downloadXLSX(){
    try { await window.needXLSX(); } catch(e){}
    if (!window.XLSX){ showToast('Excel library not loaded', 'warn', '⚠️'); return; }
    const rows = rowsForExport();
    if (!rows.length){ showToast('Nothing to export', 'warn', '⚠️'); return; }

    const wb = XLSX.utils.book_new();
    const s1 = rows.map(r => ({
      Email: r.email || '', Name: r.full_name || '', Role: r.role || '',
      Challenge: r.title || '', Topic: r.topic || deriveArenaTopic(r.question),
      Language: r.lang || '', Score: r.score || 0, 'Hint Penalty': r.penalty || 0,
      'Hints Used': r.hint_count || 0, Tag: r.tag || '',
      'Submitted At': new Date(r.created_at).toLocaleString('en-IN')
    }));
    const ws1 = XLSX.utils.json_to_sheet(s1);
    ws1['!cols'] = [{wch:28},{wch:20},{wch:10},{wch:40},{wch:22},{wch:12},{wch:8},{wch:13},{wch:11},{wch:14},{wch:22}];
    XLSX.utils.book_append_sheet(wb, ws1, 'Submissions');

    const byTopic = {};
    rows.forEach(r => {
      const t = r.topic || deriveArenaTopic(r.question);
      if (!byTopic[t]) byTopic[t] = { count:0, sum:0, hints:0, top:0 };
      byTopic[t].count++; byTopic[t].sum += r.score || 0;
      byTopic[t].hints += r.hint_count || 0;
      byTopic[t].top = Math.max(byTopic[t].top, r.score || 0);
    });
    const s2 = Object.entries(byTopic).map(([t,v]) => ({
      Topic: t, Attempts: v.count, 'Avg Score': Math.round(v.sum / v.count),
      'Top Score': v.top, 'Avg Hints': +(v.hints / v.count).toFixed(2),
      Difficulty: (v.sum / v.count) >= 75 ? 'Easy' : (v.sum / v.count) >= 50 ? 'Medium' : 'Hard'
    })).sort((a,b) => a['Avg Score'] - b['Avg Score']);
    const ws2 = XLSX.utils.json_to_sheet(s2);
    ws2['!cols'] = [{wch:24},{wch:11},{wch:12},{wch:11},{wch:11},{wch:11}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Topic Analytics');

    const buckets = [['0–19',0,20],['20–39',20,40],['40–59',40,60],['60–79',60,80],['80–100',80,101]];
    const s3 = buckets.map(([lbl,mn,mx]) => ({
      'Score Range': lbl, Count: rows.filter(r => (r.score||0) >= mn && (r.score||0) < mx).length
    }));
    const ws3 = XLSX.utils.json_to_sheet(s3);
    ws3['!cols'] = [{wch:14},{wch:10}];
    XLSX.utils.book_append_sheet(wb, ws3, 'Score Distribution');

    const s4 = [...rows].sort((a,b) => (b.score||0) - (a.score||0)).slice(0, 30).map((r,i) => ({
      Rank: i+1, Email: r.email || '', Score: r.score || 0, Language: r.lang || '', Challenge: (r.title || '').slice(0, 60)
    }));
    const ws4 = XLSX.utils.json_to_sheet(s4);
    ws4['!cols'] = [{wch:6},{wch:28},{wch:8},{wch:12},{wch:60}];
    XLSX.utils.book_append_sheet(wb, ws4, 'Top Performers');

    const fname = 'arena-analytics-' + new Date().toISOString().slice(0,10) + '.xlsx';
    XLSX.writeFile(wb, fname);
    showToast(`Excel exported (4 sheets, ${rows.length} rows)`, 'success', '📗');
  }

  if (adminExportCSV) adminExportCSV.addEventListener('click', downloadCSV);
  if (adminExport)    adminExport.addEventListener('click', downloadXLSX);

  /* --- Realtime admin stream --- */
  const rtIndicator = document.getElementById('rtIndicator');
  const rtText      = document.getElementById('rtText');
  let adminChannel  = null;

  function setRtStatus(on, text){
    if (!rtIndicator) return;
    rtIndicator.classList.toggle('off', !on);
    if (rtText) rtText.textContent = text;
  }

 async function fireWebhookViaEdge(row, isTest){
  try {
    const res = await fetch('/api/notify-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ((await supabase.auth.getSession()).data.session?.access_token || '') },
      body: JSON.stringify({ row, isTest: !!isTest })
    });
    const data = await res.json().catch(() => ({}));
    if (data?.ok) { window.__webhookErr = ''; return true; }
    window.__webhookErr = res.status === 404 ? 'api/notify-webhook.js is not deployed'
      : res.status === 401 ? 'login expired - log in again'
      : res.status === 403 ? 'only an Admin account can send (hr_is_admin check failed)'
      : data?.reason === 'no_webhook' ? 'DISCORD_WEBHOOK_URL is not set in Vercel (set it, then redeploy)'
      : data?.status ? 'Discord rejected it (HTTP ' + data.status + ') - webhook deleted or wrong?'
      : (data?.error || ('HTTP ' + res.status));
    return false;
  } catch (e){
    console.warn('Webhook failed:', e);
    window.__webhookErr = 'could not reach /api/notify-webhook (' + (e.message || e) + ')';
    return false;
  }
}

  function startRealtime(){
    if (!window.__hrArenaConfig.realtime) return;
    if (adminChannel) return;
    adminChannel = supabase
      .channel('arena-submissions-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'arena_submissions' },
        payload => {
          const row = payload.new;
          if (adminAllRows.some(r => r.id === row.id)) return;
          adminAllRows.unshift(row);
          if (adminAllRows.length > window.__hrArenaConfig.maxRows)
            adminAllRows.length = window.__hrArenaConfig.maxRows;
          renderAdminStats(adminAllRows);
          renderAdminRows();
          renderAdminAnalytics(adminAllRows);
          showToast(`📡 New submission from ${row.email || 'a user'}`, 'info', '🛡️');
          fireWebhookViaEdge(row).then(ok => { if (ok) console.log('📡 Webhook sent'); });
        })
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'arena_submissions' },
        payload => {
          adminAllRows = adminAllRows.filter(r => r.id !== payload.old.id);
          renderAdminStats(adminAllRows);
          renderAdminRows();
          renderAdminAnalytics(adminAllRows);
        })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') setRtStatus(true, 'Live');
        else if (status === 'CHANNEL_ERROR') setRtStatus(false, 'Offline');
        else if (status === 'TIMED_OUT') setRtStatus(false, 'Timeout');
        else if (status === 'CLOSED') setRtStatus(false, 'Closed');
      });
  }
  function stopRealtime(){
    if (adminChannel){ supabase.removeChannel(adminChannel); adminChannel = null; }
    setRtStatus(false, 'Paused');
  }
  window.addEventListener('beforeunload', stopRealtime);

  /* --- Admin settings + webhook (cloud) --- */
  const asHead   = document.getElementById('asHead');
  const asPanel  = document.getElementById('adminSettings');
  const asWebhook= document.getElementById('asWebhook');
  const asSave   = document.getElementById('asSave');
  const asTest   = document.getElementById('asTest');
  const asState  = document.getElementById('asState');
  const asDigestTest = document.getElementById('asDigestTest');

  async function loadWebhookFromCloud(){
    const { data, error } = await supabase.from('app_settings')
      .select('value').eq('key', 'webhook_url').maybeSingle();
    if (error) return '';
    return data?.value || '';
  }
  async function saveWebhookToCloud(url){
    const { error } = await supabase.from('app_settings').upsert(
      { key: 'webhook_url', value: url || null, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) throw error;
  }
  function refreshAsState(){
    if (!asState || !asWebhook) return;
    const u = asWebhook.value.trim();
    asState.textContent = u ? 'Webhook: on' : 'Webhook: off';
    asState.classList.toggle('on', !!u);
  }
  if (asHead) asHead.addEventListener('click', () => asPanel.classList.toggle('expanded'));
  if (asSave) asSave.addEventListener('click', async () => {
    const u = asWebhook.value.trim();
    if (u && !/^https:\/\//i.test(u)){ showToast('URL must start with https://', 'warn', '⚠️'); return; }
    asSave.disabled = true; asSave.textContent = 'Saving…';
    try {
      await saveWebhookToCloud(u);
      showToast(u ? 'Webhook saved (cloud)' : 'Webhook cleared', 'success', '⚙️');
      refreshAsState();
    } catch(e){
      showToast('Save failed: ' + e.message, 'warn', '⚠️');
    } finally {
      asSave.disabled = false; asSave.textContent = 'Save';
    }
  });
  if (asTest) asTest.addEventListener('click', async () => {
    asTest.disabled = true; asTest.textContent = 'Sending…';
    const ok = await fireWebhookViaEdge({
      email:'test@arena.dev', role:'Admin', score: 92, lang:'python',
      topic:'Strings', title:'Webhook test ping'
    }, true);
    asTest.disabled = false; asTest.textContent = 'Test alert';
    showToast(ok ? 'Test ping sent ✓' : 'Ping failed — ' + (window.__webhookErr || 'check URL & function deploy'),
              ok ? 'success' : 'warn', ok ? '📡' : '⚠️');
  });
  setTimeout(async () => {
    const u = await loadWebhookFromCloud();
    if (asWebhook) asWebhook.value = u;
    refreshAsState();
  }, 800);

  /* --- Digest trigger --- */
  async function sendDigest(mode){
    try {
      showToast(`Sending ${mode} digest…`, 'info', '📬');
      const { data, error } = await supabase.functions.invoke('digest', { body: { mode } });
      if (error) throw error;
      if (data?.sent) showToast(`${mode} digest sent ✓ (${data.total} submissions)`, 'success', '📬');
      else showToast(`No webhook configured or no data`, 'warn', '⚠️');
    } catch(e){
      showToast('Digest failed: ' + e.message, 'warn', '⚠️');
    }
  }
  const digestDailyBtn  = document.getElementById('digestDaily');
  const digestWeeklyBtn = document.getElementById('digestWeekly');
  const adminDigestBtn  = document.getElementById('adminDigest');
  if (digestDailyBtn)  digestDailyBtn.addEventListener('click', () => sendDigest('daily'));
  if (digestWeeklyBtn) digestWeeklyBtn.addEventListener('click', () => sendDigest('weekly'));
  if (asDigestTest)    asDigestTest.addEventListener('click', () => sendDigest('daily'));
  if (adminDigestBtn)  adminDigestBtn.addEventListener('click', () => {
    document.getElementById('admin').scrollIntoView({ behavior:'smooth' });
    setTimeout(() => sendDigest('weekly'), 400);
  });

  /* --- Bulk actions --- */
  const bulkBar    = document.getElementById('bulkBar');
  const bulkCount  = document.getElementById('bulkCount');
  const bulkClear  = document.getElementById('bulkClear');
  const bulkDelete = document.getElementById('bulkDelete');
  const bulkExport = document.getElementById('bulkExport');
  const bulkTag    = document.getElementById('bulkTag');
  const bulkRescore= document.getElementById('bulkRescore');
  const adminSelectAll = document.getElementById('adminSelectAll');
  const selectedIds = new Set();
  window.__showFlaggedOnly = false;

  function updateBulkBar(){
    if (!bulkBar) return;
    bulkCount.textContent = selectedIds.size;
    bulkBar.classList.toggle('show', selectedIds.size > 0);
    if (adminSelectAll){
      const visible = adminTbody.querySelectorAll('.row-check');
      adminSelectAll.checked = visible.length > 0 && Array.from(visible).every(c => selectedIds.has(c.dataset.id));
      adminSelectAll.indeterminate = selectedIds.size > 0 && !adminSelectAll.checked;
    }
  }

  if (adminTbody){
    adminTbody.addEventListener('change', e => {
      const cb = e.target.closest('.row-check');
      if (!cb) return;
      if (cb.checked) selectedIds.add(cb.dataset.id);
      else selectedIds.delete(cb.dataset.id);
      updateBulkBar();
    });
  }
  if (adminSelectAll){
    adminSelectAll.addEventListener('change', () => {
      const visible = adminTbody.querySelectorAll('.row-check');
      visible.forEach(c => {
        if (adminSelectAll.checked){ c.checked = true; selectedIds.add(c.dataset.id); }
        else { c.checked = false; selectedIds.delete(c.dataset.id); }
      });
      updateBulkBar();
    });
  }
  if (bulkClear) bulkClear.addEventListener('click', () => {
    selectedIds.clear();
    adminTbody.querySelectorAll('.row-check').forEach(c => c.checked = false);
    if (adminSelectAll) adminSelectAll.checked = false;
    updateBulkBar();
  });
  if (bulkExport) bulkExport.addEventListener('click', () => {
    const rows = adminAllRows.filter(r => selectedIds.has(r.id));
    if (!rows.length) return;
    const head = ['email','full_name','role','title','topic','lang','score','hint_count','tag','created_at'];
    const csv = [head.join(',')].concat(rows.map(r => head.map(k => {
      const v = r[k] == null ? '' : String(r[k]);
      return '"' + v.replace(/"/g,'""').replace(/\n/g,' ') + '"';
    }).join(','))).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'arena-selected-' + Date.now() + '.csv';
    a.click();
    showToast(`Exported ${rows.length} selected`, 'success', '⬇');
  });
  if (bulkTag) bulkTag.addEventListener('click', async () => {
    if (!selectedIds.size) return;
    const tag = prompt('Tag name (empty = clear):', '');
    if (tag === null) return;
    const ids = [...selectedIds];
    const { error } = await supabase.from('arena_submissions')
      .update({ tag: tag.trim() || null }).in('id', ids);
    if (error){ showToast('Tag failed: ' + error.message, 'warn', '⚠️'); return; }
    adminAllRows.forEach(r => { if (selectedIds.has(r.id)) r.tag = tag.trim() || null; });
    renderAdminRows();
    showToast(`${ids.length} rows tagged`, 'success', '🏷');
  });
  if (bulkDelete) bulkDelete.addEventListener('click', async () => {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} submission(s)? This cannot be undone.`)) return;
    const ids = [...selectedIds];
    bulkDelete.disabled = true; bulkDelete.textContent = 'Deleting…';
    const { error } = await supabase.from('arena_submissions').delete().in('id', ids);
    bulkDelete.disabled = false; bulkDelete.textContent = '🗑 Delete';
    if (error){ showToast('Delete failed: ' + error.message, 'warn', '⚠️'); return; }
    adminAllRows = adminAllRows.filter(r => !selectedIds.has(r.id));
    selectedIds.clear();
    if (adminSelectAll) adminSelectAll.checked = false;
    renderAdminStats(adminAllRows);
    renderAdminRows();
    renderAdminAnalytics(adminAllRows);
    updateBulkBar();
    showToast(`${ids.length} deleted`, 'success', '🗑');
  });

  /* --- Edge-based bulk re-score --- */
  const rescoreWrap  = document.getElementById('rescoreWrap');
  const rescoreBar   = document.getElementById('rescoreBar');
  const rescoreNow   = document.getElementById('rescoreNow');
  const rescorePct   = document.getElementById('rescorePct');
  const rescoreTitle = document.getElementById('rescoreTitle');

  function setRescoreProgress(i, total, label){
    if (!rescoreWrap) return;
    rescoreWrap.classList.add('show');
    const pct = total ? Math.round((i / total) * 100) : 0;
    rescoreBar.style.width = pct + '%';
    rescorePct.textContent = pct + '%';
    rescoreNow.textContent = label || `${i} / ${total}`;
  }
  function hideRescore(){ if (rescoreWrap) rescoreWrap.classList.remove('show'); }

  if (bulkRescore) bulkRescore.addEventListener('click', async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    if (ids.length > 50){ showToast('Max 50 per batch', 'warn', '⚠️'); return; }
    if (!confirm(`Re-score ${ids.length} submission(s) on the server?`)) return;

    bulkRescore.disabled = true;
    bulkRescore.textContent = '🔄 Server working…';
    if (rescoreTitle) rescoreTitle.textContent = 'Re-scoring on server…';
    setRescoreProgress(0, ids.length, 'Submitting to edge…');

    try {
      const { data, error } = await supabase.functions.invoke('rescore-batch', { body: { ids } });
      if (error) throw error;
      const results = data?.results || [];
      let n = 0;
      results.forEach(r => {
        const local = adminAllRows.find(x => x.id === r.id);
        if (local){ local.score = r.score; local.breakdown = r.breakdown; local.penalty = r.penalty; }
        n++;
        setRescoreProgress(n, ids.length, `${n} / ${ids.length}`);
      });
      renderAdminStats(adminAllRows);
      renderAdminRows();
      renderAdminAnalytics(adminAllRows);
      setTimeout(hideRescore, 1200);
      showToast(`Re-scored ${results.length} submissions (server)`, 'success', '🔄');
    } catch (e){
      console.error(e);
      hideRescore();
      showToast('Re-score failed: ' + e.message, 'warn', '⚠️');
    } finally {
      bulkRescore.disabled = false;
      bulkRescore.textContent = '🔄 Re-score';
    }
  });

  /* --- Import audit log + realtime --- */
  const importLogRows = document.getElementById('ilRows');
  const ilCount       = document.getElementById('ilCount');
  const ilLive        = document.getElementById('ilLive');
  const ilLiveText    = document.getElementById('ilLiveText');
  let ilChannel = null;

  function setIlLive(on, text){
    if (!ilLive) return;
    ilLive.classList.toggle('off', !on);
    if (ilLiveText) ilLiveText.textContent = text;
  }
  function prependIlRow(entry){
    if (!importLogRows) return;
    const empty = importLogRows.querySelector('.ana-empty');
    if (empty) empty.remove();
    const div = document.createElement('div');
    div.className = 'il-row new';
    div.innerHTML = `
      <div class="who">${escapeHtml(entry.admin_email || '—')}
        <small>${escapeHtml(entry.file_name || 'manual batch')}</small>
      </div>
      <span class="n ok">${entry.row_count || 0}</span>
      ${entry.failed_count ? `<span class="n bad">−${entry.failed_count}</span>` : '<span></span>'}
      <span class="when">just now</span>`;
    importLogRows.insertBefore(div, importLogRows.firstChild);
    const rows = importLogRows.querySelectorAll('.il-row');
    if (rows.length > 20) rows[rows.length - 1].remove();
    if (ilCount){
      const n = importLogRows.querySelectorAll('.il-row').length;
      ilCount.textContent = `${n} recent`;
    }
    setTimeout(() => div.classList.remove('new'), 1600);
  }
  async function renderImportLog(){
    if (!importLogRows) return;
    try {
      const { data, error } = await supabase.from('arena_import_log')
        .select('*').order('created_at', { ascending: false }).limit(15);
      if (error) throw error;
      const rows = data || [];
      if (ilCount) ilCount.textContent = rows.length ? `${rows.length} recent` : '—';
      importLogRows.innerHTML = rows.length
        ? rows.map(r => `
            <div class="il-row">
              <div class="who">${escapeHtml(r.admin_email || '—')}
                <small>${escapeHtml(r.file_name || 'manual batch')}</small>
              </div>
              <span class="n ok">${r.row_count || 0}</span>
              ${r.failed_count ? `<span class="n bad">−${r.failed_count}</span>` : '<span></span>'}
              <span class="when">${new Date(r.created_at).toLocaleString('en-IN',
                { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
            </div>`).join('')
        : '<div class="ana-empty">No imports yet.</div>';
    } catch (e){
      importLogRows.innerHTML = `<div class="ana-empty">Log unavailable: ${escapeHtml(e.message)}</div>`;
    }
  }
  function startImportLogRealtime(){
    if (ilChannel) return;
    ilChannel = supabase
      .channel('arena-import-log-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'arena_import_log' },
        payload => {
          prependIlRow(payload.new);
          showToast(`📥 ${payload.new.row_count || 0} rows imported by ${payload.new.admin_email || 'admin'}`, 'success', '📥');
        })
      .subscribe(status => {
        if (status === 'SUBSCRIBED')       setIlLive(true,  'Live');
        else if (status === 'CHANNEL_ERROR') setIlLive(false, 'Offline');
        else if (status === 'TIMED_OUT')     setIlLive(false, 'Timeout');
        else if (status === 'CLOSED')        setIlLive(false, 'Closed');
      });
  }
  function stopImportLogRealtime(){
    if (ilChannel){ supabase.removeChannel(ilChannel); ilChannel = null; }
    setIlLive(false, 'Paused');
  }
  window.addEventListener('beforeunload', stopImportLogRealtime);
 // These are only called when admin opens Admin Console via loadAdminData()

  /* --- Auto-flag filter + review queue --- */
  const filterFlaggedBtn = document.getElementById('filterFlagged');
  const flagCountEl      = document.getElementById('flagCount');
  const reviewQueue      = document.getElementById('reviewQueue');
  const rqList           = document.getElementById('rqList');
  const rqCount          = document.getElementById('rqCount');

  function updateFlagCounts(){
    const flagged = adminAllRows.filter(r => r.flagged);
    if (flagCountEl) flagCountEl.textContent = flagged.length;
    if (rqCount) rqCount.textContent = `${flagged.length} pending`;
    if (reviewQueue) reviewQueue.style.display = flagged.length ? '' : 'none';
  }
  function renderReviewQueue(){
    if (!rqList) return;
    const flagged = adminAllRows.filter(r => r.flagged)
      .sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 12);
    if (!flagged.length){
      rqList.innerHTML = '<div class="rq-empty">No flagged submissions. Nice work!</div>';
      return;
    }
    rqList.innerHTML = flagged.map(r => `
      <div class="rq-item" data-id="${r.id}">
        <div class="who">${escapeHtml(r.email || '—')}
          <small>${escapeHtml((r.title || 'Untitled').slice(0, 50))} · ${escapeHtml(r.lang || '—')}</small>
        </div>
        <span class="sc">${r.score || 0}</span>
        <button class="act" data-act="unflag" data-id="${r.id}">Unflag</button>
      </div>
    `).join('');
  }
  if (rqList){
    rqList.addEventListener('click', async e => {
      const btn = e.target.closest('[data-act="unflag"]');
      if (!btn) return;
      const id = btn.dataset.id;
      btn.disabled = true; btn.textContent = '…';
      const { error } = await supabase.from('arena_submissions')
        .update({ flagged: false, flag_reason: null }).eq('id', id);
      if (error){ showToast('Unflag failed: ' + error.message, 'warn', '⚠️'); return; }
      const local = adminAllRows.find(x => x.id === id);
      if (local){ local.flagged = false; local.flag_reason = null; }
      renderAdminRows();
      renderAdminAnalytics(adminAllRows);
      showToast('Unflagged ✓', 'success', '✅');
    });
  }
  if (filterFlaggedBtn){
    filterFlaggedBtn.addEventListener('click', () => {
      window.__showFlaggedOnly = !window.__showFlaggedOnly;
      filterFlaggedBtn.classList.toggle('active', window.__showFlaggedOnly);
      renderAdminRows();
      renderAdminAnalytics(applyAdminFilters(adminAllRows));
    });
  }

  /* --- User drilldown --- */
  const userModal   = document.getElementById('userModal');
  const umWho       = document.getElementById('umWho');
  const umSub       = document.getElementById('umSub');
  const umTotal     = document.getElementById('umTotal');
  const umAvg       = document.getElementById('umAvg');
  const umBest      = document.getElementById('umBest');
  const umTimeline  = document.getElementById('umTimeline');
  const umClose     = document.getElementById('umClose');
  const umMore      = document.getElementById('umMore');
  let umState = { email: null, offset: 0, hasMore: true, allRows: [], loading: false };

  function renderUserTimeline(rows, append){
    if (!append) umTimeline.innerHTML = '';
    const html = rows.map(r => {
      const s = r.score || 0;
      const when = new Date(r.created_at).toLocaleString('en-IN', {
        day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'
      });
      return `<div class="um-item ${scoreCls(s)}">
          <div class="row1">
            <div class="title">${escapeHtml(r.title || 'Untitled')}</div>
            <div class="sc ${scoreCls(s)}">${s}</div>
          </div>
          <div class="meta">
            <span>💻 ${escapeHtml(r.lang || '—')}</span>
            <span>📚 ${escapeHtml(r.topic || deriveArenaTopic(r.question))}</span>
            <span>💡 ${r.hint_count || 0} hints</span>
            ${r.tag ? `<span>🏷 ${escapeHtml(r.tag)}</span>` : ''}
            <span>🕒 ${when}</span>
          </div>
        </div>`;
    }).join('');
    umTimeline.insertAdjacentHTML('beforeend', html);
  }
  function recalcUmStats(){
    const rows = umState.allRows;
    const total = rows.length;
    const avg = total ? Math.round(rows.reduce((a,r) => a + (r.score||0), 0) / total) : 0;
    const best = total ? Math.max(...rows.map(r => r.score || 0)) : 0;
    umTotal.textContent = total;
    umAvg.textContent   = avg;
    umBest.textContent  = best;
  }
  async function fetchUserPage(reset){
    if (umState.loading) return;
    if (!umState.hasMore && !reset) return;
    umState.loading = true;
    if (reset){
      umState.offset = 0; umState.hasMore = true; umState.allRows = [];
      umTimeline.innerHTML = '<div class="ana-empty">Loading…</div>';
      if (umMore) umMore.style.display = 'none';
    } else {
      if (umMore){ umMore.disabled = true; umMore.textContent = 'Loading…'; }
    }
    try {
      const PAGE = 50;
      const { data, error } = await supabase.from('arena_submissions')
        .select('*').eq('email', umState.email)
        .order('created_at', { ascending: false })
        .range(umState.offset, umState.offset + PAGE - 1);
      if (error) throw error;
      const rows = data || [];
      if (reset) umTimeline.innerHTML = '';
      umState.allRows = umState.allRows.concat(rows);
      umState.offset += rows.length;
      umState.hasMore = rows.length === PAGE;
      renderUserTimeline(rows, !reset || umState.allRows.length > rows.length);
      recalcUmStats();
      if (umMore){
        umMore.style.display = umState.hasMore ? 'block' : 'none';
        umMore.disabled = false;
        umMore.textContent = `Load more (${umState.allRows.length} loaded)`;
      }
    } catch(e){
      umTimeline.innerHTML = `<div class="ana-empty">Failed: ${escapeHtml(e.message)}</div>`;
    } finally {
      umState.loading = false;
    }
  }
  async function openUserHistory(email){
    if (!email) return;
    umState.email = email;
    umWho.textContent = email;
    umSub.textContent = 'Loading…';
    userModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    await fetchUserPage(true);
    const first = umState.allRows[umState.allRows.length - 1];
    umSub.textContent = first
      ? `${first.full_name || email} · ${first.role || 'Student'} · since ${new Date(first.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`
      : 'No submissions yet';
  }
  if (umClose) umClose.addEventListener('click', () => {
    userModal.classList.remove('open'); document.body.style.overflow = '';
  });
  if (userModal) userModal.addEventListener('click', e => {
    if (e.target === userModal){ userModal.classList.remove('open'); document.body.style.overflow = ''; }
  });
  if (umMore) umMore.addEventListener('click', () => fetchUserPage(false));
  /* ============================================================
   ADMIN — TEAM REGISTRATIONS
   ============================================================ */
const teamTbody = document.getElementById('teamTbody');
const teamSearch = document.getElementById('teamSearch');
const teamFilterStatus = document.getElementById('teamFilterStatus');
const teamCount = document.getElementById('teamCount');
const teamRefresh = document.getElementById('teamRefresh');

let adminAllTeams = [];
let adminTeamSelection = new Set();
let adminTeamPage = 1;
const ADMIN_TEAM_PER_PAGE = 10;
let adminTeamFiltered = [];

function getTeamSortOption(){
  const sel = document.getElementById('teamSortBy');
  return sel?.value || 'created_desc';
}

function applyTeamFilters(rows){
  const q = (teamSearch?.value || '').trim().toLowerCase();
  const status = teamFilterStatus?.value || '';
  let out = rows.filter(r => {
    if (status && r.status !== status) return false;
    if (q){
      const hay = `${r.team_name||''} ${r.college_name||''} ${r.email||''} ${r.spoc_name||''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sort = getTeamSortOption();
  out.sort((a, b) => {
    const an = (a.team_name||'').toLowerCase();
    const bn = (b.team_name||'').toLowerCase();
    const ac = (a.college_name||'').toLowerCase();
    const bc = (b.college_name||'').toLowerCase();
    const ad = new Date(a.created_at || 0).getTime();
    const bd = new Date(b.created_at || 0).getTime();
    switch (sort){
      case 'created_asc': return ad - bd;
      case 'name_asc':    return an.localeCompare(bn);
      case 'name_desc':   return bn.localeCompare(an);
      case 'college_asc': return ac.localeCompare(bc);
      case 'status_asc':  return (a.status||'submitted').localeCompare(b.status||'submitted');
      default:            return bd - ad;
    }
  });
  return out;
}

function updateTeamBulkBar(){
  const bar = document.getElementById('teamBulkBar');
  const cnt = document.getElementById('teamBulkCount');
  if (!bar || !cnt) return;
  cnt.textContent = adminTeamSelection.size;
  bar.classList.toggle('show', adminTeamSelection.size > 0);

  const selectAll = document.getElementById('teamSelectAll');
  if (selectAll){
    const visibleBoxes = teamTbody.querySelectorAll('.team-check');
    selectAll.checked = visibleBoxes.length > 0 && Array.from(visibleBoxes).every(c => adminTeamSelection.has(c.dataset.id));
    selectAll.indeterminate = adminTeamSelection.size > 0 && !selectAll.checked;
  }
}

function renderTeamPagination(total, perPage, current){
  const info = document.getElementById('teamPageInfo');
  const btns = document.getElementById('teamPageBtns');
  if (!info || !btns) return;

  const pages = Math.max(1, Math.ceil(total / perPage));
  const start = total === 0 ? 0 : (current - 1) * perPage + 1;
  const end = Math.min(current * perPage, total);
  info.textContent = `Showing ${start}–${end} of ${total}`;

  btns.innerHTML = '';
  const mkBtn = (label, page, disabled, active) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.className = 'btn btn-ghost';
    b.style.padding = '6px 12px';
    b.style.fontSize = '12.5px';
    if (active) b.style.background = 'rgba(124,92,255,.15)', b.style.color = 'var(--violet)', b.style.borderColor = 'var(--violet)';
    b.disabled = disabled;
    if (!disabled && !active) b.addEventListener('click', () => { adminTeamPage = page; renderAdminTeams(); });
    return b;
  };
  btns.appendChild(mkBtn('← Prev', current - 1, current === 1, false));
  const maxShow = 5;
  let startPage = Math.max(1, current - Math.floor(maxShow/2));
  let endPage = Math.min(pages, startPage + maxShow - 1);
  if (endPage - startPage < maxShow - 1) startPage = Math.max(1, endPage - maxShow + 1);
  for (let p = startPage; p <= endPage; p++){
    btns.appendChild(mkBtn(p, p, false, p === current));
  }
  btns.appendChild(mkBtn('Next →', current + 1, current === pages, false));
}


function renderAdminTeams(){
  if (!teamTbody) return;
  const rows = applyTeamFilters(adminAllTeams);

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / ADMIN_TEAM_PER_PAGE));
  if (adminTeamPage > pages) adminTeamPage = pages;
  if (adminTeamPage < 1) adminTeamPage = 1;

  const startIdx = (adminTeamPage - 1) * ADMIN_TEAM_PER_PAGE;
  const pageRows = rows.slice(startIdx, startIdx + ADMIN_TEAM_PER_PAGE);

  if (teamCount) teamCount.textContent = `${total} / ${adminAllTeams.length} shown`;

  if (!pageRows.length){
    teamTbody.innerHTML = `<tr><td colspan="7" class="admin-empty">No team registrations found.</td></tr>`;
    renderTeamPagination(0, ADMIN_TEAM_PER_PAGE, 1);
    updateTeamBulkBar();
    return;
  }

  teamTbody.innerHTML = pageRows.map(r => {
    const members = Array.isArray(r.members) ? r.members.length : 0;
    const status = (r.status || 'submitted').toLowerCase();
    const statusLabel = { submitted:'🟣 Submitted', approved:'✅ Approved', rejected:'❌ Rejected' }[status] || '🟣 Submitted';
    const checked = adminTeamSelection.has(r.id) ? 'checked' : '';
    return `
      <tr data-id="${r.id}">
        <td class="col-check"><input type="checkbox" class="team-check" data-id="${r.id}" ${checked} /></td>
        <td>
          <div class="u-email">${escapeHtml(r.team_name || '—')}</div>
          <div class="u-name">${escapeHtml(r.spoc_name || '')}</div>
        </td>
        <td class="hide-sm">${escapeHtml((r.college_name || '—').slice(0, 30))}</td>
        <td class="hide-sm">${escapeHtml((r.theme || '—').slice(0, 22))}</td>
        <td class="hide-sm">${members}</td>
        <td><span class="team-status-pill ${status}">${statusLabel}</span></td>
        <td class="actions-cell">
          <div class="team-actions">
            <button class="view" data-act="view" data-id="${r.id}">View</button>
            ${status !== 'approved' ? `<button class="approve" data-act="approve" data-id="${r.id}">✓ Approve</button>` : ''}
            ${status !== 'rejected' ? `<button class="reject" data-act="reject" data-id="${r.id}">✕ Reject</button>` : ''}
          </div>
        </td>
      </tr>`;
  }).join('');

  renderTeamPagination(total, ADMIN_TEAM_PER_PAGE, adminTeamPage);
  updateTeamBulkBar();
}

function renderTeamStats(rows){
  const total = rows.length;
  const pending = rows.filter(r => (r.status || 'submitted') === 'submitted').length;
  const approved = rows.filter(r => r.status === 'approved').length;
  const rejected = rows.filter(r => r.status === 'rejected').length;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('teamStatTotal', total);
  set('teamStatPending', pending);
  set('teamStatApproved', approved);
  set('teamStatRejected', rejected);
}
/* --- Team Analytics --- */
const THEME_COLORS = [
  '#7c5cff', '#22d3ee', '#ff4d9d', '#3ddc84', 
  '#ff9f43', '#ffd93d', '#a78bfa', '#f472b6'
];

function renderTeamAnalytics(teams){
  if (!teams) teams = adminAllTeams;

  // ---- 1. Status Breakdown ----
  const total = teams.length;
  const pending = teams.filter(t => (t.status || 'submitted') === 'submitted').length;
  const approved = teams.filter(t => t.status === 'approved').length;
  const rejected = teams.filter(t => t.status === 'rejected').length;

  const statusEl = document.getElementById('statusChart');
  if (statusEl){
    const rows = [
      { key: 'submitted', label: '🟣 Pending', count: pending },
      { key: 'approved', label: '✅ Approved', count: approved },
      { key: 'rejected', label: '❌ Rejected', count: rejected }
    ];
    statusEl.innerHTML = rows.map(r => {
      const pct = total ? Math.round((r.count / total) * 100) : 0;
      return `
        <div class="status-row">
          <div class="status-lbl">
            <span class="name">${r.label}</span>
            <span>
              <span class="count">${r.count}</span>
              <span class="pct"> · ${pct}%</span>
            </span>
          </div>
          <div class="status-bar">
            <i class="${r.key}" data-w="${pct}%"></i>
          </div>
        </div>`;
    }).join('');
  }

  // ---- 2. Theme-wise Teams ----
  const byTheme = {};
  teams.forEach(t => {
    const th = (t.theme || 'Unknown').trim();
    byTheme[th] = (byTheme[th] || 0) + 1;
  });
  const themes = Object.entries(byTheme)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const themeEl = document.getElementById('themeChart');
  if (themeEl){
    const peak = Math.max(1, ...themes.map(t => t[1]));
    themeEl.innerHTML = themes.length
      ? themes.map(([name, count], i) => {
          const w = Math.round((count / peak) * 100);
          const col = THEME_COLORS[i % THEME_COLORS.length];
          return `
            <div class="topic-row">
              <div class="topic-lbl">
                <span>${escapeHtml(name)}</span>
                <span class="meta">${count} team${count > 1 ? 's' : ''}</span>
              </div>
              <div class="topic-bar">
                <i data-w="${w}%" style="background:${col};width:0"></i>
              </div>
            </div>`;
        }).join('')
      : '<div class="ana-empty">No data yet.</div>';
  }

  // ---- 3. Top Colleges ----
  const byCollege = {};
  teams.forEach(t => {
    const c = (t.college_name || 'Unknown').trim();
    byCollege[c] = (byCollege[c] || 0) + 1;
  });
  const colleges = Object.entries(byCollege)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const collegeEl = document.getElementById('collegeChart');
  if (collegeEl){
    const peak = Math.max(1, ...colleges.map(c => c[1]));
    collegeEl.innerHTML = colleges.length
      ? colleges.map(([name, count]) => {
          const w = Math.round((count / peak) * 100);
          return `
            <div class="topic-row">
              <div class="topic-lbl">
                <span>${escapeHtml(name.slice(0, 30))}</span>
                <span class="meta">${count} team${count > 1 ? 's' : ''}</span>
              </div>
              <div class="topic-bar">
                <i data-w="${w}%" style="background:linear-gradient(90deg,var(--violet),var(--cyan));width:0"></i>
              </div>
            </div>`;
        }).join('')
      : '<div class="ana-empty">No data yet.</div>';
  }

  // ---- 4. Daily Registrations (Last 7 Days) ----
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--){
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push({
      date: d,
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      count: 0
    });
  }
  teams.forEach(t => {
    const created = new Date(t.created_at);
    created.setHours(0, 0, 0, 0);
    const day = days.find(d => d.date.getTime() === created.getTime());
    if (day) day.count++;
  });

  const dailyEl = document.getElementById('dailyChart');
  if (dailyEl){
    const peak = Math.max(1, ...days.map(d => d.count));
    dailyEl.innerHTML = days.map(d => {
      const h = Math.round((d.count / peak) * 100);
      const col = d.count > 0 ? 'linear-gradient(180deg,#7c5cff,#22d3ee)' : 'rgba(255,255,255,.06)';
      return `
        <div class="hist-col">
          <div class="bar" data-h="${h}%" style="background:${col};height:0">
            <span>${d.count}</span>
          </div>
          <div class="lbl">${d.label}</div>
        </div>`;
    }).join('');
  }

  // Animate bars
  requestAnimationFrame(() => {
    document.querySelectorAll('#statusChart .status-bar i').forEach(el => {
      el.style.width = el.dataset.w;
    });
    document.querySelectorAll('#themeChart .topic-bar i, #collegeChart .topic-bar i').forEach(el => {
      el.style.width = el.dataset.w;
    });
    document.querySelectorAll('#dailyChart .bar').forEach(el => {
      el.style.height = el.dataset.h;
    });
  });
}

async function loadAdminTeams(){
  if (!teamTbody) return;
  teamTbody.innerHTML = `<tr><td colspan="7" class="admin-empty">Loading teams…</td></tr>`;
  try {
    const { data, error } = await supabase
      .from('team_registrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    adminAllTeams = data || [];
    adminTeamSelection.clear();
    adminTeamPage = 1;
    renderTeamStats(adminAllTeams);
    renderAdminTeams();
    renderTeamAnalytics(adminAllTeams);
  } catch (e){
    console.error('Team load error:', e);
    teamTbody.innerHTML = `<tr><td colspan="7" class="admin-empty">Failed to load: ${escapeHtml(e.message)}</td></tr>`;
  }
}

async function updateTeamStatus(id, status){
  const row = adminAllTeams.find(r => r.id === id);
  if (!row) return;
  try {
    const { error } = await supabase
      .from('team_registrations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    row.status = status;
    renderTeamStats(adminAllTeams);
    renderAdminTeams();
    showToast(`Team ${status === 'approved' ? '✅ approved' : '❌ rejected'}`,
              status === 'approved' ? 'success' : 'warn',
              status === 'approved' ? '✅' : '❌');

    fetch('/api/notify-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration: row, status })
    }).catch(() => {});
  } catch (e){
    console.error('Status update error:', e);
    showToast('Failed: ' + e.message, 'warn', '⚠️');
  }
}

async function bulkUpdateTeamStatus(ids, status){
  if (!ids.length) return;
  if (!confirm(`${status === 'approved' ? 'Approve' : 'Reject'} ${ids.length} team(s)?`)) return;
  try {
    const { error } = await supabase
      .from('team_registrations')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids);
    if (error) throw error;
    ids.forEach(id => {
      const r = adminAllTeams.find(x => x.id === id);
      if (r) r.status = status;
    });
    adminTeamSelection.clear();
    renderTeamStats(adminAllTeams);
    renderAdminTeams();
    showToast(`${ids.length} team(s) ${status === 'approved' ? '✅ approved' : '❌ rejected'}`,
              status === 'approved' ? 'success' : 'warn', status === 'approved' ? '✅' : '❌');
  } catch (e){
    console.error('Bulk update error:', e);
    showToast('Bulk update failed: ' + e.message, 'warn', '⚠️');
  }
}

function exportTeamsCSV(rows){
  if (!rows.length){ showToast('Nothing to export', 'warn', '⚠️'); return; }
  const head = ['team_name','spoc_name','spoc_email','spoc_mobile','college_name','college_city','theme','category','problem_statement','team_size','status','created_at'];
  const csv = [head.join(',')].concat(rows.map(r => head.map(k => {
    const v = r[k] == null ? '' : String(r[k]);
    return '"' + v.replace(/"/g,'""').replace(/\n/g,' ') + '"';
  }).join(','))).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'team-registrations-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  showToast(`Exported ${rows.length} teams`, 'success', '⬇');
}
function openTeamDetails(r){
  const modal = document.getElementById('myRegModal');
  if (!modal) return;
  document.getElementById('myRegTitle').textContent = r.team_name || 'Team';
  document.getElementById('myRegSub').textContent = `${r.college_name || ''} · ${r.spoc_email || r.email}`;
  const members = Array.isArray(r.members) ? r.members : [];
  document.getElementById('myRegBody').innerHTML = `
    <div class="myreg-hero">
      <div>
        <h3>${escapeHtml(r.team_name || '')}</h3>
        <div class="team-sub">${escapeHtml(r.college_name || '')}</div>
      </div>
      <div class="myreg-status ${r.status || 'submitted'}">${r.status || 'submitted'}</div>
    </div>
    <div class="myreg-grid">
      <div class="myreg-box">
        <h4>🎯 Team & Theme</h4>
        <div class="row"><span class="lbl">Theme</span><span class="val">${escapeHtml(r.theme||'—')}</span></div>
        <div class="row"><span class="lbl">Category</span><span class="val">${escapeHtml(r.category||'—')}</span></div>
        <div class="row"><span class="lbl">Problem</span><span class="val" style="font-size:12px">${escapeHtml((r.problem_statement||'—').slice(0,60))}</span></div>
      </div>
      <div class="myreg-box">
        <h4>🏫 SPOC</h4>
        <div class="row"><span class="lbl">Name</span><span class="val">${escapeHtml(r.spoc_name||'—')}</span></div>
        <div class="row"><span class="lbl">Email</span><span class="val" style="font-size:12px">${escapeHtml(r.spoc_email||'—')}</span></div>
        <div class="row"><span class="lbl">Mobile</span><span class="val">${escapeHtml(r.spoc_mobile||'—')}</span></div>
      </div>
    </div>
    <div class="myreg-box">
      <h4>💡 Idea Summary</h4>
      <p style="font-size:13.5px;line-height:1.7;margin:0">${escapeHtml(r.idea_summary||'—')}</p>
    </div>
    <div class="myreg-box" style="margin-top:16px">
      <h4>👥 Members (${members.length})</h4>
      ${members.length ? members.map((m,i)=>`<div class="myreg-member"><div class="num">${i+1}</div><div class="nm">${escapeHtml(m.name||'—')}</div>${m.role?`<div class="rl">${escapeHtml(m.role)}</div>`:''}</div>`).join('') : '<div style="color:var(--muted);font-size:13px">No members</div>'}
    </div>`;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* --- Team Registrations: Event bindings --- */
const teamSortBy = document.getElementById('teamSortBy');
const teamExportCSV = document.getElementById('teamExportCSV');
const teamSelectAll = document.getElementById('teamSelectAll');
const teamBulkBar = document.getElementById('teamBulkBar');
const teamBulkClear = document.getElementById('teamBulkClear');
const teamBulkApprove = document.getElementById('teamBulkApprove');
const teamBulkReject = document.getElementById('teamBulkReject');
const teamBulkExport = document.getElementById('teamBulkExport');

if (teamSortBy) teamSortBy.addEventListener('change', () => { adminTeamPage = 1; renderAdminTeams(); });
if (teamExportCSV) teamExportCSV.addEventListener('click', () => exportTeamsCSV(applyTeamFilters(adminAllTeams)));

if (teamTbody){
  teamTbody.addEventListener('change', (e) => {
    const cb = e.target.closest('.team-check');
    if (!cb) return;
    if (cb.checked) adminTeamSelection.add(cb.dataset.id);
    else adminTeamSelection.delete(cb.dataset.id);
    updateTeamBulkBar();
  });

  teamTbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('.team-actions button');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'approve') await updateTeamStatus(id, 'approved');
    else if (act === 'reject') await updateTeamStatus(id, 'rejected');
    else if (act === 'view'){
      const r = adminAllTeams.find(x => x.id === id);
      if (r) openTeamDetails(r);
    }
  });
}

if (teamSelectAll){
  teamSelectAll.addEventListener('change', () => {
    const visible = teamTbody.querySelectorAll('.team-check');
    visible.forEach(c => {
      if (teamSelectAll.checked){ c.checked = true; adminTeamSelection.add(c.dataset.id); }
      else { c.checked = false; adminTeamSelection.delete(c.dataset.id); }
    });
    updateTeamBulkBar();
  });
}

if (teamBulkClear) teamBulkClear.addEventListener('click', () => {
  adminTeamSelection.clear();
  if (teamSelectAll) teamSelectAll.checked = false;
  renderAdminTeams();
});
if (teamBulkApprove) teamBulkApprove.addEventListener('click', () => bulkUpdateTeamStatus([...adminTeamSelection], 'approved'));
if (teamBulkReject) teamBulkReject.addEventListener('click', () => bulkUpdateTeamStatus([...adminTeamSelection], 'rejected'));
if (teamBulkExport) teamBulkExport.addEventListener('click', () => {
  const rows = adminAllTeams.filter(r => adminTeamSelection.has(r.id));
  exportTeamsCSV(rows);
});

if (teamSearch) teamSearch.addEventListener('input', () => { adminTeamPage = 1; renderAdminTeams(); });
if (teamFilterStatus) teamFilterStatus.addEventListener('change', () => { adminTeamPage = 1; renderAdminTeams(); });
if (teamRefresh) teamRefresh.addEventListener('click', () => { adminTeamSelection.clear(); loadAdminTeams(); });

// Admin tab switching (Arena / Team Registrations)
document.querySelectorAll('[data-admin-tab]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-admin-tab]').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const which = tab.dataset.adminTab;
    const arena = document.getElementById('adminArenaSection');
    const teams = document.getElementById('adminTeamsSection');
    const testi = document.getElementById('adminTestimonialsSection');
    const msgs = document.getElementById('adminMessagesSection');
    if (msgs) msgs.style.display = which === 'messages' ? 'block' : 'none';
    if (arena) arena.style.display = which === 'arena' ? 'block' : 'none';
    if (teams) teams.style.display = which === 'teams' ? 'block' : 'none';
    if (testi) testi.style.display = which === 'testimonials' ? 'block' : 'none';
    if (which === 'teams') loadAdminTeams();
    if (which === 'testimonials') loadAdminTestimonials();
    if (which === 'messages') loadAdminMessages();
  });
});

  /* ============================================================
     CSV IMPORT
     ============================================================ */
  const importModal = document.getElementById('importModal');
  const imDrop      = document.getElementById('imDrop');
  const imFile      = document.getElementById('imFile');
  const imPreview   = document.getElementById('imPreview');
  const imThead     = document.getElementById('imThead');
  const imTbody     = document.getElementById('imTbody');
  const imCount     = document.getElementById('imCount');
  const imErr       = document.getElementById('imErr');
  const imErrText   = document.getElementById('imErrText');
  const imNote      = document.getElementById('imNote');
  const imImport    = document.getElementById('imImport');
  const imClear     = document.getElementById('imClear');
  const imTemplate  = document.getElementById('imTemplate');
  const imSample    = document.getElementById('imSample');
  const imClose     = document.getElementById('imClose');

  const IM_COLUMNS = ['email','full_name','role','title','question','code','lang','score','hint_count','topic','tag','created_at'];
  const IM_REQUIRED = ['email','title'];
  let imParsedRows = [];

  function parseCSV(text){
    const rows = [];
    let cur = [], field = '', inQuote = false;
    for (let i = 0; i < text.length; i++){
      const c = text[i];
      if (inQuote){
        if (c === '"'){
          if (text[i+1] === '"'){ field += '"'; i++; }
          else inQuote = false;
        } else field += c;
      } else {
        if (c === '"') inQuote = true;
        else if (c === ','){ cur.push(field); field = ''; }
        else if (c === '\n'){ cur.push(field); rows.push(cur); cur = []; field = ''; }
        else if (c === '\r'){ /* skip */ }
        else field += c;
      }
    }
    if (field || cur.length){ cur.push(field); rows.push(cur); }
    return rows.filter(r => r.some(c => c.trim()));
  }
  function csvToObjects(text){
    const matrix = parseCSV(text);
    if (matrix.length < 2) return { rows: [], error: 'CSV has no data rows' };
    const header = matrix[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const missing = IM_REQUIRED.filter(k => !header.includes(k));
    if (missing.length) return { rows: [], error: `Missing required column(s): ${missing.join(', ')}` };
    const rows = matrix.slice(1).map(cells => {
      const obj = {};
      header.forEach((h, i) => {
        if (IM_COLUMNS.includes(h)) obj[h] = (cells[i] || '').trim();
      });
      obj.role = ['Student','SPOC','Judge','Admin'].includes(obj.role) ? obj.role : 'Student';
      obj.lang = (obj.lang || 'python').toLowerCase();
      obj.score = obj.score ? parseInt(obj.score, 10) : 0;
      obj.hint_count = obj.hint_count ? parseInt(obj.hint_count, 10) : 0;
      obj.created_at = obj.created_at || new Date().toISOString();
      if (isNaN(obj.score)) obj.score = 0;
      if (isNaN(obj.hint_count)) obj.hint_count = 0;
      return obj;
    });
    return { rows, error: null };
  }
  function renderImportPreview(rows){
    if (!rows.length){
      imPreview.style.display = 'none';
      imNote.textContent = 'Nothing loaded yet.';
      imImport.disabled = true;
      imImport.textContent = 'Import 0 rows →';
      return;
    }
    imPreview.style.display = '';
    imCount.textContent = `${rows.length} row${rows.length > 1 ? 's' : ''}`;
    imThead.innerHTML = '<tr>' + IM_COLUMNS.map(c => `<th>${esc(c)}</th>`).join('') + '</tr>';
    imTbody.innerHTML = rows.slice(0, 30).map(r =>
      '<tr>' + IM_COLUMNS.map(c => {
        const v = r[c] == null ? '' : String(r[c]);
        return `<td title="${escapeHtml(v)}">${escapeHtml(v.slice(0, 40))}</td>`;
      }).join('') + '</tr>'
    ).join('') + (rows.length > 30 ? `<tr><td colspan="${IM_COLUMNS.length}" style="text-align:center;color:var(--muted)">… and ${rows.length - 30} more</td></tr>` : '');

    const bad = rows.filter(r => !r.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
    if (bad.length){
      imErr.classList.add('show');
      imErrText.textContent = `${bad.length} row(s) have invalid email. Fix before importing.`;
      imImport.disabled = true;
      imImport.textContent = 'Fix errors first';
      imNote.textContent = `${rows.length - bad.length} valid rows`;
    } else {
      imErr.classList.remove('show');
      imImport.disabled = false;
      imImport.textContent = `Import ${rows.length} rows →`;
      imNote.textContent = `${rows.length} rows ready`;
    }
  }
  function loadCSVFile(file){
    if (!file) return;
    if (file.size > 5 * 1024 * 1024){ showToast('CSV too large (max 5 MB)', 'warn', '⚠️'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const { rows, error } = csvToObjects(reader.result);
      if (error){
        imErr.classList.add('show');
        imErrText.textContent = error;
        imParsedRows = [];
        renderImportPreview([]);
        return;
      }
      imParsedRows = rows;
      renderImportPreview(rows);
    };
    reader.readAsText(file, 'utf-8');
  }
  if (adminImport) adminImport.addEventListener('click', () => importModal.classList.add('open'));
  if (imClose) imClose.addEventListener('click', () => importModal.classList.remove('open'));
  if (importModal) importModal.addEventListener('click', e => {
    if (e.target === importModal) importModal.classList.remove('open');
  });
  if (imDrop){
    imDrop.addEventListener('click', () => imFile.click());
    imDrop.addEventListener('dragover', e => { e.preventDefault(); imDrop.classList.add('drag'); });
    imDrop.addEventListener('dragleave', () => imDrop.classList.remove('drag'));
    imDrop.addEventListener('drop', e => {
      e.preventDefault(); imDrop.classList.remove('drag');
      const f = e.dataTransfer.files[0]; if (f) loadCSVFile(f);
    });
    imFile.addEventListener('change', e => { const f = e.target.files[0]; if (f) loadCSVFile(f); });
  }
  if (imClear) imClear.addEventListener('click', () => {
    imParsedRows = []; imErr.classList.remove('show');
    renderImportPreview([]); imFile.value = '';
  });
  if (imTemplate) imTemplate.addEventListener('click', () => {
    const head = IM_COLUMNS.join(',');
    const sample = ['student@college.edu.in,Aarav Mehta,Student,Two Sum,Given an array find two numbers...,,python,0,0,Arrays,priority,' + new Date().toISOString()].join('\n');
    const blob = new Blob(['\uFEFF' + head + '\n' + sample + '\n'], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'arena-import-template.csv';
    a.click();
    showToast('Template downloaded', 'success', '⬇');
  });
  if (imSample) imSample.addEventListener('click', () => {
    const sample = `email,full_name,role,title,question,code,lang,score,hint_count,topic,tag,created_at
priya@nit.edu,Priya Sharma,Student,Palindrome Check,Given a string check if palindrome,,python,72,1,Strings,priority,2026-04-10T10:00:00Z
kabir@iitb.ac.in,Kabir Joshi,Student,Binary Search,Implement binary search,def bs(a,x):\\n  lo,hi=0,len(a)-1\\n  while lo<=hi:\\n    m=(lo+hi)//2\\n    if a[m]==x: return m\\n    if a[m]<x: lo=m+1\\n    else: hi=m-1\\n  return -1\\n,python,85,0,Arrays,,2026-04-11T14:30:00Z`;
    const { rows, error } = csvToObjects(sample);
    if (error){ showToast(error, 'warn', '⚠️'); return; }
    imParsedRows = rows;
    renderImportPreview(rows);
  });
  if (imImport) imImport.addEventListener('click', async () => {
    if (!imParsedRows.length) return;
    const user = await getCurrentUser();
    if (!user){ showToast('Login required', 'warn', '🔒'); return; }

    imImport.disabled = true;
    imImport.textContent = 'Importing…';

    const payload = imParsedRows.map(r => ({
      user_id: user.id, email: r.email,
      full_name: r.full_name || null, role: r.role || 'Student',
      title: r.title, question: r.question || null, code: r.code || null,
      lang: r.lang || 'python', score: r.score || 0, hint_count: r.hint_count || 0,
      topic: r.topic || deriveArenaTopic(r.question), tag: r.tag || null,
      breakdown: null, test_cases: [],
      imported_by: user.id, source: 'import',
      created_at: r.created_at || new Date().toISOString()
    }));

    let inserted = 0, failed = 0;
    const BATCH = 100;
    for (let i = 0; i < payload.length; i += BATCH){
      const chunk = payload.slice(i, i + BATCH);
      const { error } = await supabase.from('arena_submissions').insert(chunk);
      if (error){ failed += chunk.length; console.warn('Import batch error:', error); }
      else { inserted += chunk.length; }
    }

    await supabase.from('arena_import_log').insert([{
      admin_id: user.id, admin_email: user.email,
      row_count: inserted, failed_count: failed,
      file_name: imFile.value ? imFile.value.split('\\').pop() : 'pasted'
    }]);

    imImport.disabled = false;
    imImport.textContent = 'Import ' + imParsedRows.length + ' rows →';

    if (failed){
      showToast(`Imported ${inserted} · failed ${failed}`, 'warn', '⚠️');
    } else {
      showToast(`Imported ${inserted} rows successfully`, 'success', '📥');
      importModal.classList.remove('open');
      imParsedRows = []; renderImportPreview([]);
      await fetchAdminPage(true);
      renderImportLog();
    }
  });

  /* ============ WRAP UP ============ */
  console.log('%c🚀 Hackathon Rivals','font-size:20px;font-weight:bold;background:linear-gradient(90deg,#7c5cff,#22d3ee);-webkit-background-clip:text;color:transparent');
  console.log('%cIndia\'s national hackathon arena — built for builders.','color:#8b90a4');
  console.log('%cAll modules loaded: auth · playground · arena · hints · admin · realtime · edge · import','color:#3ddc84');
/* ============ CUSTOM SELECT DROPDOWNS ============ */
function initCustomSelects(){
  document.querySelectorAll('select').forEach(select => {
    if (select.dataset.csReady) return;
    select.dataset.csReady = 'true';

    const isInline = !!select.closest('.arena-toolbar');

    const wrapper = document.createElement('div');
    wrapper.className = 'cs-wrapper' + (isInline ? ' cs-inline' : '');
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cs-btn';
    btn.textContent = select.options[select.selectedIndex]?.text || '';
    wrapper.appendChild(btn);

    const menu = document.createElement('div');
    menu.className = 'cs-menu';
    Array.from(select.options).forEach(opt => {
      const item = document.createElement('div');
      item.className = 'cs-item';
      item.dataset.value = opt.value;
      item.textContent = opt.text;
      if (opt.selected) item.classList.add('active');
      menu.appendChild(item);
    });
    wrapper.appendChild(menu);

    btn.addEventListener('click', e => {
      e.stopPropagation();
      const wasOpen = wrapper.classList.contains('open');
      document.querySelectorAll('.cs-wrapper.open').forEach(w => w.classList.remove('open'));
      if (!wasOpen) wrapper.classList.add('open');
    });

    menu.addEventListener('click', e => {
      const item = e.target.closest('.cs-item');
      if (!item) return;
      select.value = item.dataset.value;
      menu.querySelectorAll('.cs-item').forEach(i => i.classList.toggle('active', i === item));
      btn.textContent = item.textContent;
      wrapper.classList.remove('open');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const syncDisabled = () => {
      wrapper.classList.toggle('disabled', select.disabled);
      btn.disabled = select.disabled;
    };
    syncDisabled();
    new MutationObserver(syncDisabled).observe(select, { attributes: true, attributeFilter: ['disabled'] });
  });

  setInterval(() => {
    if (document.hidden) return;
    document.querySelectorAll('.cs-wrapper').forEach(w => {
      const select = w.querySelector('select');
      const btn = w.querySelector('.cs-btn');
      const menu = w.querySelector('.cs-menu');
      if (!select || !btn) return;
      const opt = select.options[select.selectedIndex];
      const txt = opt?.text || '';
      if (btn.textContent !== txt) btn.textContent = txt;
      menu.querySelectorAll('.cs-item').forEach(item => {
        item.classList.toggle('active', item.dataset.value === select.value);
      });
    });
  }, 1500);
}

document.addEventListener('click', e => {
  if (!e.target.closest('.cs-wrapper')) {
    document.querySelectorAll('.cs-wrapper.open').forEach(w => w.classList.remove('open'));
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCustomSelects);
} else {
  setTimeout(initCustomSelects, 100);
}
})();
