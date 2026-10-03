// api/verify-email.js — email verification for quizzes (6-digit code via Resend)
// Vercel env vars: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (same ones send-results uses)
//
// POST { action: 'send',  email }            -> emails a 6-digit code (valid 10 min)
// POST { action: 'check', email, code }      -> { ok, token, expires_at }  (token valid 12 h)
// The quiz page sends the token as header x-quiz-token; a database trigger refuses quiz
// submissions whose email has no valid token (see SQL "PART 4").
import crypto from 'node:crypto';

const FROM = 'Hackathon Rivals <noreply@hackathonrivals.in>';
const hits = new Map();
function limited(key, max, ms) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < ms);
  if (arr.length >= max) { hits.set(key, arr); return true; }
  arr.push(now); hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}
const goodMail = e => { const s = String(e || ''), a = s.indexOf('@'); return a > 0 && s.indexOf('.', a) > a + 1 && s.indexOf(' ') < 0 && s.length > 5 && s.length <= 120; };
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const enc = encodeURIComponent;
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {   // open /api/verify-email in a browser to check the setup (shows no secrets)
    const k = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    let role = '';
    if (k.startsWith('eyJ')) { try { role = JSON.parse(Buffer.from(k.split('.')[1], 'base64url').toString()).role; } catch (e) { role = '?'; } }
    return res.status(200).json({
      version: 'v2', RESEND_API_KEY: !!process.env.RESEND_API_KEY, SUPABASE_URL: !!process.env.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: !!k,
      keyType: !k ? 'missing' : k.startsWith('eyJ') ? (role === 'service_role' ? 'legacy service_role (ok)' : 'WRONG: this key has role "' + role + '" - use the service_role key')
        : k.startsWith('sb_secret_') ? 'new secret key (ok)' : k.startsWith('sb_publishable_') ? 'WRONG: publishable key' : 'unknown format'
    });
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  try {
    const API_KEY = process.env.RESEND_API_KEY, SB_URL = process.env.SUPABASE_URL, SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!API_KEY || !SB_URL || !SRV) return res.status(500).json({ ok: false, error: 'Server is not configured (env vars missing)' });
    const sbH = { apikey: SRV, 'Content-Type': 'application/json' };
    if (SRV.startsWith('eyJ')) sbH.Authorization = 'Bearer ' + SRV;
    const sb = (path, opt) => fetch(SB_URL + '/rest/v1/' + path, Object.assign({}, opt, { headers: Object.assign({}, sbH, (opt && opt.headers) || {}) }));

    const b = req.body || {};
    const email = String(b.email || '').trim().toLowerCase();
    if (!goodMail(email)) return res.status(400).json({ ok: false, error: 'Enter a valid email' });
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

    if (b.action === 'send') {
      if (limited('s:' + ip, 10, 3600000)) return res.status(429).json({ ok: false, error: 'Too many requests, try later' });
      const since = new Date(Date.now() - 3600000).toISOString();
      const recent = await (await sb('hr_email_codes?email=eq.' + enc(email) + '&created_at=gte.' + enc(since) + '&select=id')).json();
      if (!Array.isArray(recent)) return res.status(500).json({ ok: false, error: 'Database error - run the PART 4 SQL first' });
      if (recent.length >= 3) return res.status(429).json({ ok: false, error: 'Too many codes for this email. Try again in an hour.' });

      const code = String(crypto.randomInt(100000, 1000000));
      const ins = await sb('hr_email_codes', { method: 'POST', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ email, code_hash: sha(code + ':' + email), expires_at: new Date(Date.now() + 600000).toISOString() }) });
      if (!ins.ok) { const d = await ins.text().catch(() => ''); return res.status(500).json({ ok: false, error: 'Database write failed (' + ins.status + '): ' + d.slice(0, 160) }); }

      const mr = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY },
        body: JSON.stringify({ from: FROM, to: [email], subject: 'Your verification code: ' + code,
          html: '<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f1119;color:#e9ebf2;border-radius:12px">'
            + '<h2 style="color:#7c5cff;margin:0 0 12px">Verify your email</h2><p>Use this code to start your quiz:</p>'
            + '<p style="font-size:34px;letter-spacing:8px;font-weight:700;color:#22d3ee;margin:12px 0">' + esc(code) + '</p>'
            + '<p style="color:#9aa0b4;font-size:13px">It is valid for 10 minutes. If you did not request it, ignore this email.</p></div>' }) });
      if (!mr.ok) return res.status(502).json({ ok: false, error: 'Could not send the email, try again' });
      // housekeeping
      sb('hr_email_codes?expires_at=lt.' + enc(new Date(Date.now() - 86400000).toISOString()), { method: 'DELETE' }).catch(() => {});
      sb('hr_verified?expires_at=lt.' + enc(new Date().toISOString()), { method: 'DELETE' }).catch(() => {});
      return res.status(200).json({ ok: true });
    }

    if (b.action === 'check') {
      if (limited('c:' + ip, 40, 3600000)) return res.status(429).json({ ok: false, error: 'Too many attempts, try later' });
      const code = String(b.code || '').replace(/[^0-9]/g, '');
      if (code.length !== 6) return res.status(400).json({ ok: false, error: 'Enter the 6-digit code' });
      const rows = await (await sb('hr_email_codes?email=eq.' + enc(email) + '&used=eq.false&expires_at=gt.' + enc(new Date().toISOString())
        + '&order=created_at.desc&limit=1&select=id,code_hash,tries')).json();
      if (!Array.isArray(rows)) return res.status(500).json({ ok: false, error: 'Database error' });
      const row = rows[0];
      if (!row) return res.status(400).json({ ok: false, error: 'Code expired - request a new one' });
      if (row.tries >= 5) return res.status(429).json({ ok: false, error: 'Too many wrong tries - request a new code' });

      let same = false;
      try { same = crypto.timingSafeEqual(Buffer.from(sha(code + ':' + email)), Buffer.from(String(row.code_hash))); } catch (e) { same = false; }
      if (!same) {
        await sb('hr_email_codes?id=eq.' + row.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ tries: row.tries + 1 }) });
        return res.status(400).json({ ok: false, error: 'Wrong code (' + (4 - row.tries) + ' tries left)' });
      }
      await sb('hr_email_codes?id=eq.' + row.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ used: true }) });
      const token = crypto.randomBytes(24).toString('hex');
      const expires = new Date(Date.now() + 12 * 3600000).toISOString();
      const ins = await sb('hr_verified', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ token_hash: sha(token), email, expires_at: expires }) });
      if (!ins.ok) { const d = await ins.text().catch(() => ''); return res.status(500).json({ ok: false, error: 'Database write failed (' + ins.status + '): ' + d.slice(0, 160) }); }
      return res.status(200).json({ ok: true, token, expires_at: expires });
    }
    return res.status(400).json({ ok: false, error: 'Unknown action' });
  } catch (e) {
    console.error('verify-email error:', e);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
