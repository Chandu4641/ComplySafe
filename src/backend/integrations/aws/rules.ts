import type { IntegrationCheckResult } from "@/backend/integrations/types";
import type { AwsSecuritySnapshot } from "./client";

export function evaluateAwsRules(snapshot: AwsSecuritySnapshot): IntegrationCheckResult[] {
  return [
    {
      checkId: "AWS_S3_PUBLIC_ACCESS",
      title: "S3 public access is blocked",
      status: snapshot.s3PublicAccessBlocked ? "PASS" : "FAIL",
      severity: "HIGH",
      message: snapshot.s3PublicAccessBlocked ? "S3 block public access enabled" : "S3 bucket allows public access"
    },
    {
      checkId: "AWS_CLOUDTRAIL_ENABLED",
      title: "CloudTrail enabled",
      status: snapshot.cloudTrailEnabled ? "PASS" : "FAIL",
      severity: "HIGH",
      message: snapshot.cloudTrailEnabled ? "CloudTrail is enabled" : "CloudTrail is disabled"
    },
    {
      checkId: "AWS_IAM_MFA_ENFORCED",
      title: "IAM MFA enforcement",
      status: snapshot.iamMfaEnforced ? "PASS" : "FAIL",
      severity: "HIGH",
      message: snapshot.iamMfaEnforced ? "MFA policy is enforced" : "MFA policy is not enforced"
    },
    {
      checkId: "AWS_EBS_ENCRYPTION",
      title: "EBS encryption enabled",
      status: snapshot.ebsEncryptionEnabled ? "PASS" : "FAIL",
      severity: "MEDIUM",
      message: snapshot.ebsEncryptionEnabled ? "EBS encryption is enabled" : "EBS encryption is disabled"
    }
  ];
}
