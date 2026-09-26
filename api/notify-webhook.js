export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { row, isTest } = req.body || {};

    const SUPABASE_URL = 'https://awvcorswnzbxsrrzepto.supabase.co';
    const ANON_KEY = 'sb_publishable_6GqdbyBWEX7cIkTzcp9yvw_WYNp5GJh';

    const settingsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/app_settings?key=eq.webhook_url&select=value`,
      { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }
    );
    const settings = await settingsRes.json();
    const webhookUrl = settings?.[0]?.value;

    if (!webhookUrl){
      return res.status(200).json({ ok: false, reason: 'no_webhook' });
    }

    const isDiscord = webhookUrl.includes('discord.com');
    let message;
    if (isTest) message = '🧪 **Test ping** from Hackathon Rivals ✅';
    else if (row) message = `📥 **New Submission**\nUser: ${row.email}\nScore: ${row.score}/100\nLang: ${row.lang}`;
    else message = '📡 Hackathon Rivals';

    const body = isDiscord ? { content: message } : { text: message };

    const postRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!postRes.ok){
      const errText = await postRes.text().catch(() => '');
      return res.status(200).json({ ok: false, status: postRes.status, error: errText.slice(0, 200) });
    }

    return res.status(200).json({ ok: true });
  } catch (e){
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}