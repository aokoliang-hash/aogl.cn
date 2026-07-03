/**
 * Interbrand Best Global Brands 2026 hub article snapshot render.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "interbrand-best-global-brands-2026-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadInterbrandBgb2026Snapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    return { bgb2025Top25: [], bjb2026Top20: [], marketCapTrillionClub2026: [] };
  }
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function formatUsdM(v) {
  if (v == null) return "—";
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}B`;
  return `$${v.toFixed(0)}M`;
}

function pctCell(p) {
  if (p == null) return "—";
  return p > 0 ? `+${p}%` : `${p}%`;
}

function rankDeltaCell(row, lang) {
  if (row.rank2024 == null || row.rank2025 == null) return "—";
  const d = row.rank2024 - row.rank2025;
  if (d === 0) return "—";
  if (d > 0) return lang === "zh" ? `▲ ${d}` : `▲ ${d}`;
  return lang === "zh" ? `▼ ${Math.abs(d)}` : `▼ ${Math.abs(d)}`;
}

export function renderInterbrandBgb2026SnapshotHtml(snapshot, lang = "zh") {
  const st = snapshot.bgbGlobalStatus || {};
  const src = snapshot.sources || {};
  const statusNote =
    lang === "zh"
      ? `<p class="article-note"><strong>Interbrand Best Global Brands 2026</strong> 全球 Top 100 截至 <strong>${esc(snapshot.fetchedAt)}</strong> 尚未正式发布（惯例约 10 月）。本篇以 <a href="${esc(src.bgb2025Report)}" target="_blank" rel="noopener noreferrer">BGB 2025 报告</a> 为全球基线，并收录 <a href="${esc(src.bjb2026PressPdf)}" target="_blank" rel="noopener noreferrer">Best Japan Brands 2026</a>（2026-04-15）区域榜。2025 百强合计 <strong>$${esc(String(st.totalValue2025UsdT || "3.6"))}T</strong>（${esc(pctCell(st.totalValueChangePct2025))}），<strong>${esc(String(st.newEntrants2025 || 12))}</strong> 家新入榜。</p>`
      : `<p class="article-note"><strong>Interbrand Best Global Brands 2026</strong> global Top 100 is not yet published as of <strong>${esc(snapshot.fetchedAt)}</strong> (typically October). This page uses the <a href="${esc(src.bgb2025Report)}" target="_blank" rel="noopener noreferrer">BGB 2025 report</a> as the global baseline plus <a href="${esc(src.bjb2026PressPdf)}" target="_blank" rel="noopener noreferrer">Best Japan Brands 2026</a> (15 Apr 2026). 2025 total brand value: <strong>$${esc(String(st.totalValue2025UsdT || "3.6"))}T</strong> (${esc(pctCell(st.totalValueChangePct2025))}), <strong>${esc(String(st.newEntrants2025 || 12))}</strong> new entrants.</p>`;

  const bgbHead = `<tr><th>${lang === "zh" ? "2025 #" : "2025 #"}</th><th>${lang === "zh" ? "品牌" : "Brand"}</th><th>${lang === "zh" ? "国家/地区" : "Country"}</th><th>${lang === "zh" ? "品牌价值" : "Brand value"}</th><th>${lang === "zh" ? "同比" : "YoY"}</th><th>${lang === "zh" ? "2024 #" : "2024 #"}</th><th>${lang === "zh" ? "排名变化" : "Rank Δ"}</th></tr>`;
  const bgbBody = (snapshot.bgb2025Top25 || [])
    .map((row) => {
      return `<tr><td>${esc(String(row.rank2025))}</td><td><strong>${esc(row.name)}</strong></td><td>${esc(row.country)}</td><td>${esc(formatUsdM(row.valueUsdM))}</td><td>${esc(pctCell(row.valueChangePct))}</td><td>${esc(row.rank2024 != null ? String(row.rank2024) : "—")}</td><td>${rankDeltaCell(row, lang)}</td></tr>`;
    })
    .join("");

  const newcomers = (snapshot.bgb2025NewEntrants || [])
    .map((r) => `${esc(String(r.rank2025))}. ${esc(r.name)}${r.valueUsdM ? ` (${esc(formatUsdM(r.valueUsdM))})` : ""}`)
    .join(lang === "zh" ? " · " : " · ");
  const newcomersNote =
    lang === "zh"
      ? `<p class="article-note">2025 新入榜（节选）：${newcomers}。完整 100 家见 Interbrand 官方 PDF。</p>`
      : `<p class="article-note">2025 new entrants (excerpt): ${newcomers}. Full Top 100 in the official Interbrand report.</p>`;

  const bjbHead = `<tr><th>${lang === "zh" ? "2026 #" : "2026 #"}</th><th>${lang === "zh" ? "品牌" : "Brand"}</th><th>${lang === "zh" ? "品牌价值" : "Brand value"}</th><th>${lang === "zh" ? "同比" : "YoY"}</th><th>${lang === "zh" ? "2025 #" : "2025 #"}</th></tr>`;
  const bjbBody = (snapshot.bjb2026Top20 || [])
    .map((row) => {
      const note = row.note ? ` <span class="article-asin">${esc(row.note)}</span>` : "";
      return `<tr><td>${esc(String(row.rank2026))}</td><td><strong>${esc(row.name)}</strong>${note}</td><td>${esc(formatUsdM(row.valueUsdM))}</td><td>${esc(pctCell(row.valueChangePct))}</td><td>${esc(row.rank2025 != null ? String(row.rank2025) : "NEW")}</td></tr>`;
    })
    .join("");

  const bjbNew = (snapshot.bjb2026NewEntrants || []).map((n) => esc(n)).join(lang === "zh" ? "、" : ", ");
  const bjbNote =
    lang === "zh"
      ? `<p class="article-note">BJB 2026 新入榜：${bjbNew}。日本百强合计约 <strong>$318.9B</strong>（+1.5% YoY）。</p>`
      : `<p class="article-note">BJB 2026 debuts: ${bjbNew}. Japan Top 100 total ~ <strong>$318.9B</strong> (+1.5% YoY).</p>`;

  const capHead = `<tr><th>#</th><th>${lang === "zh" ? "公司" : "Company"}</th><th>${lang === "zh" ? "国家/地区" : "Country"}</th><th>${lang === "zh" ? "市值" : "Market cap"}</th></tr>`;
  const capBody = (snapshot.marketCapTrillionClub2026 || [])
    .map((row) => {
      return `<tr><td>${esc(String(row.rank))}</td><td><strong>${esc(row.name)}</strong></td><td>${esc(row.country)}</td><td>$${esc(String(row.marketCapUsdT))}T</td></tr>`;
    })
    .join("");
  const capNote =
    lang === "zh"
      ? `<p class="article-note"><strong>注意：</strong>下表为 <em>市值</em>（CompaniesMarketCap，2026-06-16），<strong>不是</strong> Interbrand 品牌价值。Apple 市值约 $4.4T，但 BGB 2025 品牌价值约 $471B——口径不可混读。</p>`
      : `<p class="article-note"><strong>Note:</strong> The table below is <em>market capitalization</em> (CompaniesMarketCap, 16 Jun 2026), <strong>not</strong> Interbrand brand value. Apple’s ~$4.4T market cap differs sharply from its ~$471B BGB 2025 brand value.</p>`;

  return `<div class="article-interbrand-bgb-2026-snapshot">
${statusNote}
<h3>${lang === "zh" ? "Best Global Brands 2025 · Top 25 基线" : "Best Global Brands 2025 · Top 25 baseline"}</h3>
<table class="article-data-table article-brand-value-table">
  <thead>${bgbHead}</thead>
  <tbody>${bgbBody}</tbody>
</table>
${newcomersNote}
<h3>${lang === "zh" ? "Best Japan Brands 2026 · Top 20" : "Best Japan Brands 2026 · Top 20"}</h3>
<table class="article-data-table article-brand-value-table">
  <thead>${bjbHead}</thead>
  <tbody>${bjbBody}</tbody>
</table>
${bjbNote}
<h3>${lang === "zh" ? "对照：市值万亿美元俱乐部（非 Interbrand）" : "Reference: $1T+ market cap club (not Interbrand)"}</h3>
${capNote}
<table class="article-data-table article-market-cap-table">
  <thead>${capHead}</thead>
  <tbody>${capBody}</tbody>
</table>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- INTERBRAND_BGB_2026_SNAPSHOT_AUTO -->";

export function injectInterbrandBgb2026Snapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadInterbrandBgb2026Snapshot();
  return body.replace(SNAPSHOT_MARKER, renderInterbrandBgb2026SnapshotHtml(snapshot, lang));
}
