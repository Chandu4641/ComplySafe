const fs = require("fs");
const path = require("path");

const root = process.cwd();
const riskPath = path.join(root, "src/backend/risk/engine.ts");
const txt = fs.readFileSync(riskPath, "utf8");

const required = ["automateRiskFromControlFailure", "createRisk", "createRemediationTask"];
const missing = required.filter((token) => !txt.includes(token));

if (missing.length > 0) {
  throw new Error(`Risk smoke failed. Missing tokens: ${missing.join(", ")}`);
}

console.log("Risk smoke check passed");
