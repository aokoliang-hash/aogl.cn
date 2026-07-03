import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const cdpPath =
  process.argv[2] ||
  "C:/Users/niego/.cursor/browser-logs/cdp-response-Runtime.evaluate-2026-07-03T02-24-44-912Z.json";

const cdp = JSON.parse(fs.readFileSync(cdpPath, "utf8"));
const games = JSON.parse(cdp.result.value);

const snapshot = {
  fetchedAt: "2026-07-03",
  playlistTitleZh: "New Games 2026",
  playlistTitleEn: "New Games 2026",
  author: "Derek",
  authorIgn: "doomtrain5",
  playlistUpdated: "2026-06-05",
  totalGames: 106,
  howLongToBeatHours: 151,
  heroMontageUrl:
    "https://assets-prd.ignimgs.com/montage/4e/2023/10/19/janet-demornay-is-a-slumlord-and-a-witch-button-1697705428219.jpg;/2024/01/15/kusan-button-1705362962845.jpg;/2020/08/05/low-fi-button-01-1596589294647.jpg;/2023/06/11/mariachil-1686518253396.jpg?crop=3%3A2&width=909&height=606&format=jpg&auto=webp&quality=80",
  summaryZh:
    "IGN 用户 Derek（doomtrain5）Playlist「New Games 2026」收录 106 款在研/待发售游戏，HowLongToBeat 合计约 151 小时；下表与封面网格为 2026-07-03 自 IGN 页面存档（封面链至 IGN CDN）。",
  summaryEn:
    "Derek’s IGN Playlist “New Games 2026” tracks 106 upcoming/in-development titles (~151 HowLongToBeat hours combined). Grid and table archived 2026-07-03 from the live playlist (covers hotlink IGN CDN).",
  sources: {
    playlist: "https://www.ign.com/playlist/doomtrain5/lists/new-games-2026",
  },
  featuredSlugs: [
    "grand-theft-auto-vi",
    "the-witcher-iv",
    "marvels-wolverine",
    "the-duskbloods",
    "fable",
    "phantom-blade-zero",
    "control-resonant",
    "tomb-raider-legacy-of-atlantis",
  ],
  games,
};

fs.writeFileSync(
  path.join(ROOT, "data", "ign-new-games-2026-snapshot.json"),
  JSON.stringify(snapshot, null, 2) + "\n",
  "utf8",
);
console.log("Wrote", games.length, "games to snapshot");
