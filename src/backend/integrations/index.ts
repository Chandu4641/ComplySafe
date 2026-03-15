import { collectAwsIntegration } from "@/backend/integrations/aws/collector";
import { collectGithubIntegration } from "@/backend/integrations/github/collector";
import { collectOktaIntegration } from "@/backend/integrations/okta/collector";
import { collectGoogleWorkspaceIntegration } from "@/backend/integrations/google-workspace/collector";
import { collectAzureIntegration } from "@/backend/integrations/azure/collector";
import { collectSnykIntegration } from "@/backend/integrations/snyk/collector";
import { collectWizIntegration } from "@/backend/integrations/wiz/collector";
import { collectCrowdStrikeIntegration } from "@/backend/integrations/crowdstrike/collector";
import { collectMicrosoftTeamsIntegration } from "@/backend/integrations/microsoft-teams/collector";
import type { IntegrationCollectionResult, IntegrationProvider } from "@/backend/integrations/types";

export async function collectIntegrationData(provider: IntegrationProvider, orgId: string): Promise<IntegrationCollectionResult> {
  if (provider === "AWS") return collectAwsIntegration(orgId);
  if (provider === "GITHUB") return collectGithubIntegration(orgId);
  if (provider === "OKTA") return collectOktaIntegration(orgId);
  if (provider === "GOOGLE_WORKSPACE") return collectGoogleWorkspaceIntegration(orgId);
  if (provider === "AZURE") return collectAzureIntegration(orgId);
  if (provider === "SNYK") return collectSnykIntegration(orgId);
  if (provider === "WIZ") return collectWizIntegration(orgId);
  if (provider === "CROWDSTRIKE") return collectCrowdStrikeIntegration(orgId);
  if (provider === "MICROSOFT_TEAMS") return collectMicrosoftTeamsIntegration(orgId);
  throw new Error(`Unknown integration provider: ${provider}`);
}

export async function collectAllIntegrations(orgId: string) {
  const providers: IntegrationProvider[] = ["AWS", "GITHUB", "OKTA", "GOOGLE_WORKSPACE", "AZURE", "SNYK", "WIZ", "CROWDSTRIKE", "MICROSOFT_TEAMS"];
  const collections = await Promise.all(providers.map((provider) => collectIntegrationData(provider, orgId)));
  return { collectedAt: new Date().toISOString(), providers: collections };
}
