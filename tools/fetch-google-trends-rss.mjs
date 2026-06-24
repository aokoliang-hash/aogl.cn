#!/usr/bin/env node
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "data", "google-trends-us-rss-snapshot.json");

function decode(s) {
  return String(s ?? "")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function trafficSort(t) {
  const m = String(t || "").match(/([\d,]+)\+/);
  if (!m) return 0;
  return parseInt(m[1].replace(/,/g, ""), 10);
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; aogl.cn/1.0)" } }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(d));
      })
      .on("error", reject);
  });
}

const rawPath = path.join(ROOT, "data", "google-trends-us-rss-raw.xml");
let xml;
if (process.argv.includes("--local") && fs.existsSync(rawPath)) {
  xml = fs.readFileSync(rawPath, "utf8");
} else {
  try {
    xml = await fetch("https://trends.google.com/trending/rss?geo=US");
    fs.writeFileSync(rawPath, xml);
  } catch (e) {
    if (fs.existsSync(rawPath)) {
      console.warn("Fetch failed, using cached RSS:", e.message);
      xml = fs.readFileSync(rawPath, "utf8");
    } else {
      throw e;
    }
  }
}
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

const entries = items
  .map((block) => {
    const g = (tag) => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return m ? decode(m[1].replace(/<[^>]+>/g, "").trim()) : "";
    };
    const news = [...block.matchAll(/<ht:news_item>([\s\S]*?)<\/ht:news_item>/g)].map((nm) => ({
      title: decode((nm[1].match(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/) || [])[1]?.trim()),
      url: (nm[1].match(/<ht:news_item_url>([\s\S]*?)<\/ht:news_item_url>/) || [])[1]?.trim() || "",
      source: decode((nm[1].match(/<ht:news_item_source>([\s\S]*?)<\/ht:news_item_source>/) || [])[1]?.trim()),
    }));
    const trend = g("title");
    return {
      trend,
      traffic: g("ht:approx_traffic"),
      pubDate: g("pubDate"),
      pictureSource: g("ht:picture_source"),
      exploreUrl: `https://trends.google.com/trends/explore?geo=US&q=${encodeURIComponent(trend)}`,
      newsItems: news.filter((n) => n.title).slice(0, 3),
    };
  })
  .filter((e) => e.trend);

entries.sort((a, b) => trafficSort(b.traffic) - trafficSort(a.traffic));
entries.forEach((e, i) => {
  e.rank = i + 1;
});

const now = new Date();
const fetchedAt = now.toISOString().slice(0, 10);

const snapshot = {
  fetchedAt,
  fetchedAtTime: "RSS feed pull",
  geo: "US",
  geoLabelEn: "United States",
  geoLabelZh: "美国",
  windowLabelEn: "Daily Search Trends (RSS)",
  windowLabelZh: "Daily Search Trends（RSS 订阅）",
  totalItemsInFeed: entries.length,
  sources: {
    rss: "https://trends.google.com/trending/rss?geo=US",
    trending: "https://trends.google.com/trending?geo=US",
  },
  entries: entries.slice(0, 25),
};

fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`Wrote ${OUT} (${snapshot.entries.length} of ${entries.length} items)`);
