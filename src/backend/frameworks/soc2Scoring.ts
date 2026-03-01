import { prisma } from "@/backend/db/client";

type Soc2CriteriaRow = {
  criteria: string;
  controlsTotal: number;
  controlsApplicable: number;
  controlsImplemented: number;
  readinessPercent: number;
  evidenceCoverage: number;
  weight: number;
};

type Soc2ReadinessResult = {
  frameworkKey: "SOC2";
  overallReadinessPercent: number;
  criteriaReadiness: Soc2CriteriaRow[];
};

const pct = (num: number, den: number): number =>
  den <= 0 ? 0 : Number(((num / den) * 100).toFixed(2));

const SOC2_CRITERIA_WEIGHTS: Record<string, number> = {
  "Common Criteria": 0.45,
  Security: 0.35,
  Availability: 0.08,
  "Processing Integrity": 0.06,
  Privacy: 0.06
};

export async function calculateSoc2CriteriaReadiness(
  orgId: string,
  frameworkId: string
): Promise<Soc2ReadinessResult> {
  const controls = await prisma.control.findMany({
    where: { orgId, frameworkId },
    include: { applicability: true, evidence: true }
  });

  const bucket = new Map<
    string,
    { total: number; applicable: number; implemented: number; validEvidence: number }
  >();

  for (const control of controls) {
    const category = control.category || "Common Criteria";

    const rule = control.applicability.find((a) => a.orgId === orgId);
    const applicable = rule ? rule.applicable : true;

    if (!bucket.has(category)) {
      bucket.set(category, {
        total: 0,
        applicable: 0,
        implemented: 0,
        validEvidence: 0
      });
    }

    const row = bucket.get(category)!;
    row.total += 1;

    if (!applicable) continue;

    row.applicable += 1;

    if (control.status === "IMPLEMENTED") {
      row.implemented += 1;
    }

    if (control.evidence.some((e) => e.status === "VALID")) {
      row.validEvidence += 1;
    }
  }

  const criteriaReadiness: Soc2CriteriaRow[] = Array.from(bucket.entries()).map(
    ([criteria, row]) => {
      const readinessPercent = pct(row.implemented, row.applicable);
      const evidenceCoverage = pct(row.validEvidence, row.applicable);

      return {
        criteria,
        controlsTotal: row.total,
        controlsApplicable: row.applicable,
        controlsImplemented: row.implemented,
        readinessPercent,
        evidenceCoverage,
        weight: SOC2_CRITERIA_WEIGHTS[criteria] ?? 0.02
      };
    }
  );

  // Weighted calculation
  const totalWeight =
    criteriaReadiness.reduce((sum, r) => sum + r.weight, 0) || 1;

  const weightedSum = criteriaReadiness.reduce(
    (sum, r) => sum + r.readinessPercent * r.weight,
    0
  );

  const overallReadinessPercent = Number(
    (weightedSum / totalWeight).toFixed(2)
  );

  return {
    frameworkKey: "SOC2",
    overallReadinessPercent,
    criteriaReadiness
  };
}