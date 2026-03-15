export function buildEvidenceRecommendations(params: {
  hasPayload: boolean;
  stalenessDays: number;
}) {
  const recommendations: string[] = [];
  if (!params.hasPayload) recommendations.push("Upload machine-generated evidence snapshot");
  if (params.stalenessDays > 90) recommendations.push("Refresh evidence because it is older than 90 days");
  if (recommendations.length === 0) recommendations.push("Evidence quality appears acceptable");
  return recommendations;
}
