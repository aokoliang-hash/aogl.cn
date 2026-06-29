/**
 * YouTube FIFA Creator Cup / World Cup 2026 creator roster snapshot for portal hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "youtube-fifa-creator-cup-2026-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadYoutubeFifaCreatorCup2026Snapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { creators: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(obj, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return obj[key] || obj[base + "En"] || "";
}

export function renderYoutubeFifaCreatorCup2026SnapshotHtml(snapshot, lang = "zh") {
  const src = snapshot.sourceUrl || "https://blog.youtube/news-and-events/youtube-fifa-world-cup-lineup/";
  const intro =
    lang === "zh"
      ? `<p class="article-note"><strong>YouTube FIFA Creator Cup</strong> · ${esc(snapshot.creatorCupVenueZh)} · <strong>${esc(snapshot.creatorCupDate)}</strong>。${esc(snapshot.creatorCupSummaryZh)}。${esc(snapshot.rosterSummaryZh)}。来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(snapshot.sourceTitle)}</a>（${esc(snapshot.sourcePublisher)}，存档 ${esc(snapshot.fetchedAt)}）。</p>`
      : `<p class="article-note"><strong>YouTube FIFA Creator Cup</strong> · ${esc(snapshot.creatorCupVenueEn)} · <strong>${esc(snapshot.creatorCupDate)}</strong>. ${esc(snapshot.creatorCupSummaryEn)}. ${esc(snapshot.rosterSummaryEn)}. Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(snapshot.sourceTitle)}</a> (${esc(snapshot.sourcePublisher)}, archived ${esc(snapshot.fetchedAt)}).</p>`;

  const head = `<tr><th>${lang === "zh" ? "创作者" : "Creator"}</th><th>${lang === "zh" ? "国家/地区" : "Country"}</th><th>${lang === "zh" ? "报道方向" : "Coverage"}</th></tr>`;
  const body = (snapshot.creators || [])
    .map(
      (c) =>
        `<tr><td><a href="${esc(c.youtube)}" target="_blank" rel="noopener noreferrer"><strong>${esc(c.name)}</strong></a></td><td>${esc(c.country)}</td><td>${esc(field(c, "coverage", lang))}</td></tr>`
    )
    .join("");

  const relList = (snapshot.relatedLinks || [])
    .map((l) => {
      const href = l.url.startsWith("/") ? l.url : l.url;
      const ext = l.url.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<li><a href="${esc(href)}"${ext}>${esc(field(l, "title", lang))}</a></li>`;
    })
    .join("");

  return `<div class="article-youtube-fifa-creator-cup-snapshot">
${intro}
<table class="article-data-table article-youtube-fifa-creators-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>
<ul class="article-related-links">${relList}</ul>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- YOUTUBE_FIFA_CREATOR_CUP_2026_SNAPSHOT_AUTO -->";

export function injectYoutubeFifaCreatorCup2026Snapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadYoutubeFifaCreatorCup2026Snapshot();
  return body.replace(SNAPSHOT_MARKER, renderYoutubeFifaCreatorCup2026SnapshotHtml(snapshot, lang));
}
