/**
 * Brand Finance Global 500 2026 snapshot render for brands hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "brand-finance-global-500-2026-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadBrandFinanceGlobal500Snapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { top10: [], brandStrength: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function formatUsdM(v) {
  if (v == null) return "—";
  return `$${(v / 1000).toFixed(1)}B`;
}

function rankDeltaCell(row, lang) {
  const d = row.rank2025 != null && row.rank2026 != null ? row.rank2025 - row.rank2026 : null;
  if (d == null || d === 0) return lang === "zh" ? "—" : "—";
  if (d > 0) return lang === "zh" ? `▲ ${d}` : `▲ ${d}`;
  return lang === "zh" ? `▼ ${Math.abs(d)}` : `▼ ${Math.abs(d)}`;
}

function pctCell(p) {
  if (p == null) return "—";
  return p > 0 ? `+${p}%` : `${p}%`;
}

export function renderBrandFinanceGlobal500SnapshotHtml(snapshot, lang = "zh") {
  const geo = lang === "zh" ? snapshot.geoLabelZh : snapshot.geoLabelEn;
  const pdf = snapshot.sources?.pdfPreview || "";
  const csv = snapshot.sources?.csv || "";
  const intro =
    lang === "zh"
      ? `<p class="article-note">榜单 <strong>${esc(snapshot.reportTitleZh || "Global 500 2026")}</strong> · 地区 <strong>${esc(geo)}</strong> · CSV 存档 <strong>${esc(snapshot.fetchedAt)}</strong>（共 ${esc(String(snapshot.totalBrandsInCsv || ""))} 行，其中 ${esc(String(snapshot.brandsWithValueData || ""))} 行含 2026 品牌价值）。来源：<a href="${esc(pdf)}" target="_blank" rel="noopener noreferrer">Brand Finance Global 500 2026 preview PDF</a> · 数据：<code>${esc(csv)}</code>。</p>`
      : `<p class="article-note"><strong>${esc(snapshot.reportTitleEn || "Global 500 2026")}</strong> · ${esc(geo)} · CSV archived <strong>${esc(snapshot.fetchedAt)}</strong> (${esc(String(snapshot.totalBrandsInCsv || ""))} rows, ${esc(String(snapshot.brandsWithValueData || ""))} with 2026 brand value). Source: <a href="${esc(pdf)}" target="_blank" rel="noopener noreferrer">preview PDF</a> · data: <code>${esc(csv)}</code>.</p>`;

  const head = `<tr><th>${lang === "zh" ? "2026 #" : "2026 #"}</th><th>${lang === "zh" ? "品牌" : "Brand"}</th><th>${lang === "zh" ? "国家/地区" : "Country"}</th><th>${lang === "zh" ? "2026 价值" : "2026 value"}</th><th>${lang === "zh" ? "同比" : "YoY"}</th><th>${lang === "zh" ? "2025 #" : "2025 #"}</th><th>${lang === "zh" ? "排名变化" : "Rank Δ"}</th><th>${lang === "zh" ? "评级" : "Rating"}</th></tr>`;

  const body = (snapshot.top10 || [])
    .map((row) => {
      return `<tr><td>${esc(String(row.rank2026))}</td><td><strong>${esc(row.name)}</strong></td><td>${esc(row.country)}</td><td>${esc(formatUsdM(row.value2026UsdM))}</td><td>${esc(pctCell(row.valueChangePct))}</td><td>${esc(row.rank2025 != null ? String(row.rank2025) : "—")}</td><td>${rankDeltaCell(row, lang)}</td><td>${esc(row.rating2026 || "—")}</td></tr>`;
    })
    .join("");

  const strengthHead = `<tr><th>${lang === "zh" ? "强度 #" : "Strength #"}</th><th>${lang === "zh" ? "品牌" : "Brand"}</th><th>BSI</th><th>${lang === "zh" ? "评级" : "Rating"}</th><th>${lang === "zh" ? "2025 强度 #" : "2025 strength #"}</th><th>${lang === "zh" ? "2026 价值 #" : "2026 value #"}</th></tr>`;

  const strengthBody = (snapshot.brandStrength || [])
    .map((row) => {
      return `<tr><td>${esc(String(row.strengthRank))}</td><td><strong>${esc(row.name)}</strong></td><td>${esc(String(row.bsi))}</td><td>${esc(row.rating2026 || "—")}</td><td>${esc(row.strengthRank2025 != null ? String(row.strengthRank2025) : "—")}</td><td>${esc(row.valueRank2026 != null ? String(row.valueRank2026) : "—")}</td></tr>`;
    })
    .join("");

  const aaaNote =
    lang === "zh"
      ? `<p class="article-note">2026 年 Global 500 中共有 <strong>${esc(String(snapshot.aaaPlusCount || 37))}</strong> 个品牌获得 Brand Finance 最高品牌强度评级 <strong>AAA+</strong>。</p>`
      : `<p class="article-note"><strong>${esc(String(snapshot.aaaPlusCount || 37))}</strong> Global 500 brands earned the top <strong>AAA+</strong> brand strength rating in 2026.</p>`;

  return `<div class="article-brand-finance-global-500-snapshot">
${intro}
<table class="article-data-table article-brand-value-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>
<h3>${lang === "zh" ? "品牌强度 Top 节选（BSI）" : "Brand strength excerpt (BSI)"}</h3>
${aaaNote}
<table class="article-data-table article-brand-strength-table">
  <thead>${strengthHead}</thead>
  <tbody>${strengthBody}</tbody>
</table>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- BRAND_FINANCE_GLOBAL_500_SNAPSHOT_AUTO -->";

export function injectBrandFinanceGlobal500Snapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadBrandFinanceGlobal500Snapshot();
  return body.replace(SNAPSHOT_MARKER, renderBrandFinanceGlobal500SnapshotHtml(snapshot, lang));
}
