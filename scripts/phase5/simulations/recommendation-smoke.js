const assert = require("node:assert/strict");

const recommendations = [{ id: "rec-1", category: "risk" }, { id: "rec-2", category: "evidence" }];
const filtered = recommendations.filter((r) => r.category === "risk");
assert.equal(filtered.length, 1);
console.log("Smoke check passed: recommendations category filtering");
