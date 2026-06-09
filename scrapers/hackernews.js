const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ai-hustles-bot/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

const KEYWORDS = ['ai', 'chatgpt', 'side hustle', 'freelance', 'earn', 'income', 'money', 'gpt', 'automation', 'passive'];

async function scrapeHackerNews() {
  try {
    const topStories = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids = topStories.slice(0, 100);

    const results = [];
    for (const id of ids) {
      try {
        const item = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!item || item.type !== 'story') continue;

        const title = (item.title || '').toLowerCase();
        const isRelevant = KEYWORDS.some(k => title.includes(k));
        if (!isRelevant) continue;
        if ((item.score || 0) < 20) continue;

        results.push({
          id: String(item.id),
          title: item.title,
          text: item.text || '',
          url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
          score: item.score,
          source: 'hackernews'
        });

        if (results.length >= 10) break;
      } catch (e) { continue; }

      await new Promise(r => setTimeout(r, 100));
    }

    return results;
  } catch (e) {
    console.error('HackerNews error:', e.message);
    return [];
  }
}

module.exports = { scrapeHackerNews };
