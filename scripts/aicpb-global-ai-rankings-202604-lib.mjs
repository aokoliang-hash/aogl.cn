/**
 * AICPB Global AI Rankings April 2026 snapshot render for brands hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "aicpb-global-ai-rankings-202604-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadAicpbGlobalAiRankings202604Snapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { websites: [], apps: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function pctCell(p) {
  if (p == null) return "—";
  return p > 0 ? `+${p}%` : `${p}%`;
}

function nameCell(row, lang) {
  const label =
    lang === "zh" ? row.name : row.nameEn && row.name !== row.nameEn ? `${row.nameEn} (${row.name})` : row.name;
  const url = row.productUrl || "";
  if (!url) return esc(label);
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
}

function renderTable(rows, lang, platform) {
  const metricLabel =
    platform === "website"
      ? lang === "zh"
        ? "访问量"
        : "Visits"
      : lang === "zh"
        ? "月活跃用户"
        : "MAU";
  const momLabel = lang === "zh" ? "月环比" : "MoM";
  const rankLabel = lang === "zh" ? "排名" : "Rank";
  const productLabel = lang === "zh" ? "产品" : "Product";

  const head = `<tr><th>${rankLabel}</th><th>${productLabel}</th><th>${metricLabel}</th><th>${momLabel}</th></tr>`;
  const body = (rows || [])
    .map(
      (row) =>
        `<tr><td>${esc(String(row.rank))}</td><td>${nameCell(row, lang)}</td><td>${esc(row.metricDisplay)}</td><td>${esc(pctCell(row.momPct))}</td></tr>`
    )
    .join("");
  return `<table class="article-data-table article-aicpb-rankings-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

export function renderAicpbGlobalAiRankings202604SnapshotHtml(snapshot, lang = "zh") {
  const src = snapshot.sources?.aicpb || "https://www.aicpb.com/zh/ai-rankings/products/global-ai-rankings";
  const intro =
    lang === "zh"
      ? `<p class="article-note"><strong>${esc(snapshot.reportTitleZh)}</strong> · 统计周期 <strong>${esc(snapshot.periodZh)}</strong> · 官方最后更新 <strong>${esc(snapshot.lastUpdatedOfficial)}</strong> · 本站存档 <strong>${esc(snapshot.fetchedAt)}</strong>。${esc(snapshot.summaryZh)} 来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">AICPB 全球总榜</a>。</p>`
      : `<p class="article-note"><strong>${esc(snapshot.reportTitleEn)}</strong> · period <strong>${esc(snapshot.periodEn)}</strong> · official update <strong>${esc(snapshot.lastUpdatedOfficial)}</strong> · archived <strong>${esc(snapshot.fetchedAt)}</strong>. ${esc(snapshot.summaryEn)} Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">AICPB global rankings</a>.</p>`;

  const websiteTitle = lang === "zh" ? "全球总榜 · Website Top 10（访问量）" : "Global · Website Top 10 (visits)";
  const appTitle = lang === "zh" ? "全球总榜 · App Top 10（月活跃用户）" : "Global · App Top 10 (MAU)";

  return `<div class="article-aicpb-global-ai-rankings-snapshot">
${intro}
<h3>${websiteTitle}</h3>
${renderTable(snapshot.websites, lang, "website")}
<h3>${appTitle}</h3>
${renderTable(snapshot.apps, lang, "app")}
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- AICPB_GLOBAL_AI_RANKINGS_202604_SNAPSHOT_AUTO -->";

export function injectAicpbGlobalAiRankings202604Snapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadAicpbGlobalAiRankings202604Snapshot();
  return body.replace(SNAPSHOT_MARKER, renderAicpbGlobalAiRankings202604SnapshotHtml(snapshot, lang));
}
