import { CopilotActionStatus, Prisma } from "@prisma/client";
import { prisma } from "@/backend/db/client";
import { evaluateCopilotAction, type CopilotAction } from "@/backend/copilot/policy";

export type CopilotRecommendation = {
  id: string;
  category: "coverage" | "evidence" | "risk";
  title: string;
  rationale: string;
  suggestedAction: CopilotAction;
  confidence: number;
};

async function upsertRecommendation(
  orgId: string,
  rec: Omit<CopilotRecommendation, "id">,
  targetId: string
) {
  const row = await prisma.copilotRecommendation.create({
    data: {
      orgId,
      category: rec.category,
      title: rec.title,
      rationale: rec.rationale,
      actionType: rec.suggestedAction.type,
      targetType: rec.suggestedAction.targetType,
      targetId,
      justification: rec.suggestedAction.justification,
      confidence: rec.confidence
    }
  });

  return {
    ...rec,
    id: row.id,
    suggestedAction: {
      ...rec.suggestedAction,
      targetId
    }
  } satisfies CopilotRecommendation;
}

export async function getCopilotRecommendations(
  orgId: string,
  params?: { category?: string }
) {
  const [controls, risks] = await Promise.all([
    prisma.control.findMany({
      where: { orgId },
      include: { evidence: true },
      orderBy: { controlId: "asc" },
      take: 10
    }),
    prisma.risk.findMany({
      where: { orgId, status: { in: ["OPEN", "IN_TREATMENT"] } },
      orderBy: { inherentRiskScore: "desc" },
      take: 10
    })
  ]);

  const generated: CopilotRecommendation[] = [];

  for (const control of controls) {
    const hasValidEvidence = control.evidence.some((e) => e.status === "VALID");
    if (!hasValidEvidence) {
      generated.push(
        await upsertRecommendation(
          orgId,
          {
            category: "evidence",
            title: `Missing evidence for ${control.controlId}`,
            rationale: "Control has no VALID evidence attached",
            suggestedAction: {
              type: "create_task",
              targetType: "control",
              targetId: control.id,
              justification: "Collect and upload valid evidence"
            },
            confidence: 0.86
          },
          control.id
        )
      );
    }
  }

  for (const risk of risks) {
    if (!risk.owner && risk.inherentRiskScore >= 15) {
      generated.push(
        await upsertRecommendation(
          orgId,
          {
            category: "risk",
            title: `Assign owner for ${risk.title}`,
            rationale: "High-risk item is open and has no owner",
            suggestedAction: {
              type: "assign_owner",
              targetType: "risk",
              targetId: risk.id,
              justification: "Assign accountable owner for mitigation"
            },
            confidence: 0.8
          },
          risk.id
        )
      );
    }
  }

  const category = params?.category?.toLowerCase();
  const recommendations = generated.filter((row) => {
    if (!category) return true;
    return row.category === category;
  });

  return {
    generatedAt: new Date().toISOString(),
    count: recommendations.length,
    recommendations
  };
}

export async function executeCopilotAction(params: {
  orgId: string;
  actorId?: string | null;
  action: CopilotAction;
  approved: boolean;
  recommendationId?: string | null;
}) {
  const { orgId, actorId, action, approved, recommendationId } = params;
  const decision = evaluateCopilotAction(action);

  let status: CopilotActionStatus;
  type CopilotExecutionResult =
    | { ok: false; status: "blocked" | "approval_required"; reason: string }
    | { ok: true; status: "executed"; reason: string; action: CopilotAction };
  let result: CopilotExecutionResult;

  if (!decision.allowed) {
    status = CopilotActionStatus.BLOCKED;
    result = {
      ok: false as const,
      status: "blocked",
      reason: decision.reason
    };
  } else if (decision.requiresApproval && !approved) {
    status = CopilotActionStatus.APPROVAL_REQUIRED;
    result = {
      ok: false as const,
      status: "approval_required",
      reason: decision.reason
    };
  } else {
    status = CopilotActionStatus.EXECUTED;
    try {
      await prisma.$transaction(async (tx) => {
        if (action.targetType === "control") {
          const control = await tx.control.findFirst({
            where: { id: action.targetId, orgId },
            select: { id: true }
          });
          if (!control) {
            throw new Error("Control target not found in tenant scope");
          }
        }

        if (action.targetType === "risk") {
          const risk = await tx.risk.findFirst({
            where: { id: action.targetId, orgId },
            select: { id: true }
          });
          if (!risk) {
            throw new Error("Risk target not found in tenant scope");
          }
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
            await tx.control.update({
              where: { id: action.targetId },
              data: { owner: actorId || "copilot" }
            });
          }
          if (action.targetType === "risk") {
            await tx.risk.update({
              where: { id: action.targetId },
              data: { owner: actorId || "copilot" }
            });
          }
        }

        if (action.type === "mark_exception") {
          if (action.targetType !== "risk") {
            throw new Error("mark_exception is only supported for risk targets");
          }
          await tx.risk.update({
            where: { id: action.targetId },
            data: {
              status: "ACCEPTED",
              acceptedReason: action.justification,
              reviewedAt: new Date()
            }
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
      });

      result = {
        ok: true,
        status: "executed",
        reason: "Action executed under copilot policy",
        action
      };
    } catch (error) {
      status = CopilotActionStatus.BLOCKED;
      result = {
        ok: false as const,
        status: "blocked",
        reason: error instanceof Error ? error.message : "Action execution failed"
      };
    }
  }

  await prisma.copilotActionExecution.create({
    data: {
      orgId,
      actorId: actorId || null,
      actionType: action.type,
      targetType: action.targetType,
      targetId: action.targetId,
      justification: action.justification,
      approved,
      status,
      reason: result.reason,
      recommendationId: recommendationId || null,
      requestPayload: {
        action,
        approved
      } as Prisma.InputJsonValue,
      responsePayload: result as unknown as Prisma.InputJsonValue
    }
  });

  return result;
}
