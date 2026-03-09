import { prisma } from "@/backend/db/client";

export async function createRemediationTask(params: {
  orgId: string;
  findingId?: string;
  title: string;
  dueInDays?: number;
}) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (params.dueInDays || 14));

  return prisma.task.create({
    data: {
      orgId: params.orgId,
      findingId: params.findingId,
      title: params.title,
      status: "open",
      dueDate
    }
  });
}
