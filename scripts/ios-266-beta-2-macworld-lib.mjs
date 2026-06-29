/**
 * iOS 26.6 beta 2 (Macworld) snapshot render for tech hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "ios-266-beta-2-macworld-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadIos266Beta2MacworldSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return { features: [] };
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(obj, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return obj[key] || obj[base + "En"] || "";
}

function renderSteps(steps) {
  return `<ol>${(steps || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`;
}

export function renderIos266Beta2MacworldSnapshotHtml(snapshot, lang = "zh") {
  const src = snapshot.sourceUrl || "";
  const intro =
    lang === "zh"
      ? `<p class="article-note">${esc(snapshot.beta2DateZh)} · ${esc(snapshot.releaseFocusZh)}。来源：<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(snapshot.sourceTitle)}</a>（${esc(snapshot.sourcePublisher)}，存档 ${esc(snapshot.fetchedAt)}）。</p>`
      : `<p class="article-note">${esc(snapshot.beta2DateEn)} · ${esc(snapshot.releaseFocusEn)}. Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(snapshot.sourceTitle)}</a> (${esc(snapshot.sourcePublisher)}, archived ${esc(snapshot.fetchedAt)}).</p>`;

  const featHead = `<tr><th>${lang === "zh" ? "项目" : "Item"}</th><th>${lang === "zh" ? "状态" : "Status"}</th></tr>`;
  const featBody = (snapshot.features || [])
    .map((f) => `<tr><td><strong>${esc(field(f, "name", lang))}</strong></td><td>${esc(field(f, "status", lang))}</td></tr>`)
    .join("");

  const pubLabel = lang === "zh" ? "公开测试版安装步骤" : "Public beta install steps";
  const devLabel = lang === "zh" ? "开发者测试版安装步骤" : "Developer beta install steps";
  const pubSteps = lang === "zh" ? snapshot.publicBetaStepsZh : snapshot.publicBetaStepsEn;
  const devSteps = lang === "zh" ? snapshot.developerBetaStepsZh : snapshot.developerBetaStepsEn;

  const relList = (snapshot.relatedLinks || [])
    .map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(field(l, "title", lang))}</a></li>`)
    .join("");

  return `<div class="article-ios-266-beta-2-snapshot">
${intro}
<h3>${lang === "zh" ? "26.6 已知变化" : "Known 26.6 changes"}</h3>
<table class="article-data-table article-ios-266-features-table">
  <thead>${featHead}</thead>
  <tbody>${featBody}</tbody>
</table>
<h3>${esc(pubLabel)}</h3>
${renderSteps(pubSteps)}
<h3>${esc(devLabel)}</h3>
${renderSteps(devSteps)}
<ul class="article-related-links">${relList}</ul>
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- IOS_266_BETA_2_MACWORLD_SNAPSHOT_AUTO -->";

export function injectIos266Beta2MacworldSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadIos266Beta2MacworldSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderIos266Beta2MacworldSnapshotHtml(snapshot, lang));
}
