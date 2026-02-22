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

  const verification = readJson("docs/verification/phase1-verification.json");
  const matrix = readJson("docs/verification/phase1-regression-matrix.json");
  const regression = readJson("docs/verification/phase1-regression-report.json");
  const internalAudit = readJson("docs/verification/records/internal-audit.json");
  const managementReview = readJson("docs/verification/records/management-review.json");
  const workflow = readText(".github/workflows/phase1-release-gate.yml");

  const results = [];

  const verifyPass = !!verification && verification.passed === verification.total;
  results.push(
    buildResult(
      "Static verification gate",
      verifyPass,
      verifyPass
        ? `phase1-verification.json: ${verification.passed}/${verification.total} checks passed`
        : "phase1-verification.json missing or not fully passing",
      verifyPass ? [] : ["Run npm run phase1:verify and commit updated report"]
    )
  );

  const matrixCheckCount = Array.isArray(matrix?.suites)
    ? matrix.suites.reduce((sum, suite) => {
        const checks = Array.isArray(suite.checks) ? suite.checks : [];
        return sum + checks.length;
      }, 0)
    : 0;
  const hasRegressionMatrix = matrixCheckCount >= 10;
  results.push(
    buildResult(
      "Regression matrix",
      hasRegressionMatrix,
      hasRegressionMatrix
        ? `${matrix?.suites?.length || 0} suites and ${matrixCheckCount} checks defined`
        : "Regression matrix missing or incomplete (<10 checks)",
      hasRegressionMatrix ? [] : ["Define at least 10 regression checks in docs/verification/phase1-regression-matrix.json"]
    )
  );

  const regressionPass = !!regression && regression.passed === regression.total && regression.total >= 10;
  results.push(
    buildResult(
      "Regression execution report",
      regressionPass,
      regressionPass
        ? `phase1-regression-report.json: ${regression.passed}/${regression.total} checks passed`
        : "phase1-regression-report.json missing or not fully passing",
      regressionPass ? [] : ["Run npm run phase1:regression and commit updated report"]
    )
  );

  const internalApproved = internalAudit?.status === "approved" && !!internalAudit?.approvedAt;
  const managementApproved = managementReview?.status === "approved" && !!managementReview?.approvedAt;
  const auditWorkflowComplete = internalApproved && managementApproved;
  const auditBlockers = [];
  if (!internalApproved) auditBlockers.push("Internal audit record must be approved with approvedAt timestamp");
  if (!managementApproved) auditBlockers.push("Management review record must be approved with approvedAt timestamp");

  results.push(
    buildResult(
      "Enterprise audit workflow",
      auditWorkflowComplete,
      auditWorkflowComplete
        ? "Internal audit and management review are both approved"
        : "Audit workflow records are present but not fully approved",
      auditBlockers
    )
  );

  const ciTokens = [
    "npx prisma validate",
    "npm run lint",
    "npm run build",
    "npm run phase1:verify",
    "npm run phase1:regression",
    "npm run phase1:closure",
    "actions/upload-artifact@v4"
  ];
  const ciReady = hasAllTokens(workflow, ciTokens);
  results.push(
    buildResult(
      "CI sign-off evidence",
      ciReady,
      ciReady
        ? "Workflow executes Phase 1 gate and publishes evidence artifacts"
        : "Workflow is missing required gate steps or artifact publishing",
      ciReady
        ? []
        : [
            "Include prisma validate, lint, build, phase1:verify, phase1:closure, and artifact upload steps in workflow"
          ]
    )
  );

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const fullyComplete = passed === total;

  const report = {
    generatedAt: new Date().toISOString(),
    strict,
    passed,
    total,
    completionPercent: Math.round((passed / total) * 100),
    fullyComplete,
    results
  };

  const outPath = path.join(root, "docs", "verification", "phase1-closure-status.json");
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

  for (const result of results) {
    const mark = result.pass ? "PASS" : "FAIL";
    console.log(`[${mark}] ${result.name} :: ${result.detail}`);
    for (const blocker of result.blockers) {
      console.log(`  - ${blocker}`);
    }
  }
  console.log(`Saved report: ${outPath}`);

  if (strict && !fullyComplete) {
    process.exit(1);
  }
}

run();
