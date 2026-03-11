import { prisma } from "@/backend/db/client";
import { collectIntegrationData } from "@/backend/integrations";
import type { IntegrationProvider } from "@/backend/integrations/types";
import { Prisma } from "@prisma/client";

const PROVIDER_ALIASES: Record<string, IntegrationProvider> = {
  AWS: "AWS",
  GITHUB: "GITHUB",
  OKTA: "OKTA",
  GOOGLE_WORKSPACE: "GOOGLE_WORKSPACE",
  GOOGLEWORKSPACE: "GOOGLE_WORKSPACE",
  AZURE: "AZURE",
  SNYK: "SNYK",
  WIZ: "WIZ",
  CROWDSTRIKE: "CROWDSTRIKE",
  MICROSOFT_TEAMS: "MICROSOFT_TEAMS",
  TEAMS: "MICROSOFT_TEAMS",
};

export function normalizeProvider(type: string): IntegrationProvider {
  const normalized = type.toUpperCase().replace(/[\s-]/g, "_");
  return PROVIDER_ALIASES[normalized] ?? "AWS";
}

export async function runIntegrationSync(type: string, orgId: string) {
  try {
    const provider = normalizeProvider(type);
    const collection = await collectIntegrationData(provider, orgId);

    // 1. Prepare Metadata for the parent Integration
    // Casting to Prisma.InputJsonValue resolves the "Failed to compile" error
    const integrationMetadata: Prisma.InputJsonValue = {
      accountName: collection.accountName,
      checks: collection.checks.length,
    };

    const integration = await prisma.integration.upsert({
      where: {
        orgId_type: {
          orgId,
          type: provider,
        },
      },
      update: {
        status: "connected",
        provider,
        metadata: integrationMetadata,
        lastSync: new Date(collection.collectedAt),
      },
      create: {
        orgId,
        type: provider,
        provider,
        status: "connected",
        metadata: integrationMetadata,
        lastSync: new Date(collection.collectedAt),
      },
    });

    // 2. Prepare Detailed Metadata for the Integration Account
    // We cast this because 'collection.checks' is an array, which triggers the type error
    const accountMetadata: Prisma.InputJsonValue = {
      provider,
      checks: collection.checks as unknown as Prisma.InputJsonValue,
      collectedAt: collection.collectedAt,
    };

    await prisma.integrationAccount.upsert({
      where: {
        integrationId_accountName: {
          integrationId: integration.id,
          accountName: collection.accountName,
        },
      },
      update: {
        metadata: accountMetadata,
      },
      create: {
        integrationId: integration.id,
        accountName: collection.accountName,
        metadata: accountMetadata,
      },
    });

    return {
      provider,
      integrationId: integration.id,
      accountName: collection.accountName,
      checks: collection.checks.length,
      failures: collection.checks.filter((item) => item.status === "FAIL").length,
      collectedAt: collection.collectedAt,
      results: collection.checks,
    };
  } catch (error) {
    console.error(`[IntegrationSyncError] Failed for ${type}:`, error);
    throw new Error(`Sync failed for provider ${type}`);
  }
}
