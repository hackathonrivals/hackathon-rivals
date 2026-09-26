export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { registration, status } = req.body || {};
    if (!registration || !status) return res.status(400).json({ error: 'missing data' });

    const API_KEY = process.env.RESEND_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY not set' });

    const to = registration.spoc_email || registration.email;
    if (!to) return res.status(400).json({ error: 'no recipient email' });

    const isApproved = status === 'approved';
    const subject = isApproved
      ? `🎉 Approved! Team ${registration.team_name} — Hackathon Rivals`
      : `Update on Team ${registration.team_name} — Hackathon Rivals`;

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f1119;color:#e9ebf2;border-radius:12px">
        <h1 style="color:${isApproved ? '#3ddc84' : '#ff6b6b'};margin:0 0 16px;font-size:24px">
          ${isApproved ? '🎉 Congratulations!' : '📋 Status Update'}
        </h1>
        <p style="font-size:15px;line-height:1.6">Hi <b>${esc(registration.spoc_name || 'there')}</b>,</p>
        <p style="font-size:15px;line-height:1.6">
          Team <b style="color:#22d3ee">${esc(registration.team_name)}</b> ka status update ho gaya hai:
        </p>
        <div style="background:${isApproved ? 'rgba(61,220,132,0.1)' : 'rgba(255,107,107,0.1)'};border-left:3px solid ${isApproved ? '#3ddc84' : '#ff6b6b'};padding:16px;border-radius:8px;margin:20px 0">
          <p style="margin:0;font-size:16px;font-weight:700;color:${isApproved ? '#3ddc84' : '#ff6b6b'}">
            ${isApproved ? '✅ APPROVED' : '❌ NOT SELECTED'}
          </p>
          <p style="margin:8px 0 0;font-size:13px;color:#8b90a4">
            ${isApproved 
              ? 'Aapki team Grand Finale ke liye select ho gayi hai. Next steps jald milega.' 
              : 'Is baar aapki team select nahi hui. Next season zaroor try karna!'}
          </p>
        </div>
        <p style="font-size:14px;margin-top:24px">— Team Hackathon Rivals</p>
      </div>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
       from: 'Hackathon Rivals <noreply@hackathonrivals.in>',
        to: [to], subject, html
      })
    });
    const d = await r.json();
    return res.status(200).json({ ok: r.ok, err: r.ok ? null : d?.message });
  } catch (e){
    return res.status(500).json({ error: String(e.message || e) });
  }
}

function esc(s){
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}