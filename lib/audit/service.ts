import { prisma } from "@/lib/db/client";

export async function writeAuditLog(params: {
  orgId: string;
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      orgId: params.orgId,
      actorId: params.actorId ?? null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      before: params.before as object | undefined,
      after: params.after as object | undefined,
      metadata: params.metadata as object | undefined
    }
  });
}
