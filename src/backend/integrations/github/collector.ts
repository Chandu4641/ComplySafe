import type { IntegrationCollectionResult } from "@/backend/integrations/types";
import { fetchGithubSecuritySnapshot } from "./client";
import { evaluateGithubRules } from "./rules";

export async function collectGithubIntegration(orgId: string): Promise<IntegrationCollectionResult> {
  const snapshot = await fetchGithubSecuritySnapshot(orgId);
  return {
    provider: "GITHUB",
    accountName: snapshot.organization,
    collectedAt: new Date().toISOString(),
    checks: evaluateGithubRules(snapshot)
  };
}
