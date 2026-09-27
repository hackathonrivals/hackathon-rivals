import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { code, role } = req.body || {};
    if (!code || !role) {
      return res.status(400).json({ ok: false, error: 'code and role required' });
    }

    const SUPABASE_URL = 'https://awvcorswnzbxsrrzepto.supabase.co';
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SERVICE_KEY) {
      return res.status(500).json({ ok: false, error: 'Server misconfigured' });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false }
    });

    const { data, error } = await sb
      .from('invite_codes')
      .select('code, role, used')
      .eq('code', code)
      .eq('role', role)
      .eq('used', false)
      .maybeSingle();

    if (error || !data) {
      return res.status(200).json({ ok: false, error: 'Invalid code' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Verify invite error:', e);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}