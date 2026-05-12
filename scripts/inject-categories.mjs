#!/usr/bin/env node
/**
 * Reads data/categories.json + data/i18n/category-headings.json
 * and replaces <!-- CAT_FEEDS_AUTO_START --> ... END in index.html
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");
const DATA = path.join(ROOT, "data", "categories.json");
const HEAD = path.join(ROOT, "data", "i18n", "category-headings.json");

const START = "<!-- CAT_FEEDS_AUTO_START -->";
const END = "<!-- CAT_FEEDS_AUTO_END -->";

const LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

const headings = JSON.parse(fs.readFileSync(HEAD, "utf8"));

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sectionHeading(sec, lang) {
  if (lang === "en") return sec.heading_en;
  if (lang === "zh") return sec.heading_zh;
  return headings[sec.id]?.[lang] || sec.heading_en;
}

function itemTitle(it, lang) {
  if (lang === "en") return it.title_en;
  if (lang === "zh") return it.title_zh;
  return it.title_en;
}

function itemMeta(it, lang) {
  if (lang === "en") return it.meta_en;
  if (lang === "zh") return it.meta_zh;
  return it.meta_en;
}

function renderList(items, lang) {
  return items
    .map((it) => {
      return `          <li>
            <a href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(itemTitle(it, lang))}</a>
            <span class="article-meta">${escapeHtml(itemMeta(it, lang))}</span>
          </li>`;
    })
    .join("\n");
}

function renderAll(data) {
  const inner = data.sections
    .map((sec) => {
      const h2s = LOCALES.map(
        (lang) => `          <h2 class="cat-feed-title lang-${lang}">${escapeHtml(sectionHeading(sec, lang))}</h2>`
      ).join("\n");
      const uls = LOCALES.map(
        (lang) => `          <ul class="article-list compact lang-${lang}">
${renderList(sec.items, lang)}
          </ul>`
      ).join("\n");
      return `        <section id="${escapeHtml(sec.id)}" class="cat-feed" tabindex="-1">
${h2s}
${uls}
        </section>`;
    })
    .join("\n\n");
  return `      <div class="cat-feeds-wrap" id="feeds" tabindex="-1">
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
console.log("Injected category feeds (7 locales)");
