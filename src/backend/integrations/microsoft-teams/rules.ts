import type { IntegrationCheckResult } from "@/backend/integrations/types";
import type { MicrosoftTeamsSnapshot } from "./client";

export function evaluateMicrosoftTeamsRules(snapshot: MicrosoftTeamsSnapshot): IntegrationCheckResult[] {
  const checks: IntegrationCheckResult[] = [];
  
  // Guest user access check
  checks.push({
    checkId: "TEAMS_GUEST_ACCESS",
    title: "Guest access controlled",
    status: snapshot.guestUsers < 3 ? "PASS" : "FAIL",
    severity: "MEDIUM",
    message: snapshot.guestUsers < 3 
      ? `${snapshot.guestUsers} guest users - within acceptable range` 
      : `${snapshot.guestUsers} guest users - review access policy`
  });
  
  // External access check
  checks.push({
    checkId: "TEAMS_EXTERNAL_ACCESS",
    title: "External access configuration",
    status: snapshot.externalAccessEnabled ? "FAIL" : "PASS",
    severity: "MEDIUM",
    message: !snapshot.externalAccessEnabled 
      ? "External access disabled - secure configuration" 
      : "External access enabled - ensure business requirement"
  });
  
  // Compliance mode check
  checks.push({
    checkId: "TEAMS_COMPLIANCE_MODE",
    title: "Teams compliance mode",
    status: snapshot.complianceMode === "Strict" ? "PASS" : "FAIL",
    severity: "HIGH",
    message: snapshot.complianceMode === "Strict" 
      ? "Strict compliance mode enabled" 
      : `Compliance mode: ${snapshot.complianceMode} - recommend Strict mode`
  });
  
  // User count check
  checks.push({
    checkId: "TEAMS_USER_COUNT",
    title: "Teams user coverage",
    status: snapshot.userCount > 10 ? "PASS" : "FAIL",
    severity: "LOW",
    message: snapshot.userCount > 10 
      ? `${snapshot.userCount} users in Teams` 
      : `Only ${snapshot.userCount} users - verify Teams adoption`
  });
  
  return checks;
}
