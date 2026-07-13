/**
 * AICPB Global AI Website Rankings Issue 37 (June 2026) — full Top 100 snapshot render.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "aicpb-global-ai-website-rankings-202606-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadAicpbGlobalAiWebsiteRankings202606Snapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { websites: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function pctCell(p) {
  if (p == null) return "—";
  return p > 0 ? `+${p}%` : `${p}%`;
}

function nameCell(row, lang) {
  const label =
    lang === "zh" ? row.name : row.nameEn && row.name !== row.nameEn ? row.nameEn : row.name;
  const url = row.productUrl || "";
  if (!url) return esc(label);
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
}

function renderTable(rows, lang) {
  const rankLabel = lang === "zh" ? "排名" : "Rank";
  const productLabel = lang === "zh" ? "产品" : "Product";
  const metricLabel = lang === "zh" ? "访问量" : "Visits";
  const momLabel = lang === "zh" ? "月环比" : "MoM";

  const head = `<tr><th>${rankLabel}</th><th>${productLabel}</th><th>${metricLabel}</th><th>${momLabel}</th></tr>`;
  const body = (rows || [])
    .map(
      (row) =>
        `<tr><td>${esc(String(row.rank))}</td><td>${nameCell(row, lang)}</td><td>${esc(row.metricDisplay)}</td><td>${esc(pctCell(row.momPct))}</td></tr>`
    )
    .join("");
  return `<div class="article-table-scroll"><table class="article-data-table article-aicpb-rankings-table article-aicpb-rankings-table--full">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table></div>`;
}

export function renderAicpbGlobalAiWebsiteRankings202606SnapshotHtml(snapshot, lang = "zh") {
  const src =
    snapshot.sources?.websitesFull ||
    "https://www.aicpb.com/zh/ai-rankings/products/global-ai-rankings/websites";
  const issue = snapshot.issueNumber ?? 37;
  const count = snapshot.websites?.length ?? 0;
  const intro =
    lang === "zh"
      ? `<p class="article-note"><strong>${esc(snapshot.reportTitleZh)}</strong> · 第 <strong>${issue}</strong> 期 · 统计周期 <strong>${esc(snapshot.periodZh)}</strong> · 官方最后更新 <strong>${esc(snapshot.lastUpdatedOfficial)}</strong> · 本站存档 <strong>${esc(snapshot.fetchedAt)}</strong>。${esc(snapshot.summaryZh)} 来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">AICPB Website 完整榜</a>（Top ${count}）。</p>`
      : `<p class="article-note"><strong>${esc(snapshot.reportTitleEn)}</strong> · issue <strong>${issue}</strong> · period <strong>${esc(snapshot.periodEn)}</strong> · official update <strong>${esc(snapshot.lastUpdatedOfficial)}</strong> · archived <strong>${esc(snapshot.fetchedAt)}</strong>. ${esc(snapshot.summaryEn)} Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">AICPB Website full chart</a> (top ${count}).</p>`;

  const tableTitle =
    lang === "zh"
      ? `全球总榜 · Website Top ${count}（月访问量）`
      : `Global · Website Top ${count} (monthly visits)`;

  return `<div class="article-aicpb-global-ai-rankings-snapshot">
${intro}
<h3>${tableTitle}</h3>
${renderTable(snapshot.websites, lang)}
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- AICPB_GLOBAL_AI_WEBSITE_RANKINGS_202606_SNAPSHOT_AUTO -->";

export function injectAicpbGlobalAiWebsiteRankings202606Snapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadAicpbGlobalAiWebsiteRankings202606Snapshot();
  return body.replace(SNAPSHOT_MARKER, renderAicpbGlobalAiWebsiteRankings202606SnapshotHtml(snapshot, lang));
}
