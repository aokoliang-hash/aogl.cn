/**
 * Google Trends US snapshot render for portal hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "google-trends-us-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadGoogleTrendsSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { trending24h: [], topQueriesYear: [], risingQueriesYear: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function renderTable(rows, columns) {
  const head = `<tr>${columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr>`;
  const body = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${c.cell(row)}</td>`).join("")}</tr>`)
    .join("");
  return `<table class="article-data-table article-trends-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

function formatVolume(row, lang) {
  const v = row.volume || "";
  if (lang === "en") {
    if (v.includes("100万")) return "1M+";
    if (v.includes("50万")) return "500K+";
    if (v.includes("20万")) return "200K+";
    if (v.includes("10万")) return "100K+";
    if (v.includes("5万")) return "50K+";
    if (v.includes("2万")) return "20K+";
    if (v.includes("1万")) return "10K+";
    return v;
  }
  return v;
}

function relatedPreview(row) {
  const items = (row.topRelated || []).slice(0, 3);
  if (!items.length) return "—";
  return esc(items.join(" · "));
}

export function renderGoogleTrendsSnapshotHtml(snapshot, lang = "zh") {
  const geo = lang === "zh" ? snapshot.geoLabelZh : snapshot.geoLabelEn;
  const win24 = lang === "zh" ? snapshot.windowLabelZh : snapshot.windowLabelEn;
  const winYear = lang === "zh" ? snapshot.yearWindowLabelZh : snapshot.yearWindowLabelEn;
  const src = snapshot.sources?.trending || "https://trends.google.com/trending?geo=US";

  const intro =
    lang === "zh"
      ? `<p class="article-note">地区 <strong>${esc(geo)}</strong> · ${esc(win24)} · 导出时间 <strong>${esc(snapshot.fetchedAt)} ${esc(snapshot.fetchedAtTime || "")}</strong>。数据来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Google Trends · Trending</a>（CSV 共 ${esc(String(snapshot.totalTrendsInExport || snapshot.trending24h?.length || 0))} 条，下表取搜索量档最高的 25 条）。</p>`
      : `<p class="article-note">Region <strong>${esc(geo)}</strong> · ${esc(win24)} · exported <strong>${esc(snapshot.fetchedAt)} ${esc(snapshot.fetchedAtTime || "")}</strong>. Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Google Trends · Trending</a> (top 25 by volume band from ${esc(String(snapshot.totalTrendsInExport || ""))} CSV rows).</p>`;

  const trending = (snapshot.trending24h || []).map((row, i) => ({ rank: i + 1, ...row }));

  const trendingTable = renderTable(trending, [
    {
      label: lang === "zh" ? "#" : "#",
      cell: (r) => esc(String(r.rank)),
    },
    {
      label: lang === "zh" ? "趋势" : "Trend",
      cell: (r) =>
        `<a href="${esc(r.exploreUrl)}" target="_blank" rel="noopener noreferrer">${esc(r.trend)}</a>`,
    },
    {
      label: lang === "zh" ? "搜索量档" : "Volume band",
      cell: (r) => esc(formatVolume(r, lang)),
    },
    {
      label: lang === "zh" ? "开始时间" : "Started",
      cell: (r) => esc(r.started || "—"),
    },
    {
      label: lang === "zh" ? "相关检索（节选）" : "Related (sample)",
      cell: (r) => relatedPreview(r),
    },
  ]);

  const yearIntro =
    lang === "zh"
      ? `<p class="article-note">${esc(winYear)} — 来自 Google Trends Explore「What people searched for」面板（与 24 小时 Trending 口径不同）。</p>`
      : `<p class="article-note">${esc(winYear)} — from Google Trends Explore “What people searched for” (different scope from 24h Trending).</p>`;

  const topYear = renderTable(
    (snapshot.topQueriesYear || []).map((r, i) => ({ rank: i + 1, ...r })),
    [
      { label: "#", cell: (r) => esc(String(r.rank)) },
      { label: lang === "zh" ? "检索词" : "Query", cell: (r) => esc(r.query) },
      { label: lang === "zh" ? "兴趣变化" : "Interest Δ", cell: (r) => esc(r.change || "—") },
    ],
  );

  const risingYear = renderTable(
    (snapshot.risingQueriesYear || []).map((r, i) => ({ rank: i + 1, ...r })),
    [
      { label: "#", cell: (r) => esc(String(r.rank)) },
      { label: lang === "zh" ? "检索词" : "Query", cell: (r) => esc(r.query) },
      { label: lang === "zh" ? "兴趣变化" : "Interest Δ", cell: (r) => esc(r.change || "—") },
    ],
  );

  return `<div class="article-google-trends-snapshot">
${intro}
<h3>${lang === "zh" ? "Trending now（24 小时 · Top 25）" : "Trending now (24h · top 25)"}</h3>
${trendingTable}
${yearIntro}
<h3>${lang === "zh" ? "过去 12 个月 · Top queries" : "Past 12 months · Top queries"}</h3>
${topYear}
<h3>${lang === "zh" ? "过去 12 个月 · Rising queries" : "Past 12 months · Rising queries"}</h3>
${risingYear}
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- GOOGLE_TRENDS_SNAPSHOT_AUTO -->";

export function injectGoogleTrendsSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadGoogleTrendsSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderGoogleTrendsSnapshotHtml(snapshot, lang));
}
