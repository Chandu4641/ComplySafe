const fs = require("fs");
const path = require("path");

function read(root, rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function countQuotedArrayEntries(src, arrayName) {
  const start = src.indexOf(`const ${arrayName} = [`);
  if (start < 0) return 0;
  const end = src.indexOf("] as const;", start);
  if (end < 0) return 0;
  const block = src.slice(start, end);
  const matches = block.match(/"[^"]+"/g);
  return matches ? matches.length : 0;
}

function assertIsoCatalogLock(root = process.cwd()) {
  const primary = path.join(root, "src/backend/frameworks/iso27001.ts");
  const legacy = path.join(root, "lib/frameworks/iso27001.ts");
  const isoPath = fs.existsSync(primary) ? "src/backend/frameworks/iso27001.ts" : "lib/frameworks/iso27001.ts";
  if (!fs.existsSync(primary) && !fs.existsSync(legacy)) {
    throw new Error("ISO catalog source not found (expected src/backend/frameworks/iso27001.ts or lib/frameworks/iso27001.ts)");
  }
  const iso = read(root, isoPath);
  const org = countQuotedArrayEntries(iso, "ORGANIZATIONAL_TITLES");
  const people = countQuotedArrayEntries(iso, "PEOPLE_TITLES");
  const physical = countQuotedArrayEntries(iso, "PHYSICAL_TITLES");
  const tech = countQuotedArrayEntries(iso, "TECHNOLOGICAL_TITLES");
  const total = org + people + physical + tech;

  if (total !== 93) {
    throw new Error(`ISO catalog lock failed: expected 93 controls, got ${total} (A.5=${org}, A.6=${people}, A.7=${physical}, A.8=${tech})`);
  }

  return { org, people, physical, tech, total };
}

if (require.main === module) {
  try {
    const counts = assertIsoCatalogLock(process.cwd());
    console.log(
      `PASS ISO catalog lock :: counts: A.5=${counts.org}, A.6=${counts.people}, A.7=${counts.physical}, A.8=${counts.tech}, total=${counts.total}`
    );
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ISO catalog lock failed";
    console.error(`FAIL ISO catalog lock :: ${message}`);
    process.exit(1);
  }
}

module.exports = { assertIsoCatalogLock };
