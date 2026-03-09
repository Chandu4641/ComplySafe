import { prisma } from "@/backend/db/client";

export async function getComplianceDashboard(orgId: string) {
  const [frameworksEnabled, latestScores] = await Promise.all([
    prisma.organizationFramework.count({ where: { organizationId: orgId, enabled: true } }),
    prisma.complianceScore.findMany({
      where: { orgId },
      orderBy: { calculatedAt: "desc" },
      take: 20,
      include: { framework: { select: { key: true, name: true } } }
    })
  ]);

  return {
    frameworksEnabled,
    readiness: latestScores.map((item) => ({
      framework: item.framework.name,
      frameworkKey: item.framework.key,
      overallScore: item.overallScore,
      evidenceCoverage: item.evidenceCoverage,
      calculatedAt: item.calculatedAt
    }))
  };
}

export async function getControlDashboard(orgId: string) {
  const [totalControls, byStatus, health] = await Promise.all([
    prisma.control.count({ where: { orgId } }),
    prisma.control.groupBy({ by: ["status"], where: { orgId }, _count: { _all: true } }),
    prisma.controlHealthSnapshot.groupBy({ by: ["status"], where: { orgId }, _count: { _all: true } })
  ]);

  return {
    totalControls,
    statusDistribution: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
    healthDistribution: health.map((row) => ({ status: row.status, count: row._count._all }))
  };
}

export async function getRiskDashboard(orgId: string) {
  const [totalRisks, distribution, topRisks] = await Promise.all([
    prisma.risk.count({ where: { orgId } }),
    prisma.risk.groupBy({ by: ["status"], where: { orgId }, _count: { _all: true } }),
    prisma.risk.findMany({
      where: { orgId },
      orderBy: { residualRiskScore: "desc" },
      take: 10,
      select: { id: true, title: true, status: true, residualRiskScore: true }
    })
  ]);

  return {
    totalRisks,
    distribution: distribution.map((row) => ({ status: row.status, count: row._count._all })),
    highestResidualRisks: topRisks
  };
}

export async function getMonitoringDashboard(orgId: string) {
  const [runs, openIssues, issueDistribution, recentRuns] = await Promise.all([
    prisma.monitoringRun.count({ where: { orgId } }),
    prisma.monitoringIssue.count({ where: { orgId, isResolved: false } }),
    prisma.monitoringIssue.groupBy({ by: ["severity"], where: { orgId, isResolved: false }, _count: { _all: true } }),
    prisma.monitoringRun.findMany({
      where: { orgId },
      orderBy: { runDate: "desc" },
      take: 7,
      select: { id: true, runDate: true, status: true, details: true }
    })
  ]);

  return {
    totalMonitoringRuns: runs,
    openIssues,
    issueDistribution: issueDistribution.map((row) => ({ severity: row.severity, count: row._count._all })),
    recentRuns
  };
}
