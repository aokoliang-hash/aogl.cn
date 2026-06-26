/**
 * PlayStation Studios / Bungie update memo snapshot for games hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "playstation-studios-bungie-update-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadPlaystationStudiosBungieUpdateSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { impacts: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(obj, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return obj[key] || obj[base + "En"] || "";
}

export function renderPlaystationStudiosBungieUpdateSnapshotHtml(snapshot, lang = "zh") {
  const src = snapshot.sourceUrl || "https://sonyinteractive.com/en/news/blog/an-update-from-playstation-studios-2/";
  const intro =
    lang === "zh"
      ? `<p class="article-note"><strong>${esc(snapshot.author)}</strong> · ${esc(snapshot.authorTitleZh)} · ${esc(snapshot.memoDateZh)}。来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(snapshot.sourceTitle)}</a>（${esc(snapshot.publisher)}）。</p>`
      : `<p class="article-note"><strong>${esc(snapshot.author)}</strong> · ${esc(snapshot.authorTitleEn)} · ${esc(snapshot.memoDateEn)}. Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(snapshot.sourceTitle)}</a> (${esc(snapshot.publisher)}).</p>`;

  const head = `<tr><th>${lang === "zh" ? "范围" : "Scope"}</th><th>${lang === "zh" ? "说明" : "Detail"}</th></tr>`;
  const body = (snapshot.impacts || [])
    .map((row) => `<tr><td><strong>${esc(field(row, "area", lang))}</strong></td><td>${esc(field(row, "detail", lang))}</td></tr>`)
    .join("");

  const blocks =
    lang === "zh"
      ? `<p class="article-note"><strong>决策背景：</strong>${esc(snapshot.rationaleZh)}</p>
<p class="article-note"><strong>Destiny：</strong>${esc(snapshot.destinyNoteZh)}</p>
<p class="article-note"><strong>Marathon：</strong>${esc(snapshot.marathonNoteZh)}</p>
<p class="article-note"><strong>员工支持：</strong>${esc(snapshot.supportNoteZh)}</p>`
      : `<p class="article-note"><strong>Context:</strong> ${esc(snapshot.rationaleEn)}</p>
<p class="article-note"><strong>Destiny:</strong> ${esc(snapshot.destinyNoteEn)}</p>
<p class="article-note"><strong>Marathon:</strong> ${esc(snapshot.marathonNoteEn)}</p>
<p class="article-note"><strong>Employee support:</strong> ${esc(snapshot.supportNoteEn)}</p>`;

  const relList = (snapshot.relatedLinks || [])
    .map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(field(l, "title", lang))}</a></li>`)
    .join("");

  return `<div class="article-playstation-bungie-update-snapshot">
${intro}
<table class="article-data-table article-playstation-bungie-impacts-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>
${blocks}
<ul class="article-related-links">${relList}</ul>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- PLAYSTATION_STUDIOS_BUNGIE_UPDATE_SNAPSHOT_AUTO -->";

export function injectPlaystationStudiosBungieUpdateSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadPlaystationStudiosBungieUpdateSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderPlaystationStudiosBungieUpdateSnapshotHtml(snapshot, lang));
}
