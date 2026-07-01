/**
 * Instagram Popular snapshot render for life hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "instagram-popular-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadInstagramPopularSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { topics: [], reels: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function renderTable(rows, lang, type) {
  const rankLabel = lang === "zh" ? "排名" : "Rank";
  const nameLabel = type === "topic" ? (lang === "zh" ? "话题 / 标签" : "Topic / tag") : lang === "zh" ? "Reels 主题" : "Reels theme";
  const postsLabel = lang === "zh" ? "帖子数（页面显示）" : "Posts (page count)";
  const linkLabel = lang === "zh" ? "链接" : "Link";

  const head = `<tr><th>${rankLabel}</th><th>${nameLabel}</th>`;
  const headEnd =
    type === "topic"
      ? `<th>${postsLabel}</th><th>${linkLabel}</th></tr>`
      : `<th>${linkLabel}</th></tr>`;

  const body = (rows || [])
    .map((row, i) => {
      const rank = row.rank ?? i + 1;
      const url = type === "topic" ? row.exploreUrl : row.searchUrl;
      const nameCell = url
        ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(row.name || row.title)}</a>`
        : esc(row.name || row.title);
      if (type === "topic") {
        return `<tr><td>${esc(String(rank))}</td><td>${nameCell}</td><td>${esc(row.postsDisplay || "—")}</td><td><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${lang === "zh" ? "Explore" : "Explore"}</a></td></tr>`;
      }
      return `<tr><td>${esc(String(rank))}</td><td>${nameCell}</td><td><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${lang === "zh" ? "搜索" : "Search"}</a></td></tr>`;
    })
    .join("");

  return `<table class="article-data-table article-instagram-popular-table">
  <thead>${head}${headEnd}</thead>
  <tbody>${body}</tbody>
</table>`;
}

export function renderInstagramPopularSnapshotHtml(snapshot, lang = "zh") {
  const src = snapshot.sources?.instagram || "https://www.instagram.com/popular/";
  const intro =
    lang === "zh"
      ? `<p class="article-note"><strong>${esc(snapshot.reportTitleZh)}</strong> · 本站存档 <strong>${esc(snapshot.fetchedAt)}</strong>。${esc(snapshot.summaryZh)} 来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">instagram.com/popular</a>。</p>`
      : `<p class="article-note"><strong>${esc(snapshot.reportTitleEn)}</strong> · archived <strong>${esc(snapshot.fetchedAt)}</strong>. ${esc(snapshot.summaryEn)} Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">instagram.com/popular</a>.</p>`;

  const topicsTitle = lang === "zh" ? "热门话题 / 标签（Top 40）" : "Trending topics / tags (top 40)";
  const reelsTitle = lang === "zh" ? "热门 Reels 主题（Top 25）" : "Trending Reels themes (top 25)";

  return `<div class="article-instagram-popular-snapshot">
${intro}
<h3>${topicsTitle}</h3>
${renderTable(snapshot.topics, lang, "topic")}
<h3>${reelsTitle}</h3>
${renderTable(snapshot.reels, lang, "reels")}
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- INSTAGRAM_POPULAR_SNAPSHOT_AUTO -->";

export function injectInstagramPopularSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadInstagramPopularSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderInstagramPopularSnapshotHtml(snapshot, lang));
}
