import { Prisma } from "@prisma/client";
import { prisma } from "@/backend/db/client";
import { validateEvidencePayload } from "@/backend/evidence/validator";

export async function storeAutomatedEvidence(params: {
  orgId: string;
  source: string;
  controlId?: string;
  riskId?: string;
  fileRef?: string;
  data: Prisma.InputJsonValue;
  expiresAt?: Date;
  reviewFrequency?: "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL";
}) {
  const verdict = validateEvidencePayload(params.data);
  if (!verdict.valid) {
    throw new Error(verdict.reason || "Invalid evidence payload");
  }

  return prisma.evidence.create({
    data: {
      orgId: params.orgId,
      controlId: params.controlId,
      riskId: params.riskId,
      source: params.source,
      fileRef: params.fileRef,
      data: params.data as Prisma.InputJsonValue,
      status: "VALID",
      reviewFrequency: params.reviewFrequency || "QUARTERLY",
      expiresAt: params.expiresAt
    }
  });
}
