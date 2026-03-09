export type GithubSecuritySnapshot = {
  organization: string;
  branchProtectionEnabled: boolean;
  mfaRequired: boolean;
  pullRequestReviewsRequired: boolean;
};

export async function fetchGithubSecuritySnapshot(orgId: string): Promise<GithubSecuritySnapshot> {
  return {
    organization: `org-${orgId.slice(0, 6)}`,
    branchProtectionEnabled: true,
    mfaRequired: true,
    pullRequestReviewsRequired: true
  };
}
