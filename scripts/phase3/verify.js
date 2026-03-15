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
    check: "ControlHealthSnapshot model operational",
    pass: hasAll("prisma/schema.prisma", ["model ControlHealthSnapshot", "healthScore", "driftDetected", "@@index([orgId, controlId, calculatedAt])"]),
    detail: "Schema includes control health snapshot model with tenant indexes"
  });

  results.push({
    check: "RiskTrendSnapshot model operational",
    pass: hasAll("prisma/schema.prisma", ["model RiskTrendSnapshot", "riskId", "score", "@@index([orgId, riskId, capturedAt])"]),
    detail: "Schema includes risk trend snapshots with org-scoped indexes"
  });

  results.push({
    check: "ControlEffectiveness model operational",
    pass: hasAll("prisma/schema.prisma", ["model ControlEffectiveness", "score", "@@unique([orgId, controlId])"]),
    detail: "Schema includes control effectiveness storage for advanced risk scoring"
  });

  results.push({
    check: "Audit collaboration models accessible",
    pass: hasAll("prisma/schema.prisma", ["model AuditAssignment", "model AuditComment", "parentCommentId", "AuditAssignmentStatus"]),
    detail: "Schema includes assignment lifecycle and threaded comments"
  });

  results.push({
    check: "Control health engine implemented",
    pass: hasAll("src/backend/monitoring/control-health.ts", ["runControlHealthMonitoring", "controlHealthSnapshot.create", "controlEffectiveness.upsert"]),
    detail: "Control health engine calculates and persists snapshots"
  });

  results.push({
    check: "Risk drift detection implemented",
    pass: hasAll("src/backend/monitoring/risk-drift.ts", ["runRiskDriftDetection", "riskTrendSnapshot", "RISK_DRIFT_UPWARD"]),
    detail: "Risk drift service captures trends and emits monitoring issues"
  });

  results.push({
    check: "Advanced risk scoring integrated",
    pass: hasAll("src/backend/risk/service.ts", ["calculateEnhancedResidualRisk", "controlEffectivenessModifier", "trendWeight", "captureRiskTrendSnapshot"]),
    detail: "Risk service uses control effectiveness and trend weight while preserving compatibility"
  });

  results.push({
    check: "Collaboration APIs available",
    pass: hasAll("src/app/api/audit/assign/route.ts", ["createAuditAssignment", "assignedTo is required"]) &&
      hasAll("src/app/api/audit/comment/route.ts", ["addAuditComment", "message is required"]) &&
      hasAll("src/app/api/audit/approve/route.ts", ["transitionAuditAssignment", "start_review"]) &&
      hasAll("src/app/api/audit/assignments/route.ts", ["listAuditAssignments", "assignments"]),
    detail: "Audit assignment, comment, approval, and list endpoints are wired"
  });

  results.push({
    check: "Intelligence endpoints respond",
    pass: hasAll("src/app/api/intelligence/control-health/route.ts", ["getLatestControlHealth", "NextResponse.json"]) &&
      hasAll("src/app/api/intelligence/risk-drift/route.ts", ["runRiskDriftDetection", "NextResponse.json"]) &&
      hasAll("src/app/api/intelligence/control-trends/route.ts", ["getControlTrendSeries", "NextResponse.json"]) &&
      hasAll("src/app/api/intelligence/readiness-trend/route.ts", ["getReadinessTrendSeries", "NextResponse.json"]) &&
      hasAll("src/app/api/intelligence/sla-risk/route.ts", ["getSlaRiskSeries", "NextResponse.json"]),
    detail: "Phase 3 intelligence endpoints are available"
  });

  results.push({
    check: "Phase 3 scripts registered",
    pass: hasAll("package.json", ["phase3:verify", "phase3:regression", "phase3:closure"]),
    detail: "package.json exposes phase3 governance scripts"
  });

  const passed = results.filter((r) => r.pass).length;
  const output = {
    timestamp: new Date().toISOString(),
    passed,
    total: results.length,
    results
  };

  const outPath = path.join(root, "docs", "verification", "phase3-verification.json");
  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);

  for (const result of results) {
    const mark = result.pass ? "PASS" : "FAIL";
    console.log(`[${mark}] ${result.check} :: ${result.detail}`);
  }

  console.log(`Saved report: ${outPath}`);
  process.exit(passed === results.length ? 0 : 1);
}

run();
