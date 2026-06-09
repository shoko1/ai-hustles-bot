const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function scrapeYouTube(apiKey) {
  if (!apiKey) return [];
  const queries = ['AI side hustle 2025', 'make money with AI no skills', 'AI passive income'];
  const results = [];

  for (const q of queries) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&order=viewCount&publishedAfter=${getLastWeek()}&maxResults=10&key=${apiKey}`;
    try {
      const data = await fetch(url);
      const videos = (data.items || []).map(v => ({
        id: v.id.videoId,
        title: v.snippet.title,
        text: v.snippet.description.slice(0, 300),
        url: `https://youtube.com/watch?v=${v.id.videoId}`,
        source: 'youtube'
      }));
      results.push(...videos);
    } catch (e) {
      console.error('YouTube error:', e.message);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return results;
}

function getLastWeek() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

module.exports = { scrapeYouTube };
