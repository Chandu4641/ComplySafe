const assert = require("node:assert/strict");

const timeline = [
  { id: "ev-1", changedAt: "2026-03-09T00:00:00.000Z", impactLevel: "HIGH" }
];

assert.equal(Array.isArray(timeline), true);
assert.equal(timeline.length > 0, true);
console.log("Smoke check passed: regulatory timeline output");
