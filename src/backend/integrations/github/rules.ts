import type { IntegrationCheckResult } from "@/backend/integrations/types";
import type { GithubSecuritySnapshot } from "./client";

export function evaluateGithubRules(snapshot: GithubSecuritySnapshot): IntegrationCheckResult[] {
  return [
    {
      checkId: "GH_BRANCH_PROTECTION",
      title: "Branch protection enabled",
      status: snapshot.branchProtectionEnabled ? "PASS" : "FAIL",
      severity: "HIGH",
      message: snapshot.branchProtectionEnabled ? "Protected branch rules enabled" : "Protected branch rules missing"
    },
    {
      checkId: "GH_MFA_REQUIRED",
      title: "MFA required",
      status: snapshot.mfaRequired ? "PASS" : "FAIL",
      severity: "HIGH",
      message: snapshot.mfaRequired ? "GitHub MFA required" : "GitHub MFA not required"
    },
    {
      checkId: "GH_PR_REVIEW_REQUIRED",
      title: "PR reviews required",
      status: snapshot.pullRequestReviewsRequired ? "PASS" : "FAIL",
      severity: "MEDIUM",
      message: snapshot.pullRequestReviewsRequired ? "PR approvals required" : "PR approvals not required"
    }
  ];
}
