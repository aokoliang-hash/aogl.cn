/**
 * Fetch og:title / og:description from a public URL (used by brief + hub-link sync).
 */
import * as cheerio from "cheerio";

export async function fetchPageMeta(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 22000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; aogl-meta-sync/1.0; +https://aogl.cn/)",
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });
    const text = await r.text();
    if (!r.ok) return { ok: false, status: r.status, title: "", description: "" };
    const $ = cheerio.load(text);
    const title =
      $("meta[property='og:title']").attr("content") ||
      $("title").first().text() ||
      "";
    const description =
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='description']").attr("content") ||
      "";
    return {
      ok: true,
      status: r.status,
      title: String(title).trim().slice(0, 200),
      description: String(description).trim().slice(0, 600),
    };
  } catch (e) {
    return { ok: false, status: 0, title: "", description: "", error: String(e.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
