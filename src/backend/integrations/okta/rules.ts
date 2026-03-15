import type { IntegrationCheckResult } from "@/backend/integrations/types";
import type { OktaSecuritySnapshot } from "./client";

export function evaluateOktaRules(snapshot: OktaSecuritySnapshot): IntegrationCheckResult[] {
  return [
    {
      checkId: "OKTA_MFA_ENFORCED",
      title: "Okta MFA enforcement",
      status: snapshot.mfaEnforced ? "PASS" : "FAIL",
      severity: "HIGH",
      message: snapshot.mfaEnforced ? "MFA is enforced in Okta" : "MFA is not enforced in Okta"
    },
    {
      checkId: "OKTA_SUSPICIOUS_LOGIN_POLICY",
      title: "Suspicious login policy enabled",
      status: snapshot.suspiciousLoginPolicyEnabled ? "PASS" : "FAIL",
      severity: "MEDIUM",
      message: snapshot.suspiciousLoginPolicyEnabled ? "Suspicious login policy enabled" : "Suspicious login policy missing"
    }
  ];
}
