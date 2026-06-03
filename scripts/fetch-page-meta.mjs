/**
 * Fetch og:title / og:description / og:image from a public URL (used by brief + hub-link sync).
 */
import * as cheerio from "cheerio";
import { shouldSkipHotmixUrl } from "./hub-image-local.mjs";

export function pickOgImageFromHtml(html) {
  const $ = cheerio.load(html);
  const candidates = [
    $("meta[property='og:image']").attr("content"),
    $("meta[property='og:image:url']").attr("content"),
    $("meta[name='twitter:image']").attr("content"),
    $("meta[name='twitter:image:src']").attr("content"),
  ];
  for (const c of candidates) {
    const u = String(c || "").trim();
    if (u && !shouldSkipHotmixUrl(u)) return u;
  }
  return "";
}

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
    if (!r.ok) return { ok: false, status: r.status, title: "", description: "", image: "" };
    const $ = cheerio.load(text);
    const title =
      $("meta[property='og:title']").attr("content") ||
      $("title").first().text() ||
      "";
    const description =
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='description']").attr("content") ||
      "";
    const image = pickOgImageFromHtml(text);
    return {
      ok: true,
      status: r.status,
      title: String(title).trim().slice(0, 200),
      description: String(description).trim().slice(0, 600),
      image,
    };
  } catch (e) {
    return { ok: false, status: 0, title: "", description: "", image: "", error: String(e.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
