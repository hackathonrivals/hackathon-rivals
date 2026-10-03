// api/quiz-reminders.js — emails registered students: 5 min before start, at start, and when the schedule changes.
// Vercel env vars: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET (any long random text)
// A scheduler must call this URL every minute with header  Authorization: Bearer <CRON_SECRET>
// You can also open  /api/quiz-reminders?key=<CRON_SECRET>  in a browser to run it once and see what it found.
// Admins can also trigger one quiz by hand: POST { quiz_id, kind: 'start'|'remind'|'changed' } with their login token.
// (Supabase pg_cron setup is in quiz-reminders.sql; Vercel Cron also works on a paid plan).
import crypto from 'node:crypto';

const FROM = 'Hackathon Rivals <noreply@hackathonrivals.in>';
const SITE = 'https://hackathonrivals.in';
const enc = encodeURIComponent;
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = s => String(s || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 120);
const goodMail = e => { const s = String(e || '').trim(), a = s.indexOf('@'); return a > 0 && s.indexOf('.', a) > a + 1 && s.indexOf(' ') < 0 && s.length > 5; };
const fmt = ms => new Date(ms).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) + ' IST';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const same = (a, b) => !!a && !!b && Date.parse(a) === Date.parse(b);
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const API_KEY = process.env.RESEND_API_KEY, SB_URL = process.env.SUPABASE_URL, SRV = process.env.SUPABASE_SERVICE_ROLE_KEY, SECRET = process.env.CRON_SECRET || '';
    if (!API_KEY || !SB_URL || !SRV) return res.status(500).json({ error: 'RESEND_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set' });
    const sbH = { apikey: SRV, 'Content-Type': 'application/json' };
    if (SRV.startsWith('eyJ')) sbH.Authorization = 'Bearer ' + SRV;
    const sb = (path, opt) => fetch(SB_URL + '/rest/v1/' + path, Object.assign({}, opt, { headers: Object.assign({}, sbH, (opt && opt.headers) || {}) }));
    const bearer = String(req.headers.authorization || '').replace('Bearer ', '');
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const manual = req.method === 'POST' && !!body.quiz_id;
    if (manual) {
      const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_6GqdbyBWEX7cIkTzcp9yvw_WYNp5GJh';
      const ar = bearer ? await fetch(SB_URL + '/rest/v1/rpc/hr_is_admin', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + bearer, 'Content-Type': 'application/json' }, body: '{}' }) : null;
      if (!ar || !ar.ok || (await ar.json()) !== true) return res.status(403).json({ ok: false, error: 'Admins only' });
    } else {
      // scheduler: accepts the secret stored in the database table hr_cron_secret (no copy-paste needed),
      // or the CRON_SECRET env var if you set one
      const given = bearer || String((req.query && req.query.key) || '');
      let ok = !!given && !!SECRET && safeEq(given, SECRET);
      let dbSecret = '', dbErr = '';
      if (!ok && given) {
        const dr = await (await sb('hr_cron_secret?id=eq.1&select=secret')).json().catch(() => null);
        dbSecret = Array.isArray(dr) && dr[0] ? String(dr[0].secret || '') : '';
        if (!dbSecret) dbErr = Array.isArray(dr) ? 'table is empty' : String((dr && dr.message) || 'cannot read table').slice(0, 80);
        ok = !!dbSecret && safeEq(given, dbSecret);
      }
      if (!ok) return res.status(401).json({ error: 'Unauthorized', v: 3, env: !!SECRET, db: !!dbSecret, dbErr, given: given.length, dbLen: dbSecret.length });
    }

    if (manual) {
      const kind = ['start', 'remind', 'changed'].includes(body.kind) ? body.kind : 'start';
      const qq = await (await sb('hr_quizzes?id=eq.' + enc(String(body.quiz_id)) + '&select=id,title,opens_at,closes_at,duration_min,time_changed_at')).json();
      const q = Array.isArray(qq) ? qq[0] : null;
      if (!q) return res.status(404).json({ ok: false, error: 'Quiz not found' });
      if (!q.opens_at) return res.status(400).json({ ok: false, error: 'Set the quiz start time first' });
      const r = await recipients(sb, q, kind, true);
      let sent = 0, failed = 0;
      for (let i = 0; i < r.rows.length; i += 100) {
        if (i > 0) await sleep(600);
        const chunk = r.rows.slice(i, i + 100);
        const rr = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY },
          body: JSON.stringify(chunk.map(x => mail(kind, q, x, Date.now()))) });
        if (rr.ok) sent += chunk.length; else failed += chunk.length;
      }
      if (sent) {   // so the scheduler does not send the same notice again
        const col = kind === 'remind' ? 'remind_sent_for' : kind === 'start' ? 'start_sent_for' : 'change_notified_at';
        await sb('hr_quizzes?id=eq.' + q.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ [col]: kind === 'changed' ? new Date().toISOString() : q.opens_at }) });
      }
      return res.status(200).json({ ok: true, kind, registered: r.total, recipients: r.rows.length, sent, failed });
    }

    const quizzes = await (await sb('hr_quizzes?published=eq.true&select=id,title,opens_at,closes_at,duration_min,remind_sent_for,start_sent_for,time_changed_at,change_notified_at')).json();
    if (!Array.isArray(quizzes)) return res.status(500).json({ error: 'Run the PART 5 SQL first (' + (quizzes && quizzes.message || 'unknown') + ')' });

    const now = Date.now(), report = [], status = [];
    for (const q of quizzes) {
      if (!q.opens_at) { status.push({ quiz: q.title, state: 'NO START TIME SET - no emails can be sent' }); continue; }
      const start = Date.parse(q.opens_at), close = q.closes_at ? Date.parse(q.closes_at) : 0;
      status.push({ quiz: q.title, startsInMin: Math.round((start - now) / 60000), closed: !!(close && now > close),
        remind5Sent: same(q.remind_sent_for, q.opens_at), startSent: same(q.start_sent_for, q.opens_at),
        scheduleChangePending: !!(q.time_changed_at && (!q.change_notified_at || Date.parse(q.time_changed_at) > Date.parse(q.change_notified_at))) });
      if (close && now > close) continue;
      const jobs = [];
      if (q.time_changed_at) {
        const tc = Date.parse(q.time_changed_at);
        if ((!q.change_notified_at || tc > Date.parse(q.change_notified_at)) && now - tc >= 120000) jobs.push('changed');   // wait 2 min so the final edit is what gets emailed
      }
      if (now >= start - 300000 && now < start && !same(q.remind_sent_for, q.opens_at)) jobs.push('remind');
      if (now >= start && now < start + 900000 && !same(q.start_sent_for, q.opens_at)) jobs.push('start');

      for (const kind of jobs) {
        // claim first, so two overlapping scheduler calls can never double-send
        const col = kind === 'remind' ? 'remind_sent_for' : kind === 'start' ? 'start_sent_for' : 'change_notified_at';
        const cond = kind === 'changed'
          ? 'or=(change_notified_at.is.null,change_notified_at.lt.' + enc(q.time_changed_at) + ')'
          : 'or=(' + col + '.is.null,' + col + '.neq.' + enc(q.opens_at) + ')';
        const claim = await sb('hr_quizzes?id=eq.' + q.id + '&' + cond, { method: 'PATCH', headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ [col]: kind === 'changed' ? new Date().toISOString() : q.opens_at }) });
        const got = claim.ok ? await claim.json() : [];
        if (!Array.isArray(got) || got.length !== 1) { report.push({ quiz: q.title, kind, skipped: 'already handled' }); continue; }

        let to;
        try { to = (await recipients(sb, q, kind, false)).rows; }
        catch (e) { await sb('hr_quizzes?id=eq.' + q.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ [col]: q[col] || null }) }); report.push({ quiz: q.title, kind, error: String(e.message || e) }); continue; }
        let sent = 0, failed = 0;
        for (let i = 0; i < to.length; i += 100) {
          if (i > 0) await sleep(600);
          const chunk = to.slice(i, i + 100);
          const rr = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY },
            body: JSON.stringify(chunk.map(r => mail(kind, q, r, now))) });
          if (rr.ok) sent += chunk.length; else failed += chunk.length;
        }
        if (to.length && !sent) await sb('hr_quizzes?id=eq.' + q.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ [col]: q[col] || null }) }); // nothing went out: retry next minute
        report.push({ quiz: q.title, kind, recipients: to.length, sent, failed });
      }
    }
    return res.status(200).json({ ok: true, now: new Date(now).toISOString(), report, quizzes: status });
  } catch (e) {
    console.error('quiz-reminders error:', e);
    return res.status(500).json({ ok: false, error: String(e && e.message || 'Server error').slice(0, 200) });
  }
}

async function recipients(sb, q, kind, manual) {
  const regs = await (await sb('hr_quiz_regs?quiz_id=eq.' + q.id + '&select=name,email,created_at&order=created_at')).json();
  if (!Array.isArray(regs)) throw new Error('Cannot read registrations (hr_quiz_regs): ' + (regs && regs.message || 'unknown'));
  let rows = regs.filter(r => goodMail(r.email));
  if (kind === 'changed' && !manual) {
    const tc = Date.parse(q.time_changed_at);              // people who registered after the change already saw the new time
    rows = rows.filter(r => !r.created_at || Date.parse(r.created_at) < tc);
  } else if (kind !== 'changed') {
    const att = await (await sb('hr_attempts?quiz_id=eq.' + q.id + '&select=email')).json();
    const done = new Set((Array.isArray(att) ? att : []).map(a => String(a.email || '').trim().toLowerCase()));
    rows = rows.filter(r => !done.has(String(r.email).trim().toLowerCase()));
  }
  const seen = new Set();
  rows = rows.filter(r => { const k = String(r.email).trim().toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  return { rows, total: regs.length };
}

function mail(kind, q, r, now) {
  const start = Date.parse(q.opens_at), title = clean(q.title);
  const mins = Math.max(1, Math.ceil((start - now) / 60000));
  const lines = [];
  lines.push('<b>Starts:</b> ' + esc(fmt(start)));
  if (q.closes_at) lines.push('<b>Window closes:</b> ' + esc(fmt(Date.parse(q.closes_at))));
  lines.push('<b>Duration:</b> ' + esc(q.duration_min) + ' minutes');
  const head = kind === 'remind' ? '⏰ Starting in ' + mins + ' minute' + (mins > 1 ? 's' : '')
    : kind === 'start' ? '🚀 The quiz is live now' : '📅 The quiz schedule has changed';
  const subject = kind === 'remind' ? '⏰ ' + title + ' starts in ' + mins + ' min'
    : kind === 'start' ? '🚀 ' + title + ' has started' : '📅 Schedule changed: ' + title;
  const intro = kind === 'changed' ? 'The time for <b style="color:#22d3ee">' + esc(title) + '</b> has been updated. Please note the new schedule:'
    : kind === 'start' ? '<b style="color:#22d3ee">' + esc(title) + '</b> is open now. Log in and start your attempt.'
    : '<b style="color:#22d3ee">' + esc(title) + '</b> is about to begin. Keep your email handy — you will verify it with a 6-digit code.';
  return {
    from: FROM, to: [String(r.email).trim()], subject,
    html: '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f1119;color:#e9ebf2;border-radius:12px">'
      + '<h1 style="color:#7c5cff;font-size:22px">' + head + '</h1><p>Hi <b>' + esc(clean(r.name) || 'there') + '</b>,</p><p>' + intro + '</p>'
      + '<p>' + lines.join('<br>') + '</p>'
      + '<p><a href="' + SITE + '" style="display:inline-block;background:#7c5cff;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Open Hackathon Rivals</a></p>'
      + '<p style="color:#9aa0b4;font-size:13px">You are receiving this because you registered for this exam.</p><p><b>— Team Hackathon Rivals</b></p></div>'
  };
}
