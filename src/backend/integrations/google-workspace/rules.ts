import type { IntegrationCheckResult } from "@/backend/integrations/types";
import type { GoogleWorkspaceSecuritySnapshot } from "./client";

export function evaluateGoogleWorkspaceRules(snapshot: GoogleWorkspaceSecuritySnapshot): IntegrationCheckResult[] {
  return [
    {
      checkId: "GW_MFA_ENFORCED",
      title: "Google Workspace MFA enforced",
      status: snapshot.mfaEnforced ? "PASS" : "FAIL",
      severity: "HIGH",
      message: snapshot.mfaEnforced ? "Workspace MFA enforced" : "Workspace MFA not enforced"
    },
    {
      checkId: "GW_DKIM_ENABLED",
      title: "DKIM enabled",
      status: snapshot.dkimEnabled ? "PASS" : "FAIL",
      severity: "MEDIUM",
      message: snapshot.dkimEnabled ? "DKIM enabled for domain" : "DKIM not enabled"
    }
  ];
}
