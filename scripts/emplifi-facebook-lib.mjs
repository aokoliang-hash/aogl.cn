/**
 * Emplifi US Facebook pages rankings snapshot render for portal hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "emplifi-facebook-us-pages-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadEmplifiFacebookUsPagesSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    return { likeReactions: [], comments: [], shares: [], newFollowers: [], fastestGrowthPct: [] };
  }
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(row, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return row[key] || row[base + "En"] || "";
}

function renderRankTable(rows, columns, lang) {
  if (!rows?.length) return "";
  const head = `<tr>${columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr>`;
  const body = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${c.cell(row, lang)}</td>`).join("")}</tr>`)
    .join("");
  return `<table class="article-data-table article-facebook-rank-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

function nameCell(row, lang) {
  const name = field(row, "name", lang);
  const handle = row.handle ? `/${esc(row.handle)}` : "";
  const url = row.pageUrl || "#";
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(name)}</a><br><span class="article-asin">${handle}</span>`;
}

function metricColumns(metricLabel, lang) {
  return [
    { label: lang === "zh" ? "排名" : "Rank", cell: (r) => esc(String(r.rank)) },
    { label: lang === "zh" ? "主页" : "Page", cell: (r, l) => nameCell(r, l) },
    { label: metricLabel, cell: (r) => esc(r.metricDisplay || "—") },
  ];
}

function growthColumns(lang, showPct = false) {
  const cols = [
    { label: lang === "zh" ? "排名" : "Rank", cell: (r) => esc(String(r.rank)) },
    { label: lang === "zh" ? "主页" : "Page", cell: (r, l) => nameCell(r, l) },
    { label: "2024", cell: (r) => esc(r.followers2024 || "—") },
    { label: "2025", cell: (r) => esc(r.followers2025 || "—") },
  ];
  cols.push({
    label: showPct ? (lang === "zh" ? "增幅" : "Change %") : lang === "zh" ? "新增粉丝" : "New followers",
    cell: (r) => esc(r.metricDisplay || "—"),
  });
  return cols;
}

export function renderEmplifiFacebookUsPagesSnapshotHtml(snapshot, lang = "zh") {
  const geo = lang === "zh" ? snapshot.geoLabelZh : snapshot.geoLabelEn;
  const period = lang === "zh" ? snapshot.dataPeriodZh : snapshot.dataPeriodEn;
  const src = snapshot.sourceBlogUrl || "https://emplifi.io/resources/blog/most-liked-u-s-facebook-pages/";
  const intro =
    lang === "zh"
      ? `<p class="article-note">地区 <strong>${esc(geo)}</strong> · 数据区间 <strong>${esc(period)}</strong> · 博文发布 <strong>${esc(snapshot.fetchedAt)}</strong>。来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Emplifi · 10 Most Popular US Facebook Pages 2026</a>（Emplifi 数据库内美国品牌主页样本；非 Facebook 官方榜）。</p>`
      : `<p class="article-note">Region <strong>${esc(geo)}</strong> · period <strong>${esc(period)}</strong> · blog <strong>${esc(snapshot.fetchedAt)}</strong>. Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Emplifi · 10 Most Popular US Facebook Pages 2026</a> (US brand profiles in Emplifi database — not an official Facebook chart).</p>`;

  const points = (snapshot.keyPoints || [])
    .map((p) => `<li>${esc(lang === "zh" ? p.pointZh : p.pointEn)}</li>`)
    .join("");

  return `<div class="article-emplifi-facebook-snapshot">
${intro}
<h3>${lang === "zh" ? "Emplifi 要点" : "Emplifi key points"}</h3>
<ul>${points}</ul>
<h3>${lang === "zh" ? "Like 反应 Top 10" : "Top 10 by Like reactions"}</h3>
${renderRankTable(snapshot.likeReactions, metricColumns(lang === "zh" ? "Like 反应" : "Like reactions", lang), lang)}
<h3>${lang === "zh" ? "评论 Top 10" : "Top 10 by comments"}</h3>
${renderRankTable(snapshot.comments, metricColumns(lang === "zh" ? "评论数" : "Comments", lang), lang)}
<h3>${lang === "zh" ? "分享 Top 10" : "Top 10 by shares"}</h3>
${renderRankTable(snapshot.shares, metricColumns(lang === "zh" ? "分享数" : "Shares", lang), lang)}
<h3>${lang === "zh" ? "年度新增粉丝 Top 10" : "Top 10 by new followers (yearly)"}</h3>
${renderRankTable(snapshot.newFollowers, growthColumns(lang, false), lang)}
<h3>${lang === "zh" ? "粉丝增幅 Top 10（%）" : "Top 10 by follower growth (%)"}</h3>
${renderRankTable(snapshot.fastestGrowthPct, growthColumns(lang, true), lang)}
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- EMPLIFI_FACEBOOK_US_PAGES_SNAPSHOT_AUTO -->";

export function injectEmplifiFacebookUsPagesSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadEmplifiFacebookUsPagesSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderEmplifiFacebookUsPagesSnapshotHtml(snapshot, lang));
}
