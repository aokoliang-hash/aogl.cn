#!/usr/bin/env node
/**
 * Injects AI tools directory from data/tools-directory.json + data/i18n/site-tools-i18n.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { faviconSrcForHtml } from "./favicon-local.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const INDEX = path.join(ROOT, "_multilang", "index.html");
const DATA = path.join(ROOT, "data", "tools-directory.json");
const I18N = path.join(ROOT, "data", "i18n", "site-tools-i18n.json");

const START = "<!-- TOOLS_DIRECTORY_AUTO_START -->";
const END = "<!-- TOOLS_DIRECTORY_AUTO_END -->";

const LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

const pack = JSON.parse(fs.readFileSync(I18N, "utf8"));

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toolName(t, lang) {
  if (lang === "en") return t.name_en;
  if (lang === "zh") return t.name_zh;
  const o = pack.toolDomains?.[t.domain]?.name?.[lang];
  return o != null && o !== "" ? o : t.name_en;
}

function renderTool(t) {
  const icon = faviconSrcForHtml(t.domain);
  const names = LOCALES.map(
    (lang) => `                <span class="tool-tile-name lang-${lang}">${escapeHtml(toolName(t, lang))}</span>`
  ).join("\n");
  return `            <li>
              <a class="tool-tile" href="${escapeHtml(t.url)}" target="_blank" rel="noopener noreferrer">
                <span class="tool-tile-icon-wrap">
                  <img class="tool-tile-icon" src="${icon}" width="36" height="36" alt="" loading="lazy" decoding="async" />
                </span>
${names}
              </a>
            </li>`;
}

function catTitle(cat, lang) {
  if (lang === "en") return cat.title_en;
  if (lang === "zh") return cat.title_zh;
  return pack.categories?.[cat.id]?.title?.[lang] || cat.title_en;
}

function pageHeading(data, lang) {
  if (lang === "en") return data.heading_en;
  if (lang === "zh") return data.heading_zh;
  return pack.heading?.[lang] || data.heading_en;
}

function pageIntro(data, lang) {
  if (lang === "en") return data.intro_en;
  if (lang === "zh") return data.intro_zh;
  return pack.intro?.[lang] || data.intro_en;
}

function render(data) {
  const headingLines = LOCALES.map(
    (lang) => `        <h2 class="page-section-title lang-${lang}">${escapeHtml(pageHeading(data, lang))}</h2>`
  ).join("\n");
  const introLines = LOCALES.map(
    (lang) => `        <p class="tools-intro lang-${lang}">${escapeHtml(pageIntro(data, lang))}</p>`
  ).join("\n");

  const cats = data.categories
    .map((cat) => {
      const items = cat.tools.map(renderTool).join("\n");
      const catHeads = LOCALES.map(
        (lang) => `          <h3 class="tools-cat-heading lang-${lang}">${escapeHtml(catTitle(cat, lang))}</h3>`
      ).join("\n");
      return `        <div class="tools-category" id="tools-${escapeHtml(cat.id)}">
${catHeads}
          <ul class="tools-grid">
${items}
          </ul>
        </div>`;
    })
    .join("\n\n");

  return `      <section id="tools-directory" class="tools-directory" tabindex="-1">
${headingLines}
${introLines}
${cats}
      </section>`;
}

function replaceMarker(html, inner) {
  const i0 = html.indexOf(START);
  const i1 = html.indexOf(END);
  if (i0 === -1 || i1 === -1 || i1 <= i0) throw new Error("TOOLS_DIRECTORY markers missing");
  return html.slice(0, i0 + START.length) + "\n" + inner + "\n\n      " + html.slice(i1);
}

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
let html = fs.readFileSync(INDEX, "utf8");
html = replaceMarker(html, render(data));
fs.writeFileSync(INDEX, html, "utf8");
console.log("Injected tools directory (7 locales)");
