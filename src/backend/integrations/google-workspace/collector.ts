import type { IntegrationCollectionResult } from "@/backend/integrations/types";
import { fetchGoogleWorkspaceSecuritySnapshot } from "./client";
import { evaluateGoogleWorkspaceRules } from "./rules";

export async function collectGoogleWorkspaceIntegration(orgId: string): Promise<IntegrationCollectionResult> {
  const snapshot = await fetchGoogleWorkspaceSecuritySnapshot(orgId);
  return {
    provider: "GOOGLE_WORKSPACE",
    accountName: snapshot.domain,
    collectedAt: new Date().toISOString(),
    checks: evaluateGoogleWorkspaceRules(snapshot)
  };
}
