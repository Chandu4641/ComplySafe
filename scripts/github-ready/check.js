const fs = require("node:fs");
const path = require("node:path");
const allowLocalEnv = process.argv.includes("--allow-local-env");

function exists(rel) {
  return fs.existsSync(path.join(process.cwd(), rel));
}

const envFiles = [".env", ".env.local", ".env.development.local", ".env.production.local", ".env.test.local"];
const presentEnvFiles = envFiles.filter(exists);

if (presentEnvFiles.length > 0) {
  if (allowLocalEnv) {
    console.warn("Warning: local env files detected but allowed by --allow-local-env.");
  } else {
  console.error("GitHub readiness failed: env files are present in the repository root.");
  for (const file of presentEnvFiles) {
    console.error(` - ${file}`);
  }
  console.error("Keep secrets local and publish only .env.example.");
  process.exit(1);
  }
}

const generatedDirs = ["node_modules", ".next", "modules"];
const presentGeneratedDirs = generatedDirs.filter(exists);
if (presentGeneratedDirs.length > 0) {
  console.error("GitHub readiness failed: generated folders are present.");
  for (const dir of presentGeneratedDirs) {
    console.error(` - ${dir}/`);
  }
  console.error("Clean generated folders before publishing.");
  process.exit(1);
}

if (!exists(".env.example")) {
  console.error("GitHub readiness failed: .env.example is missing.");
  process.exit(1);
}

console.log("GitHub readiness passed.");
