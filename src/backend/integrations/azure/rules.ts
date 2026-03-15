import type { IntegrationCheckResult } from "@/backend/integrations/types";
import type { AzureSecuritySnapshot } from "./client";

export function evaluateAzureRules(snapshot: AzureSecuritySnapshot): IntegrationCheckResult[] {
  return [
    {
      checkId: "AZ_DEFENDER_ENABLED",
      title: "Azure Defender enabled",
      status: snapshot.defenderEnabled ? "PASS" : "FAIL",
      severity: "HIGH",
      message: snapshot.defenderEnabled ? "Defender enabled" : "Defender disabled"
    },
    {
      checkId: "AZ_DISK_ENCRYPTION",
      title: "Disk encryption enabled",
      status: snapshot.diskEncryptionEnabled ? "PASS" : "FAIL",
      severity: "MEDIUM",
      message: snapshot.diskEncryptionEnabled ? "Disk encryption enabled" : "Disk encryption disabled"
    },
    {
      checkId: "AZ_AAD_CONDITIONAL_ACCESS",
      title: "Conditional access enabled",
      status: snapshot.aadConditionalAccessEnabled ? "PASS" : "FAIL",
      severity: "HIGH",
      message: snapshot.aadConditionalAccessEnabled ? "Conditional access enabled" : "Conditional access disabled"
    }
  ];
}
