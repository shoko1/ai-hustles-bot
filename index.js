const fs = require('fs');
const path = require('path');
const { scrapeHackerNews } = require('./scrapers/hackernews');
const { scrapeYouTube } = require('./scrapers/youtube');
const { scoreIdeas } = require('./scorer');
const { publishIdeas } = require('./publisher');

const SEEN_FILE = path.join(__dirname, 'seen.json');
const MAX_SEEN = 500;

function loadSeen() {
  try { return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); }
  catch { return []; }
}

function saveSeen(seen) {
  const trimmed = seen.slice(-MAX_SEEN);
  fs.writeFileSync(SEEN_FILE, JSON.stringify(trimmed, null, 2));
}

async function main() {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID || !CLAUDE_API_KEY) {
    console.error('חסרים משתני סביבה: TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, CLAUDE_API_KEY');
    process.exit(1);
  }

  console.log('🔍 סורק Hacker News...');
  const redditPosts = await scrapeHackerNews();
  console.log(`נמצאו ${redditPosts.length} פריטים ב-Hacker News`);

  console.log('🎥 סורק YouTube...');
  const youtubePosts = await scrapeYouTube(YOUTUBE_API_KEY);
  console.log(`נמצאו ${youtubePosts.length} סרטונים ב-YouTube`);

  const allItems = [...redditPosts, ...youtubePosts];

  const seen = loadSeen();
  const newItems = allItems.filter(p => !seen.includes(p.id));
  console.log(`${newItems.length} פריטים חדשים (לא פורסמו בעבר)`);

  if (!newItems.length) {
    console.log('אין תוכן חדש היום.');
    return;
  }

  console.log('🤖 מנתח עם Claude...');
  const ideas = await scoreIdeas(CLAUDE_API_KEY, newItems);
  console.log(`${ideas.length} רעיונות עברו את הסינון`);

  if (!ideas.length) {
    console.log('לא נמצאו רעיונות איכותיים מספיק היום.');
    return;
  }

  console.log('📤 מפרסם לטלגרם...');
  await publishIdeas(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, ideas);

  const newIds = newItems.map(p => p.id);
  saveSeen([...seen, ...newIds]);
  console.log('✅ הסתיים בהצלחה!');
}

main().catch(console.error);
