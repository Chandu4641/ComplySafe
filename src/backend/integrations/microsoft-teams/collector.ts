import type { IntegrationCollectionResult } from "@/backend/integrations/types";
import { fetchMicrosoftTeamsSnapshot } from "./client";
import { evaluateMicrosoftTeamsRules } from "./rules";

export async function collectMicrosoftTeamsIntegration(orgId: string): Promise<IntegrationCollectionResult> {
  const snapshot = await fetchMicrosoftTeamsSnapshot(orgId);
  
  return {
    provider: "MICROSOFT_TEAMS",
    accountName: snapshot.tenantId,
    collectedAt: new Date().toISOString(),
    checks: evaluateMicrosoftTeamsRules(snapshot)
  };
}
