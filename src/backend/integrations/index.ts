import { collectAwsIntegration } from "@/backend/integrations/aws/collector";
import { collectGithubIntegration } from "@/backend/integrations/github/collector";
import { collectOktaIntegration } from "@/backend/integrations/okta/collector";
import { collectGoogleWorkspaceIntegration } from "@/backend/integrations/google-workspace/collector";
import { collectAzureIntegration } from "@/backend/integrations/azure/collector";
import type { IntegrationCollectionResult, IntegrationProvider } from "@/backend/integrations/types";

export async function collectIntegrationData(provider: IntegrationProvider, orgId: string): Promise<IntegrationCollectionResult> {
  if (provider === "AWS") return collectAwsIntegration(orgId);
  if (provider === "GITHUB") return collectGithubIntegration(orgId);
  if (provider === "OKTA") return collectOktaIntegration(orgId);
  if (provider === "GOOGLE_WORKSPACE") return collectGoogleWorkspaceIntegration(orgId);
  return collectAzureIntegration(orgId);
}

export async function collectAllIntegrations(orgId: string) {
  const providers: IntegrationProvider[] = ["AWS", "GITHUB", "OKTA", "GOOGLE_WORKSPACE", "AZURE"];
  const collections = await Promise.all(providers.map((provider) => collectIntegrationData(provider, orgId)));
  return { collectedAt: new Date().toISOString(), providers: collections };
}
