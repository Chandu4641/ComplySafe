import type { IntegrationCheckResult } from "@/backend/integrations/types";
import type { CrowdStrikeSnapshot } from "./client";

export function evaluateCrowdStrikeRules(snapshot: CrowdStrikeSnapshot): IntegrationCheckResult[] {
  const checks: IntegrationCheckResult[] = [];
  
  // Hosts at risk check
  checks.push({
    checkId: "CS_HOSTS_AT_RISK",
    title: "No hosts at risk",
    status: snapshot.hostsAtRisk === 0 ? "PASS" : "FAIL",
    severity: "HIGH",
    message: snapshot.hostsAtRisk === 0 
      ? "All hosts protected" 
      : `${snapshot.hostsAtRisk} hosts at risk - requires attention`
  });
  
  // Malware detection check
  checks.push({
    checkId: "CS_MALWARE_DETECTIONS",
    title: "No active malware detections",
    status: snapshot.malwareDetections === 0 ? "PASS" : "FAIL",
    severity: "HIGH",
    message: snapshot.malwareDetections === 0 
      ? "No malware detected" 
      : `${snapshot.malwareDetections} malware detections found`
  });
  
  // Agent coverage check
  const coveragePercent = snapshot.hostsProtected > 0 
    ? (snapshot.endpointAgentsActive / snapshot.hostsProtected) * 100 
    : 0;
  checks.push({
    checkId: "CS_AGENT_COVERAGE",
    title: "Endpoint agent coverage",
    status: coveragePercent >= 90 ? "PASS" : "FAIL",
    severity: "MEDIUM",
    message: coveragePercent >= 90 
      ? `${Math.round(coveragePercent)}% agent coverage - good` 
      : `${Math.round(coveragePercent)}% agent coverage - below threshold`
  });
  
  // Phishing protection
  checks.push({
    checkId: "CS_PHISHING_ATTEMPTS",
    title: "Phishing attempts blocked",
    status: snapshot.phishingAttempts < 5 ? "PASS" : "FAIL",
    severity: "MEDIUM",
    message: snapshot.phishingAttempts < 5 
      ? `${snapshot.phishingAttempts} phishing attempts - normal` 
      : `${snapshot.phishingAttempts} phishing attempts - elevated`
  });
  
  return checks;
}
