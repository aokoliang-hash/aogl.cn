#!/usr/bin/env node
/**
 * Fail if locale nested content pages still use ../css or ../js (404 under /en/briefs/).
 * Run: node scripts/validate-locale-asset-paths.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];
const CONTENT_DIRS = ["articles", "briefs", "tool-guides", "hub-links"];
const BAD = /(?:href|src)=["'](?:\.\.\/)+(css|js|upload|favicon\.svg)["']/;

let failed = 0;

for (const loc of LOCALES) {
  for (const dir of CONTENT_DIRS) {
    const base = path.join(ROOT, loc, dir);
    if (!fs.existsSync(base)) continue;
    for (const f of fs.readdirSync(base)) {
      if (!f.endsWith(".html")) continue;
      const html = fs.readFileSync(path.join(base, f), "utf8");
      if (BAD.test(html)) {
        console.error(`BAD relative asset: ${loc}/${dir}/${f}`);
        failed++;
      }
      if (/(?:href|src)=["']\.\.\/\.\.\/css\//.test(html)) {
        console.error(`OLD depth-relative asset (use /css/): ${loc}/${dir}/${f}`);
        failed++;
      }
    }
  }
}

if (failed) {
  console.error(`\n${failed} file(s) with bad asset paths`);
  process.exit(1);
}
console.log("OK: locale content pages use root-absolute /css /js /upload paths");
