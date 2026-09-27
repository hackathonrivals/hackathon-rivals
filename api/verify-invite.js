export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { code, role } = req.body || {};
    if (!code || !role) {
      return res.status(400).json({ ok: false, error: 'code and role required' });
    }

    const SUPABASE_URL = 'https://awvcorswnzbxsrrzepto.supabase.co';
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SERVICE_KEY) {
      return res.status(500).json({ ok: false, error: 'Server misconfigured: missing key' });
    }

    const url = SUPABASE_URL
      + '/rest/v1/invite_codes?select=code,role,used'
      + '&code=eq.' + encodeURIComponent(code)
      + '&role=eq.' + encodeURIComponent(role)
      + '&used=eq.false';

    const r = await fetch(url, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY
      }
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ ok: false, error: 'DB error ' + r.status + ': ' + text.slice(0, 200) });
    }

    const rows = await r.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(200).json({ ok: false, error: 'Invalid code' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}