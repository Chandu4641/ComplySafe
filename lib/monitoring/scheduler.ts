import { prisma } from "@/lib/db/client";
import { runDailyMonitoring } from "./daily";

export async function runMonitoringScheduler() {
  const orgs = await prisma.organization.findMany({ select: { id: true } });
  const results: { orgId: string; skipped: boolean; runId?: string }[] = [];

  for (const org of orgs) {
    const outcome = await runDailyMonitoring(org.id);
    results.push({ orgId: org.id, skipped: outcome.skipped, runId: outcome.runId });
  }

  return { skipped: false, organizations: orgs.length, results };
}
