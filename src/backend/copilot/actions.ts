import type { Prisma } from "@prisma/client";
import type { CopilotAction } from "@/backend/copilot/policy";

export async function executeApprovedCopilotAction(params: {
  tx: Prisma.TransactionClient;
  orgId: string;
  actorId?: string | null;
  action: CopilotAction;
  approved: boolean;
  recommendationId?: string | null;
}) {
  const { tx, orgId, actorId, action, approved, recommendationId } = params;

  if (action.targetType === "control") {
    const control = await tx.control.findFirst({ where: { id: action.targetId, orgId }, select: { id: true } });
    if (!control) throw new Error("Control target not found in tenant scope");
  }

  if (action.targetType === "risk") {
    const risk = await tx.risk.findFirst({ where: { id: action.targetId, orgId }, select: { id: true } });
    if (!risk) throw new Error("Risk target not found in tenant scope");
  }

  if (action.type === "create_task") {
    await tx.task.create({
      data: {
        orgId,
        title: `Copilot: ${action.justification}`,
        status: "OPEN"
      }
    });
  }

  if (action.type === "assign_owner") {
    if (action.targetType === "control") {
      await tx.control.update({ where: { id: action.targetId }, data: { owner: actorId || "copilot" } });
    }
    if (action.targetType === "risk") {
      await tx.risk.update({ where: { id: action.targetId }, data: { owner: actorId || "copilot" } });
    }
  }

  if (action.type === "mark_exception") {
    if (action.targetType !== "risk") {
      throw new Error("mark_exception is only supported for risk targets");
    }
    await tx.risk.update({
      where: { id: action.targetId },
      data: { status: "ACCEPTED", acceptedReason: action.justification, reviewedAt: new Date() }
    });
  }

  await tx.auditLog.create({
    data: {
      orgId,
      actorId: actorId || null,
      action: "COPILOT_ACTION_EXECUTED",
      targetType: action.targetType,
      targetId: action.targetId,
      metadata: {
        actionType: action.type,
        approved,
        recommendationId
      } as Prisma.InputJsonValue
    }
  });
}
