export interface EvidenceItem {
  id: string;
  controlId: string;
  status: "collected" | "pending";
}

export function mockEvidence(): EvidenceItem[] {
  return [
    { id: "ev_001", controlId: "CC6.1", status: "collected" },
    { id: "ev_002", controlId: "CC7.2", status: "pending" }
  ];
}
