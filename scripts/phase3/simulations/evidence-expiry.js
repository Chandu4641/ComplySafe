function computeHealthScore({ hasExpiredEvidence, missingEvidence }) {
  let score = 72;
  if (missingEvidence) score -= 35;
  if (hasExpiredEvidence) score -= 25;
  return Math.max(0, Math.min(100, score));
}

const baseline = computeHealthScore({ hasExpiredEvidence: false, missingEvidence: false });
const expired = computeHealthScore({ hasExpiredEvidence: true, missingEvidence: false });

if (expired >= baseline) {
  throw new Error("Expected expired evidence to reduce health score");
}
