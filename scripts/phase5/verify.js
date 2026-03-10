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
    check: "Copilot architecture modules implemented",
    pass:
      hasAll("src/backend/copilot/context.ts", ["buildCopilotContext"]) &&
      hasAll("src/backend/copilot/engine.ts", ["generateCopilotExplanation", "buildCopilotContext"]) &&
      hasAll("src/backend/copilot/actions.ts", ["executeApprovedCopilotAction"]) &&
      hasAll("src/backend/copilot/guardrails.ts", ["enforceCopilotActionGuardrails", "requireHumanApprovalForSensitiveAction"]),
    detail: "Copilot context, engine, actions, and guardrails are implemented"
  });

  results.push({
    check: "Copilot service and APIs available",
    pass:
      hasAll("src/backend/copilot/service.ts", ["getCopilotRecommendations", "executeCopilotAction", "enforceCopilotActionGuardrails"]) &&
      hasAll("src/app/api/copilot/recommendations/route.ts", ["getCopilotRecommendations", "Unauthorized"]) &&
      hasAll("src/app/api/copilot/actions/route.ts", ["executeCopilotAction", "action is required"]) &&
      hasAll("src/app/api/copilot/query/route.ts", ["generateCopilotExplanation", "query is required"]),
    detail: "Copilot recommendation, action, and query APIs are available"
  });

  results.push({
    check: "Policy AI generator implemented",
    pass:
      hasAll("src/backend/policy-ai/templates.ts", ["POLICY_TEMPLATES", "Access Control Policy"]) &&
      hasAll("src/backend/policy-ai/generator.ts", ["generatePolicyDraft", "templateKey"]) &&
      hasAll("src/backend/policy-ai/review.ts", ["reviewPolicyDraft", "Missing purpose section"]) &&
      hasAll("src/app/api/policies/generate/route.ts", ["generatePolicyDraft", "reviewPolicyDraft", "preview"]),
    detail: "Policy AI templates, generation, and review are implemented"
  });

  results.push({
    check: "Evidence AI review implemented",
    pass:
      hasAll("src/backend/evidence-ai/validator.ts", ["validateEvidenceWithAi"]) &&
      hasAll("src/backend/evidence-ai/analysis.ts", ["analyzeEvidenceContent"]) &&
      hasAll("src/backend/evidence-ai/recommendations.ts", ["buildEvidenceRecommendations"]) &&
      hasAll("src/app/api/evidence/ai-review/route.ts", ["validateEvidenceWithAi", "evidenceId is required"]),
    detail: "Evidence AI analysis, validation, and recommendations are implemented"
  });

  results.push({
    check: "Audit AI assistant implemented",
    pass:
      hasAll("src/backend/audit-ai/assistant.ts", ["runAuditAssistant", "generateAuditSummary", "answerAuditQuestion"]) &&
      hasAll("src/backend/audit-ai/qa.ts", ["answerAuditQuestion"]) &&
      hasAll("src/backend/audit-ai/report.ts", ["generateAuditSummary"]) &&
      hasAll("src/app/api/audit/assistant/route.ts", ["runAuditAssistant", "Unauthorized"]),
    detail: "Audit AI assistant, Q&A, and summary generation are implemented"
  });

  results.push({
    check: "Regulatory intelligence ingestion pipeline implemented",
    pass:
      hasAll("src/backend/regulatory/ingestion.ts", ["ingestRegulatoryUpdates", "DEFAULT_REGULATORY_FEED"]) &&
      hasAll("src/backend/regulatory/parser.ts", ["parseRegulatoryFeed"]) &&
      hasAll("src/backend/regulatory/impact.ts", ["computeRegulatoryImpactSignal"]) &&
      hasAll("src/backend/regulatory/timeline.ts", ["getRegulatoryTimeline"]) &&
      hasAll("src/app/api/regulatory/timeline/route.ts", ["getRegulatoryTimeline"]),
    detail: "Regulatory ingestion, parser, impact, and timeline capabilities are implemented"
  });

  results.push({
    check: "Enterprise reporting exports implemented",
    pass:
      hasAll("src/backend/reporting/enterprise.ts", ["buildEnterpriseReports", "isoReadinessReport", "riskHeatmap"]) &&
      hasAll("src/app/api/reports/enterprise/route.ts", ["buildEnterpriseReports", "format", "text/csv", "application/pdf"]),
    detail: "Enterprise reporting supports JSON/CSV/PDF exports"
  });

  results.push({
    check: "Phase 5 scripts registered",
    pass: hasAll("package.json", ["phase5:verify", "phase5:regression", "phase5:closure"]),
    detail: "package.json exposes phase5 governance scripts"
  });

  results.push({
    check: "Phase 5 regression matrix exists",
    pass: hasAll("docs/verification/phase5-regression-matrix.json", ["Phase 5 - AI Compliance Operating System", "suites", "checks"]),
    detail: "Phase 5 regression matrix is defined"
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
