#!/usr/bin/env node
/**
 * Injects AI tools directory from data/tools-directory.html into index.html
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");
const DATA = path.join(ROOT, "data", "tools-directory.json");

const START = "<!-- TOOLS_DIRECTORY_AUTO_START -->";
const END = "<!-- TOOLS_DIRECTORY_AUTO_END -->";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function faviconUrl(domain) {
  return "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(domain) + "&sz=48";
}

function renderTool(t) {
  const icon = faviconUrl(t.domain);
  return `            <li>
              <a class="tool-tile" href="${escapeHtml(t.url)}" target="_blank" rel="noopener noreferrer">
                <span class="tool-tile-icon-wrap">
                  <img class="tool-tile-icon" src="${icon}" width="36" height="36" alt="" loading="lazy" decoding="async" />
                </span>
                <span class="tool-tile-name lang-en">${escapeHtml(t.name_en)}</span>
                <span class="tool-tile-name lang-zh">${escapeHtml(t.name_zh)}</span>
              </a>
            </li>`;
}

function render(data) {
  const cats = data.categories
    .map((cat) => {
      const items = cat.tools.map(renderTool).join("\n");
      return `        <div class="tools-category" id="tools-${escapeHtml(cat.id)}">
          <h3 class="tools-cat-heading lang-en">${escapeHtml(cat.title_en)}</h3>
          <h3 class="tools-cat-heading lang-zh">${escapeHtml(cat.title_zh)}</h3>
          <ul class="tools-grid">
${items}
          </ul>
        </div>`;
    })
    .join("\n\n");

  return `      <section id="tools-directory" class="tools-directory" tabindex="-1">
        <h2 class="page-section-title lang-en">${escapeHtml(data.heading_en)}</h2>
        <h2 class="page-section-title lang-zh">${escapeHtml(data.heading_zh)}</h2>
        <p class="tools-intro lang-en">${escapeHtml(data.intro_en)}</p>
        <p class="tools-intro lang-zh">${escapeHtml(data.intro_zh)}</p>
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
console.log("Injected tools directory from data/tools-directory.json");
