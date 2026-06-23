/**
 * Sensor Tower State of AI 2026 snapshot render for tech hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "sensor-tower-state-of-ai-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadStateOfAiSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    return { assistantMetrics: [], commerceMetrics: [], advertisingMetrics: [], landscapeHighlights: [] };
  }
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(row, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return row[key] || row[base + "En"] || "";
}

function renderMetricsTable(rows, lang) {
  if (!rows?.length) return "";
  const head = `<tr><th>${lang === "zh" ? "指标" : "Metric"}</th><th>${lang === "zh" ? "数值" : "Value"}</th><th>${lang === "zh" ? "说明" : "Notes"}</th></tr>`;
  const body = rows
    .map(
      (r) =>
        `<tr><td>${esc(field(r, "metric", lang))}</td><td>${esc(field(r, "value", lang))}</td><td>${esc(field(r, "note", lang) || "—")}</td></tr>`,
    )
    .join("");
  return `<table class="article-data-table article-ai-metrics-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

function renderLandscapeTable(rows, lang) {
  if (!rows?.length) return "";
  const head = `<tr><th>${lang === "zh" ? "主题" : "Topic"}</th><th>${lang === "zh" ? "数据" : "Figure"}</th></tr>`;
  const body = rows
    .map((r) => `<tr><td>${esc(field(r, "topic", lang))}</td><td>${esc(field(r, "value", lang))}</td></tr>`)
    .join("");
  return `<table class="article-data-table article-ai-landscape-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

export function renderStateOfAiSnapshotHtml(snapshot, lang = "zh") {
  const blog = snapshot.sourceBlogUrl || "https://sensortower.com/blog/state-of-ai-2026";
  const report = snapshot.sourceReportUrl || "https://sensortower.com/report/state-of-ai-2026";
  const intro =
    lang === "zh"
      ? `<p class="article-note">来源：<a href="${esc(blog)}" target="_blank" rel="noopener noreferrer">Sensor Tower · State of AI 2026 博文</a>（${esc(snapshot.fetchedAt)} 存档）。完整图表见 <a href="${esc(report)}" target="_blank" rel="noopener noreferrer">官方报告</a>。</p>`
      : `<p class="article-note">Source: <a href="${esc(blog)}" target="_blank" rel="noopener noreferrer">Sensor Tower · State of AI 2026 blog</a> (archived ${esc(snapshot.fetchedAt)}). Full charts: <a href="${esc(report)}" target="_blank" rel="noopener noreferrer">official report</a>.</p>`;

  const themes = (snapshot.threeThemes || [])
    .map((t, i) => `<li>${esc(lang === "zh" ? t.themeZh : t.themeEn)}</li>`)
    .join("");

  return `<div class="article-state-of-ai-snapshot">
${intro}
<h3>${lang === "zh" ? "2026 年 AI 三条主线" : "Three AI themes for 2026"}</h3>
<ol>${themes}</ol>
<h3>${lang === "zh" ? "AI 助手竞争（节选数据）" : "AI assistants (selected metrics)"}</h3>
${renderMetricsTable(snapshot.assistantMetrics, lang)}
<h3>${lang === "zh" ? "AI 与电商（节选数据）" : "AI & commerce (selected metrics)"}</h3>
${renderMetricsTable(snapshot.commerceMetrics, lang)}
<h3>${lang === "zh" ? "AI 与广告（节选数据）" : "AI & advertising (selected metrics)"}</h3>
${renderMetricsTable(snapshot.advertisingMetrics, lang)}
<h3>${lang === "zh" ? "市场体量（报告摘要）" : "Market scale (report highlights)"}</h3>
${renderLandscapeTable(snapshot.landscapeHighlights, lang)}
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- SENSOR_TOWER_STATE_OF_AI_SNAPSHOT_AUTO -->";

export function injectStateOfAiSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadStateOfAiSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderStateOfAiSnapshotHtml(snapshot, lang));
}
