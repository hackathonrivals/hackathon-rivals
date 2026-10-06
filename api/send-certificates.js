// api/send-certificates.js — e-mails each participant a link to their certificate (admin only)
// Env vars (same as send-results): RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
const SITE = 'https://hackathonrivals.in';
const FROM = 'Hackathon Rivals <noreply@hackathonrivals.in>';
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const goodMail = e => { const s = String(e || '').trim(), a = s.indexOf('@'); return a > 0 && s.indexOf('.', a) > a + 1 && s.indexOf(' ') < 0 && s.length > 5; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const API_KEY = process.env.RESEND_API_KEY, SB_URL = process.env.SUPABASE_URL, SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!API_KEY || !SB_URL || !SRV) return res.status(500).json({ error: 'RESEND_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set' });

    // caller must be a logged-in Admin
    const token = String(req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Login required' });
    const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_6GqdbyBWEX7cIkTzcp9yvw_WYNp5GJh';
    const ar = await fetch(SB_URL + '/rest/v1/rpc/hr_is_admin', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: '{}' });
    if (ar.status === 401) return res.status(401).json({ error: 'Login expired - log in again' });
    if (!ar.ok || (await ar.json()) !== true) return res.status(403).json({ error: 'Admins only' });

    const sbH = { apikey: SRV, 'Content-Type': 'application/json' };
    if (SRV.startsWith('eyJ')) sbH.Authorization = 'Bearer ' + SRV;
    const sb = (path, opt) => fetch(SB_URL + '/rest/v1/' + path, Object.assign({}, opt, { headers: Object.assign({}, sbH, (opt && opt.headers) || {}) }));

    const body = req.body || {};
    const quizId = String(body.quiz_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(quizId)) return res.status(400).json({ error: 'quiz_id required' });
    const qr = await (await sb('hr_quizzes?id=eq.' + quizId + '&select=title')).json();
    if (!Array.isArray(qr) || !qr[0]) return res.status(404).json({ error: 'Quiz not found' });
    const title = String(qr[0].title || 'the quiz');

    const certs = await (await sb('hr_certificates?quiz_id=eq.' + quizId + '&revoked=eq.false&select=id,code,email,name,kind,pos,emailed_at')).json();
    if (!Array.isArray(certs)) return res.status(500).json({ error: 'Run certificates.sql first (' + (certs && certs.message || 'unknown') + ')' });

    const wanted = certs.filter(c => body.force || !c.emailed_at);
    const todo = wanted.filter(c => goodMail(c.email));
    const errors = wanted.filter(c => !goodMail(c.email)).slice(0, 3).map(c => 'invalid email skipped: ' + String(c.email || '(empty)').slice(0, 40));
    let sent = 0;
    for (let i = 0; i < todo.length; i += 100) {
      if (i > 0) await sleep(600);
      const chunk = todo.slice(i, i + 100);
      const mails = chunk.map(c => {
        const win = c.kind === 'winner';
        return {
          from: FROM, to: [String(c.email).trim()], subject: '🎓 Your certificate - ' + title,
          html: '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f1119;color:#e9ebf2;border-radius:12px">'
            + '<h1 style="color:#7c5cff;font-size:24px">' + (win ? 'Congratulations! 🏆' : 'Your certificate is ready 🎓') + '</h1>'
            + '<p>Hi <b>' + esc(c.name) + '</b>,</p>'
            + '<p>Your <b>' + (win ? 'Certificate of Achievement (Rank #' + esc(c.pos) + ')' : 'Certificate of Participation') + '</b> for <b style="color:#22d3ee">' + esc(title) + '</b> is ready.</p>'
            + '<p><a href="' + SITE + '/?cert=' + encodeURIComponent(c.code) + '" style="display:inline-block;background:#7c5cff;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">View &amp; download certificate</a></p>'
            + '<p style="color:#9aa0b4;font-size:13px">Certificate ID: <b>' + esc(c.code) + '</b><br>Anyone can verify it at ' + SITE + '/?verify=' + esc(c.code) + '</p>'
            + '<p><b>— Team Hackathon Rivals</b></p></div>'
        };
      });
      const rr = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY }, body: JSON.stringify(mails) });
      if (rr.ok) {
        sent += chunk.length;
        await sb('hr_certificates?id=in.(' + chunk.map(c => c.id).join(',') + ')', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ emailed_at: new Date().toISOString() }) });
      } else {
        let m = ''; try { m = (await rr.json()).message; } catch (e) {}
        errors.push('batch ' + (i / 100 + 1) + ': ' + (m || 'HTTP ' + rr.status));
      }
    }
    return res.status(200).json({ sent, failed: wanted.length - sent, errors: errors.slice(0, 5), total: wanted.length });
  } catch (e) {
    console.error('send-certificates error:', e);
    return res.status(500).json({ error: String(e && e.message || 'Server error').slice(0, 200) });
  }
}
