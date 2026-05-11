/**
 * Builds footer-wordmark-outline.svg — stroke-only paths for "AOGL.CN", no <text>.
 * Requires: npm install opentype.js, Windows Segoe UI Bold or set FONT_PATH.
 */
const TEXT = process.env.FOOTER_MARK_TEXT || "AOGL.CN";
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");

const root = path.join(__dirname, "..");
const fontPath =
  process.env.FONT_PATH ||
  (process.platform === "win32"
    ? "C:\\Windows\\Fonts\\segoeuib.ttf"
    : path.join(root, "node_modules", ".stub"));

const font = opentype.loadSync(fontPath);
const fsz = 100;
const p = font.getPath(TEXT, 0, 0, fsz);
const bb = p.getBoundingBox();
const pad = 10;
const tx = pad - bb.x1;
const ty = pad - bb.y1;
const vbw = bb.x2 - bb.x1 + 2 * pad;
const vbh = bb.y2 - bb.y1 + 2 * pad;
const d = p.toPathData(2);
/** 1 CSS px hairline; non-scaling keeps ~1px when the SVG is stretched */
const STROKE_PX = "1";

const svg =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbw.toFixed(2)} ${vbh.toFixed(2)}" width="100%" preserveAspectRatio="xMidYMid meet">` +
  "<defs>" +
  '<linearGradient id="footerWordStroke" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">' +
  '<stop offset="0%" stop-color="#7dd3fc"/>' +
  '<stop offset="100%" stop-color="#030508"/>' +
  "</linearGradient>" +
  "</defs>" +
  `<g transform="translate(${tx.toFixed(3)},${ty.toFixed(3)})">` +
  `<path fill="none" stroke="url(#footerWordStroke)" stroke-width="${STROKE_PX}" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round" d="${d.replace(/"/g, "")}"/>` +
  "</g>" +
  "</svg>";

const out = path.join(root, "footer-wordmark-outline.svg");
fs.writeFileSync(out, svg, "utf8");
console.log("Wrote", out, "viewBox", vbw.toFixed(1), "x", vbh.toFixed(1));
