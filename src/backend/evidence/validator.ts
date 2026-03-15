export function validateEvidencePayload(data: unknown): { valid: boolean; reason?: string } {
  if (data == null) return { valid: false, reason: "Evidence payload is required" };
  if (typeof data !== "object") return { valid: false, reason: "Evidence payload must be an object" };
  return { valid: true };
}
