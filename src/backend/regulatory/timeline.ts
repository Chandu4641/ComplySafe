import { prisma } from "@/backend/db/client";

export async function getRegulatoryTimeline(orgId: string, limit = 50) {
  const events = await prisma.regulatoryChangeEvent.findMany({
    where: { orgId },
    orderBy: { changedAt: "desc" },
    take: limit,
    include: {
      record: {
        select: {
          frameworkKey: true,
          normalizedControlId: true,
          title: true
        }
      }
    }
  });

  return events.map((event) => ({
    id: event.id,
    changedAt: event.changedAt,
    changeType: event.changeType,
    impactLevel: event.impactLevel,
    summary: event.summary,
    frameworkKey: event.record.frameworkKey,
    controlId: event.record.normalizedControlId,
    title: event.record.title
  }));
}
