#!/usr/bin/env node
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync(process.execPath, ["scripts/update-reading.mjs", "--verify-only"], {
  cwd: root,
  stdio: "inherit",
});
process.exit(r.status ?? 1);
