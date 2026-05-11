#!/usr/bin/env node
/**
 * Reads data/categories.json and replaces <!-- CAT_FEEDS_AUTO_START --> ... END in index.html
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");
const DATA = path.join(ROOT, "data", "categories.json");

const START = "<!-- CAT_FEEDS_AUTO_START -->";
const END = "<!-- CAT_FEEDS_AUTO_END -->";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderList(items, lang) {
  return items
    .map((it) => {
      const title = lang === "zh" ? it.title_zh : it.title_en;
      const meta = lang === "zh" ? it.meta_zh : it.meta_en;
      return `          <li>
            <a href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>
            <span class="article-meta">${escapeHtml(meta)}</span>
          </li>`;
    })
    .join("\n");
}

function renderAll(data) {
  const inner = data.sections
    .map((sec) => {
      const liEn = renderList(sec.items, "en");
      const liZh = renderList(sec.items, "zh");
      return `        <section id="${escapeHtml(sec.id)}" class="cat-feed" tabindex="-1">
          <h2 class="cat-feed-title lang-en">${escapeHtml(sec.heading_en)}</h2>
          <h2 class="cat-feed-title lang-zh">${escapeHtml(sec.heading_zh)}</h2>
          <ul class="article-list compact lang-en">
${liEn}
          </ul>
          <ul class="article-list compact lang-zh">
${liZh}
          </ul>
        </section>`;
    })
    .join("\n\n");
  return `      <div class="cat-feeds-wrap">
${inner}
      </div>`;
}

function replaceMarker(html, inner) {
  const i0 = html.indexOf(START);
  const i1 = html.indexOf(END);
  if (i0 === -1 || i1 === -1 || i1 <= i0) throw new Error("Category markers missing in index.html");
  return html.slice(0, i0 + START.length) + "\n" + inner + "\n      " + html.slice(i1);
}

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
let html = fs.readFileSync(INDEX, "utf8");
html = replaceMarker(html, renderAll(data));
fs.writeFileSync(INDEX, html, "utf8");
console.log("Injected category feeds from data/categories.json");
