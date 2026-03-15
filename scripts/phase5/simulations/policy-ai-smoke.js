const assert = require("node:assert/strict");

function generate(title) {
  return `${title}\n1. Purpose\n2. Scope\n3. Enforcement`;
}

const draft = generate("Access Control Policy");
assert.ok(draft.includes("Purpose"));
assert.ok(draft.includes("Scope"));
console.log("Smoke check passed: policy AI draft structure");
