// api/send-email.js  — hardened version (replace your current file)
// Env vars (same as before): RESEND_API_KEY, ADMIN_EMAIL
// Optional: SUPABASE_URL, SUPABASE_ANON_KEY (defaults to your public project values)
//
// What changed vs the old version:
//  * Caller must be logged in (Authorization: Bearer <supabase access token>).
//  * The student email is taken from the verified login, never from the request body.
//  * The mail content is read from the caller's own row in team_registrations (RLS applies),
//    so a fake request cannot inject text or make the site email strangers.
//  * Rate limits per user and per IP, CORS wildcard removed, CR/LF stripped from subjects.

const SB_URL_DEFAULT = 'https://awvcorswnzbxsrrzepto.supabase.co';
const ANON_DEFAULT = 'sb_publishable_6GqdbyBWEX7cIkTzcp9yvw_WYNp5GJh';
const FROM = 'Hackathon Rivals <noreply@hackathonrivals.in>';

// best-effort limiter (per serverless instance; stops casual abuse)
const hits = new Map();
function limited(key, max, ms) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < ms);
  if (arr.length >= max) { hits.set(key, arr); return true; }
  arr.push(now); hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const API_KEY = process.env.RESEND_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const SB_URL = process.env.SUPABASE_URL || SB_URL_DEFAULT;
    const ANON = process.env.SUPABASE_ANON_KEY || ANON_DEFAULT;
    if (!API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY not set' });
    if (!ADMIN_EMAIL) return res.status(500).json({ error: 'ADMIN_EMAIL not set' });

    // 1) who is calling?
    const token = String(req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Login required' });
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (limited('ip:' + ip, 20, 3600000)) return res.status(429).json({ error: 'Too many requests' });

    const ur = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: ANON, Authorization: 'Bearer ' + token } });
    if (!ur.ok) return res.status(401).json({ error: 'Login required' });
    const user = await ur.json();
    if (!user || !user.id || !user.email) return res.status(401).json({ error: 'Login required' });
    if (limited('u:' + user.id, 5, 3600000)) return res.status(429).json({ error: 'Too many emails, try later' });

    // 2) read this user's own registration (row-level security applies)
    const rr = await fetch(SB_URL + '/rest/v1/team_registrations?user_id=eq.' + encodeURIComponent(user.id)
      + '&select=team_name,spoc_name,spoc_email,college_name,theme,category&limit=5',
      { headers: { apikey: ANON, Authorization: 'Bearer ' + token } });
    const rows = rr.ok ? await rr.json() : [];
    const reg = Array.isArray(rows) && rows.length ? rows[rows.length - 1] : null;
    if (!reg) return res.status(403).json({ error: 'No registration found for this account' });

    const clean = (s, n) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').trim().slice(0, n || 120);
    const R = {
      team_name: clean(reg.team_name, 80), spoc_name: clean(reg.spoc_name, 80), spoc_email: clean(reg.spoc_email, 120),
      college_name: clean(reg.college_name, 120), theme: clean(reg.theme, 120), category: clean(reg.category, 60)
    };

    const adminHtml = '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f1119;color:#e9ebf2;border-radius:12px">'
      + '<h2 style="color:#7c5cff;margin:0 0 16px">🎉 New Team Registration!</h2>'
      + '<p><b>Team:</b> ' + esc(R.team_name) + '</p><p><b>SPOC:</b> ' + esc(R.spoc_name) + '</p>'
      + '<p><b>Email:</b> ' + esc(R.spoc_email) + '</p><p><b>College:</b> ' + esc(R.college_name) + '</p>'
      + '<p><b>Theme:</b> ' + esc(R.theme) + '</p><p><b>Category:</b> ' + esc(R.category) + '</p></div>';

    const userHtml = '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f1119;color:#e9ebf2;border-radius:12px">'
      + '<h1 style="color:#7c5cff">Welcome to Hackathon Rivals! 🚀</h1>'
      + '<p>Hi <b>' + esc(R.spoc_name) + '</b>,</p>'
      + '<p>Team <b style="color:#22d3ee">' + esc(R.team_name) + '</b> ki registration successfully submit ho gayi hai.</p>'
      + '<p><b>Theme:</b> ' + esc(R.theme) + '</p><p><b>Category:</b> ' + esc(R.category) + '</p>'
      + '<p>All the best! 💪</p><p><b>— Team Hackathon Rivals</b></p></div>';

    const sendEmail = (to, subject, html) => fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY },
      body: JSON.stringify({ from: FROM, to: [to], subject, html })
    });

    const [adminRes, userRes] = await Promise.all([
      sendEmail(ADMIN_EMAIL, '🎉 New Registration: ' + R.team_name, adminHtml),
      sendEmail(user.email, 'Welcome to Hackathon Rivals! Team ' + R.team_name, userHtml)
    ]);
    const adminData = await adminRes.json().catch(() => ({}));
    const userData = await userRes.json().catch(() => ({}));

    return res.status(200).json({
      ok: true, admin: adminRes.ok, user: userRes.ok,
      adminErr: adminRes.ok ? null : (adminData && adminData.message),
      userErr: userRes.ok ? null : (userData && userData.message)
    });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
