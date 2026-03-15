const assert = require("node:assert/strict");

function validate(hasPayload, stalenessDays) {
  return hasPayload && stalenessDays <= 180;
}

assert.equal(validate(true, 10), true);
assert.equal(validate(false, 10), false);
console.log("Smoke check passed: evidence AI validation path");
