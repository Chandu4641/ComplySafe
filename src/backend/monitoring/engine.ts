import { prisma } from "@/backend/db/client";
import { collectIntegrationData } from "@/backend/integrations";
import { normalizeProvider } from "@/backend/integrations/registry";
import type { IntegrationProvider } from "@/backend/integrations/types";
import { evaluateCollectionsAgainstControlRules } from "@/backend/monitoring/evaluator";
import { collectIntegrationEvidence } from "@/backend/evidence/collector";
import { automateRiskFromControlFailure } from "@/backend/risk/engine";

export async function runMonitoringEngine(orgId: string) {
  const integrationRows = await prisma.integration.findMany({
    where: { orgId, status: { not: "disconnected" } },
    select: { type: true }
  });

  const providers = integrationRows.length > 0
    ? Array.from(new Set(integrationRows.map((item) => normalizeProvider(item.type))))
    : (["AWS", "GITHUB", "OKTA", "GOOGLE_WORKSPACE", "AZURE"] as IntegrationProvider[]);

  const collections = await Promise.all(providers.map((provider) => collectIntegrationData(provider, orgId)));

  const evidenceCounts = await Promise.all(
    collections.map((collection) => collectIntegrationEvidence(orgId, collection))
  );

  const evaluated = evaluateCollectionsAgainstControlRules(collections);

  const automatedRisks = [] as Array<{ riskId: string; taskId?: string }>;
  for (const failure of evaluated.evaluations.filter((item) => !item.passed)) {
    const control = await prisma.control.findFirst({
      where: { orgId, controlId: failure.controlCode },
      select: { id: true }
    });

    const risk = await automateRiskFromControlFailure({
      orgId,
      controlId: control?.id,
      provider: failure.provider,
      checkId: failure.checkId,
      title: `${failure.framework} ${failure.controlCode}: ${failure.title}`,
      severity: failure.severity,
      message: failure.message
    });

    automatedRisks.push({
      riskId: risk.risk.id,
      taskId: risk.remediationTask?.id
    });
  }

  return {
    startedAt: new Date().toISOString(),
    providers,
    collections,
    evidenceCreated: evidenceCounts.reduce((sum, item) => sum + item.length, 0),
    evaluation: {
      total: evaluated.total,
      passed: evaluated.passed,
      failed: evaluated.failed
    },
    riskAutomations: automatedRisks.length
  };
}
