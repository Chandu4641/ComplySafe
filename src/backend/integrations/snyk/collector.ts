import type { IntegrationCollectionResult } from "@/backend/integrations/types";
import { fetchSnykSecuritySnapshot } from "./client";
import { evaluateSnykRules } from "./rules";

export async function collectSnykIntegration(orgId: string): Promise<IntegrationCollectionResult> {
  const snapshot = await fetchSnykSecuritySnapshot(orgId);
  
  return {
    provider: "SNYK",
    accountName: snapshot.orgId,
    collectedAt: new Date().toISOString(),
    checks: evaluateSnykRules(snapshot)
  };
}
