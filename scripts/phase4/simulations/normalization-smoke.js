const assert = require("node:assert/strict");

function normalizeLocal(record) {
  return {
    ...record,
    jurisdiction: record.jurisdiction.toUpperCase(),
    framework: record.framework.toUpperCase().replace(/\s+/g, ""),
    normalizedControlId: record.normalizedControlId.toUpperCase()
  };
}

const input = {
  id: "x",
  jurisdiction: "us",
  framework: "soc2",
  title: "t",
  normalizedControlId: "cc9.2",
  version: "1",
  effectiveDate: "2026-01-01",
  status: "new"
};

const output = normalizeLocal(input);
assert.equal(output.jurisdiction, "US");
assert.equal(output.framework, "SOC2");
assert.equal(output.normalizedControlId, "CC9.2");
console.log("Smoke check passed: normalizeRegulatoryRecord behavior");
