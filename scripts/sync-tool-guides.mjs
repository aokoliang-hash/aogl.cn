#!/usr/bin/env node
/**
 * Sync data/tool-guides/*.json from data/tools-directory.json; attach slug to each tool.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  TOOL_GUIDES_DIR,
  TOOLS_DATA,
  collectToolsFromDirectory,
  normalizeUrl,
  slugFromUrl,
} from "./tool-guide-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function patchToolsDirectory() {
  const data = JSON.parse(fs.readFileSync(TOOLS_DATA, "utf8"));
  data.updated = new Date().toISOString().slice(0, 10);
  for (const cat of data.categories || []) {
    cat.tools = (cat.tools || []).map((t) => ({
      ...t,
      url: normalizeUrl(t.url),
      slug: t.slug || slugFromUrl(normalizeUrl(t.url)),
    }));
  }
  writeJson(TOOLS_DATA, data);
}

function main() {
  const items = collectToolsFromDirectory();
  fs.mkdirSync(TOOL_GUIDES_DIR, { recursive: true });

  let created = 0;
  let updated = 0;
  const slugs = [];

  for (const [, meta] of items) {
    const outPath = path.join(TOOL_GUIDES_DIR, `${meta.slug}.json`);
    let guide = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : null;
    if (!guide) {
      created++;
      guide = {
        slug: meta.slug,
        url: meta.url,
        name_en: meta.name_en,
        name_zh: meta.name_zh,
        domain: meta.domain,
        category_id: meta.category_ids[0],
        category_ids: meta.category_ids,
        category_title_en: meta.category_title_en,
        category_title_zh: meta.category_title_zh,
        updated: new Date().toISOString().slice(0, 10),
      };
    } else {
      updated++;
      guide.name_en = meta.name_en || guide.name_en;
      guide.name_zh = meta.name_zh || guide.name_zh;
      guide.domain = meta.domain || guide.domain;
      guide.category_ids = [...new Set([...(guide.category_ids || []), ...meta.category_ids])];
      guide.category_id = guide.category_ids[0] || guide.category_id;
      guide.category_title_en = meta.category_title_en || guide.category_title_en;
      guide.category_title_zh = meta.category_title_zh || guide.category_title_zh;
      guide.updated = new Date().toISOString().slice(0, 10);
    }
    writeJson(outPath, guide);
    slugs.push(meta.slug);
  }

  writeJson(path.join(TOOL_GUIDES_DIR, "_index.json"), {
    updated: new Date().toISOString().slice(0, 10),
    count: slugs.length,
    slugs: slugs.sort(),
  });
  patchToolsDirectory();
  console.log(`Tool guides: ${slugs.length} tools (${created} new, ${updated} updated) in data/tool-guides/`);
}

main();
