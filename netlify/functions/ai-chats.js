// netlify/functions/ai-chat.js
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

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY)
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'GEMINI_API_KEY not set in Netlify' }) };

    const SYSTEM_PROMPT = `You are "Rival AI Mentor" for Hackathon Rivals — India's national hackathon arena inspired by Smart India Hackathon.

Facts you can use:
- Season 2026, Grand Finale 15-17 May 2026 in New Delhi
- 17 themes (Smart Automation & AI, Agriculture, MedTech, Blockchain, Robotics, Clean Energy, Smart Cities, EdTech, Water & Sanitation, etc.)
- Team size: 1-6 members (solo allowed)
- Registration FREE
- Prize pool: ₹1.2 Cr total; ₹1.5 Lakh for 1st place per track
- Judging criteria (equal weight): Innovation, Feasibility, Relevance to PS, Technical Proficiency, Presentation
- Registration steps: SPOC details → Team & Theme → Team Members → Idea PPT submission
- Website sections: Themes, Problem Statements, Code Lab, Code Arena, Register, Contact

Rules:
- Be friendly, concise (2-4 sentences), and encouraging
- Use Hinglish (Hindi-English mix) when natural, like: "Bilkul! Aapko..." or "Great question! Ye try kar..."
- Use bullet points or emojis sparingly for readability
- If unsure, say: "Ye check karne ke liye FAQ ya Discord pe puch lo"
- Never make up specific facts, dates, or numbers not in the list above`;

    const contents = [];
    if (Array.isArray(history)) {
      history.slice(-6).forEach(h => {
        if (!h || !h.text) return;
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(h.text).slice(0, 1000) }]
        });
      });
    }
    contents.push({ role: 'user', parts: [{ text: message.slice(0, 2000) }] });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('Gemini error:', JSON.stringify(data));
      const msg = data?.error?.message || 'AI service error';
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: msg }) };
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text 
      || "Sorry, main abhi reply nahi bana paya. Thodi der baad try karo.";

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