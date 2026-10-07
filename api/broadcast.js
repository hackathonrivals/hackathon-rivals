// api/broadcast.js — announcement e-mails to ALL signed-up users (new quiz / hackathon)
// Env vars (same as before): RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Called every minute by Supabase pg_cron (?key=<secret from hr_cron_secret>) and by the admin page (POST {action}).
import crypto from 'node:crypto';

const SITE = 'https://hackathonrivals.in';
const FROM = 'Hackathon Rivals <noreply@hackathonrivals.in>';
const enc = encodeURIComponent;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = s => String(s || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 140);
const goodMail = e => { const s = String(e || '').trim(), a = s.indexOf('@'); return a > 0 && s.indexOf('.', a) > a + 1 && s.indexOf(' ') < 0 && s.length > 5 && s.length <= 120; };
const fmt = ms => new Date(ms).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) + ' IST';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const BATCH = 100;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const API_KEY = process.env.RESEND_API_KEY, SB_URL = process.env.SUPABASE_URL, SRV = process.env.SUPABASE_SERVICE_ROLE_KEY, SECRET = process.env.CRON_SECRET || '';
    if (!API_KEY || !SB_URL || !SRV) return res.status(500).json({ ok: false, error: 'RESEND_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set' });
    const sbH = { apikey: SRV, 'Content-Type': 'application/json' };
    if (SRV.startsWith('eyJ')) sbH.Authorization = 'Bearer ' + SRV;
    const sb = (path, opt) => fetch(SB_URL + '/rest/v1/' + path, Object.assign({}, opt, { headers: Object.assign({}, sbH, (opt && opt.headers) || {}) }));

    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const bearer = String(req.headers.authorization || '').replace('Bearer ', '');
    const isAdminCall = req.method === 'POST' && !!body.action;
    if (isAdminCall) {
      const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_6GqdbyBWEX7cIkTzcp9yvw_WYNp5GJh';
      const ar = bearer ? await fetch(SB_URL + '/rest/v1/rpc/hr_is_admin', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + bearer, 'Content-Type': 'application/json' }, body: '{}' }) : null;
      if (!ar || !ar.ok || (await ar.json()) !== true) return res.status(403).json({ ok: false, error: 'Admins only' });
    } else {
      const given = bearer || String((req.query && req.query.key) || '');
      let ok = !!given && !!SECRET && safeEq(given, SECRET);
      if (!ok && given) {
        const dr = await (await sb('hr_cron_secret?id=eq.1&select=secret')).json().catch(() => null);
        const dbs = Array.isArray(dr) && dr[0] ? String(dr[0].secret || '') : '';
        ok = !!dbs && safeEq(given, dbs);
      }
      if (!ok) return res.status(401).json({ error: 'Unauthorized' });
    }

    // ---------- helpers that need the database ----------
    const listUsers = async () => {
      const out = [];
      try {
        for (let page = 1; page <= 50; page++) {
          const r = await fetch(SB_URL + '/auth/v1/admin/users?page=' + page + '&per_page=1000', { headers: sbH });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const j = await r.json(); const us = Array.isArray(j) ? j : (j.users || []);
          out.push(...us); if (us.length < 1000) break;
        }
        return out;
      } catch (e) {
        const p = await (await sb('profiles?select=email&limit=1000')).json().catch(() => null);   // fallback if the auth list is not allowed
        if (Array.isArray(p) && p.length) return p;
        throw new Error('Cannot list signed-up users (' + (e.message || e) + ')');
      }
    };
    const optouts = async () => {
      const set = new Set();
      for (let i = 0; i < 30; i++) {
        const r = await (await sb('hr_mail_optout?select=email&order=email&limit=1000&offset=' + i * 1000)).json().catch(() => null);
        if (!Array.isArray(r)) break; r.forEach(x => set.add(String(x.email).toLowerCase())); if (r.length < 1000) break;
      }
      return set;
    };
    const recipients = async () => {
      const users = await listUsers(), out = await optouts();
      let ems = users.filter(u => u.email).map(u => ({ e: String(u.email).trim().toLowerCase(), ok: !!(u.email_confirmed_at || u.confirmed_at) }));
      const confirmed = ems.filter(x => x.ok); if (confirmed.length) ems = confirmed;      // skip never-confirmed addresses when we can tell
      const seen = new Set(), list = [];
      ems.forEach(x => { if (goodMail(x.e) && !out.has(x.e) && !seen.has(x.e)) { seen.add(x.e); list.push(x.e); } });
      return { list, optedOut: out.size };
    };
    const upd = (id, patch) => sb('hr_broadcasts?id=eq.' + id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(patch) });

    // ---------- what the e-mail says (read live, so it is always current) ----------
    const content = async b => {
      if (b.kind === 'quiz') {
        const id = String(b.ref).split('#')[0];
        const q = (await (await sb('hr_quizzes?id=eq.' + enc(id) + '&select=*')).json())[0];
        if (!q || !q.published) return null;
        const lines = [];
        if (q.opens_at) lines.push('<b>Starts:</b> ' + esc(fmt(Date.parse(q.opens_at))));
        if (q.closes_at) lines.push('<b>Window closes:</b> ' + esc(fmt(Date.parse(q.closes_at))));
        lines.push('<b>Duration:</b> ' + esc(q.duration_min) + ' minutes');
        if (q.reg_closes_at) lines.push('<b>Register before:</b> ' + esc(fmt(Date.parse(q.reg_closes_at))));
        return { subject: '📝 New quiz: ' + clean(q.title), head: 'A new quiz is open 📝', intro: '<b style="color:#22d3ee">' + esc(clean(q.title)) + '</b>' + (q.description ? '<br><span style="color:#9aa0b4">' + esc(String(q.description).slice(0, 300)) + '</span>' : ''), lines, cta: 'Open the quiz' };
      }
      const e = (await (await sb('hr_events?id=eq.main&select=*')).json())[0];
      if (!e) return null;
      const lines = [];
      if (e.starts_at) lines.push('<b>Starts:</b> ' + esc(fmt(Date.parse(e.starts_at))));
      if (e.reg_closes_at) lines.push('<b>Registration closes:</b> ' + esc(fmt(Date.parse(e.reg_closes_at))));
      if (e.ends_at) lines.push('<b>Ends:</b> ' + esc(fmt(Date.parse(e.ends_at))));
      return { subject: '🚀 ' + clean(e.name), head: 'Hackathon update 🚀', intro: '<b style="color:#22d3ee">' + esc(clean(e.name)) + '</b>' + (e.message ? '<br><span style="color:#9aa0b4">' + esc(String(e.message).slice(0, 300)) + '</span>' : ''), lines, cta: 'Register your team' };
    };
    const unsub = email => SITE + '/api/unsubscribe?e=' + enc(email) + '&t=' + sha(email + ':' + SRV).slice(0, 32);
    const mail = (c, email) => ({
      from: FROM, to: [email], subject: c.subject, headers: { 'List-Unsubscribe': '<' + unsub(email) + '>' },
      html: '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f1119;color:#e9ebf2;border-radius:12px">'
        + '<h1 style="color:#7c5cff;font-size:22px">' + c.head + '</h1><p>' + c.intro + '</p><p>' + c.lines.join('<br>') + '</p>'
        + '<p><a href="' + SITE + '" style="display:inline-block;background:#7c5cff;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">' + esc(c.cta) + '</a></p>'
        + '<p style="color:#9aa0b4;font-size:12px">You are receiving this because you signed up at hackathonrivals.in. <a href="' + unsub(email) + '" style="color:#9aa0b4">Unsubscribe</a></p>'
        + '<p><b>— Team Hackathon Rivals</b></p></div>'
    });

    // ---------- admin page ----------
    if (isAdminCall) {
      if (body.action === 'count') { const r = await recipients(); return res.status(200).json({ ok: true, users: r.list.length, optedOut: r.optedOut }); }
      if (body.action === 'status') {
        const rows = await (await sb('hr_broadcasts?select=id,kind,ref,status,total,sent,last_error,created_at&order=created_at.desc&limit=8')).json();
        if (!Array.isArray(rows)) return res.status(500).json({ ok: false, error: 'Run announcements.sql first' });
        const ids = [...new Set(rows.filter(r => r.kind === 'quiz').map(r => String(r.ref).split('#')[0]))];
        const qs = ids.length ? await (await sb('hr_quizzes?id=in.(' + ids.map(enc).join(',') + ')&select=id,title')).json().catch(() => []) : [];
        const tt = {}; (Array.isArray(qs) ? qs : []).forEach(q => { tt[q.id] = q.title; });
        return res.status(200).json({ ok: true, rows: rows.map(r => ({ label: r.kind === 'quiz' ? 'Quiz: ' + (tt[String(r.ref).split('#')[0]] || '?') : 'Hackathon', status: r.status, sent: r.sent, total: r.total, last_error: r.last_error })) });
      }
      return res.status(400).json({ ok: false, error: 'Unknown action' });
    }

    // ---------- scheduler: send the next batch ----------
    const now = Date.now();
    const due = await (await sb('hr_broadcasts?status=in.(queued,sending)&send_after=lte.' + enc(new Date(now).toISOString()) + '&order=created_at&limit=5&select=*')).json();
    if (!Array.isArray(due)) return res.status(500).json({ ok: false, error: 'Run announcements.sql first (' + (due && due.message || 'unknown') + ')' });
    const b = due.find(x => !x.next_try_at || Date.parse(x.next_try_at) <= now);
    if (!b) return res.status(200).json({ ok: true, idle: true });

    const c = await content(b);
    if (!c) { await upd(b.id, { status: 'cancelled', last_error: 'quiz is not published any more', finished_at: new Date().toISOString() }); return res.status(200).json({ ok: true, cancelled: b.id }); }

    if (b.status === 'queued') {                       // first run: take the list of recipients
      const r = await recipients();
      for (let i = 0; i < r.list.length; i += 500) {
        const rr = await sb('hr_broadcast_rcpt?on_conflict=broadcast_id,email', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: JSON.stringify(r.list.slice(i, i + 500).map(e => ({ broadcast_id: b.id, email: e }))) });
        if (!rr.ok) throw new Error('Cannot store recipients: ' + (await rr.text()).slice(0, 120));
      }
      await upd(b.id, { status: 'sending', total: r.list.length, started_at: new Date().toISOString() });
      b.total = r.list.length;
    }

    const next = await (await sb('hr_broadcast_rcpt?broadcast_id=eq.' + b.id + '&sent_at=is.null&order=email&limit=' + BATCH + '&select=email')).json();
    if (!Array.isArray(next) || !next.length) { await upd(b.id, { status: 'done', sent: b.total, finished_at: new Date().toISOString(), last_error: null }); return res.status(200).json({ ok: true, done: b.id }); }
    // claim first, so two overlapping runs can never send the same address twice
    const list = next.map(x => x.email);
    const cl = await sb('hr_broadcast_rcpt?broadcast_id=eq.' + b.id + '&sent_at=is.null&email=in.' + enc('(' + list.map(e => '"' + e + '"').join(',') + ')'),
      { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ sent_at: new Date().toISOString() }) });
    const claimed = (cl.ok ? await cl.json() : []).map(x => x.email);
    if (!claimed.length) return res.status(200).json({ ok: true, skipped: 'another run is sending' });

    const rr = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY }, body: JSON.stringify(claimed.map(e => mail(c, e))) });
    if (!rr.ok) {
      let m = ''; try { m = (await rr.json()).message; } catch (e) {}
      await sb('hr_broadcast_rcpt?broadcast_id=eq.' + b.id + '&email=in.' + enc('(' + claimed.map(e => '"' + e + '"').join(',') + ')'), { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ sent_at: null }) });
      await upd(b.id, { last_error: ('Resend: ' + (m || 'HTTP ' + rr.status)).slice(0, 200), next_try_at: new Date(Date.now() + 30 * 60000).toISOString() });
      return res.status(200).json({ ok: false, error: m || 'HTTP ' + rr.status, retryInMin: 30 });
    }
    await upd(b.id, { sent: (b.sent || 0) + claimed.length, last_error: null, next_try_at: null });
    return res.status(200).json({ ok: true, broadcast: b.id, sent: claimed.length });
  } catch (e) {
    console.error('broadcast error:', e);
    return res.status(500).json({ ok: false, error: String(e && e.message || 'Server error').slice(0, 200) });
  }
}
