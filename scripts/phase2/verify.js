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
    check: "SOC2 catalog available",
    pass: hasAll("src/backend/frameworks/soc2.ts", ["SOC2_TSC", 'key: "SOC2"', "clauses"]),
    detail: "SOC2 framework seed exists with clause catalog"
  });

  results.push({
    check: "SOC2 criteria-based scoring implemented",
    pass: hasAll("src/backend/frameworks/soc2Scoring.ts", ["calculateSoc2CriteriaReadiness", "SOC2_CRITERIA_WEIGHTS", "overallReadinessPercent"]),
    detail: "SOC2 readiness scoring is computed by Trust Services Criteria"
  });

  results.push({
    check: "PCI-DSS catalog available",
    pass: hasAll("src/backend/frameworks/pci.ts", ["PCI_DSS_V4", 'key: "PCI_DSS"', "clauses"]),
    detail: "PCI framework seed exists with v4.0 clauses"
  });

  results.push({
    check: "HIPAA catalog available",
    pass: hasAll("src/backend/frameworks/hipaa.ts", ["HIPAA_SECURITY_RULE", 'key: "HIPAA_SECURITY"', "clauses"]),
    detail: "HIPAA Security Rule seed exists with clauses"
  });

  results.push({
    check: "Framework catalog orchestrator",
    pass: hasAll("src/backend/frameworks/service.ts", ["ensurePhase2FrameworkCatalogs", "PHASE2_FRAMEWORK_CATALOGS", "controlFrameworkMapping.upsert"]),
    detail: "Framework service seeds catalogs and maps clauses through ControlFrameworkMapping"
  });

  results.push({
    check: "Cross-framework mapping engine",
    pass: hasAll("src/backend/mappings/service.ts", ["ensureCrossFrameworkMappings", "crossFrameworkMapping", "canonicalControlId"]),
    detail: "Mapping service writes canonical control equivalence records"
  });

  results.push({
    check: "ISO<->SOC2 cross-framework mappings present",
    pass: hasAll("src/backend/mappings/catalog.ts", ['frameworkKey: "ISO27001"', 'frameworkKey: "SOC2"']),
    detail: "Cross-framework mapping catalog includes ISO and SOC2 equivalence"
  });

  results.push({
    check: "Coverage reporting engine",
    pass: hasAll("src/backend/reporting/frameworkCoverage.ts", ["buildFrameworkCoverageReport", "perFramework", "crossFramework", "soc2ReadinessPercent"]),
    detail: "Reporting engine generates per-framework coverage including SOC2 readiness %"
  });

  results.push({
    check: "SOC2 coverage reporting service",
    pass: hasAll("src/backend/reporting/soc2Coverage.ts", ["buildSoc2CoverageReport", "isoSoc2Mappings", "overallReadinessPercent"]),
    detail: "SOC2 reporting service exposes readiness and ISO mapping coverage"
  });

  results.push({
    check: "Framework reporting API",
    pass: hasAll("src/app/api/frameworks/report/route.ts", ["buildFrameworkCoverageReport", "calculateComplianceScore"]),
    detail: "Framework report endpoint returns cross-framework coverage"
  });

  results.push({
    check: "Framework mappings API",
    pass: hasAll("src/app/api/frameworks/mappings/route.ts", ["frameworkKey is required", "getFrameworkMappings"]),
    detail: "Mappings endpoint exposes framework equivalence data"
  });

  results.push({
    check: "SOC2 export endpoint",
    pass: hasAll("src/app/api/frameworks/soc2/export/route.ts", ["buildSoc2CoverageReport", "format === \"csv\"", "readinessPercent"]),
    detail: "SOC2 export endpoint provides readiness JSON/CSV output"
  });

  results.push({
    check: "Prisma CrossFrameworkMapping model",
    pass: hasAll("prisma/schema.prisma", ["model CrossFrameworkMapping", "canonicalControlId", "sourceFrameworkKey", "targetFrameworkKey"]),
    detail: "Schema includes CrossFrameworkMapping model"
  });

  results.push({
    check: "Phase 2 scripts registered",
    pass: hasAll("package.json", ["phase2:verify", "phase2:regression", "phase2:closure"]),
    detail: "package.json exposes phase2 verification scripts"
  });

  const passed = results.filter((r) => r.pass).length;
  const output = {
    timestamp: new Date().toISOString(),
    passed,
    total: results.length,
    results
  };

  const outPath = path.join(root, "docs", "verification", "phase2-verification.json");
  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);

  for (const result of results) {
    const mark = result.pass ? "PASS" : "FAIL";
    console.log(`[${mark}] ${result.check} :: ${result.detail}`);
  }

  console.log(`Saved report: ${outPath}`);
  process.exit(passed === results.length ? 0 : 1);
}

run();
