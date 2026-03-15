const assert = require("node:assert/strict");

function evaluate(type, approved) {
  if (type === "mark_exception" && !approved) {
    return { status: "approval_required" };
  }
  return { status: "executed" };
}

const result = evaluate("mark_exception", false);
assert.equal(result.status, "approval_required");
console.log("Smoke check passed: approval_required guardrail");
