// File: api/send-results.js  (Vercel serverless function, same style as api/send-email.js)
// Vercel env vars needed: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const API_KEY = process.env.RESEND_API_KEY;
    const SB_URL = process.env.SUPABASE_URL;
    const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY not set' });
    if (!SB_URL || !SRV) return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set' });

    // 1) caller must be a logged-in Admin
    const token = String(req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Login required' });
    const ur = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: SRV, Authorization: 'Bearer ' + token } });
    if (!ur.ok) return res.status(401).json({ error: 'Login required' });
    const user = await ur.json();
    const sb = (path, opt) => fetch(SB_URL + '/rest/v1/' + path, Object.assign({}, opt, {
      headers: Object.assign({ apikey: SRV, Authorization: 'Bearer ' + SRV, 'Content-Type': 'application/json' }, (opt && opt.headers) || {})
    }));
    const prof = await (await sb('profiles?id=eq.' + encodeURIComponent(user.id) + '&select=role')).json();
    if (!prof || !prof[0] || prof[0].role !== 'Admin') return res.status(403).json({ error: 'Admins only' });

    // 2) quiz + attempts
    const body = req.body || {};
    const quizId = String(body.quiz_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(quizId)) return res.status(400).json({ error: 'quiz_id required' });
    const quiz = (await (await sb('hr_quizzes?id=eq.' + quizId + '&select=title,results_published')).json())[0];
    if (!quiz || !quiz.results_published) return res.status(400).json({ error: 'Upload the results first' });
    const att = await (await sb('hr_attempts?quiz_id=eq.' + quizId + '&select=id,name,email,score,bonus,max_score,secs,emailed_at')).json();

    const rows = att.map(a => Object.assign({}, a, { total: a.score + (a.bonus || 0), pos: 0 }))
      .sort((a, b) => b.total - a.total || (a.secs || 0) - (b.secs || 0));
    let pos = 0, last = '';
    rows.forEach((r, i) => { const k = r.total + ':' + r.secs; if (k !== last) { pos = i + 1; last = k; } r.pos = pos; });

    const FROM = 'Hackathon Rivals <noreply@hackathonrivals.in>';
    const todo = rows.filter(r => body.force || !r.emailed_at);
    let sent = 0; const errors = [];

    // 3) send in batches of 100 (one Resend call per batch = fast enough for Vercel)
    for (let i = 0; i < todo.length; i += 100) {
      const chunk = todo.slice(i, i + 100);
      const mails = chunk.map(r => ({
        from: FROM, to: [r.email], subject: 'Your result - ' + quiz.title,
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
    return res.status(200).json({ sent, failed: todo.length - sent, errors: errors.slice(0, 5), total: todo.length });
  } catch (err) {
    console.error('send-results error:', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
