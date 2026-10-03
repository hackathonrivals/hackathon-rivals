// api/notify-webhook.js — hardened version (replace your current file)
// Vercel env var needed:  DISCORD_WEBHOOK_URL   (Discord or Slack webhook URL — never put it in code)
// Optional: SUPABASE_URL, SUPABASE_ANON_KEY (defaults to your public project values)
//
// Changes vs the old version:
//  * Webhook URL comes from an environment variable, not from the source code.
//  * Only a logged-in Admin can trigger it (checked with the caller's own login token).
//  * Message text is cleaned and Discord mentions (@everyone / @here / roles) are disabled.
//  * CORS wildcard removed (the site calls this from its own domain), simple rate limit added.

const SB_URL_DEFAULT = 'https://awvcorswnzbxsrrzepto.supabase.co';
const ANON_DEFAULT = 'sb_publishable_6GqdbyBWEX7cIkTzcp9yvw_WYNp5GJh';

const hits = [];
function limited(max, ms) {
  const now = Date.now();
  while (hits.length && now - hits[0] > ms) hits.shift();
  if (hits.length >= max) return true;
  hits.push(now);
  return false;
}
const clean = (s, n) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').replace(/@/g, '@\u200b').slice(0, n || 80);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 1) admin only
    const token = String(req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ ok: false, error: 'Login required' });
    const SB_URL = process.env.SUPABASE_URL || SB_URL_DEFAULT;
    const ANON = process.env.SUPABASE_ANON_KEY || ANON_DEFAULT;
    const ar = await fetch(SB_URL + '/rest/v1/rpc/hr_is_admin', {
      method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: '{}'
    });
    if (ar.status === 401) return res.status(401).json({ ok: false, error: 'Login expired - log in again' });
    if (!ar.ok || (await ar.json()) !== true) return res.status(403).json({ ok: false, error: 'Admins only' });
    if (limited(60, 60000)) return res.status(429).json({ ok: false, error: 'Too many requests' });

    // 2) webhook from env
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return res.status(200).json({ ok: false, reason: 'no_webhook' });
    const isDiscord = webhookUrl.includes('discord.com');

    // 3) message
    const { row, isTest } = req.body || {};
    let message;
    if (isTest) message = '🧪 **Test ping** from Hackathon Rivals ✅';
    else if (row && typeof row === 'object') {
      const score = Math.max(0, Math.min(100, Number(row.score) || 0));
      message = '📥 **New Submission**\n**User:** ' + (clean(row.email, 80) || '—') + '\n**Score:** ' + score + '/100\n**Lang:** ' + (clean(row.lang, 30) || '—');
    } else message = '📡 Hackathon Rivals';

    const body = isDiscord ? { content: message, allowed_mentions: { parse: [] } } : { text: message };
    const postRes = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    if (!postRes.ok) {
      const errText = await postRes.text().catch(() => '');
      console.error('Webhook error:', postRes.status, errText);
      return res.status(200).json({ ok: false, status: postRes.status, error: errText.slice(0, 300) });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Function error:', e);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
