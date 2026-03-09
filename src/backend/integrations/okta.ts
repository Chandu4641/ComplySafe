import { runIntegrationSync } from "@/backend/integrations/registry";

export async function syncOkta(orgId: string) {
  return runIntegrationSync("OKTA", orgId);
}
