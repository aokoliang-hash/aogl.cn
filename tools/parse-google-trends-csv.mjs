/**
 * Parse Google Trends trending CSV export -> snapshot JSON.
 * Usage: node tools/parse-google-trends-csv.mjs [csvPath] [outPath]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = process.argv[2] || path.join(ROOT, "data", "google-trends-us-trending-20260622.csv");
const outPath = process.argv[3] || path.join(ROOT, "data", "google-trends-us-snapshot.json");

function parseVolume(raw) {
  const s = String(raw || "").trim().replace(/,/g, "");
  if (!s) return 0;
  const wan = s.match(/^([\d.]+)万\+$/);
  if (wan) return Math.round(parseFloat(wan[1]) * 10000);
  const plus = s.match(/^([\d.]+)\+$/);
  if (plus) return Math.round(parseFloat(plus[1]));
  return 0;
}

function formatVolume(raw, lang = "zh") {
  const s = String(raw || "").trim();
  if (lang === "en") {
    if (s.includes("100万")) return "1M+";
    if (s.includes("50万")) return "500K+";
    if (s.includes("20万")) return "200K+";
    if (s.includes("10万")) return "100K+";
    if (s.includes("5万")) return "50K+";
    if (s.includes("2万")) return "20K+";
    if (s.includes("1万")) return "10K+";
    return s.replace("万", "0K").replace("+", "+");
  }
  return s;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
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
        cols.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    cols.push(cur);
    if (cols.length < 5) continue;
    const [trend, volume, started, ended, breakdown] = cols;
    const topRelated = breakdown
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 5);
    rows.push({
      trend: trend.trim(),
      volume: volume.trim(),
      volumeSort: parseVolume(volume),
      started: started.trim(),
      ended: (ended || "").trim(),
      topRelated,
      exploreUrl: `https://trends.google.com/trends/explore?geo=US&q=${encodeURIComponent(trend.trim())}`,
    });
  }
  rows.sort((a, b) => b.volumeSort - a.volumeSort);
  return rows;
}

const csv = fs.readFileSync(csvPath, "utf8");
const trending24h = parseCsv(csv).slice(0, 25);

const snapshot = {
  fetchedAt: "2026-06-22",
  fetchedAtTime: "15:51 UTC+8",
  geo: "US",
  geoLabelEn: "United States",
  geoLabelZh: "美国",
  windowLabelEn: "Past 24 hours · Trending now",
  windowLabelZh: "过去 24 小时 · Trending now",
  totalTrendsInExport: parseCsv(csv).length,
  sources: {
    home: "https://trends.google.com/home?hl=en-US",
    explore: "https://trends.google.com/explore?geo=US&hl=en-US",
    trending: "https://trends.google.com/trending?geo=US&hl=en-US",
  },
  csvSource: "data/google-trends-us-trending-20260622.csv",
  trending24h,
  topQueriesYear: [
    { query: "weather", change: "+30%" },
    { query: "google", change: "+10%" },
    { query: "youtube", change: "+20%" },
    { query: "amazon", change: "+5%" },
    { query: "news", change: "+20%" },
    { query: "reddit", change: "-2%" },
    { query: "apple", change: "+30%" },
    { query: "walmart", change: "+2%" },
    { query: "facebook", change: "-5%" },
    { query: "movies", change: "+20%" },
  ],
  risingQueriesYear: [
    { query: "fifa world cup 2026", change: "+1,400%" },
    { query: "world cup 2026", change: "+1,250%" },
    { query: "knicks vs spurs", change: "+1,200%" },
    { query: "spurs vs knicks", change: "+1,150%" },
    { query: "world cup schedule", change: "+900%" },
    { query: "fifa world cup", change: "+800%" },
    { query: "world cup", change: "+650%" },
    { query: "spurs", change: "+550%" },
    { query: "fifa", change: "+500%" },
    { query: "spurs game", change: "+500%" },
  ],
  yearWindowLabelEn: "Past 12 months · Top / Rising queries",
  yearWindowLabelZh: "过去 12 个月 · Top / Rising queries",
};

fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath} (${trending24h.length} trending rows, ${snapshot.totalTrendsInExport} total in CSV)`);
