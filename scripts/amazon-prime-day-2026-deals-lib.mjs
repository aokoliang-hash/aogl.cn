/**
 * Amazon Prime Day 2026 Day 3 deals snapshot for shopping hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "amazon-prime-day-2026-deals-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadAmazonPrimeDay2026DealsSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { categories: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(obj, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return obj[key] || obj[base + "En"] || "";
}

export function renderAmazonPrimeDay2026DealsSnapshotHtml(snapshot, lang = "zh") {
  const src = snapshot.sourceUrl || "https://www.aboutamazon.com/news/retail/best-prime-day-deals-2026";
  const intro =
    lang === "zh"
      ? `<p class="article-note"><strong>${esc(snapshot.dayLabelZh)}</strong> · ${esc(snapshot.eventEndNoteZh)} · 活动 ${esc(snapshot.eventStart)}–${esc(snapshot.eventEnd)}。来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(snapshot.sourceTitle)}</a>（About Amazon，2026-06-01 存档）。下表为各品类代表优惠；完整 185+ 清单见官方页。</p>`
      : `<p class="article-note"><strong>${esc(snapshot.dayLabelEn)}</strong> · ${esc(snapshot.eventEndNoteEn)} · event runs ${esc(snapshot.eventStart)}–${esc(snapshot.eventEnd)}. Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(snapshot.sourceTitle)}</a> (About Amazon archive). Tables below are representative picks; see the official page for 185+ deals.</p>`;

  const tables = (snapshot.categories || [])
    .map((cat) => {
      const label = field(cat, "label", lang);
      const head = `<tr><th>${lang === "zh" ? "商品" : "Product"}</th><th>${lang === "zh" ? "折扣" : "Discount"}</th><th>${lang === "zh" ? "链接" : "Link"}</th></tr>`;
      const body = (cat.deals || [])
        .map(
          (d) =>
            `<tr><td>${esc(d.product)}</td><td><strong>${esc(d.discount)}</strong></td><td><a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${lang === "zh" ? "查看优惠" : "Shop deal"}</a></td></tr>`
        )
        .join("");
      return `<h3>${esc(label)}</h3>
<table class="article-data-table article-prime-day-deals-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
    })
    .join("\n");

  const relHead = lang === "zh" ? "官方延伸阅读" : "Official related links";
  const relList = (snapshot.relatedLinks || [])
    .map(
      (l) =>
        `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(field(l, "title", lang))}</a></li>`
    )
    .join("");

  return `<div class="article-prime-day-2026-deals-snapshot">
${intro}
${tables}
<h3>${esc(relHead)}</h3>
<ul class="article-related-links">${relList}</ul>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- AMAZON_PRIME_DAY_2026_DEALS_SNAPSHOT_AUTO -->";

export function injectAmazonPrimeDay2026DealsSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadAmazonPrimeDay2026DealsSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderAmazonPrimeDay2026DealsSnapshotHtml(snapshot, lang));
}
