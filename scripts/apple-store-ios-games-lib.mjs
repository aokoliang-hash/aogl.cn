/**
 * App Store CN iPhone games chart snapshot render for games hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "apple-store-ios-games-cn-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadAppleStoreIosGamesCnSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { entries: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(row, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return row[key] || row[base + "En"] || row[base + "Zh"] || "";
}

export function renderAppleStoreIosGamesCnSnapshotHtml(snapshot, lang = "zh") {
  const geo = lang === "zh" ? snapshot.geoLabelZh : snapshot.geoLabelEn;
  const chart = lang === "zh" ? snapshot.chartTitleZh : snapshot.chartTitleEn;
  const src = snapshot.sourceChartUrl || "https://apps.apple.com/cn/iphone/games";
  const topRows = (snapshot.entries || []).slice(0, 10);
  const intro =
    lang === "zh"
      ? `<p class="article-note">地区 <strong>${esc(geo)}</strong> · ${esc(chart)} · 存档 <strong>${esc(snapshot.fetchedAt)}</strong>。数据来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">App Store · iPhone 游戏</a>（下表 Top 10；完整 25 款见 JSON）。副标题为商店页抓取时展示文案。</p>`
      : `<p class="article-note">Region <strong>${esc(geo)}</strong> · ${esc(chart)} · archived <strong>${esc(snapshot.fetchedAt)}</strong>. Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">App Store · iPhone Games (CN)</a> (top 10 below; full 25 in JSON). Subtitles reflect store copy at capture time.</p>`;

  const head = `<tr><th>${lang === "zh" ? "排名" : "Rank"}</th><th>${lang === "zh" ? "游戏" : "Game"}</th><th>${lang === "zh" ? "副标题" : "Subtitle"}</th><th>${lang === "zh" ? "类型" : "Genre"}</th></tr>`;
  const body = topRows
    .map((row) => {
      const title = field(row, "title", lang);
      const sub = field(row, "subtitle", lang);
      const genre = field(row, "genre", lang);
      return `<tr><td>${esc(String(row.rank))}</td><td><a href="${esc(row.appUrl)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a><br><span class="article-asin">ID ${esc(row.appId)}</span></td><td>${esc(sub)}</td><td>${esc(genre)}</td></tr>`;
    })
    .join("");

  return `<div class="article-apple-store-games-snapshot">
${intro}
<table class="article-data-table article-apple-store-games-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- APPLE_STORE_IOS_GAMES_CN_SNAPSHOT_AUTO -->";

export function injectAppleStoreIosGamesCnSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadAppleStoreIosGamesCnSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderAppleStoreIosGamesCnSnapshotHtml(snapshot, lang));
}
