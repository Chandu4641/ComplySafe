const assert = require("node:assert/strict");

function execute(approved) {
  if (!approved) return { status: "approval_required" };
  return { status: "executed" };
}

const result = execute(true);
assert.equal(result.status, "executed");
console.log("Smoke check passed: executed action path");
