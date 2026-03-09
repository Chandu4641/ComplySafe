import type { IntegrationCollectionResult } from "@/backend/integrations/types";
import { fetchAwsSecuritySnapshot } from "./client";
import { evaluateAwsRules } from "./rules";

export async function collectAwsIntegration(orgId: string): Promise<IntegrationCollectionResult> {
  const snapshot = await fetchAwsSecuritySnapshot(orgId);
  return {
    provider: "AWS",
    accountName: snapshot.accountId,
    collectedAt: new Date().toISOString(),
    checks: evaluateAwsRules(snapshot)
  };
}
