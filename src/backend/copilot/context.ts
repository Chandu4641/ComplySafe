import { prisma } from "@/backend/db/client";

export type CopilotContext = {
  orgId: string;
  unresolvedRisks: number;
  controlsWithoutEvidence: number;
  staleEvidence: number;
  generatedAt: string;
};

export async function buildCopilotContext(orgId: string): Promise<CopilotContext> {
  const [unresolvedRisks, controlsWithoutEvidence, staleEvidence] = await Promise.all([
    prisma.risk.count({ where: { orgId, status: { in: ["OPEN", "IN_TREATMENT"] } } }),
    prisma.control.count({ where: { orgId, evidence: { none: {} } } }),
    prisma.evidence.count({ where: { orgId, OR: [{ status: "EXPIRED" }, { status: "MISSING" }] } })
  ]);

  return {
    orgId,
    unresolvedRisks,
    controlsWithoutEvidence,
    staleEvidence,
    generatedAt: new Date().toISOString()
  };
}
