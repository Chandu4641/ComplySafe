import { prisma } from "@/backend/db/client";
import { runDailyMonitoring } from "@/backend/monitoring/daily";
import { runMonitoringEngine } from "@/backend/monitoring/engine";

export async function runMonitoringScheduler() {
  const orgs = await prisma.organization.findMany({ select: { id: true } });
  const results: { orgId: string; skipped: boolean; runId?: string; monitoredChecks?: number }[] = [];

  for (const org of orgs) {
    const [daily, automated] = await Promise.all([
      runDailyMonitoring(org.id),
      runMonitoringEngine(org.id)
    ]);

    results.push({
      orgId: org.id,
      skipped: daily.skipped,
      runId: daily.runId,
      monitoredChecks: automated.evaluation.total
    });
  }

  return { skipped: false, organizations: orgs.length, results };
}
