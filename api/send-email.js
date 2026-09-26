export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { registration } = req.body || {};
    if (!registration || !registration.email) {
      return res.status(400).json({ error: 'registration required' });
    }

    const API_KEY = process.env.RESEND_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY not set' });
    if (!ADMIN_EMAIL) return res.status(500).json({ error: 'ADMIN_EMAIL not set' });

   from: 'Hackathon Rivals <noreply@hackathonrivals.in>',
    const adminHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f1119;color:#e9ebf2;border-radius:12px">
        <h2 style="color:#7c5cff;margin:0 0 16px">🎉 New Team Registration!</h2>
        <p><b>Team:</b> ${esc(registration.team_name)}</p>
        <p><b>SPOC:</b> ${esc(registration.spoc_name)}</p>
        <p><b>Email:</b> ${esc(registration.spoc_email)}</p>
        <p><b>College:</b> ${esc(registration.college_name)}</p>
        <p><b>Theme:</b> ${esc(registration.theme)}</p>
        <p><b>Category:</b> ${esc(registration.category)}</p>
      </div>`;

    const userHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f1119;color:#e9ebf2;border-radius:12px">
        <h1 style="color:#7c5cff">Welcome to Hackathon Rivals! 🚀</h1>
        <p>Hi <b>${esc(registration.spoc_name)}</b>,</p>
        <p>Team <b style="color:#22d3ee">${esc(registration.team_name)}</b> ki registration successfully submit ho gayi hai.</p>
        <p><b>Theme:</b> ${esc(registration.theme)}</p>
        <p><b>Category:</b> ${esc(registration.category)}</p>
        <p>All the best! 💪</p>
        <p><b>— Team Hackathon Rivals</b></p>
      </div>`;

    const sendEmail = (to, subject, html) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({ from: FROM, to: [to], subject, html })
      });

    const [adminRes, userRes] = await Promise.all([
      sendEmail(ADMIN_EMAIL, `🎉 New Registration: ${registration.team_name}`, adminHtml),
      sendEmail(registration.email, `Welcome to Hackathon Rivals! Team ${registration.team_name}`, userHtml)
    ]);

    const adminData = await adminRes.json();
    const userData = await userRes.json();

    return res.status(200).json({
      ok: true,
      admin: adminRes.ok,
      user: userRes.ok,
      adminErr: adminRes.ok ? null : adminData?.message,
      userErr: userRes.ok ? null : userData?.message
    });

  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}