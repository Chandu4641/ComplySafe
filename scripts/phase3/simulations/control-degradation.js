function resolveStatus(score) {
  if (score >= 80) return "HEALTHY";
  if (score >= 50) return "DEGRADED";
  return "FAILED";
}

if (resolveStatus(85) !== "HEALTHY") throw new Error("Expected HEALTHY status");
if (resolveStatus(65) !== "DEGRADED") throw new Error("Expected DEGRADED status");
if (resolveStatus(30) !== "FAILED") throw new Error("Expected FAILED status");
