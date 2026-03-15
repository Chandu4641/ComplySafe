import type { IntegrationCollectionResult } from "@/backend/integrations/types";
import { fetchWizSecuritySnapshot } from "./client";
import { evaluateWizRules } from "./rules";

export async function collectWizIntegration(orgId: string): Promise<IntegrationCollectionResult> {
  const snapshot = await fetchWizSecuritySnapshot(orgId);
  
  return {
    provider: "WIZ",
    accountName: snapshot.accountId,
    collectedAt: new Date().toISOString(),
    checks: evaluateWizRules(snapshot)
  };
}
