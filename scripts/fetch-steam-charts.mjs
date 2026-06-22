#!/usr/bin/env node
/**
 * Refresh data/steam-charts-snapshot.json from Valve store / optional Web API key.
 * Run weekly (see .github/workflows/steam-charts-weekly.yml) or locally:
 *   npm run fetch-steam-charts
 * Then rebuild article HTML:
 *   npm run build-articles && npm run build-seo-locales
 */
import { fetchSteamChartsSnapshot, saveSteamChartsSnapshot } from "./steam-charts-lib.mjs";

async function main() {
  const snapshot = await fetchSteamChartsSnapshot();
  saveSteamChartsSnapshot(snapshot);
  const mp = snapshot.mostPlayed?.length ?? 0;
  const ts = snapshot.topSellers?.length ?? 0;
  const wk = snapshot.weeklyTopSellers?.length ?? 0;
  console.log(
    `Wrote data/steam-charts-snapshot.json (${snapshot.fetchStatus}; mostPlayed=${mp}, topSellers=${ts}, weekly=${wk})`,
  );
  if (snapshot.fetchNote) console.log("Note:", snapshot.fetchNote);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
