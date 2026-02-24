export interface IntegrationConnector {
  type: string;
  connect: () => Promise<void>;
  sync: () => Promise<void>;
}

export async function connectStub(type: string) {
  return { type, status: "connected" };
}
