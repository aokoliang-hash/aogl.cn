import fs from "fs";

const line = fs
  .readFileSync(
    "C:/Users/niego/.cursor/projects/c-wamp-www-aogl-cn/agent-transcripts/66a78e04-a56b-4364-9e6a-940e17aa3d32/66a78e04-a56b-4364-9e6a-940e17aa3d32.jsonl",
    "utf8",
  )
  .split("\n")
  .find((l) => l.includes("instagram.com/popular"));

const msg = JSON.parse(line).message.content.find((c) => c.type === "text")?.text || "";
const THUMB = "\u7684\u7f29\u7565\u56fe";
const reels = [];

for (const m of msg.matchAll(/(?:aria-label|alt)="([^"]+)"/g)) {
  const label = m[1];
  if (label.length > 100 || /instagram|chevron|icon|photo|profile/i.test(label)) continue;
  if (!label.includes("\u7f29\u7565\u56fe")) continue;
  const title = label.replace(/\u7684\u7f29\u7565\u56fe$/, "");
  if (!title || reels.some((r) => r.title === title)) continue;
  reels.push({
    rank: reels.length + 1,
    title,
    searchUrl: `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(title)}`,
  });
}

console.log("reels:", reels.length, reels.slice(0, 3).map((r) => r.title));

const snap = JSON.parse(fs.readFileSync("data/instagram-popular-snapshot.json", "utf8"));
snap.reels = reels.slice(0, 25);
fs.writeFileSync("data/instagram-popular-snapshot.json", JSON.stringify(snap, null, 2) + "\n", "utf8");
