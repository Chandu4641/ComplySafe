const fs = require("fs");
const path = require("path");
const { assertIsoCatalogLock } = require("../../tests/iso-catalog-lock");

const root = process.cwd();

function pickExisting(candidates, label) {
  for (const rel of candidates) {
    const abs = path.join(root, rel);
    if (fs.existsSync(abs)) return rel;
  }
  throw new Error(`Missing required file for ${label}: ${candidates.join(" | ")}`);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function hasPattern(text, pattern) {
  const txt = text;
  return pattern.test(txt);
}

function run() {
  const results = [];

  let lockCounts = { org: 0, people: 0, physical: 0, tech: 0, total: 0 };
  let isoLockPass = false;
  try {
    lockCounts = assertIsoCatalogLock(root);
    isoLockPass = true;
  } catch {
    isoLockPass = false;
  }

  results.push({
    check: "ISO Annex A control count",
    pass: isoLockPass,
    detail: `counts: A.5=${lockCounts.org}, A.6=${lockCounts.people}, A.7=${lockCounts.physical}, A.8=${lockCounts.tech}, total=${lockCounts.total}`
  });

  const soaRoutePath = pickExisting(
    ["src/app/api/soa/route.ts", "app/api/soa/route.ts"],
    "SoA route"
  );
  const soaRoute = read(soaRoutePath);
  results.push({
    check: "SoA PDF binary response",
    pass: /application\/pdf/.test(soaRoute) && /PDFDocument/.test(soaRoute),
    detail: `${soaRoutePath} contains PDF generation and application/pdf response`
  });

  const schedulerPath = pickExisting(
    ["src/backend/monitoring/scheduler.ts", "lib/monitoring/scheduler.ts"],
    "monitoring scheduler core"
  );
  const scheduler = read(schedulerPath);
  results.push({
    check: "No memory scheduler flags",
    pass: !/schedulerRunning|lastRunKey|runKeyForNow/.test(scheduler),
    detail: `${schedulerPath} no longer uses in-memory run guards`
  });

  const schedulerRoutePath = pickExisting(
    ["src/app/api/monitoring/scheduler/route.ts", "app/api/monitoring/scheduler/route.ts"],
    "monitoring scheduler route"
  );
  const schedulerRoute = read(schedulerRoutePath);
  results.push({
    check: "Scheduler supports cron trigger",
    pass: /x-vercel-cron/.test(schedulerRoute) && /export async function GET/.test(schedulerRoute),
    detail: `${schedulerRoutePath} supports GET + cron header auth`
  });

  const verificationRoutePath = pickExisting(
    ["src/app/api/system/verification/route.ts", "app/api/system/verification/route.ts"],
    "system verification route"
  );
  const verificationRoute = read(verificationRoutePath);
  const noConsole = !hasPattern(soaRoute, /console\./) &&
    !hasPattern(scheduler, /console\./) &&
    !hasPattern(verificationRoute, /console\./);
  results.push({
    check: "No console logs in hardened Phase 1 files",
    pass: noConsole,
    detail: `checked ${soaRoutePath}, ${schedulerPath}, ${verificationRoutePath}`
  });

  const passCount = results.filter((r) => r.pass).length;
  const output = {
    timestamp: new Date().toISOString(),
    passed: passCount,
    total: results.length,
    results
  };

  const outPath = path.join(root, "docs", "verification", "phase1-verification.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  for (const r of results) {
    const mark = r.pass ? "PASS" : "FAIL";
    console.log(`[${mark}] ${r.check} :: ${r.detail}`);
  }

  console.log(`Saved report: ${outPath}`);
  process.exit(passCount === results.length ? 0 : 1);
}

run();
