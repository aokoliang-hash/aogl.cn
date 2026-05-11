/**
 * Regenerates logo.svg wordmark paths from a local bold .ttf (Segoe UI Bold on Windows).
 * Usage (from repo root): npm install opentype.js && node scripts/regenerate-logo-wordmark.cjs
 */
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");

const root = path.join(__dirname, "..");
const fontPath =
  process.env.LOGO_FONT ||
  (process.platform === "win32"
    ? "C:\\Windows\\Fonts\\segoeuib.ttf"
    : "/Library/Fonts/SFNSText.ttf"); // macOS fallback — set LOGO_FONT if missing

if (!fs.existsSync(fontPath)) {
  console.error("Font not found:", fontPath);
  console.error("Set LOGO_FONT to a bold .ttf path and retry.");
  process.exit(1);
}

const font = opentype.parse(fs.readFileSync(fontPath));
const p = font.getPath("aogl.cn", 60, 39, 34);
const d = p.toPathData(4);

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 336 56" fill="none">
  <defs>
    <linearGradient id="logoGrad" x1="0" y1="0" x2="336" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#7dd3fc"/>
      <stop offset="1" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect x="0" y="4" width="48" height="48" rx="12" fill="rgba(18, 25, 34, 0.92)" stroke="url(#logoGrad)" stroke-opacity="0.55" stroke-width="1"/>
  <path d="M24 17.6 L33 33.2 H15 Z" stroke="url(#logoGrad)" stroke-width="1.85" stroke-linejoin="round" fill="none"/>
  <circle cx="24" cy="17.6" r="3.5" fill="url(#logoGrad)"/>
  <circle cx="15" cy="33.2" r="3.15" fill="url(#logoGrad)"/>
  <circle cx="33" cy="33.2" r="3.15" fill="url(#logoGrad)"/>
  <path fill="url(#logoGrad)" fill-rule="evenodd" d="${d}"/>
</svg>
`;

fs.writeFileSync(path.join(root, "logo.svg"), svg);
console.log("Wrote logo.svg (wordmark from", fontPath + ")");
