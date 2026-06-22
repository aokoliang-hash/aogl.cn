/**
 * One-off parser for Steam weekly top sellers tbody HTML → snapshot JSON rows.
 * Usage: node tools/parse-steam-weekly-html.mjs < html-snippet.txt
 */
import fs from "fs";

const html = fs.readFileSync(0, "utf8");

const rowRe = /<tr class="_2-RN6nWOY56sNmcDHu069P">([\s\S]*?)<\/tr>/g;

function cleanName(raw) {
  return raw
    .replace(/<span class="_1VpmUWOpL8QFhgJE9-wTWg">[\s\S]*?<\/span>/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function extractPrice(block) {
  const aria = block.match(/aria-label="([^"]+)"/);
  const sale = block.match(/class="_3j4dI1yA7cRfCvK8h406OB">([^<]+)</);
  const pre = block.includes("预购");
  const neu = block.includes("新品");
  const priceText = sale ? sale[1].trim() : "—";
  let priceEn = priceText;
  let priceZh = priceText;

  if (priceText === "免费开玩") {
    priceEn = "Free to Play";
    priceZh = "免费开玩";
  } else if (pre) {
    priceEn = `Pre-order · ${priceText}`;
    priceZh = `预购 · ${priceText}`;
  } else if (neu) {
    priceEn = `New · ${priceText}`;
    priceZh = `新品 · ${priceText}`;
  } else if (aria) {
    const m = aria[1].match(/原价为 HK\$ ([\d.]+)，折后为 HK\$ ([\d.]+)/);
    const pct = aria[1].match(/立省 (\d+)%/);
    if (m && pct) {
      priceEn = `HK$ ${m[2]} (-${pct[1]}%)`;
      priceZh = `HK$ ${m[2]}（原价 HK$ ${m[1]}，-${pct[1]}%）`;
    }
  }

  return { price: priceEn, priceZh };
}

function extractChange(block) {
  const spanNew = block.includes("_3VOg1Au8rs5wnnu2fXny0M">新上榜");
  const spanRe = block.includes("CQijl-dgrfQHKUydm9c2F">再度上榜");
  const changeDiv = block.match(
    /class="_1ZdIh_OWh9DUr5O4OCypQn[^"]*">[\s\S]*?class="_2OA1JW-4H-f01kM7myTUuu Focusable">([^<]+(?:<[^>]+>[^<]*)?)<\/div>/,
  );
  let raw = changeDiv ? changeDiv[1].replace(/<[^>]+>/g, "").trim() : "—";
  if (spanNew) raw = "新上榜";
  if (spanRe) raw = "再度上榜";
  if (raw === "0" || raw === " 0") raw = "—";

  let change = raw;
  let changeZh = raw;
  if (raw === "新上榜") change = "New";
  if (raw === "再度上榜") change = "Re-entry";

  return { change, changeZh };
}

function isMostlyChinese(s) {
  return /[\u4e00-\u9fff]/.test(s) && !/^[A-Za-z0-9\s™®:.-]+$/.test(s);
}

const rows = [];
let m;
while ((m = rowRe.exec(html)) !== null) {
  const block = m[1];
  const rankM = block.match(/class="_34h48M_x9S-9Q2FFPX_CcU">(\d+)</);
  const nameM = block.match(/class="_1n_4-zvf0n4aqGEksbgW9N">([\s\S]*?)<\/div>/);
  const urlM = block.match(/href="(https:\/\/store\.steampowered\.com\/app\/\d+[^"]*)"/);
  const weeksM = block.match(/class="xm7JpnZElM9XGF4ruu0Z-">[\s\S]*?>(\d+)</);

  if (!rankM || !nameM) continue;

  const rank = Number(rankM[1]);
  if (rank > 50) break;

  const displayName = cleanName(nameM[1]);
  const { price, priceZh } = extractPrice(block);
  const { change, changeZh } = extractChange(block);
  const url = urlM ? urlM[1].replace(/\?snr=[^"]*/, "").replace(/\/$/, "") + "/" : null;
  const appidM = url?.match(/\/app\/(\d+)/);
  const appid = appidM ? Number(appidM[1]) : null;

  const row = {
    rank,
    name: isMostlyChinese(displayName) ? displayName : displayName,
    price,
    priceZh,
    change,
    changeZh,
    weeksOnChart: weeksM ? Number(weeksM[1]) : null,
    url: url || `https://store.steampowered.com/charts/`,
  };
  if (appid) row.appid = appid;
  if (isMostlyChinese(displayName)) row.nameZh = displayName;

  rows.push(row);
}

console.log(JSON.stringify(rows, null, 2));
console.error(`Parsed ${rows.length} rows (ranks 1–50).`);
