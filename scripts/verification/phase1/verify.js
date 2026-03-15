const fs = require("fs");
const path = require("path");
const { assertIsoCatalogLock } = require("../../tests/iso-catalog-lock");

// Pragmatic root detection: ensures we are at the project root regardless of where script is called
const root = process.cwd();

/**
 * Robust file locator that handles different directory structures (src vs root)
 * and provides clear GRC evidence logs.
 */
function pickExisting(candidates, label) {
  for (const rel of candidates) {
    const abs = path.resolve(root, rel); // Use resolve for absolute path consistency
    if (fs.existsSync(abs)) {
      return rel;
    }
  }
  // Detailed error for VAPT debugging
  console.error(`[ERROR] GRC Path Discovery Failed for: ${label}`);
  console.error(`Checked paths: ${candidates.map(c => path.resolve(root, c)).join(', ')}`);
  throw new Error(`ENOENT: Missing required file for ${label}`);
}

function read(rel) {
  return fs.readFileSync(path.resolve(root, rel), "utf8");
}

function hasPattern(text, pattern) {
  return pattern.test(text);
}

function run() {
  const results = [];

  // --- 1. ISO Catalog Verification ---
  let lockCounts = { org: 0, people: 0, physical: 0, tech: 0, total: 0 };
  let isoLockPass = false;
  try {
    lockCounts = assertIsoCatalogLock(root);
    isoLockPass = true;
  } catch (err) {
    console.error(`ISO Lock Check Failed: ${err.message}`);
    isoLockPass = false;
  }

  results.push({
    check: "ISO Annex A control count",
    pass: isoLockPass,
    detail: `counts: A.5=${lockCounts.org}, A.6=${lockCounts.people}, A.7=${lockCounts.physical}, A.8=${lockCounts.tech}, total=${lockCounts.total}`
  });

  // --- 2. SoA Route Verification ---
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

  // --- 3. Scheduler Logic Verification ---
  const schedulerPath = pickExisting(
    ["src/backend/monitoring/scheduler.ts", "lib/monitoring/scheduler.ts", "src/lib/monitoring/scheduler.ts"],
    "monitoring scheduler core"
  );
  const scheduler = read(schedulerPath);
  results.push({
    check: "No memory scheduler flags",
    pass: !/schedulerRunning|lastRunKey|runKeyForNow/.test(scheduler),
    detail: `${schedulerPath} no longer uses in-memory run guards`
  });

  // --- 4. Cron Trigger Verification ---
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

  // --- 5. Hardening (No Console Logs) ---
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

  // --- Output Generation ---
  const passCount = results.filter((r) => r.pass).length;
  const output = {
    timestamp: new Date().toISOString(),
    passed: passCount,
    total: results.length,
    results
  };

  // Ensure directory exists before writing
  const outDir = path.join(root, "docs", "verification");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "phase1-verification.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  // Log summary to console
  for (const r of results) {
    const mark = r.pass ? "PASS" : "FAIL";
    console.log(`[${mark}] ${r.check} :: ${r.detail}`);
  }

  console.log(`Saved report: ${outPath}`);
  
  // Exit with 0 only if all checks pass - This is the CI/CD Gate
  process.exit(passCount === results.length ? 0 : 1);
}

run();