const fs = require("fs");
const path = require("path");

const root = process.cwd();

function readJson(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readText(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return "";
  return fs.readFileSync(file, "utf8");
}

function hasAllTokens(text, tokens) {
  return tokens.every((token) => text.includes(token));
}

function buildResult(name, pass, detail, blockers = []) {
  return { name, pass, detail, blockers };
}

function run() {
  const strict = process.argv.includes("--strict");

  const verification = readJson("docs/verification/phase3-verification.json");
  const matrix = readJson("docs/verification/phase3-regression-matrix.json");
  const regression = readJson("docs/verification/phase3-regression-report.json");
  const workflow = readText(".github/workflows/phase3-release-gate.yml");

  const results = [];

  const verifyPass = !!verification && verification.passed === verification.total;
  results.push(
    buildResult(
      "Static verification gate",
      verifyPass,
      verifyPass
        ? `phase3-verification.json: ${verification.passed}/${verification.total} checks passed`
        : "phase3-verification.json missing or not fully passing",
      verifyPass ? [] : ["Run npm run phase3:verify and commit updated report"]
    )
  );

  const matrixCheckCount = Array.isArray(matrix?.suites)
    ? matrix.suites.reduce((sum, suite) => sum + ((suite.checks || []).length || 0), 0)
    : 0;
  const hasRegressionMatrix = matrixCheckCount >= 10;
  results.push(
    buildResult(
      "Regression matrix",
      hasRegressionMatrix,
      hasRegressionMatrix
        ? `${matrix?.suites?.length || 0} suites and ${matrixCheckCount} checks defined`
        : "Regression matrix missing or incomplete (<10 checks)",
      hasRegressionMatrix ? [] : ["Define at least 10 regression checks in docs/verification/phase3-regression-matrix.json"]
    )
  );

  const regressionPass = !!regression && regression.passed === regression.total && regression.total >= 10;
  results.push(
    buildResult(
      "Regression execution report",
      regressionPass,
      regressionPass
        ? `phase3-regression-report.json: ${regression.passed}/${regression.total} checks passed`
        : "phase3-regression-report.json missing or not fully passing",
      regressionPass ? [] : ["Run npm run phase3:regression and commit updated report"]
    )
  );

  const ciTokens = [
    "npx prisma validate",
    "npm run lint",
    "npm run build",
    "npm run phase3:verify",
    "npm run phase3:regression",
    "npm run phase3:closure -- --strict",
    "actions/upload-artifact@v4"
  ];
  const ciReady = hasAllTokens(workflow, ciTokens);
  results.push(
    buildResult(
      "CI sign-off evidence",
      ciReady,
      ciReady
        ? "Workflow executes Phase 3 gate and publishes evidence artifacts"
        : "Workflow is missing required gate steps or artifact publishing",
      ciReady ? [] : ["Update .github/workflows/phase3-release-gate.yml with full release gate steps"]
    )
  );

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const fullyComplete = passed === total;
  const status = fullyComplete ? "closed" : "pending_runtime_validation";

  const report = {
    generatedAt: new Date().toISOString(),
    strict,
    status,
    passed,
    total,
    completionPercent: Math.round((passed / total) * 100),
    fullyComplete,
    results
  };

  const outPath = path.join(root, "docs", "verification", "phase3-closure-status.json");
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  const mirrorPath = path.join(root, "docs", "phase3-closure-status.json");
  const mirror = {
    phase: "Phase 3 — Continuous Compliance Intelligence",
    status,
    updatedAt: report.generatedAt,
    sourceOfTruth: "docs/verification/phase3-closure-status.json",
    summary: {
      fullyComplete: report.fullyComplete,
      passed: report.passed,
      total: report.total
    },
    blockers: report.results.filter((result) => !result.pass).flatMap((result) => result.blockers)
  };
  fs.writeFileSync(mirrorPath, `${JSON.stringify(mirror, null, 2)}\n`);

  for (const result of results) {
    const mark = result.pass ? "PASS" : "FAIL";
    console.log(`[${mark}] ${result.name} :: ${result.detail}`);
  }

  console.log(`Saved report: ${outPath}`);
  console.log(`Saved mirror: ${mirrorPath}`);

  if (strict && !fullyComplete) process.exit(1);
}

run();
