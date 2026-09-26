exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };

  try {
    const { registration } = JSON.parse(event.body || '{}');
    if (!registration || !registration.email) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'registration required' }) };
    }

    const API_KEY = process.env.RESEND_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!API_KEY) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) };
    }
    if (!ADMIN_EMAIL) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'ADMIN_EMAIL not set' }) };
    }

    const FROM = 'Hackathon Rivals <onboarding@resend.dev>';

    const adminHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f1119;color:#e9ebf2;border-radius:12px">
        <h2 style="color:#7c5cff;margin:0 0 16px">🎉 New Team Registration!</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#8b90a4">Team Name</td><td style="padding:8px 0;font-weight:600">${esc(registration.team_name)}</td></tr>
          <tr><td style="padding:8px 0;color:#8b90a4">SPOC</td><td style="padding:8px 0">${esc(registration.spoc_name)}</td></tr>
          <tr><td style="padding:8px 0;color:#8b90a4">SPOC Email</td><td style="padding:8px 0">${esc(registration.spoc_email)}</td></tr>
          <tr><td style="padding:8px 0;color:#8b90a4">Mobile</td><td style="padding:8px 0">${esc(registration.spoc_mobile || '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#8b90a4">College</td><td style="padding:8px 0">${esc(registration.college_name)}</td></tr>
          <tr><td style="padding:8px 0;color:#8b90a4">Theme</td><td style="padding:8px 0">${esc(registration.theme)}</td></tr>
          <tr><td style="padding:8px 0;color:#8b90a4">Category</td><td style="padding:8px 0">${esc(registration.category)}</td></tr>
          <tr><td style="padding:8px 0;color:#8b90a4">Problem</td><td style="padding:8px 0">${esc(registration.problem_statement)}</td></tr>
          <tr><td style="padding:8px 0;color:#8b90a4">Registered By</td><td style="padding:8px 0">${esc(registration.email)}</td></tr>
        </table>
      </div>`;

    const userHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f1119;color:#e9ebf2;border-radius:12px">
        <h1 style="color:#7c5cff;margin:0 0 16px;font-size:24px">Welcome to Hackathon Rivals! 🚀</h1>
        <p style="font-size:15px;line-height:1.6">Hi <b>${esc(registration.spoc_name)}</b>,</p>
        <p style="font-size:15px;line-height:1.6">
          Congratulations! Team <b style="color:#22d3ee">${esc(registration.team_name)}</b> ki registration successfully submit ho gayi hai.
        </p>
        <div style="background:rgba(124,92,255,0.1);border-left:3px solid #7c5cff;padding:16px;border-radius:8px;margin:20px 0">
          <p style="margin:0 0 8px;font-size:13px;color:#8b90a4;text-transform:uppercase;letter-spacing:0.05em">Your Registration</p>
          <p style="margin:4px 0;font-size:14px"><b>Team:</b> ${esc(registration.team_name)}</p>
          <p style="margin:4px 0;font-size:14px"><b>Theme:</b> ${esc(registration.theme)}</p>
          <p style="margin:4px 0;font-size:14px"><b>Category:</b> ${esc(registration.category)}</p>
          <p style="margin:4px 0;font-size:14px"><b>Problem:</b> ${esc(registration.problem_statement)}</p>
        </div>
        <h3 style="color:#22d3ee;margin:24px 0 12px;font-size:16px">What's Next?</h3>
        <ol style="font-size:14px;line-height:1.8;padding-left:20px">
          <li>Idea PPT prepare karo (deadline: <b>30 April 2026</b>)</li>
          <li>Team members ko add karo (1-6 members)</li>
          <li>Prototype banane ka plan banao</li>
          <li>Grand Finale: <b>15-17 May 2026, New Delhi</b></li>
        </ol>
        <p style="font-size:14px;line-height:1.6;margin-top:24px">
          Koi bhi doubt ho toh reply kar dena, ya <a href="https://hackathonrivals.netlify.app" style="color:#7c5cff">portal</a> pe check karte rehna.
        </p>
        <p style="font-size:14px;margin-top:24px">All the best! 💪</p>
        <p style="font-size:14px"><b>— Team Hackathon Rivals</b></p>
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

    const adminSubject = `🎉 New Registration: ${registration.team_name} — ${registration.college_name}`;
    const userSubject  = `Welcome to Hackathon Rivals! 🚀 Team ${registration.team_name}`;

    const [adminRes, userRes] = await Promise.all([
      sendEmail(ADMIN_EMAIL, adminSubject, adminHtml),
      sendEmail(registration.email, userSubject, userHtml)
    ]);

    const adminData = await adminRes.json();
    const userData = await userRes.json();

    if (!adminRes.ok) console.warn('Admin email failed:', adminData);
    if (!userRes.ok)  console.warn('User email failed:', userData);

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        admin: adminRes.ok,
        user: userRes.ok,
        adminErr: adminRes.ok ? null : adminData?.message,
        userErr: userRes.ok ? null : userData?.message
      })
    };

  } catch (err) {
    console.error('Email function error:', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(err.message || err) }) };
  }
};

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}