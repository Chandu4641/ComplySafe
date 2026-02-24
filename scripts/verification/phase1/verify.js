const fs = require("fs");
const path = require("path");
const { assertIsoCatalogLock } = require("../../tests/iso-catalog-lock");

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function hasPattern(rel, pattern) {
  const txt = read(rel);
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

  const soaRoute = read("app/api/soa/route.ts");
  results.push({
    check: "SoA PDF binary response",
    pass: /application\/pdf/.test(soaRoute) && /PDFDocument/.test(soaRoute),
    detail: "route contains PDF generation and application/pdf response"
  });

  const scheduler = read("lib/monitoring/scheduler.ts");
  results.push({
    check: "No memory scheduler flags",
    pass: !/schedulerRunning|lastRunKey|runKeyForNow/.test(scheduler),
    detail: "scheduler file no longer uses in-memory run guards"
  });

  const schedulerRoute = read("app/api/monitoring/scheduler/route.ts");
  results.push({
    check: "Scheduler supports cron trigger",
    pass: /x-vercel-cron/.test(schedulerRoute) && /export async function GET/.test(schedulerRoute),
    detail: "route supports GET + cron header auth"
  });

  const noConsole = !hasPattern("app/api/soa/route.ts", /console\./) &&
    !hasPattern("lib/monitoring/scheduler.ts", /console\./) &&
    !hasPattern("app/api/system/verification/route.ts", /console\./);
  results.push({
    check: "No console logs in hardened Phase 1 files",
    pass: noConsole,
    detail: "checked critical Phase 1 files"
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
