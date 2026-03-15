const fs = require("fs");
const path = require("path");

const root = process.cwd();
const enginePath = path.join(root, "src/backend/monitoring/engine.ts");
const txt = fs.readFileSync(enginePath, "utf8");

const required = ["runMonitoringEngine", "collectIntegrationEvidence", "automateRiskFromControlFailure"];
const missing = required.filter((token) => !txt.includes(token));

if (missing.length > 0) {
  throw new Error(`Monitoring smoke failed. Missing tokens: ${missing.join(", ")}`);
}

console.log("Monitoring smoke check passed");
