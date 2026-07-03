/**
 * Parse IGN New Games 2026 playlist HTML into snapshot JSON.
 * Usage: node tools/parse-ign-new-games-2026.mjs [html-file]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const htmlPath = process.argv[2] || path.join(__dirname, "ign-new-games-2026-source.html");

if (!fs.existsSync(htmlPath)) {
  console.error("Missing", htmlPath);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, "utf8");
const games = [];
const seen = new Set();

const figureRe =
  /<figure[^>]*data-cy="object-tile"[^>]*>[\s\S]*?<a[^>]+href="(\/games\/[^"]+)"[\s\S]*?<img[^>]+alt="([^"]*)"[^>]+src="([^"]+)"[\s\S]*?data-cy="tile-title">([^<]+)<\/figcaption>[\s\S]*?data-cy="tile-meta">([^<]+)<\/div>/gi;

let m;
while ((m = figureRe.exec(html)) !== null) {
  const slug = m[1].replace(/^\/games\//, "");
  if (seen.has(slug)) continue;
  seen.add(slug);
  games.push({
    rank: games.length + 1,
    title: m[4].trim(),
    developer: m[5].trim(),
    ignPath: m[1],
    ignUrl: `https://www.ign.com${m[1]}`,
    imageUrl: m[3].replace(/&amp;/g, "&"),
    imageAlt: m[2].trim() || m[4].trim(),
  });
}

// Fallback: simpler tile-title / tile-meta pairs if figure regex misses
if (games.length < 10) {
  const titleRe = /data-cy="tile-title">([^<]+)<\/figcaption>[\s\S]*?data-cy="tile-meta">([^<]+)<\/div/gi;
  const hrefRe = /href="(\/games\/[^"]+)"/g;
  const hrefs = [...html.matchAll(hrefRe)].map((x) => x[1]);
  const imgRe = /src="(https:\/\/assets[^"]+ignimgs[^"]+)"/g;
  const imgs = [...html.matchAll(imgRe)].map((x) => x[1].replace(/&amp;/g, "&"));
  let i = 0;
  while ((m = titleRe.exec(html)) !== null) {
    const slug = (hrefs[i] || "").replace(/^\/games\//, "");
    if (!slug || seen.has(slug)) {
      i++;
      continue;
    }
    seen.add(slug);
    games.push({
      rank: games.length + 1,
      title: m[1].trim(),
      developer: m[2].trim(),
      ignPath: hrefs[i] || `/games/${slug}`,
      ignUrl: `https://www.ign.com${hrefs[i] || `/games/${slug}`}`,
      imageUrl: imgs[i] || "",
      imageAlt: m[1].trim(),
    });
    i++;
  }
}

console.log("Parsed", games.length, "games");

const snapshot = {
  fetchedAt: "2026-07-03",
  playlistTitleZh: "New Games 2026",
  playlistTitleEn: "New Games 2026",
  author: "Derek",
  authorIgn: "doomtrain5",
  playlistUpdated: "2026-06-05",
  totalGames: 106,
  howLongToBeatHours: 151,
  summaryZh:
    "IGN Playlist「New Games 2026」收录 106 款在研/待发售游戏，附 HowLongToBeat 合计约 151 小时估算；下表为页面 grid 存档（封面链至 IGN CDN）。",
  summaryEn:
    "IGN Playlist “New Games 2026” tracks 106 upcoming/in-development games with ~151 HowLongToBeat hours combined; table archives the page grid (covers hotlink IGN CDN).",
  sources: {
    playlist: "https://www.ign.com/playlist/doomtrain5/lists/new-games-2026",
  },
  games,
};

fs.writeFileSync(
  path.join(ROOT, "data", "ign-new-games-2026-snapshot.json"),
  JSON.stringify(snapshot, null, 2) + "\n",
  "utf8",
);
