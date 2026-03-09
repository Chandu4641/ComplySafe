const fs = require("fs");
const path = require("path");

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function hasAll(rel, tokens) {
  const txt = read(rel);
  return tokens.every((token) => txt.includes(token));
}

function run() {
  const results = [];

  results.push({
    check: "Copilot policy guardrails implemented",
    pass: hasAll("src/backend/copilot/policy.ts", ["evaluateCopilotAction", "requiresApproval", "High-risk action requires explicit human approval"]),
    detail: "Copilot policy evaluates action safety and approval requirements"
  });

  results.push({
    check: "Copilot recommendation service implemented",
    pass: hasAll("src/backend/copilot/service.ts", ["getCopilotRecommendations", "executeCopilotAction", "copilotActionExecution.create"]),
    detail: "Copilot service provides recommendations and execution guardrails"
  });

  results.push({
    check: "Copilot recommendations API available",
    pass: hasAll("src/app/api/copilot/recommendations/route.ts", ["getCopilotRecommendations", "NextResponse.json", 'runtime = "nodejs"']),
    detail: "Recommendations endpoint is available"
  });

  results.push({
    check: "Copilot actions API available",
    pass: hasAll("src/app/api/copilot/actions/route.ts", ["executeCopilotAction", "action is required", "action.targetId is required"]),
    detail: "Action execution endpoint enforces policy checks"
  });

  results.push({
    check: "Phase 5 scripts registered",
    pass: hasAll("package.json", ["phase5:verify", "phase5:regression", "phase5:closure"]),
    detail: "package.json exposes phase5 governance scripts"
  });

  results.push({
    check: "Phase 5 regression matrix exists",
    pass: hasAll("docs/verification/phase5-regression-matrix.json", ["Phase 5 - AI Automation + Co-Pilot", "suites", "checks"]),
    detail: "Phase 5 regression matrix is defined"
  });

  results.push({
    check: "Guardrail simulation exists",
    pass: hasAll("scripts/phase5/simulations/guardrail-smoke.js", ["approval_required", "Smoke check passed"]),
    detail: "Guardrail simulation is present"
  });

  results.push({
    check: "Recommendation simulation exists",
    pass: hasAll("scripts/phase5/simulations/recommendation-smoke.js", ["recommendations", "Smoke check passed"]),
    detail: "Recommendation simulation is present"
  });

  results.push({
    check: "Action execution simulation exists",
    pass: hasAll("scripts/phase5/simulations/action-exec-smoke.js", ["executed", "Smoke check passed"]),
    detail: "Action execution simulation is present"
  });

  results.push({
    check: "Phase 5 workflow exists",
    pass: hasAll(".github/workflows/phase5-release-gate.yml", ["npm run phase5:verify", "npm run phase5:regression", "npm run phase5:closure -- --strict"]),
    detail: "Phase 5 release gate workflow is configured"
  });

  const passed = results.filter((r) => r.pass).length;
  const output = {
    timestamp: new Date().toISOString(),
    passed,
    total: results.length,
    results
  };

  const outPath = path.join(root, "docs", "verification", "phase5-verification.json");
  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);

  for (const result of results) {
    const mark = result.pass ? "PASS" : "FAIL";
    console.log(`[${mark}] ${result.check} :: ${result.detail}`);
  }

  console.log(`Saved report: ${outPath}`);
  process.exit(passed === results.length ? 0 : 1);
}

run();
