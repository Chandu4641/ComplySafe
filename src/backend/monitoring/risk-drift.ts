import { prisma } from "@/backend/db/client";

const DEFAULT_DRIFT_THRESHOLD = 3;

export async function captureRiskTrendSnapshot(orgId: string, riskId: string, score: number) {
  return prisma.riskTrendSnapshot.create({
    data: {
      orgId,
      riskId,
      score
    }
  });
}

export async function captureAllRiskSnapshots(orgId: string) {
  const risks = await prisma.risk.findMany({
    where: { orgId },
    select: { id: true, residualRiskScore: true }
  });

  await Promise.all(
    risks.map((risk) =>
      captureRiskTrendSnapshot(orgId, risk.id, Math.max(1, Math.round(risk.residualRiskScore)))
    )
  );

  return risks.length;
}

export async function runRiskDriftDetection(orgId: string, threshold = DEFAULT_DRIFT_THRESHOLD) {
  const now = new Date();
  await captureAllRiskSnapshots(orgId);

  const risks = await prisma.risk.findMany({
    where: { orgId },
    select: { id: true, title: true, residualRiskScore: true }
  });

  const results: Array<{
    riskId: string;
    title: string;
    latestScore: number;
    delta: number;
    driftDetected: boolean;
    trend: number[];
  }> = [];

  for (const risk of risks) {
    const snapshots = await prisma.riskTrendSnapshot.findMany({
      where: { orgId, riskId: risk.id },
      orderBy: { capturedAt: "desc" },
      take: 3
    });

    const ordered = snapshots.slice().reverse();
    const trend = ordered.map((item) => item.score);

    let driftDetected = false;
    let delta = 0;
    if (ordered.length === 3) {
      delta = ordered[2].score - ordered[0].score;
      const nonDecreasing = ordered[1].score >= ordered[0].score && ordered[2].score >= ordered[1].score;
      driftDetected = nonDecreasing && delta >= threshold;
    }

    if (driftDetected) {
      await prisma.monitoringIssue.upsert({
        where: {
          orgId_issueType_targetId: {
            orgId,
            issueType: "RISK_DRIFT_UPWARD",
            targetId: risk.id
          }
        },
        update: {
          isResolved: false,
          resolvedAt: null
        },
        create: {
          orgId,
          issueType: "RISK_DRIFT_UPWARD",
          title: "Risk score drift detected",
          severity: "HIGH",
          targetType: "Risk",
          targetId: risk.id
        }
      });
    } else {
      await prisma.monitoringIssue.updateMany({
        where: {
          orgId,
          issueType: "RISK_DRIFT_UPWARD",
          targetId: risk.id,
          isResolved: false
        },
        data: {
          isResolved: true,
          resolvedAt: now
        }
      });
    }

    results.push({
      riskId: risk.id,
      title: risk.title,
      latestScore: risk.residualRiskScore,
      delta,
      driftDetected,
      trend
    });
  }

  return {
    generatedAt: now.toISOString(),
    threshold,
    analyzed: results.length,
    driftCount: results.filter((item) => item.driftDetected).length,
    results
  };
}

export async function getRecentRiskTrends(orgId: string, limit = 200) {
  return prisma.riskTrendSnapshot.findMany({
    where: { orgId },
    orderBy: { capturedAt: "desc" },
    take: limit,
    include: {
      risk: {
        select: {
          title: true
        }
      }
    }
  });
}
