/**
 * YouTube Charts Trending Trailers US snapshot render for portal hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "youtube-trending-trailers-us-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadYoutubeTrendingTrailersSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { entries: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(row, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return row[key] || row[base + "En"] || "";
}

export function renderYoutubeTrendingTrailersSnapshotHtml(snapshot, lang = "zh") {
  const geo = lang === "zh" ? snapshot.geoLabelZh : snapshot.geoLabelEn;
  const chart = lang === "zh" ? snapshot.chartTitleZh : snapshot.chartTitleEn;
  const src = snapshot.sourceChartUrl || "https://charts.youtube.com/charts/TrendingTrailers/us";
  const intro =
    lang === "zh"
      ? `<p class="article-note">地区 <strong>${esc(geo)}</strong> · ${esc(chart)} · 存档 <strong>${esc(snapshot.fetchedAt)}</strong>。数据来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">YouTube Charts · Trending Trailers</a>（下表 Top 10）。</p>`
      : `<p class="article-note">Region <strong>${esc(geo)}</strong> · ${esc(chart)} · archived <strong>${esc(snapshot.fetchedAt)}</strong>. Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">YouTube Charts · Trending Trailers</a> (top 10 below).</p>`;

  const head = `<tr><th>${lang === "zh" ? "排名" : "Rank"}</th><th>${lang === "zh" ? "预告片" : "Trailer"}</th><th>${lang === "zh" ? "频道" : "Channel"}</th><th>${lang === "zh" ? "发布日期" : "Release"}</th><th>${lang === "zh" ? "类型" : "Type"}</th></tr>`;
  const body = (snapshot.entries || [])
    .map((row) => {
      const type =
        lang === "zh"
          ? row.isOfficialTrailer
            ? "官方"
            : "解析/反应"
          : row.isOfficialTrailer
            ? "Official"
            : "Breakdown/Reaction";
      return `<tr><td>${esc(String(row.rank))}</td><td><a href="${esc(row.videoUrl)}" target="_blank" rel="noopener noreferrer">${esc(field(row, "title", lang))}</a></td><td>${esc(field(row, "channel", lang))}</td><td>${esc(row.releaseDate || "—")}</td><td>${esc(type)}</td></tr>`;
    })
    .join("");

  return `<div class="article-youtube-trailers-snapshot">
${intro}
<table class="article-data-table article-youtube-trailers-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- YOUTUBE_TRENDING_TRAILERS_SNAPSHOT_AUTO -->";

export function injectYoutubeTrendingTrailersSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadYoutubeTrendingTrailersSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderYoutubeTrendingTrailersSnapshotHtml(snapshot, lang));
}
