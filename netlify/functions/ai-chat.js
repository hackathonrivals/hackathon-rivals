exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };

  try {
    const { message, history } = JSON.parse(event.body || '{}');
    if (!message || typeof message !== 'string')
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'message required' }) };

    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY)
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'GROQ_API_KEY not set' }) };

    const SYSTEM_PROMPT = `You are "Rival AI Mentor" for Hackathon Rivals — India's national hackathon arena inspired by Smart India Hackathon.

Facts:
- Season 2026, Grand Finale 15-17 May 2026, New Delhi
- 17 themes: Smart Automation & AI, Agriculture, MedTech, Blockchain, Robotics, Clean Energy, Smart Cities, EdTech, Water & Sanitation
- Team size: 1-6 members (solo allowed)
- Registration FREE
- Prize pool: ₹1.2 Cr total; ₹1.5 Lakh for 1st place per track
- Judging: Innovation, Feasibility, Relevance, Technical, Presentation (equal weight)
- Registration: SPOC details → Team & Theme → Team Members → Idea PPT

Rules:
- Be friendly, concise (2-4 sentences), encouraging
- Use Hinglish naturally like: "Bilkul! Aapko..." or "Great question! Ye try kar..."
- Use emojis/bullets sparingly
- If unsure: "Ye FAQ ya Discord pe puch lo"`;

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

    if (Array.isArray(history)) {
      history.slice(-6).forEach(h => {
        if (!h || !h.text) return;
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: String(h.text).slice(0, 1000)
        });
      });
    }
    messages.push({ role: 'user', content: message.slice(0, 2000) });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 400
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Groq error:', JSON.stringify(data));
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: data?.error?.message || 'AI error' }) };
    }

    const reply = data?.choices?.[0]?.message?.content
      || "Sorry, main abhi reply nahi bana paya.";

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: reply.trim() })
    };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(err.message || err) }) };
  }
};