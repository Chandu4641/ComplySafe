import { buildCopilotContext } from "@/backend/copilot/context";

export async function generateCopilotExplanation(params: {
  orgId: string;
  query: string;
}) {
  const context = await buildCopilotContext(params.orgId);
  const normalized = params.query.toLowerCase();

  if (normalized.includes("a.9.2.3") || normalized.includes("mfa")) {
    return {
      answer:
        "Control A.9.2.3 likely fails when MFA enforcement is incomplete in identity systems. Review IAM/IdP accounts and enforce MFA for privileged users.",
      recommendations: [
        "Enable MFA for all privileged users",
        "Attach mandatory MFA enforcement policy",
        "Upload fresh MFA evidence snapshot"
      ],
      context
    };
  }

  return {
    answer: `Current compliance context: ${context.unresolvedRisks} unresolved risks, ${context.controlsWithoutEvidence} controls without evidence, ${context.staleEvidence} stale evidence items.`,
    recommendations: [
      "Remediate open risks with owner assignments",
      "Collect evidence for uncovered controls",
      "Refresh expired evidence items"
    ],
    context
  };
}
