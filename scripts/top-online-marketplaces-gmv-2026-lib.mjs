/**
 * SaleHoo Top Online Marketplaces by GMV 2026 snapshot render.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "top-online-marketplaces-gmv-2026-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadTopOnlineMarketplacesGmv2026Snapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { top5: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

export function renderTopOnlineMarketplacesGmv2026SnapshotHtml(snapshot, lang = "zh") {
  const src = snapshot.sources?.article || "";
  const img = snapshot.sources?.imageAmazon || "";
  const intro =
    lang === "zh"
      ? `<p class="article-note"><strong>${esc(snapshot.reportTitleZh)}</strong> · 存档 <strong>${esc(snapshot.fetchedAt)}</strong>。全球 Top 100 在线市场第三方 GMV 预计 <strong>$${esc(String(snapshot.top100GmvUsdT))}T</strong>（${esc(String(snapshot.top100GrowthPct))}% 年增速）。来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">SaleHoo Learn</a>。下表为第三方销售额（GMV，十亿美元）。</p>`
      : `<p class="article-note"><strong>${esc(snapshot.reportTitleEn)}</strong> · archived <strong>${esc(snapshot.fetchedAt)}</strong>. Top 100 marketplaces projected at <strong>$${esc(String(snapshot.top100GmvUsdT))}T</strong> GMV (${esc(String(snapshot.top100GrowthPct))}% growth). Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">SaleHoo Learn</a>. Third-party sales (GMV, $B) below.</p>`;

  const head = `<tr><th>${lang === "zh" ? "排名" : "Rank"}</th><th>${lang === "zh" ? "平台" : "Marketplace"}</th><th>${lang === "zh" ? "GMV（十亿美元）" : "GMV ($B)"}</th><th>${lang === "zh" ? "地区" : "Region"}</th><th>${lang === "zh" ? "模式" : "Model"}</th></tr>`;
  const body = (snapshot.top5 || [])
    .map((row) => {
      return `<tr><td>${esc(String(row.rank))}</td><td><strong>${esc(row.name)}</strong><br><span class="article-asin">${esc(row.owner || "")}</span></td><td>${esc(String(row.gmvUsdB))}</td><td>${esc(row.region)}</td><td>${esc(row.model || "—")}</td></tr>`;
    })
    .join("");

  const shareNote =
    lang === "zh"
      ? `<p class="article-note">前三名（淘宝 + 天猫 + 亚马逊）合计约 <strong>$${esc(String(snapshot.top3CombinedGmvUsdB))}B</strong>，约占 Top 100 总 GMV 的 <strong>${esc(String(snapshot.top3CombinedSharePct))}%</strong>。</p>`
      : `<p class="article-note">Top 3 combined ~<strong>$${esc(String(snapshot.top3CombinedGmvUsdB))}B</strong>, about <strong>${esc(String(snapshot.top3CombinedSharePct))}%</strong> of Top 100 GMV.</p>`;

  const takeaways = (snapshot.keyTakeaways || [])
    .map((t) => {
      const title = lang === "zh" ? t.titleZh : t.titleEn;
      const bodyText = lang === "zh" ? t.bodyZh : t.bodyEn;
      return `<li><strong>${esc(title)}</strong> — ${esc(bodyText)}</li>`;
    })
    .join("");

  const imgBlock = img
    ? `<figure class="article-figure"><a href="${esc(img)}" target="_blank" rel="noopener noreferrer"><img src="${esc(img)}" alt="${lang === "zh" ? "全球在线市场 GMV 示意" : "Global online marketplaces GMV"}" loading="lazy" decoding="async" width="800" height="450"></a></figure>`
    : "";

  return `<div class="article-top-online-marketplaces-gmv-snapshot">
${intro}
${imgBlock}
<table class="article-data-table article-marketplace-gmv-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>
${shareNote}
<h3>${lang === "zh" ? "关键结论" : "Key takeaways"}</h3>
<ul class="article-marketplace-takeaways">${takeaways}</ul>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- TOP_ONLINE_MARKETPLACES_GMV_2026_SNAPSHOT_AUTO -->";

export function injectTopOnlineMarketplacesGmv2026Snapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadTopOnlineMarketplacesGmv2026Snapshot();
  return body.replace(SNAPSHOT_MARKER, renderTopOnlineMarketplacesGmv2026SnapshotHtml(snapshot, lang));
}
