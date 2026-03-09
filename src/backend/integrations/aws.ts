import { runIntegrationSync } from "@/backend/integrations/registry";

export async function syncAws(orgId: string) {
  return runIntegrationSync("AWS", orgId);
}
