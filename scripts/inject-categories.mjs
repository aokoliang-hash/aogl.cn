#!/usr/bin/env node
/**
 * Injects homepage category feed preview into _multilang/index.html
 * Links to local briefs/ pages; optional homepageCategoryItemLimit preview.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  ROOT,
  loadCategoryData,
  loadSiteConfig,
  renderCategoryFeeds,
} from "./official-feeds-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.join(ROOT, "_multilang", "index.html");
const START = "<!-- CAT_FEEDS_AUTO_START -->";
const END = "<!-- CAT_FEEDS_AUTO_END -->";

function replaceMarker(html, inner) {
  const i0 = html.indexOf(START);
  const i1 = html.indexOf(END);
  if (i0 === -1 || i1 === -1 || i1 <= i0) throw new Error("Category markers missing in _multilang/index.html");
  return html.slice(0, i0 + START.length) + "\n" + inner + "\n      " + html.slice(i1);
}

const config = loadSiteConfig();
const limitRaw = config.homepageCategoryItemLimit;
const limit = limitRaw === undefined || limitRaw === null ? 0 : Number(limitRaw) || 0;
const data = loadCategoryData();
const inner = renderCategoryFeeds(data, { itemLimit: limit, moreHref: "briefs/index.html" });

let html = fs.readFileSync(INDEX, "utf8");
html = replaceMarker(html, inner);
fs.writeFileSync(INDEX, html, "utf8");
console.log(
  limit > 0
    ? `Injected category feeds (homepage preview: ${limit} per section)`
    : "Injected category feeds (full lists, local brief links)"
);
