/**
 * Google Trends US RSS snapshot render for index / portal articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "google-trends-us-rss-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadGoogleTrendsRssSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { entries: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function newsCell(row) {
  const items = row.newsItems || [];
  if (!items.length) return "—";
  return items
    .slice(0, 2)
    .map((n) => {
      const label = esc(n.title);
      if (n.url) return `<a href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">${label}</a> <span class="article-news-source">(${esc(n.source || "")})</span>`;
      return label;
    })
    .join("<br>");
}

export function renderGoogleTrendsRssSnapshotHtml(snapshot, lang = "zh") {
  const geo = lang === "zh" ? snapshot.geoLabelZh : snapshot.geoLabelEn;
  const win = lang === "zh" ? snapshot.windowLabelZh : snapshot.windowLabelEn;
  const rss = snapshot.sources?.rss || "https://trends.google.com/trending/rss?geo=US";
  const trending = snapshot.sources?.trending || "https://trends.google.com/trending?geo=US";

  const intro =
    lang === "zh"
      ? `<p class="article-note">地区 <strong>${esc(geo)}</strong> · ${esc(win)} · 抓取 <strong>${esc(snapshot.fetchedAt)}</strong>（RSS 共 ${esc(String(snapshot.totalItemsInFeed || snapshot.entries?.length || 0))} 条，下表全部列出并按 <code>ht:approx_traffic</code> 排序）。订阅源：<a href="${esc(rss)}" target="_blank" rel="noopener noreferrer">trends.google.com/trending/rss?geo=US</a> · 网页：<a href="${esc(trending)}" target="_blank" rel="noopener noreferrer">Trending</a>。</p>`
      : `<p class="article-note">Region <strong>${esc(geo)}</strong> · ${esc(win)} · pulled <strong>${esc(snapshot.fetchedAt)}</strong> (${esc(String(snapshot.totalItemsInFeed || ""))} RSS items, sorted by <code>ht:approx_traffic</code>). Feed: <a href="${esc(rss)}" target="_blank" rel="noopener noreferrer">RSS</a> · page: <a href="${esc(trending)}" target="_blank" rel="noopener noreferrer">Trending</a>.</p>`;

  const head = `<tr><th>${lang === "zh" ? "#" : "#"}</th><th>${lang === "zh" ? "检索趋势" : "Trend"}</th><th>${lang === "zh" ? "流量档" : "Traffic"}</th><th>${lang === "zh" ? "RSS 时间" : "RSS time"}</th><th>${lang === "zh" ? "相关新闻（节选）" : "Related news"}</th></tr>`;
  const body = (snapshot.entries || [])
    .map((row) => {
      return `<tr><td>${esc(String(row.rank))}</td><td><a href="${esc(row.exploreUrl)}" target="_blank" rel="noopener noreferrer">${esc(row.trend)}</a></td><td>${esc(row.traffic || "—")}</td><td>${esc(row.pubDate || "—")}</td><td>${newsCell(row)}</td></tr>`;
    })
    .join("");

  return `<div class="article-google-trends-rss-snapshot">
${intro}
<table class="article-data-table article-trends-rss-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- GOOGLE_TRENDS_RSS_SNAPSHOT_AUTO -->";

export function injectGoogleTrendsRssSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadGoogleTrendsRssSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderGoogleTrendsRssSnapshotHtml(snapshot, lang));
}
