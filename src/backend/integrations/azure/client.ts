export type AzureSecuritySnapshot = {
  subscription: string;
  defenderEnabled: boolean;
  diskEncryptionEnabled: boolean;
  aadConditionalAccessEnabled: boolean;
};

export async function fetchAzureSecuritySnapshot(orgId: string): Promise<AzureSecuritySnapshot> {
  return {
    subscription: `sub-${orgId.slice(0, 8)}`,
    defenderEnabled: true,
    diskEncryptionEnabled: true,
    aadConditionalAccessEnabled: true
  };
}
