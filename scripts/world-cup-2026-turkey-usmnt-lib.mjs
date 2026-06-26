/**
 * 2026 FIFA World Cup Türkiye vs USMNT match snapshot for portal hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "world-cup-2026-turkey-usmnt-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadWorldCup2026TurkeyUsmntSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { goals: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(obj, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return obj[key] || obj[base + "En"] || "";
}

export function renderWorldCup2026TurkeyUsmntSnapshotHtml(snapshot, lang = "zh") {
  const kctv = snapshot.sources?.kctv || "";
  const fox = snapshot.sources?.foxHighlights || "";
  const fs_ = snapshot.finalScore || {};
  const intro =
    lang === "zh"
      ? `<p class="article-note">${esc(snapshot.competitionZh)} · ${esc(snapshot.venueZh)} · ${esc(snapshot.matchDateZh)} · 终场 <strong>${esc(fs_.home)} ${esc(String(fs_.homeGoals))}–${esc(String(fs_.awayGoals))} ${esc(fs_.away)}</strong>。${esc(snapshot.contextZh)} 来源：<a href="${esc(kctv)}" target="_blank" rel="noopener noreferrer">KCTV5 / AP</a> · 集锦：<a href="${esc(fox)}" target="_blank" rel="noopener noreferrer">FOX Sports Highlights</a>。</p>`
      : `<p class="article-note">${esc(snapshot.competitionEn)} · ${esc(snapshot.venueEn)} · ${esc(snapshot.matchDateEn)} · final <strong>${esc(fs_.home)} ${esc(String(fs_.homeGoals))}–${esc(String(fs_.awayGoals))} ${esc(fs_.away)}</strong>. ${esc(snapshot.contextEn)} Sources: <a href="${esc(kctv)}" target="_blank" rel="noopener noreferrer">KCTV5 / AP</a> · <a href="${esc(fox)}" target="_blank" rel="noopener noreferrer">FOX Sports highlights</a>.</p>`;

  const head = `<tr><th>${lang === "zh" ? "时间" : "Min"}</th><th>${lang === "zh" ? "球队" : "Team"}</th><th>${lang === "zh" ? "进球" : "Scorer"}</th><th>${lang === "zh" ? "说明" : "Note"}</th></tr>`;
  const body = (snapshot.goals || [])
    .map((g) => `<tr><td>${esc(g.minute)}</td><td>${esc(g.team)}</td><td><strong>${esc(g.scorer)}</strong></td><td>${esc(field(g, "note", lang))}</td></tr>`)
    .join("");

  const grp = snapshot.usmntGroup || {};
  const nxt = snapshot.nextMatch || {};
  const after =
    lang === "zh"
      ? `<p class="article-note"><strong>美国小组赛：</strong>${esc(grp.groupResultZh)} · ${esc(grp.groupGoalsZh)}。${esc(snapshot.lineupNotesZh)}</p><p class="article-note"><strong>下一轮：</strong>vs ${esc(nxt.opponent)} · ${esc(nxt.dateZh)} · ${esc(nxt.venueZh)}。</p>`
      : `<p class="article-note"><strong>USMNT group:</strong> ${esc(grp.groupResultEn)} · ${esc(grp.groupGoalsEn)}. ${esc(snapshot.lineupNotesEn)}</p><p class="article-note"><strong>Next:</strong> vs ${esc(nxt.opponent)} · ${esc(nxt.dateEn)} · ${esc(nxt.venueEn)}.</p>`;

  return `<div class="article-world-cup-turkey-usmnt-snapshot">
${intro}
<table class="article-data-table article-world-cup-goals-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>
${after}
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- WORLD_CUP_2026_TURKEY_USMNT_SNAPSHOT_AUTO -->";

export function injectWorldCup2026TurkeyUsmntSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadWorldCup2026TurkeyUsmntSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderWorldCup2026TurkeyUsmntSnapshotHtml(snapshot, lang));
}
