import { syncAws } from "./aws";
import { syncOkta } from "./okta";

export async function runIntegrationSync(type: string, orgId: string) {
  if (type === "AWS") return syncAws(orgId);
  if (type === "Okta") return syncOkta(orgId);
  return { assets: 0 };
}
