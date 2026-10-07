// api/unsubscribe.js — one-click unsubscribe link used in announcement e-mails
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import crypto from 'node:crypto';
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const goodMail = e => { const s = String(e || ''), a = s.indexOf('@'); return a > 0 && s.indexOf('.', a) > a + 1 && s.indexOf(' ') < 0 && s.length <= 120; };
const page = (res, code, title, text) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.status(code).send('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title><body style="font-family:system-ui,sans-serif;background:#0f1119;color:#e9ebf2;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0"><div style="max-width:420px;padding:28px;text-align:center"><h2 style="color:#7c5cff">' + title + '</h2><p>' + text + '</p><p><a style="color:#22d3ee" href="https://hackathonrivals.in">Back to Hackathon Rivals</a></p></div></body>'); };

export default async function handler(req, res) {
  try {
    const SB_URL = process.env.SUPABASE_URL, SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SB_URL || !SRV) return page(res, 500, 'Not available', 'Please try again later.');
    const e = String((req.query && req.query.e) || '').trim().toLowerCase(), t = String((req.query && req.query.t) || '');
    if (!goodMail(e) || !safeEq(t, sha(e + ':' + SRV).slice(0, 32))) return page(res, 400, 'Invalid link', 'This unsubscribe link is not valid.');
    const h = { apikey: SRV, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' };
    if (SRV.startsWith('eyJ')) h.Authorization = 'Bearer ' + SRV;
    const r = await fetch(SB_URL + '/rest/v1/hr_mail_optout?on_conflict=email', { method: 'POST', headers: h, body: JSON.stringify({ email: e }) });
    if (!r.ok) return page(res, 500, 'Something went wrong', 'Please try again later.');
    return page(res, 200, 'You are unsubscribed', 'We will not send you announcement emails any more. Emails about quizzes you registered for can still reach you.');
  } catch (err) {
    return page(res, 500, 'Something went wrong', 'Please try again later.');
  }
}
