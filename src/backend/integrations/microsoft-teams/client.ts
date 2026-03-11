/**
 * Microsoft Teams API Client
 * 
 * DEV STUB: This implementation uses mock data for development.
 * Replace with actual Microsoft Graph API calls in production:
 * https://docs.microsoft.com/en-us/graph/
 */

export type MicrosoftTeamsSnapshot = {
  tenantId: string;
  teamCount: number;
  channelCount: number;
  userCount: number;
  guestUsers: number;
  externalAccessEnabled: boolean;
  complianceMode: string;
};

export async function fetchMicrosoftTeamsSnapshot(orgId: string): Promise<MicrosoftTeamsSnapshot> {
  // Simulated Microsoft Graph API response
  // In production, this would call Microsoft Graph API
  const hash = orgId.length % 3;
  
  return {
    tenantId: `teams-${orgId.slice(0, 8)}`,
    teamCount: 5 + hash,
    channelCount: 20 + hash * 3,
    userCount: 50 + hash * 10,
    guestUsers: hash,
    externalAccessEnabled: hash < 2,
    complianceMode: hash < 2 ? "Strict" : "Standard"
  };
}
