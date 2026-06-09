const https = require('https');

const SUBREDDITS = ['ChatGPT', 'SideHustle', 'beermoney', 'passive_income', 'Entrepreneur'];
const KEYWORDS = ['made', 'earning', 'earned', 'I make', 'per month', 'AI', 'ChatGPT', 'side hustle', 'income'];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function scrapeSubreddit(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=AI+money+earn&sort=top&t=week&limit=25`;
  try {
    const data = await fetch(url);
    return (data.data?.children || []).map(p => ({
      id: p.data.id,
      title: p.data.title,
      text: (p.data.selftext || '').slice(0, 500),
      score: p.data.score,
      url: `https://reddit.com${p.data.permalink}`,
      subreddit: p.data.subreddit
    }));
  } catch (e) {
    console.error(`Reddit error (${subreddit}):`, e.message);
    return [];
  }
}

async function scrapeReddit() {
  const results = [];
  for (const sub of SUBREDDITS) {
    const posts = await scrapeSubreddit(sub);
    const relevant = posts.filter(p =>
      KEYWORDS.some(k => (p.title + p.text).toLowerCase().includes(k.toLowerCase()))
      && p.score > 10
    );
    results.push(...relevant);
    await new Promise(r => setTimeout(r, 1000));
  }
  return results;
}

module.exports = { scrapeReddit };
