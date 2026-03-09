export interface EvidenceItem {
  id: string;
  controlId: string;
  status: "VALID" | "EXPIRED" | "MISSING";
}

export function mockEvidence(): EvidenceItem[] {
  return [
    { id: "ev_001", controlId: "A.5.1", status: "VALID" },
    { id: "ev_002", controlId: "A.8.1", status: "MISSING" }
  ];
}

export { collectIntegrationEvidence } from "@/backend/evidence/collector";
export { validateEvidencePayload } from "@/backend/evidence/validator";
export { storeAutomatedEvidence } from "@/backend/evidence/storage";
