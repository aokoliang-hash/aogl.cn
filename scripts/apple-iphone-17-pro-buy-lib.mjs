/**
 * Apple iPhone 17 Pro buy page snapshot render for tech hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "apple-iphone-17-pro-buy-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadAppleIphone17ProBuySnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { storageUnlockPricing: [], carrierDeals: [], tradeInSteps: [], specHighlights: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(obj, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return obj[key] || obj[base + "En"] || "";
}

export function renderAppleIphone17ProBuySnapshotHtml(snapshot, lang = "zh") {
  const buy = snapshot.sources?.buyPage || "https://www.apple.com/shop/buy-iphone/iphone-17-pro";
  const trade = snapshot.sources?.tradeIn || "https://www.apple.com/shop/trade-in";
  const intro =
    lang === "zh"
      ? `<p class="article-note">产品 <strong>${esc(snapshot.productNameZh)}</strong> · 抓取 <strong>${esc(snapshot.fetchedAt)}</strong> · ${esc(snapshot.headlineZh)} · ${esc(snapshot.tradeInCreditRangeZh)}。官方购买页：<a href="${esc(buy)}" target="_blank" rel="noopener noreferrer">apple.com/shop/buy-iphone/iphone-17-pro</a> · Trade In：<a href="${esc(trade)}" target="_blank" rel="noopener noreferrer">Apple Trade In</a>。</p>`
      : `<p class="article-note"><strong>${esc(snapshot.productNameEn)}</strong> · archived <strong>${esc(snapshot.fetchedAt)}</strong> · ${esc(snapshot.headlineEn)} · ${esc(snapshot.tradeInCreditRangeEn)}. Buy: <a href="${esc(buy)}" target="_blank" rel="noopener noreferrer">apple.com</a> · <a href="${esc(trade)}" target="_blank" rel="noopener noreferrer">Trade In</a>.</p>`;

  const priceHead = `<tr><th>${lang === "zh" ? "机型" : "Model"}</th><th>${lang === "zh" ? "容量" : "Storage"}</th><th>${lang === "zh" ? "解锁价（Connect later）" : "Unlocked (connect later)"}</th></tr>`;
  const priceBody = (snapshot.storageUnlockPricing || [])
    .map((r) => `<tr><td>${esc(r.model)}</td><td>${esc(r.storage)}</td><td>$${esc(String(r.priceUsd))}</td></tr>`)
    .join("");

  const carrierHead = `<tr><th>${lang === "zh" ? "运营商" : "Carrier"}</th><th>${lang === "zh" ? "页面摘要" : "Deal headline"}</th></tr>`;
  const carrierBody = (snapshot.carrierDeals || [])
    .map((r) => `<tr><td><strong>${esc(r.carrier)}</strong></td><td>${esc(field(r, "headline", lang))}</td></tr>`)
    .join("");

  const specHead = `<tr><th>${lang === "zh" ? "项目" : "Item"}</th><th>${lang === "zh" ? "iPhone 17 Pro 要点" : "iPhone 17 Pro highlights"}</th></tr>`;
  const specBody = (snapshot.specHighlights || [])
    .map((r) => `<tr><td>${esc(field(r, "key", lang))}</td><td>${esc(field(r, "value", lang))}</td></tr>`)
    .join("");

  const stepsTitle = lang === "zh" ? "Apple Trade In 四步（官方流程）" : "Apple Trade In — four steps (official)";
  const steps = (snapshot.tradeInSteps || [])
    .map(
      (s) =>
        `<li><strong>${esc(String(s.step))}. ${esc(field(s, "title", lang))}</strong> — ${esc(field(s, "body", lang))}</li>`,
    )
    .join("");

  const colors = (snapshot.colors || []).map((c) => esc(c)).join(lang === "zh" ? " · " : " · ");

  return `<div class="article-iphone-17-pro-buy-snapshot">
${intro}
<p class="article-note">${lang === "zh" ? "配色" : "Colors"}: <strong>${colors}</strong></p>
<h3>${lang === "zh" ? "解锁零售价（节选）" : "Unlocked MSRP (excerpt)"}</h3>
<table class="article-data-table article-iphone-price-table">
  <thead>${priceHead}</thead>
  <tbody>${priceBody}</tbody>
</table>
<h3>${lang === "zh" ? "Carrier Deals at Apple（页面摘要）" : "Carrier Deals at Apple"}</h3>
<table class="article-data-table article-iphone-carrier-table">
  <thead>${carrierHead}</thead>
  <tbody>${carrierBody}</tbody>
</table>
<h3>${lang === "zh" ? "规格要点（Pro 系列）" : "Spec highlights (Pro)"}</h3>
<table class="article-data-table article-iphone-spec-table">
  <thead>${specHead}</thead>
  <tbody>${specBody}</tbody>
</table>
<h3>${stepsTitle}</h3>
<ol>${steps}</ol>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- APPLE_IPHONE_17_PRO_BUY_SNAPSHOT_AUTO -->";

export function injectAppleIphone17ProBuySnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadAppleIphone17ProBuySnapshot();
  return body.replace(SNAPSHOT_MARKER, renderAppleIphone17ProBuySnapshotHtml(snapshot, lang));
}
