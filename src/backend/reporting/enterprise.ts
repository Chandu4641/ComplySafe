import { prisma } from "@/backend/db/client";

export async function buildEnterpriseReports(orgId: string) {
  const [scores, risks, controls] = await Promise.all([
    prisma.complianceScore.findMany({ where: { orgId }, orderBy: { calculatedAt: "desc" }, take: 20 }),
    prisma.risk.findMany({ where: { orgId }, orderBy: { residualRiskScore: "desc" }, take: 100 }),
    prisma.controlHealthSnapshot.findMany({ where: { orgId }, orderBy: { calculatedAt: "desc" }, take: 200 })
  ]);

  const latestScore = scores[0];
  const isoReadiness = latestScore?.overallScore ?? 0;
  const soc2Readiness = latestScore?.overallScore ?? 0;

  const riskHeatmap = {
    high: risks.filter((risk) => risk.residualRiskScore >= 15).length,
    medium: risks.filter((risk) => risk.residualRiskScore >= 8 && risk.residualRiskScore < 15).length,
    low: risks.filter((risk) => risk.residualRiskScore < 8).length
  };

  const controlMaturityTrend = controls.slice(0, 20).map((item) => ({
    capturedAt: item.calculatedAt,
    status: item.status,
    score: item.healthScore
  }));

  return {
    generatedAt: new Date().toISOString(),
    isoReadinessReport: {
      readiness: Math.round(isoReadiness),
      evidenceCoverage: Math.round(latestScore?.evidenceCoverage ?? 0)
    },
    soc2ReadinessReport: {
      readiness: Math.round(soc2Readiness),
      riskMitigation: Math.round(latestScore?.riskMitigation ?? 0)
    },
    riskHeatmap,
    controlMaturityTrend
  };
}
