const fs = require("fs");
const path = require("path");

const root = process.cwd();
const registryPath = path.join(root, "src/backend/integrations/registry.ts");
const txt = fs.readFileSync(registryPath, "utf8");

const required = ["AWS", "GITHUB", "OKTA", "GOOGLE_WORKSPACE", "AZURE", "runIntegrationSync"];
const missing = required.filter((token) => !txt.includes(token));

if (missing.length > 0) {
  throw new Error(`Integration smoke failed. Missing tokens: ${missing.join(", ")}`);
}

console.log("Integration smoke check passed");
