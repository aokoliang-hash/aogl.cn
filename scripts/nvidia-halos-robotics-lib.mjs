/**
 * NVIDIA Halos for Robotics announcement snapshot render for tech hub articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "nvidia-halos-robotics-snapshot.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadNvidiaHalosRoboticsSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    return { stackLayers: [], keyFacts: [], ecosystemPartners: [], availability: [] };
  }
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

function field(row, base, lang) {
  const key = lang === "zh" ? base + "Zh" : base + "En";
  return row[key] || row[base + "En"] || "";
}

function renderStackTable(rows, lang) {
  const head = `<tr><th>${lang === "zh" ? "层级" : "Layer"}</th><th>${lang === "zh" ? "组件" : "Components"}</th><th>${lang === "zh" ? "作用" : "Role"}</th></tr>`;
  const body = (rows || [])
    .map(
      (r) =>
        `<tr><td>${esc(field(r, "layer", lang))}</td><td>${esc(field(r, "components", lang))}</td><td>${esc(field(r, "role", lang))}</td></tr>`,
    )
    .join("");
  return `<table class="article-data-table article-halos-stack-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

function renderFactsTable(rows, lang) {
  const head = `<tr><th>${lang === "zh" ? "要点" : "Topic"}</th><th>${lang === "zh" ? "内容" : "Detail"}</th><th>${lang === "zh" ? "备注" : "Notes"}</th></tr>`;
  const body = (rows || [])
    .map(
      (r) =>
        `<tr><td>${esc(field(r, "metric", lang))}</td><td>${esc(field(r, "value", lang))}</td><td>${esc(field(r, "note", lang) || "—")}</td></tr>`,
    )
    .join("");
  return `<table class="article-data-table article-halos-facts-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

function renderPartnersTable(rows, lang) {
  const head = `<tr><th>${lang === "zh" ? "类别" : "Category"}</th><th>${lang === "zh" ? "伙伴" : "Partners"}</th><th>${lang === "zh" ? "角色" : "Role"}</th></tr>`;
  const body = (rows || [])
    .map(
      (r) =>
        `<tr><td>${esc(field(r, "category", lang))}</td><td>${esc(field(r, "partners", lang))}</td><td>${esc(field(r, "role", lang))}</td></tr>`,
    )
    .join("");
  return `<table class="article-data-table article-halos-partners-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

function renderAvailabilityTable(rows, lang) {
  const head = `<tr><th>${lang === "zh" ? "项目" : "Item"}</th><th>${lang === "zh" ? "状态" : "Status"}</th><th>${lang === "zh" ? "配置" : "Config"}</th></tr>`;
  const body = (rows || [])
    .map(
      (r) =>
        `<tr><td>${esc(field(r, "item", lang))}</td><td>${esc(field(r, "status", lang))}</td><td>${esc(field(r, "config", lang))}</td></tr>`,
    )
    .join("");
  return `<table class="article-data-table article-halos-availability-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

export function renderNvidiaHalosRoboticsSnapshotHtml(snapshot, lang = "zh") {
  const blog = snapshot.sourceBlogUrl || "https://blogs.nvidia.cn/blog/nvidia-announces-halos-for-robotics-the-industrys-first-full-stack-safety-system-for-physical-ai/";
  const intro =
    lang === "zh"
      ? `<p class="article-note">来源：<a href="${esc(blog)}" target="_blank" rel="noopener noreferrer">NVIDIA 英伟达博客 · Halos for Robotics</a>（${esc(snapshot.fetchedAt)} 存档）。题图由 Agility 提供。</p>`
      : `<p class="article-note">Source: <a href="${esc(blog)}" target="_blank" rel="noopener noreferrer">NVIDIA blog · Halos for Robotics</a> (archived ${esc(snapshot.fetchedAt)}). Hero image courtesy of Agility.</p>`;

  return `<div class="article-nvidia-halos-snapshot">
${intro}
<h3>${lang === "zh" ? "全栈三层架构" : "Three-layer full-stack architecture"}</h3>
${renderStackTable(snapshot.stackLayers, lang)}
<h3>${lang === "zh" ? "发布要点" : "Announcement highlights"}</h3>
${renderFactsTable(snapshot.keyFacts, lang)}
<h3>${lang === "zh" ? "生态系统伙伴（节选）" : "Ecosystem partners (selected)"}</h3>
${renderPartnersTable(snapshot.ecosystemPartners, lang)}
<h3>${lang === "zh" ? "上市与开发者访问" : "Availability & developer access"}</h3>
${renderAvailabilityTable(snapshot.availability, lang)}
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- NVIDIA_HALOS_ROBOTICS_SNAPSHOT_AUTO -->";

export function injectNvidiaHalosRoboticsSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadNvidiaHalosRoboticsSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderNvidiaHalosRoboticsSnapshotHtml(snapshot, lang));
}
