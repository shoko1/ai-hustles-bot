const https = require('https');

const SYSTEM_PROMPT = `אתה מנתח רעיונות לעשיית כסף עם AI.
קבל רשימת פוסטים/סרטונים ובחר עד 2 הרעיונות הטובים ביותר.

קריטריונים לרעיון טוב:
- יש ראיות שאנשים אמיתיים הרוויחו (לא תיאוריה)
- אפשר לעשות בלי ידע טכני
- עלות כניסה נמוכה
- פוטנציאל הכנסה סביר

החזר JSON בלבד (ללא markdown, ללא \`\`\`):
[
  {
    "idea": "שם הרעיון בקצרה",
    "what": "מה עושים - משפט אחד",
    "how_much": "כמה אפשר להרוויח",
    "difficulty": "קל/בינוני/קשה",
    "steps": ["צעד 1", "צעד 2", "צעד 3"],
    "source_url": "הקישור המקורי",
    "score": 7
  }
]

אם אין רעיונות טובים, החזר [].`;

function callClaude(apiKey, items) {
  const content = items.map((p, i) => `[${i+1}] ${p.title}\n${p.text}\nURL: ${p.url}`).join('\n\n---\n\n');

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `נתח את הפוסטים הבאים:\n\n${content}` }]
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          let text = parsed.content?.[0]?.text || '[]';
          text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          resolve(JSON.parse(text));
        } catch (e) {
          console.error('Claude parse error:', data);
          resolve([]);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function scoreIdeas(apiKey, items) {
  if (!items.length) return [];
  const chunks = [];
  for (let i = 0; i < items.length; i += 15) chunks.push(items.slice(i, i + 15));

  const results = [];
  for (const chunk of chunks) {
    const scored = await callClaude(apiKey, chunk);
    results.push(...scored.filter(r => r.score >= 6));
    await new Promise(r => setTimeout(r, 1000));
  }
  return results;
}

module.exports = { scoreIdeas };
