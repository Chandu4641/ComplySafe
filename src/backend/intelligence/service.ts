import { prisma } from "@/backend/db/client";

type SeriesPoint = {
  date: string;
  [key: string]: number | string;
};

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function buildDaySeries(days: number) {
  const out: string[] = [];
  const start = dateDaysAgo(days);
  for (let i = 0; i <= days; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    out.push(toDayKey(d));
  }
  return out;
}

export async function getControlTrendSeries(orgId: string, days = 30) {
  const since = dateDaysAgo(days);
  const snapshots = await prisma.controlHealthSnapshot.findMany({
    where: { orgId, calculatedAt: { gte: since } },
    orderBy: { calculatedAt: "asc" }
  });

  const buckets = new Map<string, { totalScore: number; total: number; healthy: number; degraded: number; failed: number }>();

  for (const item of snapshots) {
    const day = toDayKey(item.calculatedAt);
    const row = buckets.get(day) ?? { totalScore: 0, total: 0, healthy: 0, degraded: 0, failed: 0 };
    row.totalScore += item.healthScore;
    row.total += 1;
    if (item.status === "HEALTHY") row.healthy += 1;
    if (item.status === "DEGRADED") row.degraded += 1;
    if (item.status === "FAILED") row.failed += 1;
    buckets.set(day, row);
  }

  const series: SeriesPoint[] = buildDaySeries(days).map((day) => {
    const row = buckets.get(day);
    if (!row || row.total === 0) {
      return {
        date: day,
        avgHealthScore: 0,
        healthy: 0,
        degraded: 0,
        failed: 0,
        snapshots: 0
      };
    }
    return {
      date: day,
      avgHealthScore: Math.round((row.totalScore / row.total) * 100) / 100,
      healthy: row.healthy,
      degraded: row.degraded,
      failed: row.failed,
      snapshots: row.total
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    rangeDays: days,
    series
  };
}

export async function getReadinessTrendSeries(orgId: string, days = 30) {
  const since = dateDaysAgo(days);
  const scores = await prisma.complianceScore.findMany({
    where: { orgId, calculatedAt: { gte: since } },
    orderBy: { calculatedAt: "asc" }
  });

  const buckets = new Map<string, { total: number; overall: number; control: number; evidence: number }>();

  for (const score of scores) {
    const day = toDayKey(score.calculatedAt);
    const row = buckets.get(day) ?? { total: 0, overall: 0, control: 0, evidence: 0 };
    row.total += 1;
    row.overall += score.overallScore;
    row.control += score.controlCompletion;
    row.evidence += score.evidenceCoverage;
    buckets.set(day, row);
  }

  const series = buildDaySeries(days).map((day) => {
    const row = buckets.get(day);
    if (!row || row.total === 0) {
      return {
        date: day,
        overallScore: 0,
        controlCompletion: 0,
        evidenceCoverage: 0,
        samples: 0
      };
    }

    return {
      date: day,
      overallScore: Math.round((row.overall / row.total) * 100) / 100,
      controlCompletion: Math.round((row.control / row.total) * 100) / 100,
      evidenceCoverage: Math.round((row.evidence / row.total) * 100) / 100,
      samples: row.total
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    rangeDays: days,
    series
  };
}

export async function getSlaRiskSeries(orgId: string, days = 30) {
  const since = dateDaysAgo(days);
  const assignments = await prisma.auditAssignment.findMany({
    where: { orgId, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" }
  });

  const now = new Date();
  const buckets = new Map<string, { open: number; inReview: number; approved: number; rejected: number; overdueOpen: number }>();

  for (const assignment of assignments) {
    const day = toDayKey(assignment.createdAt);
    const row = buckets.get(day) ?? { open: 0, inReview: 0, approved: 0, rejected: 0, overdueOpen: 0 };

    if (assignment.status === "OPEN") row.open += 1;
    if (assignment.status === "IN_REVIEW") row.inReview += 1;
    if (assignment.status === "APPROVED") row.approved += 1;
    if (assignment.status === "REJECTED") row.rejected += 1;

    const overdue =
      !!assignment.dueDate &&
      assignment.dueDate < now &&
      (assignment.status === "OPEN" || assignment.status === "IN_REVIEW");
    if (overdue) row.overdueOpen += 1;

    buckets.set(day, row);
  }

  const series = buildDaySeries(days).map((day) => {
    const row = buckets.get(day) ?? { open: 0, inReview: 0, approved: 0, rejected: 0, overdueOpen: 0 };
    const active = row.open + row.inReview;
    const slaRiskPercent = active === 0 ? 0 : Math.round((row.overdueOpen / active) * 10000) / 100;

    return {
      date: day,
      open: row.open,
      inReview: row.inReview,
      approved: row.approved,
      rejected: row.rejected,
      overdueOpen: row.overdueOpen,
      slaRiskPercent
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    rangeDays: days,
    series
  };
}
