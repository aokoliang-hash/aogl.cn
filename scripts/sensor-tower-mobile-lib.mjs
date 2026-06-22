/**
 * Sensor Tower mobile games snapshot render for articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "sensor-tower-mobile-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadSensorTowerMobileSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    return { revenueTop10: [], downloadsTop10: [], downloadsGrowthTop10: [] };
  }
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function noteField(row, lang) {
  return lang === "zh" ? row.noteZh || row.noteEn || "" : row.noteEn || row.noteZh || "";
}

function renderRankTable(rows, columns, lang) {
  const head = `<tr>${columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr>`;
  const body = rows
    .map((row) => {
      const cells = columns.map((c) => {
        const v = typeof c.value === "function" ? c.value(row, lang) : row[c.key];
        return `<td>${v ?? "—"}</td>`;
      });
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");
  return `<table class="article-data-table article-mobile-chart-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

function renderRevenueSection(snapshot, lang) {
  const period = lang === "zh" ? snapshot.periodLabelZh : snapshot.periodLabel;
  const src = snapshot.sourceUrl;
  const intro =
    lang === "zh"
      ? `<p class="article-note">统计周期 <strong>${esc(period)}</strong>。数据来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Sensor Tower · App Performance Insights</a>（App Store + Google Play；不含第三方 Android 市场）。全球手游内购支出约 <strong>${esc(snapshot.revenueSummary?.totalUsd)}</strong>，环比 <strong>${esc(snapshot.revenueSummary?.mom)}</strong>。</p>`
      : `<p class="article-note">Period <strong>${esc(period)}</strong>. Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Sensor Tower · App Performance Insights</a> (App Store + Google Play; third-party Android stores excluded). Global mobile game consumer spending ≈ <strong>${esc(snapshot.revenueSummary?.totalUsd)}</strong>, <strong>${esc(snapshot.revenueSummary?.mom)}</strong> MoM.</p>`;

  const rows = snapshot.revenueTop10 || [];
  const table = renderRankTable(rows, [
    { label: lang === "zh" ? "排名" : "Rank", value: (r) => esc(String(r.rank)) },
    { label: lang === "zh" ? "游戏" : "Game", value: (r) => esc(r.name) },
    { label: lang === "zh" ? "发行/厂商" : "Publisher", value: (r) => esc(r.publisher || "—") },
    { label: lang === "zh" ? "备注" : "Notes", value: (r, l) => esc(noteField(r, l) || "—") },
  ], lang);

  const midNote =
    lang === "zh" ? snapshot.revenueMidRanksNoteZh : snapshot.revenueMidRanksNoteEn;

  const growthTitle = lang === "zh" ? "收入增长亮点（博文摘录）" : "Revenue growth highlights (from blog copy)";
  const growthRows = snapshot.revenueGrowthHighlights || [];
  const growthTable = growthRows.length
    ? renderRankTable(
        growthRows.map((r, i) => ({ rank: i + 1, ...r })),
        [
          { label: "#", value: (r) => esc(String(r.rank)) },
          { label: lang === "zh" ? "游戏" : "Game", value: (r) => esc(r.name) },
          { label: lang === "zh" ? "厂商" : "Publisher", value: (r) => esc(r.publisher || "—") },
          { label: lang === "zh" ? "说明" : "Notes", value: (r, l) => esc(noteField(r, l) || "—") },
        ],
        lang,
      )
    : "";

  return `${intro}
<h3>${lang === "zh" ? "全球手游收入前十（文中点名）" : "Global revenue top 10 (named in post)"}</h3>
${table}
<p class="article-note">${esc(midNote || "")}</p>
<h3>${growthTitle}</h3>
${growthTable}`;
}

function renderDownloadsSection(snapshot, lang) {
  const period = lang === "zh" ? snapshot.periodLabelZh : snapshot.periodLabel;
  const intro =
    lang === "zh"
      ? `<p class="article-note">全球手游下载约 <strong>${esc(snapshot.downloadSummary?.total)}</strong> 次，环比 <strong>${esc(snapshot.downloadSummary?.mom)}</strong>。印度占 <strong>${esc(snapshot.downloadSummary?.topMarkets?.[0]?.share)}</strong>（约 ${esc(snapshot.downloadSummary?.topMarkets?.[0]?.downloads)}）。</p>`
      : `<p class="article-note">Global mobile game downloads ≈ <strong>${esc(snapshot.downloadSummary?.total)}</strong>, <strong>${esc(snapshot.downloadSummary?.mom)}</strong> MoM. India led at <strong>${esc(snapshot.downloadSummary?.topMarkets?.[0]?.share)}</strong> (~${esc(snapshot.downloadSummary?.topMarkets?.[0]?.downloads)}).</p>`;

  const dlTable = renderRankTable(snapshot.downloadsTop10 || [], [
    { label: lang === "zh" ? "排名" : "Rank", value: (r) => esc(String(r.rank)) },
    { label: lang === "zh" ? "游戏" : "Game", value: (r) => esc(r.name) },
    { label: lang === "zh" ? "发行" : "Publisher", value: (r) => esc(r.publisher || "—") },
    { label: lang === "zh" ? "较上期" : "Change", value: (r) => esc(r.change || "—") },
  ], lang);

  const growthTable = renderRankTable(snapshot.downloadsGrowthTop10 || [], [
    { label: lang === "zh" ? "排名" : "Rank", value: (r) => esc(String(r.rank)) },
    { label: lang === "zh" ? "游戏" : "Game", value: (r) => esc(r.name) },
    { label: lang === "zh" ? "发行" : "Publisher", value: (r) => esc(r.publisher || "—") },
    {
      label: lang === "zh" ? "标签" : "Tag",
      value: (r) => esc(r.tag || (lang === "zh" ? "增长" : "Growth")),
    },
  ], lang);

  return `${intro}
<h3>${lang === "zh" ? "全球下载量前十" : "Global downloads top 10"}</h3>
${dlTable}
<h3>${lang === "zh" ? "下载增长前十" : "Downloads growth top 10"}</h3>
${growthTable}`;
}

export function renderSensorTowerMobileSnapshotHtml(snapshot, lang = "zh") {
  return `<div class="article-sensor-tower-snapshot">
${renderRevenueSection(snapshot, lang)}
${renderDownloadsSection(snapshot, lang)}
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- SENSOR_TOWER_MOBILE_SNAPSHOT_AUTO -->";

export function injectSensorTowerMobileSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadSensorTowerMobileSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderSensorTowerMobileSnapshotHtml(snapshot, lang));
}
