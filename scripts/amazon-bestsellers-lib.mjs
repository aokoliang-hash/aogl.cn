/**
 * Amazon Best Sellers (Fashion) US snapshot render for shopping hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "amazon-bestsellers-fashion-us-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadAmazonBestsellersFashionSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { entries: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(row, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return row[key] || row[base + "En"] || "";
}

function formatRating(row) {
  const count = Number(row.reviewCount || 0).toLocaleString("en-US");
  return `${row.rating} ★ (${count})`;
}

export function renderAmazonBestsellersFashionSnapshotHtml(snapshot, lang = "zh") {
  const geo = lang === "zh" ? snapshot.geoLabelZh : snapshot.geoLabelEn;
  const chart = lang === "zh" ? snapshot.chartTitleZh : snapshot.chartTitleEn;
  const src = snapshot.sourceChartUrl || "https://www.amazon.com/gp/bestsellers/fashion/";
  const intro =
    lang === "zh"
      ? `<p class="article-note">站点 <strong>${esc(geo)}</strong> · ${esc(chart)} · 存档 <strong>${esc(snapshot.fetchedAt)}</strong>。数据来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Amazon Best Sellers · Fashion</a>（下表 Top 10）。价格与评分为页面抓取时显示，随 ASIN/尺码变化。</p>`
      : `<p class="article-note">Marketplace <strong>${esc(geo)}</strong> · ${esc(chart)} · archived <strong>${esc(snapshot.fetchedAt)}</strong>. Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Amazon Best Sellers · Fashion</a> (top 10 below). Prices and ratings reflect the chart UI at capture time.</p>`;

  const head = `<tr><th>${lang === "zh" ? "排名" : "Rank"}</th><th>${lang === "zh" ? "商品" : "Product"}</th><th>${lang === "zh" ? "评分" : "Rating"}</th><th>${lang === "zh" ? "价格" : "Price"}</th><th>${lang === "zh" ? "类目" : "Category"}</th></tr>`;
  const body = (snapshot.entries || [])
    .map((row) => {
      return `<tr><td>${esc(String(row.rank))}</td><td><a href="${esc(row.productUrl)}" target="_blank" rel="noopener noreferrer">${esc(field(row, "title", lang))}</a><br><span class="article-asin">ASIN ${esc(row.asin)}</span></td><td>${esc(formatRating(row))}</td><td>${esc(row.priceDisplay || "—")}</td><td>${esc(field(row, "category", lang))}</td></tr>`;
    })
    .join("");

  return `<div class="article-amazon-bestsellers-snapshot">
${intro}
<table class="article-data-table article-amazon-bestsellers-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- AMAZON_BESTSELLERS_FASHION_SNAPSHOT_AUTO -->";

export function injectAmazonBestsellersFashionSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadAmazonBestsellersFashionSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderAmazonBestsellersFashionSnapshotHtml(snapshot, lang));
}
