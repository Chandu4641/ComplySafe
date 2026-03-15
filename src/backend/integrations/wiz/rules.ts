import type { IntegrationCheckResult } from "@/backend/integrations/types";
import type { WizSecuritySnapshot } from "./client";

export function evaluateWizRules(snapshot: WizSecuritySnapshot): IntegrationCheckResult[] {
  const checks: IntegrationCheckResult[] = [];
  
  // Critical findings check
  checks.push({
    checkId: "WIZ_CRITICAL_FINDINGS",
    title: "No critical security findings",
    status: snapshot.criticalFindings === 0 ? "PASS" : "FAIL",
    severity: "HIGH",
    message: snapshot.criticalFindings === 0 
      ? "No critical security findings" 
      : `Found ${snapshot.criticalFindings} critical findings`
  });
  
  // Exposed secrets check
  checks.push({
    checkId: "WIZ_EXPOSED_SECRETS",
    title: "No exposed secrets detected",
    status: snapshot.exposedSecrets === 0 ? "PASS" : "FAIL",
    severity: "HIGH",
    message: snapshot.exposedSecrets === 0 
      ? "No exposed secrets found" 
      : `Found ${snapshot.exposedSecrets} exposed secrets - critical risk`
  });
  
  // Misconfigurations check
  checks.push({
    checkId: "WIZ_MISCONFIGURATIONS",
    title: "Cloud misconfigurations managed",
    status: snapshot.misconfigurations <= 5 ? "PASS" : "FAIL",
    severity: "MEDIUM",
    message: snapshot.misconfigurations <= 5 
      ? `${snapshot.misconfigurations} misconfigurations - within acceptable range` 
      : `${snapshot.misconfigurations} misconfigurations - requires attention`
  });
  
  // Overall compliance status
  checks.push({
    checkId: "WIZ_COMPLIANCE_STATUS",
    title: "Cloud security compliance",
    status: snapshot.complianceStatus === "PASSED" ? "PASS" : "FAIL",
    severity: "MEDIUM",
    message: snapshot.complianceStatus === "PASSED" 
      ? "Wiz security posture: PASSED" 
      : `Wiz security posture: ${snapshot.complianceStatus}`
  });
  
  return checks;
}
