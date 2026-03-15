export function generateAuditSummary(params: {
  orgName: string;
  readinessScore: number;
  openRisks: number;
  evidenceCoverage: number;
}) {
  return {
    title: `${params.orgName} Audit Readiness Summary`,
    summary: `Readiness score ${params.readinessScore}. Open risks: ${params.openRisks}. Evidence coverage: ${params.evidenceCoverage}%.`,
    generatedAt: new Date().toISOString()
  };
}
