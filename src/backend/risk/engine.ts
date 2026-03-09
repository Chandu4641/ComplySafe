import { prisma } from "@/backend/db/client";
import { createRisk } from "@/backend/risk/service";
import { scoreRiskFromFailure } from "@/backend/risk/scoring";
import { createRemediationTask } from "@/backend/risk/remediation";

export async function automateRiskFromControlFailure(params: {
  orgId: string;
  controlId?: string;
  provider: string;
  checkId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
}) {
  const existing = await prisma.risk.findFirst({
    where: {
      orgId: params.orgId,
      title: params.title,
      status: {
        in: ["OPEN", "IN_TREATMENT"]
      }
    }
  });

  if (existing) {
    return {
      risk: existing,
      remediationTask: null,
      created: false
    };
  }

  const score = scoreRiskFromFailure({ severity: params.severity });
  const risk = await createRisk({
    orgId: params.orgId,
    title: params.title,
    description: `${params.message} [${params.provider}:${params.checkId}]`,
    likelihood: score.likelihood,
    impact: score.impact
  });

  if (params.controlId) {
    await prisma.riskControl.upsert({
      where: {
        riskId_controlId: {
          riskId: risk.id,
          controlId: params.controlId
        }
      },
      update: {},
      create: {
        orgId: params.orgId,
        riskId: risk.id,
        controlId: params.controlId
      }
    });
  }

  const remediationTask = await createRemediationTask({
    orgId: params.orgId,
    title: `Remediate: ${params.title}`,
    dueInDays: params.severity === "HIGH" ? 7 : 14
  });

  return {
    risk,
    remediationTask,
    created: true
  };
}
