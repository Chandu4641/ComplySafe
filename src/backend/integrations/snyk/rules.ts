import type { IntegrationCheckResult } from "@/backend/integrations/types";
import type { SnykSecuritySnapshot } from "./client";

export function evaluateSnykRules(snapshot: SnykSecuritySnapshot): IntegrationCheckResult[] {
  const checks: IntegrationCheckResult[] = [];
  
  // Critical vulnerabilities check
  checks.push({
    checkId: "SNYK_CRITICAL_VULNS",
    title: "No critical vulnerabilities",
    status: snapshot.criticalVulnerabilities === 0 ? "PASS" : "FAIL",
    severity: "HIGH",
    message: snapshot.criticalVulnerabilities === 0 
      ? "No critical vulnerabilities found" 
      : `Found ${snapshot.criticalVulnerabilities} critical vulnerabilities`
  });
  
  // High vulnerabilities check
  checks.push({
    checkId: "SNYK_HIGH_VULNS",
    title: "Minimal high vulnerabilities",
    status: snapshot.highVulnerabilities <= 2 ? "PASS" : "FAIL",
    severity: "HIGH",
    message: snapshot.highVulnerabilities <= 2 
      ? "High vulnerabilities within acceptable range" 
      : `Found ${snapshot.highVulnerabilities} high vulnerabilities - exceeds threshold`
  });
  
  // Open issues check
  checks.push({
    checkId: "SNYK_OPEN_ISSUES",
    title: "Open issues being tracked",
    status: snapshot.openIssues < 10 ? "PASS" : "FAIL",
    severity: "MEDIUM",
    message: snapshot.openIssues < 10 
      ? `${snapshot.openIssues} open issues - being addressed` 
      : `${snapshot.openIssues} open issues - requires immediate attention`
  });
  
  // Resolution rate check
  const totalIssues = snapshot.openIssues + snapshot.resolvedIssues;
  const resolutionRate = totalIssues > 0 ? snapshot.resolvedIssues / totalIssues : 0;
  checks.push({
    checkId: "SNYK_RESOLUTION_RATE",
    title: "Active vulnerability remediation",
    status: resolutionRate >= 0.5 ? "PASS" : "FAIL",
    severity: "MEDIUM",
    message: resolutionRate >= 0.5 
      ? `${Math.round(resolutionRate * 100)}% resolution rate - good remediation progress` 
      : `${Math.round(resolutionRate * 100)}% resolution rate - needs improvement`
  });
  
  return checks;
}
