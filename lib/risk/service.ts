import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/lib/audit/service";
import { calculateComplianceScore } from "@/lib/compliance/score";

const clamp = (value: number) => Math.min(5, Math.max(1, Math.round(value)));

export function calculateRiskScore(likelihood: number, impact: number) {
  return clamp(likelihood) * clamp(impact);
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

  await writeAuditLog({
    orgId: params.orgId,
    actorId: params.actorId,
    action: "risk.created",
    targetType: "Risk",
    targetId: risk.id,
    after: risk
  });

  if (params.frameworkId) {
    await calculateComplianceScore(params.orgId, params.frameworkId);
  }

  return risk;
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
  const residualRiskScore =
    params.patch.residualRiskScore == null ? current.residualRiskScore : Math.max(1, params.patch.residualRiskScore);

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

  await writeAuditLog({
    orgId: params.orgId,
    actorId: params.actorId,
    action: "risk.updated",
    targetType: "Risk",
    targetId: next.id,
    before: current,
    after: next
  });

  const frameworkId = params.frameworkId ?? current.frameworkId ?? undefined;
  if (frameworkId) {
    await calculateComplianceScore(params.orgId, frameworkId);
  }

  return next;
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
