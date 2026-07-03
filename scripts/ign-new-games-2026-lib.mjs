/**
 * IGN New Games 2026 playlist snapshot render for games hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "ign-new-games-2026-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadIgnNewGames2026Snapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { games: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function renderFeaturedGrid(games, lang) {
  const title = lang === "zh" ? "焦点新作（封面预览）" : "Spotlight picks (cover preview)";
  const items = games
    .map(
      (g) => `<figure class="article-ign-game-card">
  <a href="${esc(g.ignUrl)}" target="_blank" rel="noopener noreferrer">
    <img src="${esc(g.imageUrl)}" alt="${esc(g.imageAlt || g.title)}" loading="lazy" width="120" height="120" />
    <figcaption><strong>${esc(g.title)}</strong><br><span class="article-asin">${esc(g.developer)}</span></figcaption>
  </a>
</figure>`,
    )
    .join("\n");
  return `<h3>${title}</h3>
<div class="article-ign-game-grid">${items}</div>`;
}

function renderTable(games, lang) {
  const head = `<tr><th>${lang === "zh" ? "序" : "#"}</th><th>${lang === "zh" ? "游戏" : "Game"}</th><th>${lang === "zh" ? "开发商" : "Developer"}</th><th>${lang === "zh" ? "IGN" : "IGN"}</th></tr>`;
  const body = games
    .map(
      (g) =>
        `<tr><td>${esc(String(g.rank))}</td><td><a href="${esc(g.ignUrl)}" target="_blank" rel="noopener noreferrer">${esc(g.title)}</a></td><td>${esc(g.developer)}</td><td><a href="${esc(g.ignUrl)}" target="_blank" rel="noopener noreferrer">${lang === "zh" ? "条目" : "Page"}</a></td></tr>`,
    )
    .join("");
  return `<table class="article-data-table article-ign-new-games-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

export function renderIgnNewGames2026SnapshotHtml(snapshot, lang = "zh") {
  const src = snapshot.sources?.playlist || "https://www.ign.com/playlist/doomtrain5/lists/new-games-2026";
  const total = snapshot.totalGames || snapshot.games?.length || 0;
  const hltb = snapshot.howLongToBeatHours || 151;
  const intro =
    lang === "zh"
      ? `<p class="article-note"><strong>${esc(snapshot.playlistTitleZh)}</strong> · 作者 ${esc(snapshot.author)} · Playlist 更新 <strong>${esc(snapshot.playlistUpdated)}</strong> · 本站存档 <strong>${esc(snapshot.fetchedAt)}</strong>。共 <strong>${total}</strong> 款 · HowLongToBeat 合计约 <strong>${hltb}</strong> 小时。来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">IGN Playlist</a>（封面热链 IGN CDN；完整 106 款见下表）。</p>`
      : `<p class="article-note"><strong>${esc(snapshot.playlistTitleEn)}</strong> · by ${esc(snapshot.author)} · playlist updated <strong>${esc(snapshot.playlistUpdated)}</strong> · archived <strong>${esc(snapshot.fetchedAt)}</strong>. <strong>${total}</strong> games · ~<strong>${hltb}</strong> HowLongToBeat hours. Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">IGN Playlist</a> (covers hotlink IGN CDN; full list below).</p>`;

  const all = snapshot.games || [];
  const featuredSlugs = snapshot.featuredSlugs || [];
  const featured = featuredSlugs
    .map((slug) => all.find((g) => g.ignPath === `/games/${slug}`))
    .filter(Boolean);

  const tableTitle = lang === "zh" ? "完整清单（106 款）" : "Full list (106 games)";

  return `<div class="article-ign-new-games-snapshot">
${intro}
${renderFeaturedGrid(featured.length ? featured : all.slice(0, 8), lang)}
<h3>${tableTitle}</h3>
${renderTable(all, lang)}
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- IGN_NEW_GAMES_2026_SNAPSHOT_AUTO -->";

export function injectIgnNewGames2026Snapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadIgnNewGames2026Snapshot();
  return body.replace(SNAPSHOT_MARKER, renderIgnNewGames2026SnapshotHtml(snapshot, lang));
}
