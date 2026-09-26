export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { row, isTest } = req.body || {};

    // ⚠️ TEMPORARY HARDCODE — apna actual Discord URL daal
    const webhookUrl = 'https://discord.com/api/webhooks/1553515404586917930/t6abGGaYpSvRcc3UEGoaAq5Av7L-4LypnFf8j6Z1NEWslXl8Z2rr4fTZQ95bw4flejBP';

    if (!webhookUrl) {
      return res.status(200).json({ ok: false, reason: 'no_webhook' });
    }

    const isDiscord = webhookUrl.includes('discord.com');
    let message;
    if (isTest) message = '🧪 **Test ping** from Hackathon Rivals ✅';
    else if (row) message = `📥 **New Submission**\n**User:** ${row.email || '—'}\n**Score:** ${row.score || 0}/100\n**Lang:** ${row.lang || '—'}`;
    else message = '📡 Hackathon Rivals';

    const body = isDiscord ? { content: message } : { text: message };

    const postRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!postRes.ok) {
      const errText = await postRes.text().catch(() => '');
      console.error('Discord error:', postRes.status, errText);
      return res.status(200).json({ 
        ok: false, 
        status: postRes.status, 
        error: errText.slice(0, 300) 
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Function error:', e);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}