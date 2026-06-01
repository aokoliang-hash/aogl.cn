#!/usr/bin/env node
/**
 * Regression tests for js/i18n.js locale URL building (run: node scripts/test-i18n-paths.mjs)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import vm from "vm";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(ROOT, "js", "i18n.js"), "utf8");

function loadI18n(pathname) {
  const sandbox = {
    location: { pathname, search: "", hash: "" },
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      documentElement: { lang: "", setAttribute() {}, removeAttribute() {}, getAttribute: () => null },
      body: { className: "", removeAttribute() {}, setAttribute() {} },
      title: "",
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {},
    },
    navigator: { language: "en-US", languages: ["en-US"] },
    console,
  };
  const wrapped = code.replace("(function () {", "(function () {\n") + "\nreturn { parseLocalePath, targetPathForLocale, navigateIfLocaleSwitch, localeFromPath };";
  // Extract functions by re-executing patched source
  let fnBody = fs.readFileSync(path.join(ROOT, "js", "i18n.js"), "utf8");
  fnBody = fnBody.replace(/^\(function \(\) \{/, "").replace(/\}\)\(\);\s*$/, "");
  const cut = fnBody.indexOf("  applySafe(getInitialLang());");
  if (cut !== -1) fnBody = fnBody.slice(0, cut);
  const extract = `
${fnBody}
globalThis.__i18n = { parseLocalePath, targetPathForLocale, localeFromPath, normalizePath };
`;
  vm.createContext(sandbox);
  vm.runInContext(extract, sandbox);
  return sandbox.__i18n;
}

const DEPLOY = "/aogl.cn";

const cases = [
  // [pathname, switchTo, expectedHref]
  [`${DEPLOY}/tool-guides/copilot-post.html`, "en", `${DEPLOY}/en/tool-guides/copilot-post.html`],
  [`${DEPLOY}/tool-guides/copilot-post.html`, "zh", `${DEPLOY}/tool-guides/copilot-post.html`],
  [`${DEPLOY}/tool-guides/copilot-post.html`, "zht", `${DEPLOY}/zh/tool-guides/copilot-post.html`],
  [`${DEPLOY}/en/tool-guides/copilot-post.html`, "zh", `${DEPLOY}/tool-guides/copilot-post.html`],
  [`/tool-guides/copilot-post.html`, "en", `/en/tool-guides/copilot-post.html`],
  [`${DEPLOY}/briefs/openai-introducing-gpt-5-2.html`, "ja", `${DEPLOY}/ja/briefs/openai-introducing-gpt-5-2.html`],
  [`${DEPLOY}/articles/velmora.html`, "en", `${DEPLOY}/en/articles/velmora.html`],
  [`${DEPLOY}/en/articles/velmora.html`, "zht", `${DEPLOY}/zh/articles/velmora.html`],
  [`${DEPLOY}/articles/index.html`, "en", `${DEPLOY}/en/articles/index.html`],
  [`/en/articles/index.html`, "zh", `/articles/index.html`],
  [`${DEPLOY}/briefs/index.html`, "fr", `${DEPLOY}/fr/briefs/index.html`],
  [`${DEPLOY}/privacy.html`, "en", `${DEPLOY}/en/privacy.html`],
  [`${DEPLOY}/en/about.html`, "zh", `${DEPLOY}/about.html`],
  [`${DEPLOY}/`, "en", `${DEPLOY}/en/`],
  [`${DEPLOY}/index.html`, "zht", `${DEPLOY}/zh/`],
  [`/en/tools.html`, "zh", `/tools.html`],
  [`${DEPLOY}/zh/games.html`, "en", `${DEPLOY}/en/games.html`],
  [`${DEPLOY}/official-news.html`, "ko", `${DEPLOY}/ko/official-news.html`],
  [`/briefs/index.html`, "en", `/en/briefs/index.html`],
  [`${DEPLOY}/en/briefs/index.html`, "zh", `${DEPLOY}/briefs/index.html`],
  [`/games.html`, "ja", `/ja/games.html`],
  [`${DEPLOY}/ja/tech.html`, "zh", `${DEPLOY}/tech.html`],
];

const compareCases = [
  [`${DEPLOY}/`, `${DEPLOY}/index.html`],
  [`${DEPLOY}/en/`, `${DEPLOY}/en/index.html`],
  [`/en/`, `/en/index.html`],
  [`${DEPLOY}/articles/index.html`, `${DEPLOY}/articles/index.html`],
];

let failed = 0;
for (const [pathname, lang, expected] of cases) {
  const i18n = loadI18n(pathname);
  const parsed = i18n.parseLocalePath();
  const got = i18n.targetPathForLocale(lang, parsed.relFile, parsed.deployBase);
  const ok = got === expected;
  if (!ok) {
    failed++;
    console.error("FAIL", pathname, "→", lang);
    console.error("  expected:", expected);
    console.error("  got:     ", got);
    console.error("  parsed: ", JSON.stringify(parsed));
  }
}

// navigate should not strip nested index.html
const i18nIdx = loadI18n(`${DEPLOY}/articles/index.html`);
let navigated = "";
const orig = i18nIdx;
// simulate navigate by checking target directly
const p = orig.parseLocalePath();
const want = orig.targetPathForLocale("en", p.relFile, p.deployBase);
if (want !== `${DEPLOY}/en/articles/index.html`) {
  failed++;
  console.error("FAIL articles/index navigation path:", want);
}

for (const [a, b] of compareCases) {
  const i18n = loadI18n(a);
  const na = i18n.normalizePath(a);
  const nb = i18n.normalizePath(b);
  if (na !== nb) {
    failed++;
    console.error("FAIL normalize compare:", a, "vs", b, "→", na, "!=", nb);
  }
}

// Switching locale on articles/index must keep index.html in href
const idx = loadI18n(`${DEPLOY}/articles/index.html`);
const pi = idx.parseLocalePath();
const toEn = idx.targetPathForLocale("en", pi.relFile, pi.deployBase);
if (toEn !== `${DEPLOY}/en/articles/index.html`) {
  failed++;
  console.error("FAIL articles/index to en:", toEn);
}

if (failed === 0) {
  console.log(`OK: ${cases.length + 1} path + ${compareCases.length} normalize cases passed`);
} else {
  console.error(`${failed} case(s) failed`);
  process.exitCode = 1;
}
