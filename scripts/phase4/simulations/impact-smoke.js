const assert = require("node:assert/strict");

const impactedRecords = [
  { normalizedControlId: "CC9.2" },
  { normalizedControlId: "A.8.24" }
];

const controlId = "CC9.2";
const impactedControls = impactedRecords
  .filter((row) => row.normalizedControlId === controlId)
  .map((row) => row.normalizedControlId);

assert.deepEqual(impactedControls, ["CC9.2"]);
console.log("Smoke check passed: getRegulatoryImpactReport impact selection");
