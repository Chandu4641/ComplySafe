export function scoreRiskFromFailure(params: {
  severity: "LOW" | "MEDIUM" | "HIGH";
  failureCount?: number;
}) {
  const count = Math.max(1, params.failureCount || 1);
  const baseLikelihood = params.severity === "HIGH" ? 4 : params.severity === "MEDIUM" ? 3 : 2;
  const baseImpact = params.severity === "HIGH" ? 5 : params.severity === "MEDIUM" ? 3 : 2;

  const likelihood = Math.min(5, baseLikelihood + Math.floor((count - 1) / 3));
  const impact = baseImpact;

  return {
    likelihood,
    impact,
    score: likelihood * impact
  };
}
