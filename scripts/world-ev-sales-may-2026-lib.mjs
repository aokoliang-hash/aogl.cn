/**
 * CleanTechnica World EV Sales May 2026 snapshot render for brands hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "world-ev-sales-may-2026-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadWorldEvSalesMay2026Snapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    return { top20ModelsMay: [], oemPluginShare: [] };
  }
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function formatUnits(n) {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

function pctCell(p) {
  if (p == null) return "—";
  return p > 0 ? `+${p}%` : `${p}%`;
}

export function renderWorldEvSalesMay2026SnapshotHtml(snapshot, lang = "zh") {
  const src = snapshot.sources || {};
  const m = snapshot.marketStats || {};
  const intro =
    lang === "zh"
      ? `<p class="article-note"><strong>${esc(snapshot.reportTitleZh)}</strong> · 数据月 <strong>2026-05</strong> · 存档 <strong>${esc(snapshot.fetchedAt)}</strong>。来源：<a href="${esc(src.article)}" target="_blank" rel="noopener noreferrer">CleanTechnica 原文</a>（${esc(snapshot.authorEn)}）。5 月插电车注册约 <strong>${formatUnits(m.pluginRegistrationsMay)}</strong> 辆（${esc(pctCell(m.pluginYoYpct))} YoY）；纯电占插电车 <strong>${esc(String(m.bevShareOfPluginsMayPct))}%</strong>。完整 Top 20 图表：<a href="${esc(src.chartTop20May)}" target="_blank" rel="noopener noreferrer">车型榜图</a> · <a href="${esc(src.tableMay)}" target="_blank" rel="noopener noreferrer">数据表</a>。</p>`
      : `<p class="article-note"><strong>${esc(snapshot.reportTitleEn)}</strong> · period <strong>May 2026</strong> · archived <strong>${esc(snapshot.fetchedAt)}</strong>. Source: <a href="${esc(src.article)}" target="_blank" rel="noopener noreferrer">CleanTechnica article</a> (${esc(snapshot.authorEn)}). ~<strong>${formatUnits(m.pluginRegistrationsMay)}</strong> plugin registrations in May (${esc(pctCell(m.pluginYoYpct))} YoY); BEVs <strong>${esc(String(m.bevShareOfPluginsMayPct))}%</strong> of plugins. Charts: <a href="${esc(src.chartTop20May)}" target="_blank" rel="noopener noreferrer">Top 20 models</a> · <a href="${esc(src.tableMay)}" target="_blank" rel="noopener noreferrer">data table</a>.</p>`;

  const marketRows =
    lang === "zh"
      ? [
          ["插电车注册（5月）", `${formatUnits(m.pluginRegistrationsMay)}（${pctCell(m.pluginYoYpct)}）`],
          ["纯电 YoY / 插混 YoY", `${pctCell(m.bevYoYpct)} / ${pctCell(m.phevYoYpct)}`],
          ["纯电占插电车（5月 / YTD）", `${m.bevShareOfPluginsMayPct}% / ${m.bevShareOfPluginsYtdPct}%`],
          ["纯电市场份额（5月 / 2026 YTD）", `${m.bevMarketShareMayPct}% / ${m.bevMarketShareYtdPct}%`],
          ["插电车市场份额（5月 / 2026 YTD）", `${m.pevMarketShareMayPct}% / ${m.pevMarketShareYtdPct}%`],
          ["剔除中美后 EV YoY（5月）", `${pctCell(m.exChinaUsaEvYoYpct)}（纯电 ${pctCell(m.exChinaUsaBevYoYpct)}）`],
          ["年初至今纯电注册", formatUnits(m.bevRegistrationsYtd)]
        ]
      : [
          ["Plugin registrations (May)", `${formatUnits(m.pluginRegistrationsMay)} (${pctCell(m.pluginYoYpct)})`],
          ["BEV YoY / PHEV YoY", `${pctCell(m.bevYoYpct)} / ${pctCell(m.phevYoYpct)}`],
          ["BEV share of plugins (May / YTD)", `${m.bevShareOfPluginsMayPct}% / ${m.bevShareOfPluginsYtdPct}%`],
          ["BEV market share (May / 2026 YTD)", `${m.bevMarketShareMayPct}% / ${m.bevMarketShareYtdPct}%`],
          ["PEV market share (May / 2026 YTD)", `${m.pevMarketShareMayPct}% / ${m.pevMarketShareYtdPct}%`],
          ["EV YoY ex-China & USA (May)", `${pctCell(m.exChinaUsaEvYoYpct)} (BEV ${pctCell(m.exChinaUsaBevYoYpct)})`],
          ["BEV registrations YTD", formatUnits(m.bevRegistrationsYtd)]
        ];

  const marketHead = `<tr><th>${lang === "zh" ? "指标" : "Metric"}</th><th>${lang === "zh" ? "数值" : "Value"}</th></tr>`;
  const marketBody = marketRows
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`)
    .join("");

  const modelHead = `<tr><th>#</th><th>${lang === "zh" ? "车型" : "Model"}</th><th>${lang === "zh" ? "注册量" : "Registrations"}</th><th>${lang === "zh" ? "同比" : "YoY"}</th></tr>`;
  const modelBody = (snapshot.top20ModelsMay || [])
    .map((row) => {
      const note = row.note ? ` <span class="article-asin">${esc(row.note)}</span>` : "";
      return `<tr><td>${esc(String(row.rank))}</td><td><strong>${esc(row.name)}</strong>${note}</td><td>${esc(formatUnits(row.registrations))}</td><td>${esc(pctCell(row.yoyPct))}</td></tr>`;
    })
    .join("");

  const modelNote =
    lang === "zh"
      ? `<p class="article-note">上表为原文中已披露注册量或排名的车型节选；Top 20 无传统车企代表。完整 20 名见 CleanTechnica 官方图表。</p>`
      : `<p class="article-note">Excerpt of models with disclosed May registrations or ranks; no legacy OEM in the Top 20. See CleanTechnica charts for the full table.</p>`;

  const brandHead = `<tr><th>#</th><th>${lang === "zh" ? "品牌" : "Brand"}</th><th>${lang === "zh" ? "注册量" : "Registrations"}</th><th>${lang === "zh" ? "同比" : "YoY"}</th></tr>`;
  const brandBody = (snapshot.topBrandsMay || [])
    .map((row) => {
      return `<tr><td>${esc(String(row.rank))}</td><td><strong>${esc(row.name)}</strong></td><td>${esc(formatUnits(row.registrations))}</td><td>${esc(pctCell(row.yoyPct))}</td></tr>`;
    })
    .join("");

  const oemHead = `<tr><th>#</th><th>OEM</th><th>${lang === "zh" ? "份额" : "Share"}</th></tr>`;
  const oemBody = (snapshot.oemPluginShare || [])
    .map((row) => `<tr><td>${esc(String(row.rank))}</td><td><strong>${esc(row.name)}</strong></td><td>${esc(String(row.sharePct))}%</td></tr>`)
    .join("");

  const bevOemHead = `<tr><th>#</th><th>OEM (BEV)</th><th>${lang === "zh" ? "份额 YTD" : "YTD share"}</th></tr>`;
  const bevOemBody = (snapshot.oemBevShareYtd || [])
    .map((row) => `<tr><td>${esc(String(row.rank))}</td><td><strong>${esc(row.name)}</strong></td><td>${esc(String(row.sharePct))}%</td></tr>`)
    .join("");

  const ytdList = (snapshot.topBrandsYtd || [])
    .map((row) => `<li><strong>#${esc(String(row.rank))} ${esc(row.name)}</strong>${row.note ? ` — ${esc(row.note)}` : ""}</li>`)
    .join("");

  const legacyHead = `<tr><th>${lang === "zh" ? "车型" : "Model"}</th><th>${lang === "zh" ? "注册量" : "Registrations"}</th></tr>`;
  const legacyBody = (snapshot.legacyModelsOutsideTop20 || [])
    .map((row) => {
      const note = row.note ? ` <span class="article-asin">${esc(row.note)}</span>` : "";
      return `<tr><td><strong>${esc(row.name)}</strong>${note}</td><td>${esc(formatUnits(row.registrations))}</td></tr>`;
    })
    .join("");

  return `<div class="article-world-ev-sales-may-2026-snapshot">
${intro}
<h3>${lang === "zh" ? "全球市场概览" : "Global market overview"}</h3>
<table class="article-data-table article-ev-market-table">
  <thead>${marketHead}</thead>
  <tbody>${marketBody}</tbody>
</table>
<h3>${lang === "zh" ? "5 月畅销车型（节选）" : "Best-selling models — May (excerpt)"}</h3>
<table class="article-data-table article-ev-models-table">
  <thead>${modelHead}</thead>
  <tbody>${modelBody}</tbody>
</table>
${modelNote}
<h3>${lang === "zh" ? "5 月品牌榜（节选）" : "Brands — May (excerpt)"}</h3>
<table class="article-data-table article-ev-brands-table">
  <thead>${brandHead}</thead>
  <tbody>${brandBody}</tbody>
</table>
<h3>${lang === "zh" ? "年初至今品牌变动" : "YTD brand movements"}</h3>
<ul class="article-ev-ytd-list">${ytdList}</ul>
<h3>${lang === "zh" ? "OEM 插电车份额（5月）" : "OEM plugin share (May)"}</h3>
<table class="article-data-table article-ev-oem-table">
  <thead>${oemHead}</thead>
  <tbody>${oemBody}</tbody>
</table>
<h3>${lang === "zh" ? "OEM 纯电份额（YTD）" : "OEM BEV share (YTD)"}</h3>
<table class="article-data-table article-ev-bev-oem-table">
  <thead>${bevOemHead}</thead>
  <tbody>${bevOemBody}</tbody>
</table>
<h3>${lang === "zh" ? "Top 20 之外：传统车企最佳" : "Outside Top 20: best legacy models"}</h3>
<table class="article-data-table article-ev-legacy-table">
  <thead>${legacyHead}</thead>
  <tbody>${legacyBody}</tbody>
</table>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- WORLD_EV_SALES_MAY_2026_SNAPSHOT_AUTO -->";

export function injectWorldEvSalesMay2026Snapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadWorldEvSalesMay2026Snapshot();
  return body.replace(SNAPSHOT_MARKER, renderWorldEvSalesMay2026SnapshotHtml(snapshot, lang));
}
