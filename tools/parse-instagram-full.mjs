import fs from "fs";

const line = fs
  .readFileSync(
    "C:/Users/niego/.cursor/projects/c-wamp-www-aogl-cn/agent-transcripts/66a78e04-a56b-4364-9e6a-940e17aa3d32/66a78e04-a56b-4364-9e6a-940e17aa3d32.jsonl",
    "utf8",
  )
  .split("\n")
  .find((l) => l.includes("instagram.com/popular"));

const msg = JSON.parse(line).message.content.find((c) => c.type === "text")?.text || "";

function slugify(name) {
  return name.replace(/\s+/g, "").replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "").toLowerCase();
}

const topics = [];
const seen = new Set();
// e.g. Birth Right Citizenship · 3&nbsp;万 posts  OR  Ecuador · 2,312&nbsp;万 posts
const topicRe =
  />([^<]{2,80})\s*(?:&nbsp;|&#160;|\u00a0)?·\s*(?:&nbsp;|&#160;|\u00a0)?([\d,]+)(?:&nbsp;|&#160;|\u00a0|\s)*(万|亿)?\s*(?:&nbsp;|&#160;|\u00a0)?posts/gi;

let m;
while ((m = topicRe.exec(msg)) !== null) {
  const name = m[1].trim().replace(/&nbsp;/g, " ");
  const postsDisplay = m[3] ? `${m[2].trim()}${m[3]}` : m[2].trim();
  if (/instagram|meta|log in|sign up|chevron|icon|看看 instagram/i.test(name)) continue;
  const key = name.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  const slug = slugify(name);
  topics.push({
    name,
    postsDisplay,
    exploreUrl: slug
      ? `https://www.instagram.com/explore/tags/${encodeURIComponent(slug)}/`
      : "https://www.instagram.com/popular/",
  });
}

const reels = [];
const reelRe = /aria-label="([^"]+?)(?:的缩略图| thumbnail)"/gi;
while ((m = reelRe.exec(msg)) !== null) {
  const title = m[1].trim();
  if (!title || reels.some((r) => r.title === title)) continue;
  reels.push({
    rank: reels.length + 1,
    title,
    searchUrl: `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(title)}`,
  });
}

console.log("topics:", topics.length, "reels:", reels.length);
console.log(topics.slice(0, 5).map((t) => `${t.name} · ${t.postsDisplay}`).join("\n"));

const snapshot = {
  fetchedAt: "2026-06-01",
  reportTitleZh: "看看 Instagram 上的热门内容",
  reportTitleEn: "Popular on Instagram",
  summaryZh:
    "Instagram /popular/ 页面展示的当下热门话题、标签与 Reels 主题快照；帖子数为页面公开计数，完整互动数据需登录 App 查看。",
  summaryEn:
    "Snapshot of trending topics, hashtags, and Reels themes from Instagram /popular/; post counts are public page figures — full engagement requires the app.",
  sources: { instagram: "https://www.instagram.com/popular/" },
  topics: topics.slice(0, 40),
  reels: reels.slice(0, 25),
};

fs.writeFileSync("data/instagram-popular-snapshot.json", JSON.stringify(snapshot, null, 2) + "\n", "utf8");
