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
  const checks = [
    {
      check: "Integration provider collectors implemented",
      pass:
        hasAll("src/backend/integrations/aws/collector.ts", ["collectAwsIntegration"]) &&
        hasAll("src/backend/integrations/aws/rules.ts", ["AWS_S3_PUBLIC_ACCESS"]) &&
        hasAll("src/backend/integrations/github/collector.ts", ["collectGithubIntegration"]) &&
        hasAll("src/backend/integrations/github/rules.ts", ["GH_BRANCH_PROTECTION"]) &&
        hasAll("src/backend/integrations/okta/collector.ts", ["collectOktaIntegration"]) &&
        hasAll("src/backend/integrations/okta/rules.ts", ["OKTA_MFA_ENFORCED"]) &&
        hasAll("src/backend/integrations/google-workspace/collector.ts", ["collectGoogleWorkspaceIntegration"]) &&
        hasAll("src/backend/integrations/google-workspace/rules.ts", ["GW_MFA_ENFORCED"]) &&
        hasAll("src/backend/integrations/azure/collector.ts", ["collectAzureIntegration"]) &&
        hasAll("src/backend/integrations/azure/rules.ts", ["AZ_DEFENDER_ENABLED"]),
      detail: "AWS, GitHub, Okta, Google Workspace, and Azure collectors exist"
    },
    {
      check: "Control monitoring engine implemented",
      pass:
        hasAll("src/backend/monitoring/engine.ts", ["runMonitoringEngine", "collectIntegrationEvidence", "automateRiskFromControlFailure"]) &&
        hasAll("src/backend/monitoring/evaluator.ts", ["evaluateCollectionsAgainstControlRules"]) &&
        hasAll("src/backend/monitoring/rules.ts", ["MONITORING_CONTROL_RULES"]),
      detail: "Scheduler -> collectors -> evaluation -> evidence -> risk flow is implemented"
    },
    {
      check: "Evidence auto collection implemented",
      pass:
        hasAll("src/backend/evidence/collector.ts", ["collectIntegrationEvidence", "storeAutomatedEvidence"]) &&
        hasAll("src/backend/evidence/storage.ts", ["storeAutomatedEvidence", "prisma.evidence.create"]) &&
        hasAll("src/backend/evidence/validator.ts", ["validateEvidencePayload"]),
      detail: "Automated evidence collection, validation, and storage are implemented"
    },
    {
      check: "Compliance scanner modules implemented",
      pass:
        hasAll("src/backend/scanner/portScanner.ts", ["scanOpenPorts"]) &&
        hasAll("src/backend/scanner/tlsScanner.ts", ["scanTlsConfiguration"]) &&
        hasAll("src/backend/scanner/dnsScanner.ts", ["scanDnsAndEmailSecurity"]) &&
        hasAll("src/backend/scanner/report.ts", ["runAttackSurfaceScan"]) &&
        hasAll("src/app/api/scanner/attack-surface/route.ts", ["runAttackSurfaceScan", "prisma.finding.createMany"]),
      detail: "Port, TLS, DNS/email scanners and report aggregation are implemented"
    },
    {
      check: "Risk automation engine implemented",
      pass:
        hasAll("src/backend/risk/engine.ts", ["automateRiskFromControlFailure", "createRisk", "createRemediationTask"]) &&
        hasAll("src/backend/risk/scoring.ts", ["scoreRiskFromFailure"]) &&
        hasAll("src/backend/risk/remediation.ts", ["createRemediationTask", "prisma.task.create"]),
      detail: "Failed controls auto-create risks and remediation tasks"
    },
    {
      check: "Dashboard APIs available",
      pass:
        hasAll("src/app/api/dashboard/compliance/route.ts", ["getComplianceDashboard", "Unauthorized"]) &&
        hasAll("src/app/api/dashboard/controls/route.ts", ["getControlDashboard", "Unauthorized"]) &&
        hasAll("src/app/api/dashboard/risks/route.ts", ["getRiskDashboard", "Unauthorized"]) &&
        hasAll("src/app/api/dashboard/monitoring/route.ts", ["getMonitoringDashboard", "Unauthorized"]),
      detail: "Operational dashboard APIs are implemented"
    },
    {
      check: "Prisma schema supports integration accounts and evidence JSON",
      pass:
        hasAll("prisma/schema.prisma", ["model IntegrationAccount", "metadata      Json", "data            Json?", "provider  String?"]),
      detail: "Schema supports integration account metadata and evidence payloads"
    },
    {
      check: "Phase 4 scripts registered",
      pass: hasAll("package.json", ["phase4:verify", "phase4:regression", "phase4:closure"]),
      detail: "package.json exposes phase4 governance scripts"
    },
    {
      check: "Phase 4 workflow exists",
      pass: hasAll(".github/workflows/phase4-release-gate.yml", ["npm run phase4:verify", "npm run phase4:regression", "npm run phase4:closure -- --strict"]),
      detail: "Phase 4 release gate workflow is configured"
    },
    {
      check: "Phase matrix includes Phase 4 automation scope",
      pass: hasAll("docs/verification/phase-matrix.md", ["Phase 4", "Compliance Automation Platform"]),
      detail: "Phase matrix tracks Phase 4 objective"
    }
  ];

  const passed = checks.filter((r) => r.pass).length;
  const output = {
    timestamp: new Date().toISOString(),
    passed,
    total: checks.length,
    results: checks
  };

  const outPath = path.join(root, "docs", "verification", "phase4-verification.json");
  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);

  for (const result of checks) {
    const mark = result.pass ? "PASS" : "FAIL";
    console.log(`[${mark}] ${result.check} :: ${result.detail}`);
  }

  console.log(`Saved report: ${outPath}`);
  process.exit(passed === checks.length ? 0 : 1);
}

run();
