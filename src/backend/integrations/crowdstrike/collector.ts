import type { IntegrationCollectionResult } from "@/backend/integrations/types";
import { fetchCrowdStrikeSnapshot } from "./client";
import { evaluateCrowdStrikeRules } from "./rules";

export async function collectCrowdStrikeIntegration(orgId: string): Promise<IntegrationCollectionResult> {
  const snapshot = await fetchCrowdStrikeSnapshot(orgId);
  
  return {
    provider: "CROWDSTRIKE",
    accountName: snapshot.customerId,
    collectedAt: new Date().toISOString(),
    checks: evaluateCrowdStrikeRules(snapshot)
  };
}
