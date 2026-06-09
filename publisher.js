const https = require('https');

function sendTelegram(token, chatId, text) {
  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: false });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function formatPost(idea) {
  const diffEmoji = { 'קל': '🟢', 'בינוני': '🟡', 'קשה': '🔴' };
  const steps = idea.steps.map((s, i) => `${i+1}. ${s}`).join('\n');

  return `💡 <b>Side Hustle עם AI</b>

🎯 <b>${idea.idea}</b>
${idea.what}

💰 <b>פוטנציאל:</b> ${idea.how_much}
⚡ <b>רמת קושי:</b> ${diffEmoji[idea.difficulty] || '⚪'} ${idea.difficulty}

📌 <b>איך מתחילים:</b>
${steps}

🔗 <a href="${idea.source_url}">קרא עוד</a>

—
<i>מרעיון להכנסה 🤖</i>`;
}

async function publishIdeas(token, chatId, ideas) {
  for (const idea of ideas) {
    const text = formatPost(idea);
    const result = await sendTelegram(token, chatId, text);
    if (!result.ok) console.error('Telegram error:', result.description);
    else console.log(`✅ פורסם: ${idea.idea}`);
    await new Promise(r => setTimeout(r, 2000));
  }
}

module.exports = { publishIdeas };
