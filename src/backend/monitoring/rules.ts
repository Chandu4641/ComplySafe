export type MonitoringControlRule = {
  id: string;
  framework: "ISO27001" | "SOC2";
  controlCode: string;
  provider: "AWS" | "GITHUB" | "OKTA" | "GOOGLE_WORKSPACE" | "AZURE";
  checkId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

export const MONITORING_CONTROL_RULES: MonitoringControlRule[] = [
  {
    id: "MR-001",
    framework: "ISO27001",
    controlCode: "A.9.2.3",
    provider: "AWS",
    checkId: "AWS_IAM_MFA_ENFORCED",
    title: "MFA enabled for privileged IAM users",
    severity: "HIGH"
  },
  {
    id: "MR-002",
    framework: "SOC2",
    controlCode: "CC6.1",
    provider: "GITHUB",
    checkId: "GH_BRANCH_PROTECTION",
    title: "Branch protection enforces secure development",
    severity: "HIGH"
  },
  {
    id: "MR-003",
    framework: "SOC2",
    controlCode: "CC6.1",
    provider: "GITHUB",
    checkId: "GH_MFA_REQUIRED",
    title: "MFA is required for GitHub org users",
    severity: "HIGH"
  },
  {
    id: "MR-004",
    framework: "ISO27001",
    controlCode: "A.8.15",
    provider: "AWS",
    checkId: "AWS_CLOUDTRAIL_ENABLED",
    title: "Audit logging enabled",
    severity: "HIGH"
  }
];
