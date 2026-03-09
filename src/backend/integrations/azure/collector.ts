import type { IntegrationCollectionResult } from "@/backend/integrations/types";
import { fetchAzureSecuritySnapshot } from "./client";
import { evaluateAzureRules } from "./rules";

export async function collectAzureIntegration(orgId: string): Promise<IntegrationCollectionResult> {
  const snapshot = await fetchAzureSecuritySnapshot(orgId);
  return {
    provider: "AZURE",
    accountName: snapshot.subscription,
    collectedAt: new Date().toISOString(),
    checks: evaluateAzureRules(snapshot)
  };
}
