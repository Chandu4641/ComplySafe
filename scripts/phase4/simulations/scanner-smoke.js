const fs = require("fs");
const path = require("path");

const root = process.cwd();
const reportPath = path.join(root, "src/backend/scanner/report.ts");
const txt = fs.readFileSync(reportPath, "utf8");

const required = ["scanOpenPorts", "scanTlsConfiguration", "scanDnsAndEmailSecurity", "runAttackSurfaceScan"];
const missing = required.filter((token) => !txt.includes(token));

if (missing.length > 0) {
  throw new Error(`Scanner smoke failed. Missing tokens: ${missing.join(", ")}`);
}

console.log("Scanner smoke check passed");
