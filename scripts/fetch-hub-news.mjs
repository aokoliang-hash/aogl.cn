#!/usr/bin/env node
/**
 * Refreshes hub newsGroups in data/hubs/*.json from RSS/Atom URLs in data/hubs/news-feeds.json,
 * and optional hotMixLists (e.g. social hot-mix strip) merged from multiple vendor / trade-press feeds.
 * Strategy (unified): fetch → merge → dedupe by URL → filter by age → sort by pubDate → take perGroup
 * → pad with existing items if fewer than perGroup. Groups with no feeds or zero parsed items are left unchanged.
 *
 * RSS titles are usually English: titleZh mirrors titleEn (optional titleFilter regex per group).
 * Run weekly: GitHub Actions, or locally: npm run fetch-hub-news && npm run build-hubs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { load as cheerioLoad } from "cheerio";
import Parser from "rss-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HUB_DIR = path.join(ROOT, "data", "hubs");
const FEED_CONFIG = path.join(HUB_DIR, "news-feeds.json");

function stripHtml(s) {
  return String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** First usable hero image from RSS item (iTunes art, enclosure image, or first img in HTML body). */
function rssHeroImageFromItem(it) {
  if (it.itunes?.image) {
    const u = String(it.itunes.image).trim();
    if (/^https?:\/\//i.test(u)) return u.slice(0, 900);
  }
  const enc = it.enclosure;
  if (enc && enc.url && /image\//i.test(String(enc.type || ""))) {
    const u = String(enc.url).trim();
    if (/^https?:\/\//i.test(u)) return u.slice(0, 900);
  }
  const rawParts = [];
  if (typeof it.content === "string") rawParts.push(it.content);
  else if (it.content && typeof it.content === "object" && it.content.encoded) rawParts.push(String(it.content.encoded));
  if (it["content:encoded"]) rawParts.push(String(it["content:encoded"]));
  const raw = rawParts.join("\n");
  if (!raw.trim()) return "";
  try {
    const $ = cheerioLoad(raw, { xml: false });
    const $img = $("img").first();
    let u = $img.attr("src") || $img.attr("data-src") || $img.attr("data-lazy-src") || $img.attr("data-original");
    if (!u) return "";
    u = u.trim();
    if (u.startsWith("//")) u = "https:" + u;
    if (!/^https?:\/\//i.test(u)) return "";
    return u.slice(0, 900);
  } catch {
    return "";
  }
}

function normUrl(href) {
  try {
    const u = new URL(href);
    u.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => u.searchParams.delete(k));
    return u.href;
  } catch {
    return href;
  }
}

function formatDateLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function itemPubDate(it) {
  const raw = it.pubDate || it.isoDate || it.date;
  const t = raw ? new Date(raw).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
}

function itemLink(it) {
  if (it.link) return String(it.link).trim();
  const g = it.guid;
  if (!g) return "";
  if (typeof g === "string") return g.trim();
  if (typeof g === "object" && g != null && typeof g.value === "string") return g.value.trim();
  return "";
}

async function fetchText(url, opts, attempt = 1) {
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), opts.requestTimeoutMs);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        "user-agent": opts.userAgent,
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    if (attempt < opts.maxRetries) {
      await new Promise((r) => setTimeout(r, opts.retryDelayMs));
      return fetchText(url, opts, attempt + 1);
    }
    throw e;
  } finally {
    clearTimeout(tid);
  }
}

async function parseFeedUrl(parser, url, opts) {
  const xml = await fetchText(url, opts);
  return parser.parseString(xml);
}

function loadFeedConfig() {
  if (!fs.existsSync(FEED_CONFIG)) {
    throw new Error(`Missing ${path.relative(ROOT, FEED_CONFIG)}`);
  }
  const raw = JSON.parse(fs.readFileSync(FEED_CONFIG, "utf8"));
  const options = {
    userAgent:
      raw.options?.userAgent ||
      "Mozilla/5.0 (compatible; aogl.cn-hub-news/1.0; +https://aogl.cn/) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    requestTimeoutMs: raw.options?.requestTimeoutMs ?? 35000,
    maxRetries: raw.options?.maxRetries ?? 2,
    retryDelayMs: raw.options?.retryDelayMs ?? 900,
    perGroup: raw.options?.perGroup ?? 3,
    maxAgeDays: raw.options?.maxAgeDays ?? 56,
    feedDelayMs: raw.options?.feedDelayMs ?? 350,
  };
  const groups = Array.isArray(raw.groups) ? raw.groups : [];
  const hotMixLists = Array.isArray(raw.hotMixLists) ? raw.hotMixLists : [];
  return { options, groups, hotMixLists };
}

function feedsByHub(groups) {
  const map = new Map();
  for (const g of groups) {
    const hub = g.hub;
    const gid = g.groupId;
    if (!hub || !gid) continue;
    if (!map.has(hub)) map.set(hub, new Map());
    map.get(hub).set(gid, g);
  }
  return map;
}

function filterByTitle(items, titleFilter) {
  if (!titleFilter) return items;
  let re;
  try {
    re = new RegExp(titleFilter, "i");
  } catch {
    return items;
  }
  return items.filter((x) => re.test(x.title || "") || re.test(x.link || ""));
}

function withinMaxAge(pubMs, maxAgeDays) {
  if (!pubMs) return true;
  const maxMs = maxAgeDays * 24 * 60 * 60 * 1000;
  return Date.now() - pubMs <= maxMs;
}

async function collectItemsForGroup(groupCfg, parser, opts) {
  const feeds = Array.isArray(groupCfg.feeds) ? groupCfg.feeds : [];
  if (feeds.length === 0) return [];

  const merged = [];
  const seen = new Set();

  for (const url of feeds) {
    if (!url || typeof url !== "string") continue;
    try {
      const feed = await parseFeedUrl(parser, url.trim(), opts);
      for (const it of feed.items || []) {
        const link = itemLink(it);
        if (!link) continue;
        const nu = normUrl(link);
        if (seen.has(nu)) continue;
        seen.add(nu);
        const title = stripHtml(it.title || "").slice(0, 200);
        if (!title) continue;
        merged.push({
          title,
          link,
          pubMs: itemPubDate(it),
        });
      }
    } catch (e) {
      console.warn(`  [feed] ${groupCfg.hub}/${groupCfg.groupId} ← ${url}: ${e.message || e}`);
    }
    await new Promise((r) => setTimeout(r, opts.feedDelayMs));
  }

  let out = filterByTitle(merged, groupCfg.titleFilter);
  if (groupCfg.titleFilter && out.length === 0 && merged.length > 0) {
    console.warn(`  [warn] ${groupCfg.hub}/${groupCfg.groupId}: titleFilter matched nothing — using unfiltered feed items`);
    out = merged;
  }
  out = out.filter((x) => withinMaxAge(x.pubMs, opts.maxAgeDays));
  out.sort((a, b) => b.pubMs - a.pubMs);

  const offset = Number(groupCfg.sliceOffset) || 0;
  if (offset > 0 && offset < out.length) {
    out = out.slice(offset);
  }

  return out.slice(0, opts.perGroup);
}

async function collectHotMixItems(listCfg, parser, opts) {
  const limit = Number(listCfg.limit) || 20;
  const maxAgeDays = Number(listCfg.maxAgeDays ?? opts.maxAgeDays);
  const feedEntries = Array.isArray(listCfg.feeds) ? listCfg.feeds : [];
  const merged = [];
  const seen = new Set();

  for (const fe of feedEntries) {
    const url = typeof fe === "string" ? fe.trim() : String(fe?.url || "").trim();
    if (!url) continue;
    const source = (typeof fe === "object" && fe?.source) || "RSS";
    const titleFilter = typeof fe === "object" ? fe.titleFilter : undefined;
    try {
      const feed = await parseFeedUrl(parser, url, opts);
      let items = (feed.items || [])
        .map((it) => {
          const link = itemLink(it);
          const title = stripHtml(it.title || "").slice(0, 220);
          const image = rssHeroImageFromItem(it);
          return { title, link, pubMs: itemPubDate(it), source, image };
        })
        .filter((x) => x.title && x.link);

      if (titleFilter) {
        const filtered = filterByTitle(items, titleFilter);
        if (filtered.length === 0) {
          console.warn(`  [hotMix-feed] ${url}: titleFilter matched nothing — skip`);
          await new Promise((r) => setTimeout(r, opts.feedDelayMs));
          continue;
        }
        items = filtered;
      }

      for (const x of items) {
        const nu = normUrl(x.link);
        if (seen.has(nu)) continue;
        seen.add(nu);
        merged.push(x);
      }
    } catch (e) {
      console.warn(`  [hotMix] ← ${url}: ${e.message || e}`);
    }
    await new Promise((r) => setTimeout(r, opts.feedDelayMs));
  }

  let out = merged.filter((x) => withinMaxAge(x.pubMs, maxAgeDays));
  out.sort((a, b) => b.pubMs - a.pubMs);
  return out.slice(0, limit);
}

function hotMixRowsToSpecItems(rows) {
  return rows.map((x) => ({
    titleEn: x.title,
    titleZh: x.title,
    url: x.link,
    date: formatDateLabel(x.pubMs) || todayYmd(),
    source: x.source || "",
    image: x.image || "",
  }));
}

function rssItemsToHubItems(rssItems) {
  return rssItems.map((x) => ({
    titleEn: x.title,
    titleZh: x.title,
    url: x.link,
    date: formatDateLabel(x.pubMs) || new Date().toISOString().slice(0, 10),
  }));
}

function padFromExisting(newItems, oldItems, perGroup) {
  const urls = new Set(newItems.map((i) => normUrl(i.url)));
  const out = [...newItems];
  for (const o of oldItems || []) {
    if (out.length >= perGroup) break;
    const u = normUrl(o.url);
    if (!u || urls.has(u)) continue;
    urls.add(u);
    out.push({
      titleEn: o.titleEn,
      titleZh: o.titleZh || o.titleEn,
      url: o.url,
      date: o.date || "",
    });
  }
  return out;
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const { options, groups, hotMixLists } = loadFeedConfig();
  const byHub = feedsByHub(groups);
  const parser = new Parser({ timeout: options.requestTimeoutMs });

  let hubsTouched = 0;
  let groupsUpdated = 0;
  let groupsSkipped = 0;

  for (const [hubSlug, groupMap] of byHub) {
    const hubPath = path.join(HUB_DIR, `${hubSlug}.json`);
    if (!fs.existsSync(hubPath)) {
      console.warn("Skip unknown hub file:", hubSlug);
      continue;
    }
    const spec = JSON.parse(fs.readFileSync(hubPath, "utf8"));
    const newsGroups = spec.newsGroups;
    if (!Array.isArray(newsGroups)) continue;

    let hubChanged = false;
    for (let gi = 0; gi < newsGroups.length; gi++) {
      const g = newsGroups[gi];
      const cfg = groupMap.get(g.id);
      if (!cfg || !Array.isArray(cfg.feeds) || cfg.feeds.length === 0) {
        groupsSkipped++;
        continue;
      }

      const rssItems = await collectItemsForGroup(cfg, parser, options);
      if (rssItems.length === 0) {
        console.warn(`  [skip] ${hubSlug}/${g.id}: no items from feeds`);
        groupsSkipped++;
        continue;
      }

      const fresh = rssItemsToHubItems(rssItems);
      const merged = padFromExisting(fresh, g.items, options.perGroup);
      newsGroups[gi] = { ...g, items: merged };
      hubChanged = true;
      groupsUpdated++;
      console.log(`  ${hubSlug}/${g.id}: ${merged.length} items (RSS ${fresh.length})`);
    }

    if (hubChanged) {
      spec.updated = todayYmd();
      fs.writeFileSync(hubPath, JSON.stringify(spec, null, 2) + "\n", "utf8");
      hubsTouched++;
    }
  }

  let hotMixUpdated = 0;
  for (const listCfg of hotMixLists) {
    const hubSlug = listCfg.hub;
    const jsonKey = listCfg.jsonKey || "hotMixItems";
    if (!hubSlug) continue;
    const hubPath = path.join(HUB_DIR, `${hubSlug}.json`);
    if (!fs.existsSync(hubPath)) {
      console.warn("Skip hotMix unknown hub:", hubSlug);
      continue;
    }
    if (!Array.isArray(listCfg.feeds) || listCfg.feeds.length === 0) continue;

    const rows = await collectHotMixItems(listCfg, parser, options);
    if (rows.length === 0) {
      console.warn(`  [hotMix] ${hubSlug}.${jsonKey}: no items`);
      continue;
    }
    const spec = JSON.parse(fs.readFileSync(hubPath, "utf8"));
    spec[jsonKey] = hotMixRowsToSpecItems(rows);
    spec.updated = todayYmd();
    fs.writeFileSync(hubPath, JSON.stringify(spec, null, 2) + "\n", "utf8");
    hotMixUpdated++;
    console.log(`  hotMix ${hubSlug}.${jsonKey}: ${rows.length} items`);
  }

  console.log(
    `fetch-hub-news: updated ${groupsUpdated} groups across ${hubsTouched} hub JSON files; skipped ${groupsSkipped} group slots; hotMix lists updated: ${hotMixUpdated}.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
