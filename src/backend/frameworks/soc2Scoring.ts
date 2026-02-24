import { prisma } from "@/backend/db/client";

const pct = (num: number, den: number) => (den <= 0 ? 0 : Number(((num / den) * 100).toFixed(2)));

const SOC2_CRITERIA_WEIGHTS: Record<string, number> = {
  "Common Criteria": 0.45,
  Security: 0.35,
  Availability: 0.08,
  "Processing Integrity": 0.06,
  Privacy: 0.06
};

export async function calculateSoc2CriteriaReadiness(orgId: string, frameworkId: string) {
  const controls = await prisma.control.findMany({
    where: { orgId, frameworkId },
    include: { applicability: true, evidence: true }
  });

  const bucket = new Map<
    string,
    { total: number; applicable: number; implemented: number; validEvidence: number; readinessPercent: number }
  >();

  for (const control of controls) {
    const category = control.category || "Common Criteria";
    const rule = control.applicability.find((a) => a.orgId === orgId);
    const applicable = rule ? rule.applicable : true;

    if (!bucket.has(category)) {
      bucket.set(category, { total: 0, applicable: 0, implemented: 0, validEvidence: 0, readinessPercent: 0 });
    }

    const row = bucket.get(category)!;
    row.total += 1;

    if (!applicable) continue;

    row.applicable += 1;
    if (control.status === "IMPLEMENTED") row.implemented += 1;
    if (control.evidence.some((e) => e.status === "VALID")) row.validEvidence += 1;
  }

  const criteriaReadiness = Array.from(bucket.entries()).map(([criteria, row]) => {
    const readinessPercent = pct(row.implemented, row.applicable || 1);
    const evidenceCoverage = pct(row.validEvidence, row.applicable || 1);
    return {
      criteria,
      controlsTotal: row.total,
      controlsApplicable: row.applicable,
      controlsImplemented: row.implemented,
      readinessPercent,
      evidenceCoverage,
      weight: SOC2_CRITERIA_WEIGHTS[criteria] ?? 0.02
    };
  });

  const weightedReadiness = criteriaReadiness.reduce((sum, row) => sum + row.readinessPercent * row.weight, 0);
  const normalizedWeight = criteriaReadiness.reduce((sum, row) => sum + row.weight, 0) || 1;
  const overallReadinessPercent = Number((weightedReadiness / normalizedWeight).toFixed(2));

  return {
    frameworkKey: "SOC2",
    overallReadinessPercent,
    criteriaReadiness
  };
}
