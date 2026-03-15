import { prisma } from "@/backend/db/client";
import { calculateSoc2CriteriaReadiness } from "@/backend/frameworks/soc2Scoring";

const pct = (num: number, den: number) => (den <= 0 ? 0 : Number(((num / den) * 100).toFixed(2)));

export async function calculateComplianceScore(orgId: string, frameworkId: string) {
  const framework = await prisma.framework.findUnique({
    where: { id: frameworkId },
    select: { key: true }
  });

  const controls = await prisma.control.findMany({
    where: { orgId, frameworkId },
    include: { evidence: true }
  });

  const risks = await prisma.risk.findMany({
    where: { orgId, frameworkId }
  });

  const totalControls = controls.length;
  const implementedControls = controls.filter((c: any) => c.status === "IMPLEMENTED").length;
  const overdueControls = controls.filter((c: any) => c.reviewDate && c.reviewDate < new Date()).length;
  const controlsWithValidEvidence = controls.filter((c: any) =>
    c.evidence.some((e: any) => e.status === "VALID")
  ).length;

  const highRisks = risks.filter((r: any) => r.inherentRiskScore >= 15).length;
  const mitigatedHighRisks = risks.filter(
    (r: any) => r.inherentRiskScore >= 15 && r.status === "MITIGATED"
  ).length;

  let controlCompletion = pct(implementedControls, totalControls);
  const riskMitigation = pct(mitigatedHighRisks, highRisks || 1);
  const evidenceCoverage = pct(controlsWithValidEvidence, totalControls);
  const overdueControlsPct = pct(overdueControls, totalControls || 1);

  // SOC 2 scoring is criteria-driven to reflect TSC readiness by criteria bucket.
  if (framework?.key === "SOC2") {
    const soc2 = await calculateSoc2CriteriaReadiness(orgId, frameworkId);
    controlCompletion = soc2.overallReadinessPercent;
  }

  const overallScore = Number(
    (
      controlCompletion * 0.4 +
      riskMitigation * 0.3 +
      evidenceCoverage * 0.2 +
      (100 - overdueControlsPct) * 0.1
    ).toFixed(2)
  );

  const score = await prisma.complianceScore.upsert({
    where: {
      orgId_frameworkId: {
        orgId,
        frameworkId
      }
    },
    update: {
      controlCompletion,
      riskMitigation,
      evidenceCoverage,
      overdueControls: overdueControlsPct,
      overallScore,
      calculatedAt: new Date()
    },
    create: {
      orgId,
      frameworkId,
      controlCompletion,
      riskMitigation,
      evidenceCoverage,
      overdueControls: overdueControlsPct,
      overallScore,
      calculatedAt: new Date()
    }
  });

  return score;
}
