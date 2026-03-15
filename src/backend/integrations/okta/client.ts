export type OktaSecuritySnapshot = {
  tenant: string;
  mfaEnforced: boolean;
  suspiciousLoginPolicyEnabled: boolean;
};

export async function fetchOktaSecuritySnapshot(orgId: string): Promise<OktaSecuritySnapshot> {
  return {
    tenant: `okta-${orgId.slice(0, 6)}`,
    mfaEnforced: true,
    suspiciousLoginPolicyEnabled: true
  };
}
