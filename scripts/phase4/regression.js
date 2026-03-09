const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = process.cwd();

function resolve(relPath) {
  return path.join(root, relPath);
}

function readText(relPath) {
  return fs.readFileSync(resolve(relPath), "utf8");
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function normalizeError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error.stderr) return String(error.stderr);
  if (error.stdout) return String(error.stdout);
  if (error.message) return String(error.message);
  return JSON.stringify(error);
}

function runCheck(check) {
  if (check.type === "fileContainsAll") {
    const content = readText(check.file);
    const missing = (check.tokens || []).filter((token) => !content.includes(token));
    return {
      pass: missing.length === 0,
      detail:
        missing.length === 0
          ? `All tokens present in ${check.file}`
          : `Missing tokens in ${check.file}: ${missing.join(", ")}`
    };
  }

  if (check.type === "scriptExitZero") {
    const scriptPath = resolve(check.script);
    try {
      execFileSync(process.execPath, [scriptPath], {
        cwd: root,
        stdio: "pipe",
        encoding: "utf8"
      });
      return {
        pass: true,
        detail: `Script exited 0: ${check.script}`
      };
    } catch (error) {
      return {
        pass: false,
        detail: `Script failed: ${check.script}. ${normalizeError(error).trim()}`
      };
    }
  }

  return {
    pass: false,
    detail: `Unsupported check type: ${check.type}`
  };
}

function run() {
  const matrixPath = "docs/verification/phase4-regression-matrix.json";
  const matrix = readJson(matrixPath);
  const suites = Array.isArray(matrix.suites) ? matrix.suites : [];

  const results = [];
  let total = 0;

  for (const suite of suites) {
    const checks = Array.isArray(suite.checks) ? suite.checks : [];
    for (const check of checks) {
      total += 1;
      const outcome = runCheck(check);
      results.push({
        suite: suite.suite,
        id: check.id,
        description: check.description,
        pass: outcome.pass,
        detail: outcome.detail
      });
    }
  }

  const passed = results.filter((result) => result.pass).length;
  const report = {
    generatedAt: new Date().toISOString(),
    matrixPath,
    phase: matrix.phase || "Phase 4",
    passed,
    total,
    completionPercent: total === 0 ? 0 : Math.round((passed / total) * 100),
    results
  };

  const outputPath = resolve("docs/verification/phase4-regression-report.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  for (const result of results) {
    const mark = result.pass ? "PASS" : "FAIL";
    console.log(`[${mark}] ${result.id} ${result.description} :: ${result.detail}`);
  }

  console.log(`Saved report: ${outputPath}`);
  process.exit(passed === total ? 0 : 1);
}

run();
