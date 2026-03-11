/**
 * Snyk API Client
 * 
 * DEV STUB: This implementation uses mock data for development.
 * Replace with actual Snyk REST API calls in production:
 * https://snyk.docs.apiary.io/
 */

export type SnykSecuritySnapshot = {
  orgId: string;
  projectCount: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  openIssues: number;
  resolvedIssues: number;
};

export async function fetchSnykSecuritySnapshot(orgId: string): Promise<SnykSecuritySnapshot> {
  // Simulated Snyk API response
  // In production, this would call Snyk's REST API
  const hash = orgId.length % 3;
  
  return {
    orgId: `snyk-${orgId.slice(0, 8)}`,
    projectCount: 5 + hash,
    criticalVulnerabilities: hash === 0 ? 0 : hash,
    highVulnerabilities: 2 + hash,
    mediumVulnerabilities: 5 + hash,
    lowVulnerabilities: 8 + hash,
    openIssues: 3 + hash * 2,
    resolvedIssues: 10 + hash * 3
  };
}
