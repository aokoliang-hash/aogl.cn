/**
 * Fortune China Tech 50 2026 snapshot render for brands hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "fortune-china-tech-50-2026-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadFortuneChinaTech502026Snapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { entries: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(obj, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return obj[key] || obj[base + "En"] || "";
}

export function renderFortuneChinaTech502026SnapshotHtml(snapshot, lang = "zh") {
  const base = snapshot.sourceListBase || "https://www.fortunechina.com";
  const pdf = snapshot.sources?.tsinghuaPdf || "";
  const intro =
    lang === "zh"
      ? `<p class="article-note"><strong>${esc(snapshot.reportTitleZh)}</strong> · ${esc(snapshot.listPublishedZh)} · ${esc(snapshot.summaryZh)}。存档 <strong>${esc(snapshot.fetchedAt)}</strong>。参考：<a href="${esc(pdf)}" target="_blank" rel="noopener noreferrer">清华 SEM 2026 中国上市公司品牌价值榜分析报告（PDF）</a> · 榜单详情页域名 <code>fortunechina.com</code>。</p>`
      : `<p class="article-note"><strong>${esc(snapshot.reportTitleEn)}</strong> · ${esc(snapshot.listPublishedEn)} · ${esc(snapshot.summaryEn)}. Archived <strong>${esc(snapshot.fetchedAt)}</strong>. Reference: <a href="${esc(pdf)}" target="_blank" rel="noopener noreferrer">Tsinghua SEM 2026 listed-company brand value report (PDF)</a> · list pages on <code>fortunechina.com</code>.</p>`;

  const head = `<tr><th>${lang === "zh" ? "排名" : "Rank"}</th><th>${lang === "zh" ? "公司" : "Company"}</th><th>${lang === "zh" ? "品牌/英文名" : "Brand"}</th></tr>`;
  const body = (snapshot.entries || [])
    .map((row) => {
      const url = `${base}${row.path}`;
      const nameCell =
        lang === "zh"
          ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(row.nameZh)}</a>`
          : `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(row.brand)}</strong></a><br><span class="article-asin">${esc(row.nameZh)}</span>`;
      return `<tr><td>${esc(String(row.rank))}</td><td>${nameCell}</td><td>${esc(row.brand)}</td></tr>`;
    })
    .join("");

  return `<div class="article-fortune-china-tech-50-snapshot">
${intro}
<table class="article-data-table article-fortune-china-tech-50-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- FORTUNE_CHINA_TECH_50_2026_SNAPSHOT_AUTO -->";

export function injectFortuneChinaTech502026Snapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadFortuneChinaTech502026Snapshot();
  return body.replace(SNAPSHOT_MARKER, renderFortuneChinaTech502026SnapshotHtml(snapshot, lang));
}
