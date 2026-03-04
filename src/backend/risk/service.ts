import { prisma } from "@/backend/db/client";
import { writeAuditLog } from "@/backend/audit/service";
import { calculateComplianceScore } from "@/backend/compliance/score";
import { captureRiskTrendSnapshot } from "@/backend/monitoring/risk-drift";

const clamp = (value: number) => Math.min(5, Math.max(1, Math.round(value)));
const clampResidual = (value: number) => Math.min(25, Math.max(1, Math.round(value)));

export function calculateRiskScore(likelihood: number, impact: number) {
  return clamp(likelihood) * clamp(impact);
}

async function calculateControlEffectivenessModifier(orgId: string, riskId: string) {
  const effectiveness = await prisma.controlEffectiveness.findMany({
    where: {
      orgId,
      control: {
        riskLinks: {
          some: {
            riskId
          }
        }
      }
    },
    select: { score: true }
  });

  if (effectiveness.length === 0) return 0;
  const avg = effectiveness.reduce((sum, item) => sum + item.score, 0) / effectiveness.length;
  return Math.round(avg * 5);
}

async function calculateTrendWeight(orgId: string, riskId: string) {
  const snapshots = await prisma.riskTrendSnapshot.findMany({
    where: { orgId, riskId },
    orderBy: { capturedAt: "desc" },
    take: 3
  });

  const ordered = snapshots.slice().reverse();
  if (ordered.length < 3) return 0;

  const delta = ordered[2].score - ordered[0].score;
  if (delta <= 0) return 0;
  return Math.min(5, delta);
}

async function calculateEnhancedResidualRisk(params: {
  orgId: string;
  riskId: string;
  inherentRiskScore: number;
}) {
  const [controlEffectivenessModifier, trendWeight] = await Promise.all([
    calculateControlEffectivenessModifier(params.orgId, params.riskId),
    calculateTrendWeight(params.orgId, params.riskId)
  ]);

  const residualRiskScore = clampResidual(params.inherentRiskScore - controlEffectivenessModifier + trendWeight);

  return {
    residualRiskScore,
    modifiers: {
      controlEffectivenessModifier,
      trendWeight
    }
  };
}

export async function createRisk(params: {
  orgId: string;
  actorId?: string;
  frameworkId?: string;
  assetId?: string;
  title: string;
  description?: string;
  likelihood: number;
  impact: number;
}) {
  const inherentRiskScore = calculateRiskScore(params.likelihood, params.impact);

  const risk = await prisma.risk.create({
    data: {
      orgId: params.orgId,
      frameworkId: params.frameworkId,
      assetId: params.assetId,
      title: params.title,
      description: params.description,
      likelihood: clamp(params.likelihood),
      impact: clamp(params.impact),
      inherentRiskScore,
      residualRiskScore: inherentRiskScore,
      status: "OPEN"
    }
  });

  const enhanced = await calculateEnhancedResidualRisk({
    orgId: params.orgId,
    riskId: risk.id,
    inherentRiskScore
  });

  const finalizedRisk =
    enhanced.residualRiskScore === risk.residualRiskScore
      ? risk
      : await prisma.risk.update({
          where: { id: risk.id },
          data: {
            residualRiskScore: enhanced.residualRiskScore
          }
        });

  await captureRiskTrendSnapshot(params.orgId, finalizedRisk.id, finalizedRisk.residualRiskScore);

  await writeAuditLog({
    orgId: params.orgId,
    actorId: params.actorId,
    action: "risk.created",
    targetType: "Risk",
    targetId: finalizedRisk.id,
    after: finalizedRisk,
    metadata: enhanced.modifiers
  });

  if (params.frameworkId) {
    await calculateComplianceScore(params.orgId, params.frameworkId);
  }

  return finalizedRisk;
}

export async function updateRisk(params: {
  orgId: string;
  riskId: string;
  actorId?: string;
  frameworkId?: string;
  patch: Partial<{
    title: string;
    description: string;
    likelihood: number;
    impact: number;
    residualRiskScore: number;
    status: "OPEN" | "IN_TREATMENT" | "MITIGATED" | "ACCEPTED" | "CLOSED";
    owner: string;
    acceptedReason: string;
    nextReviewAt: Date;
  }>;
}) {
  const current = await prisma.risk.findFirst({ where: { id: params.riskId, orgId: params.orgId } });
  if (!current) {
    throw new Error("Risk not found");
  }

  const likelihood = params.patch.likelihood ?? current.likelihood;
  const impact = params.patch.impact ?? current.impact;
  const inherentRiskScore = calculateRiskScore(likelihood, impact);
  let residualRiskScore = params.patch.residualRiskScore == null ? current.residualRiskScore : clampResidual(params.patch.residualRiskScore);

  if (params.patch.status === "CLOSED") {
    const openControls = await prisma.riskControl.count({
      where: {
        riskId: current.id,
        control: { status: { not: "IMPLEMENTED" } }
      }
    });
    if (openControls > 0) {
      throw new Error("Risk cannot be closed until linked controls are implemented.");
    }
  }

  const next = await prisma.risk.update({
    where: { id: current.id },
    data: {
      ...params.patch,
      likelihood,
      impact,
      inherentRiskScore,
      residualRiskScore,
      reviewedAt: new Date()
    }
  });

  let finalRisk = next;
  let modifiers: { controlEffectivenessModifier: number; trendWeight: number } | null = null;
  if (params.patch.residualRiskScore == null) {
    const enhanced = await calculateEnhancedResidualRisk({
      orgId: params.orgId,
      riskId: next.id,
      inherentRiskScore
    });
    modifiers = enhanced.modifiers;
    if (enhanced.residualRiskScore !== next.residualRiskScore) {
      finalRisk = await prisma.risk.update({
        where: { id: next.id },
        data: {
          residualRiskScore: enhanced.residualRiskScore
        }
      });
    }
  }

  await captureRiskTrendSnapshot(params.orgId, finalRisk.id, finalRisk.residualRiskScore);

  await writeAuditLog({
    orgId: params.orgId,
    actorId: params.actorId,
    action: "risk.updated",
    targetType: "Risk",
    targetId: finalRisk.id,
    before: current,
    after: finalRisk,
    metadata: modifiers ?? undefined
  });

  const frameworkId = params.frameworkId ?? current.frameworkId ?? undefined;
  if (frameworkId) {
    await calculateComplianceScore(params.orgId, frameworkId);
  }

  return finalRisk;
}

export async function linkRiskToControl(params: {
  orgId: string;
  riskId: string;
  controlId: string;
  actorId?: string;
}) {
  const [risk, control] = await Promise.all([
    prisma.risk.findFirst({ where: { id: params.riskId, orgId: params.orgId } }),
    prisma.control.findFirst({ where: { id: params.controlId, orgId: params.orgId } })
  ]);

  if (!risk || !control) {
    throw new Error("Risk or control not found for organization");
  }

  const link = await prisma.riskControl.upsert({
    where: { riskId_controlId: { riskId: risk.id, controlId: control.id } },
    update: {},
    create: {
      orgId: params.orgId,
      riskId: risk.id,
      controlId: control.id
    }
  });

  await writeAuditLog({
    orgId: params.orgId,
    actorId: params.actorId,
    action: "risk.control.linked",
    targetType: "RiskControl",
    targetId: link.id,
    after: link
  });

  return link;
}
