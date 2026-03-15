export type IntegrationProvider = "AWS" | "GITHUB" | "OKTA" | "GOOGLE_WORKSPACE" | "AZURE" | "SNYK" | "WIZ" | "CROWDSTRIKE" | "MICROSOFT_TEAMS";

export type IntegrationCheckResult = {
  checkId: string;
  title: string;
  status: "PASS" | "FAIL";
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  metadata?: Record<string, unknown>;
};

export type IntegrationCollectionResult = {
  provider: IntegrationProvider;
  accountName: string;
  collectedAt: string;
  checks: IntegrationCheckResult[];
};
