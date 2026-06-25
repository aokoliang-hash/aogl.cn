/**
 * Parse Brand Finance Global 500 CSV -> snapshot JSON.
 * Usage: node tools/parse-brand-finance-global-500-csv.mjs [csvPath] [outPath]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = process.argv[2] || path.join(ROOT, "original", "brandirectory-ranking-data-global-2026.csv");
const outPath = process.argv[3] || path.join(ROOT, "data", "brand-finance-global-500-2026-snapshot.json");

function parseCsvLine(line) {
  const cols = [];
  let cur = "";
  let inQ = false;
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === "," && !inQ) {
      cols.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  cols.push(cur.trim());
  return cols;
}

function num(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "-") return null;
  const n = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function pctChange(v2026, v2025) {
  if (v2026 == null || v2025 == null || v2025 === 0) return null;
  return Math.round(((v2026 - v2025) / v2025) * 100);
}

function formatUsdM(v, lang = "en") {
  if (v == null) return "—";
  const b = v / 1000;
  if (lang === "zh") return `$${b.toFixed(1)}B`;
  return `$${b.toFixed(1)}B`;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const [rank2026, rank2025, name, country, v2026, v2025, rating2026, rating2025] = parseCsvLine(line);
    if (!name) continue;
    const value2026 = num(v2026);
    const value2025 = num(v2025);
    rows.push({
      rank2026: parseInt(rank2026, 10) || null,
      rank2025: parseInt(rank2025, 10) || null,
      name,
      country,
      value2026UsdM: value2026,
      value2025UsdM: value2025,
      valueChangePct: pctChange(value2026, value2025),
      rating2026: rating2026 === "-" ? null : rating2026,
      rating2025: rating2025 === "-" ? null : rating2025,
      rankDelta: (parseInt(rank2025, 10) || 0) - (parseInt(rank2026, 10) || 0),
    });
  }
  return rows;
}

const allRows = parseCsv(fs.readFileSync(csvPath, "utf8"));
const top10 = allRows.filter((r) => r.rank2026 != null && r.rank2026 <= 10 && r.value2026UsdM != null);

const snapshot = {
  fetchedAt: "2026-06-01",
  reportYear: 2026,
  reportTitleEn: "Brand Finance Global 500 2026",
  reportTitleZh: "Brand Finance Global 500 2026",
  geoLabelEn: "Global",
  geoLabelZh: "全球",
  totalBrandsInCsv: allRows.length,
  brandsWithValueData: allRows.filter((r) => r.value2026UsdM != null).length,
  aaaPlusCount: 37,
  sources: {
    pdfPreview: "https://static.brandirectory.com/reports/brand-finance-global-500-2026-preview.pdf",
    csv: "original/brandirectory-ranking-data-global-2026.csv",
    brandFinance: "https://brandfinance.com/",
  },
  highlights: [
    {
      key: "apple",
      headlineEn: "$608 billion: Apple's brand value, up 6% from 2025",
      headlineZh: "6080 亿美元：Apple 品牌价值，较 2025 年增长 6%",
    },
    {
      key: "nvidia",
      headlineEn: "NVIDIA's brand is now more valuable than Facebook and Walmart",
      headlineZh: "NVIDIA 品牌价值已超越 Facebook 与 Walmart",
    },
    {
      key: "revolut",
      headlineEn: "239%: Revolut enters the Global 500 for the first time",
      headlineZh: "239%：Revolut 首次进入 Global 500",
    },
    {
      key: "youtube",
      headlineEn: "AAA+: YouTube becomes the world's strongest brand",
      headlineZh: "AAA+：YouTube 成为全球最强品牌",
    },
  ],
  top10,
  brandStrength: [
    {
      strengthRank: 1,
      name: "YouTube",
      country: "United States",
      bsi: 95.3,
      rating2026: "AAA+",
      strengthRank2025: 8,
      valueRank2026: 49,
    },
    {
      strengthRank: 2,
      name: "WeChat",
      country: "China",
      bsi: 95.1,
      rating2026: "AAA+",
      strengthRank2025: 1,
      valueRank2026: 33,
      valueChangePct: 46,
      value2026UsdM: 48100,
    },
    {
      strengthRank: 3,
      name: "Microsoft",
      country: "United States",
      bsi: 94.7,
      rating2026: "AAA+",
      strengthRank2025: 2,
      valueRank2026: 2,
    },
    {
      strengthRank: 5,
      name: "LEGO",
      country: "Denmark",
      bsi: 94.2,
      rating2026: "AAA+",
      strengthRank2025: 5,
      valueRank2026: 138,
      valueChangePct: 59,
      value2026UsdM: 17600,
    },
  ],
};

fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath} (top10=${top10.length}, csv rows=${allRows.length})`);
