#!/usr/bin/env node
/**
 * Injects homepage keyword pills (Google search links) from data/index-pills.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const INDEX = path.join(ROOT, "_multilang", "index.html");
const DATA = path.join(ROOT, "data", "index-pills.json");

const START = "      <!-- INDEX_PILLS_AUTO_START -->";
const END = "      <!-- INDEX_PILLS_AUTO_END -->";

const LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tenTags(data, lang) {
  const primary = Array.isArray(data[lang]) ? data[lang].map(String).filter(Boolean) : [];
  const en = Array.isArray(data.en) ? data.en.map(String).filter(Boolean) : [];
  const out = [...primary];
  let i = 0;
  while (out.length < 10) {
    out.push(en[out.length] || en[i % Math.max(en.length, 1)] || "generative AI tools");
    i++;
  }
  return out.slice(0, 10);
}

/**
 * AdSense first-impression: do not inject Google-search keyword pills on the home page.
 * data/index-pills.json is kept for optional restore later.
 */
function render(_data) {
  return `        <!-- index keyword pills omitted (AdSense: avoid thin SEO pill clusters on home) -->`;
}

function replaceMarker(html, inner) {
  const i0 = html.indexOf(START);
  const i1 = html.indexOf(END);
  if (i0 === -1 || i1 === -1 || i1 <= i0) throw new Error("INDEX_PILLS markers missing in _multilang/index.html");
  return html.slice(0, i0 + START.length) + "\n" + inner + "\n" + html.slice(i1);
}

const data = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, "utf8")) : {};
let html = fs.readFileSync(INDEX, "utf8");
html = replaceMarker(html, render(data));
fs.writeFileSync(INDEX, html, "utf8");
console.log("Index keyword pills cleared (AdSense home IA)");
