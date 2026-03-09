import type { IntegrationCollectionResult } from "@/backend/integrations/types";
import { fetchOktaSecuritySnapshot } from "./client";
import { evaluateOktaRules } from "./rules";

export async function collectOktaIntegration(orgId: string): Promise<IntegrationCollectionResult> {
  const snapshot = await fetchOktaSecuritySnapshot(orgId);
  return {
    provider: "OKTA",
    accountName: snapshot.tenant,
    collectedAt: new Date().toISOString(),
    checks: evaluateOktaRules(snapshot)
  };
}
