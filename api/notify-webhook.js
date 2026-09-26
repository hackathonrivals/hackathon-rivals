export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { row, isTest } = req.body || {};

    // 1. Get webhook URL from Supabase app_settings
    const SUPABASE_URL = 'https://awvcorswnzbxsrrzepto.supabase.co';
    const ANON_KEY = 'sb_publishable_6GqdbyBWEX7cIkTzcp9yvw_WYNp5GJh';

    const settingsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/app_settings?key=eq.webhook_url&select=value`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        }
      }
    );
    const settings = await settingsRes.json();
    const webhookUrl = settings?.[0]?.value;

    if (!webhookUrl){
      console.warn('No webhook URL configured');
      return res.status(200).json({ ok: false, reason: 'no_webhook' });
    }

    // 2. Build message
    const isDiscord = webhookUrl.includes('discord.com');
    const isSlack = webhookUrl.includes('hooks.slack.com');

    let message;

    if (isTest){
      message = '🧪 **Test ping** from Hackathon Rivals\nWebhook is working correctly! ✅';
    } else if (row){
      const lines = [
        `📥 **New Submission**`,
        `**User:** ${row.email || 'unknown'}`,
        `**Role:** ${row.role || 'Student'}`,
        `**Score:** ${row.score || 0}/100`,
        `**Lang:** ${row.lang || '—'}`,
        `**Topic:** ${row.topic || '—'}`,
        `**Title:** ${(row.title || 'Untitled').slice(0, 80)}`
      ];
      message = lines.join('\n');
    } else {
      message = '📡 Hackathon Rivals notification';
    }

    // 3. Post to webhook
    const body = isDiscord
      ? { content: message }
      : { text: message };

    const postRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!postRes.ok){
      const errText = await postRes.text().catch(() => '');
      console.error('Webhook POST failed:', postRes.status, errText);
      return res.status(200).json({ 
        ok: false, 
        status: postRes.status, 
        error: errText.slice(0, 200) 
      });
    }

    return res.status(200).json({ ok: true });

  } catch (e){
    console.error('notify-webhook error:', e);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}