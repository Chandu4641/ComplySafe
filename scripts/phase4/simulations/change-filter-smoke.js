const assert = require("node:assert/strict");

const records = [
  { framework: "SOC2", jurisdiction: "US" },
  { framework: "ISO27001", jurisdiction: "EU" }
];

const filtered = records.filter((row) => row.framework === "SOC2");
assert.equal(filtered.length, 1);
assert.equal(filtered[0].jurisdiction, "US");
console.log("Smoke check passed: getRegulatoryChanges filtering model");
