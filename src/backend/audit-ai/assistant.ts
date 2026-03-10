import { prisma } from "@/backend/db/client";
import { answerAuditQuestion } from "@/backend/audit-ai/qa";
import { generateAuditSummary } from "@/backend/audit-ai/report";

export async function runAuditAssistant(params: {
  orgId: string;
  question?: string;
}) {
  const [risks, evidence, score] = await Promise.all([
    prisma.risk.count({ where: { orgId: params.orgId, status: { in: ["OPEN", "IN_TREATMENT"] } } }),
    prisma.evidence.count({ where: { orgId: params.orgId, status: "VALID" } }),
    prisma.complianceScore.findFirst({ where: { orgId: params.orgId }, orderBy: { calculatedAt: "desc" } })
  ]);

  const summary = generateAuditSummary({
    orgName: `org:${params.orgId}`,
    readinessScore: Math.round(score?.overallScore || 0),
    openRisks: risks,
    evidenceCoverage: Math.round(score?.evidenceCoverage || 0)
  });

  const qa = answerAuditQuestion({
    question: params.question || "How is access control enforced?",
    evidenceRefs: ["AWS IAM snapshot", "GitHub branch protection export", "Access review report"]
  });

  return {
    summary,
    qa,
    suggestedMissingEvidence:
      evidence === 0 ? ["Upload identity control evidence", "Upload monitoring run snapshots"] : []
  };
}
