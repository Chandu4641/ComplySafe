export type AwsSecuritySnapshot = {
  accountId: string;
  s3PublicAccessBlocked: boolean;
  cloudTrailEnabled: boolean;
  iamMfaEnforced: boolean;
  ebsEncryptionEnabled: boolean;
};

export async function fetchAwsSecuritySnapshot(orgId: string): Promise<AwsSecuritySnapshot> {
  const hash = orgId.length % 2;
  return {
    accountId: `aws-${orgId.slice(0, 8)}`,
    s3PublicAccessBlocked: true,
    cloudTrailEnabled: true,
    iamMfaEnforced: hash === 0,
    ebsEncryptionEnabled: true
  };
}
