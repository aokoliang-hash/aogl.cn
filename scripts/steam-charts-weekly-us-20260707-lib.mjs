/**
 * Steam weekly top sellers US (2026-06-30 – 2026-07-07) snapshot render.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "steam-charts-weekly-us-20260707-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadSteamChartsWeeklyUs20260707Snapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { weeklyTopSellers: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function renderWeeklyTable(rows, lang) {
  if (!rows?.length) {
    return lang === "zh"
      ? `<p class="article-note">暂无周榜数据 — 请打开 Valve 官方 Charts 页核对。</p>`
      : `<p class="article-note">No weekly rows — open official Valve Charts.</p>`;
  }
  const head =
    lang === "zh"
      ? "<tr><th>#</th><th>游戏</th><th>价格（USD）</th><th>排名变化</th><th>在榜周数</th></tr>"
      : "<tr><th>#</th><th>Title</th><th>Price (USD)</th><th>Change</th><th>Weeks on chart</th></tr>";
  const body = rows
    .map((r) => {
      const name = lang === "zh" ? r.nameZh || r.name : r.name;
      const price = lang === "zh" ? r.priceZh || r.price : r.price;
      const change = lang === "zh" ? r.changeZh || r.change : r.change;
      const nameCell = r.url
        ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(name)}</a>`
        : esc(name);
      return `<tr><td>${r.rank}</td><td>${nameCell}</td><td>${esc(price || "—")}</td><td>${esc(change || "—")}</td><td>${esc(String(r.weeksOnChart ?? "—"))}</td></tr>`;
    })
    .join("");
  return `<table class="article-data-table article-weekly-chart-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

export function renderSteamChartsWeeklyUs20260707SnapshotHtml(snapshot, lang = "zh") {
  const week = lang === "zh" ? snapshot.weekLabelZh || snapshot.weekLabel : snapshot.weekLabel;
  const region = lang === "zh" ? snapshot.regionLabelZh || snapshot.region : snapshot.regionLabel || snapshot.region;
  const count = snapshot.weeklyTopSellers?.length ?? 0;
  const src = snapshot.sources?.weeklyTopSellers || "https://store.steampowered.com/charts/topsellers";
  const intro =
    lang === "zh"
      ? `<p class="article-note">统计周期 <strong>${esc(week)}</strong> · 地区 <strong>${esc(region)}</strong> · 存档 <strong>${esc(snapshot.fetchedAt)}</strong>。数据来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Steam 商店 · 每周热销商品（美国）</a>（Top 100 中的前 ${count} 名存档）。</p>`
      : `<p class="article-note">Week <strong>${esc(week)}</strong> · region <strong>${esc(region)}</strong> · archived <strong>${esc(snapshot.fetchedAt)}</strong>. Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Steam store · Weekly top sellers (US)</a> (top ${count} archived from the top-100 list).</p>`;

  return `<div class="article-steam-weekly-us-snapshot">
${intro}
${renderWeeklyTable(snapshot.weeklyTopSellers, lang)}
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- STEAM_CHARTS_WEEKLY_US_20260707_SNAPSHOT_AUTO -->";

export function injectSteamChartsWeeklyUs20260707Snapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadSteamChartsWeeklyUs20260707Snapshot();
  return body.replace(SNAPSHOT_MARKER, renderSteamChartsWeeklyUs20260707SnapshotHtml(snapshot, lang));
}
