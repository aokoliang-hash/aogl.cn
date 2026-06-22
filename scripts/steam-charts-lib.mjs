/**
 * Shared Steam Charts snapshot fetch + HTML table render for articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SNAPSHOT_PATH = path.join(ROOT, "data", "steam-charts-snapshot.json");

const STORE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://store.steampowered.com/charts/mostplayed",
  Origin: "https://store.steampowered.com",
};

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appStoreUrl(appid) {
  if (!appid) return "https://store.steampowered.com/charts/";
  return `https://store.steampowered.com/app/${appid}/`;
}

function normalizeRankItem(raw, rank) {
  const appid = raw.appid ?? raw.app_id ?? raw.id ?? null;
  const name = raw.name ?? raw.localized_name ?? raw.title ?? `App ${appid || rank}`;
  return {
    rank,
    appid: appid ? Number(appid) : null,
    name: String(name).trim(),
    concurrent: raw.concurrent_in_game ?? raw.concurrent ?? raw.players ?? null,
    peak: raw.peak_in_game ?? raw.peak ?? null,
    url: appStoreUrl(appid),
  };
}

async function fetchStoreJson(url) {
  const res = await fetch(url, { headers: STORE_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data && data.success === false) throw new Error(data.error || "success=false");
  return data;
}

async function fetchWithWebApiKey(key) {
  const input = {
    context: { language: "english", country_code: "US" },
    data_request: { include_basic_info: true, include_assets: false },
    count: 10,
  };
  const qs = new URLSearchParams({
    key,
    input_json: JSON.stringify(input),
  });
  const mostPlayedUrl = `https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/?${qs}`;
  const weeklyUrl = `https://api.steampowered.com/IStoreTopSellersService/GetWeeklyTopSellers/v1/?${qs}&country_code=US&page_count=10`;

  const out = { mostPlayed: [], topSellers: [], weeklyTopSellers: [] };

  const mp = await fetch(mostPlayedUrl);
  if (!mp.ok) throw new Error(`WebAPI most played HTTP ${mp.status}`);
  const mpJson = await mp.json();
  const mpRanks = mpJson?.response?.ranks ?? mpJson?.response?.games ?? [];
  out.mostPlayed = mpRanks.slice(0, 10).map((r, i) => normalizeRankItem(r, i + 1));

  const wk = await fetch(weeklyUrl);
  if (wk.ok) {
    const wkJson = await wk.json();
    const items = wkJson?.response?.items ?? wkJson?.response?.ranks ?? [];
    out.weeklyTopSellers = items.slice(0, 10).map((r, i) => normalizeRankItem(r, i + 1));
  }

  const ts = await fetchStoreJson("https://store.steampowered.com/api/GetTopSellersList/?cc=US&l=english");
  const tsItems = ts?.items ?? ts?.top_sellers ?? [];
  out.topSellers = tsItems.slice(0, 10).map((r, i) => normalizeRankItem(r, i + 1));

  return out;
}

async function fetchStoreEndpoints() {
  const out = { mostPlayed: [], topSellers: [], weeklyTopSellers: [] };

  const mp = await fetchStoreJson("https://store.steampowered.com/api/GetMostPlayedGames/?cc=US");
  const ranks = mp?.ranks ?? mp?.response?.ranks ?? [];
  out.mostPlayed = ranks.slice(0, 10).map((r, i) => normalizeRankItem(r, i + 1));

  const ts = await fetchStoreJson("https://store.steampowered.com/api/GetTopSellersList/?cc=US&l=english");
  const tsItems = ts?.items ?? ts?.top_sellers ?? [];
  out.topSellers = tsItems.slice(0, 10).map((r, i) => normalizeRankItem(r, i + 1));

  return out;
}

/** Seed snapshot when automated fetch is blocked — titles are placeholders until next successful pull. */
export function fallbackSnapshot() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    fetchedAt: today,
    fetchStatus: "fallback",
    fetchNote:
      "Automated pull blocked (403). Run npm run fetch-steam-charts on a network that can reach store.steampowered.com, or set STEAM_WEB_API_KEY.",
    sources: {
      chartsHub: "https://store.steampowered.com/charts/",
      mostPlayed: "https://store.steampowered.com/charts/mostplayed",
      topSellers: "https://store.steampowered.com/charts/topsellers",
    },
    mostPlayed: [],
    topSellers: [],
    weeklyTopSellers: [],
  };
}

export async function fetchSteamChartsSnapshot() {
  const key = process.env.STEAM_WEB_API_KEY?.trim();
  let lists;
  let fetchStatus = "ok";
  let fetchNote = "";

  try {
    if (key) {
      lists = await fetchWithWebApiKey(key);
      fetchNote = "Pulled via Steam Web API key + store endpoints where available.";
    } else {
      lists = await fetchStoreEndpoints();
      fetchNote = "Pulled via store.steampowered.com JSON endpoints.";
    }
  } catch (e) {
    fetchStatus = "error";
    fetchNote = String(e.message || e);
    const prev = loadSteamChartsSnapshot();
    if (prev && (prev.mostPlayed?.length || prev.topSellers?.length)) {
      return {
        ...prev,
        fetchedAt: new Date().toISOString().slice(0, 10),
        fetchStatus: "stale",
        fetchNote: `Keep previous snapshot — ${fetchNote}`,
      };
    }
    return fallbackSnapshot();
  }

  const empty =
    !lists.mostPlayed.length && !lists.topSellers.length && !lists.weeklyTopSellers.length;
  if (empty) {
    fetchStatus = "empty";
    fetchNote = "Endpoints returned zero rows; check region or API access.";
  }

  return {
    fetchedAt: new Date().toISOString().slice(0, 10),
    fetchStatus,
    fetchNote,
    sources: {
      chartsHub: "https://store.steampowered.com/charts/",
      mostPlayed: "https://store.steampowered.com/charts/mostplayed",
      topSellers: "https://store.steampowered.com/charts/topsellers",
      weeklyTopSellers: "https://store.steampowered.com/charts/topsellers?week=1",
    },
    ...lists,
  };
}

export function loadSteamChartsSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return fallbackSnapshot();
  try {
    return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
  } catch {
    return fallbackSnapshot();
  }
}

export function saveSteamChartsSnapshot(snapshot) {
  fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
}

function renderTable(title, rows, lang) {
  const emptyMsg =
    lang === "zh"
      ? "暂无自动快照行 — 请打开下方 Valve 官方 Charts 链接核对，或运行 fetch-steam-charts。"
      : "No automated snapshot rows — open official Valve Charts links below, or run fetch-steam-charts.";
  if (!rows?.length) {
    return `<h3>${esc(title)}</h3><p class="article-note">${emptyMsg}</p>`;
  }
  const head =
    lang === "zh"
      ? "<tr><th>#</th><th>游戏</th><th>同时在线</th><th>峰值</th></tr>"
      : "<tr><th>#</th><th>Title</th><th>Concurrent</th><th>Peak</th></tr>";
  const body = rows
    .map((r) => {
      const conc = r.concurrent != null ? Number(r.concurrent).toLocaleString("en-US") : "—";
      const peak = r.peak != null ? Number(r.peak).toLocaleString("en-US") : "—";
      return `<tr><td>${r.rank}</td><td><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.name)}</a></td><td>${conc}</td><td>${peak}</td></tr>`;
    })
    .join("");
  return `<h3>${esc(title)}</h3>
<table class="article-data-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

function renderSellersTable(title, rows, lang) {
  const emptyMsg =
    lang === "zh"
      ? "暂无自动快照行 — 请以 Valve 官方 Charts 为准。"
      : "No automated snapshot rows — use official Valve Charts.";
  if (!rows?.length) {
    return `<h3>${esc(title)}</h3><p class="article-note">${emptyMsg}</p>`;
  }
  const head =
    lang === "zh"
      ? "<tr><th>#</th><th>游戏</th><th>商店页</th></tr>"
      : "<tr><th>#</th><th>Title</th><th>Store</th></tr>";
  const linkLabel = lang === "zh" ? "Steam 商店" : "Steam store";
  const body = rows
    .map(
      (r) =>
        `<tr><td>${r.rank}</td><td>${esc(r.name)}</td><td><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${linkLabel}</a></td></tr>`,
    )
    .join("");
  return `<h3>${esc(title)}</h3>
<table class="article-data-table">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}

export function renderSteamChartsSnapshotHtml(snapshot, lang = "zh") {
  const status = snapshot.fetchStatus || "unknown";
  const note = snapshot.fetchNote || "";
  const at = snapshot.fetchedAt || "—";
  const intro =
    lang === "zh"
      ? `<p class="article-note"><strong>快照日期 ${esc(at)}</strong>（状态：${esc(status)}）。${esc(note)} 实时并发数以 <a href="${esc(snapshot.sources?.mostPlayed)}" target="_blank" rel="noopener noreferrer">Valve 官方 Most Played</a> 为准；本站表格为个人阅读备忘，非商业榜单。</p>`
      : `<p class="article-note"><strong>Snapshot ${esc(at)}</strong> (status: ${esc(status)}). ${esc(note)} Live concurrents are authoritative on <a href="${esc(snapshot.sources?.mostPlayed)}" target="_blank" rel="noopener noreferrer">Valve’s Most Played page</a>; this table is a personal reading aid, not a commercial ranking.</p>`;

  const mpTitle = lang === "zh" ? "Most Played（同时在线 · 快照）" : "Most Played (concurrent · snapshot)";
  const tsTitle = lang === "zh" ? "Top Sellers（畅销 · 快照）" : "Top Sellers (revenue · snapshot)";
  const wkTitle = lang === "zh" ? "Weekly Top Sellers（周榜 · 快照）" : "Weekly top sellers (snapshot)";

  return `${intro}
<div class="article-steam-snapshot">
${renderTable(mpTitle, snapshot.mostPlayed, lang)}
${renderSellersTable(tsTitle, snapshot.topSellers, lang)}
${renderSellersTable(wkTitle, snapshot.weeklyTopSellers, lang)}
</div>`;
}

export const SNAPSHOT_MARKER = "<!-- STEAM_CHARTS_SNAPSHOT_AUTO -->";

export function injectSteamChartsSnapshot(body, lang) {
  if (!body.includes(SNAPSHOT_MARKER)) return body;
  const snapshot = loadSteamChartsSnapshot();
  return body.replace(SNAPSHOT_MARKER, renderSteamChartsSnapshotHtml(snapshot, lang));
}
