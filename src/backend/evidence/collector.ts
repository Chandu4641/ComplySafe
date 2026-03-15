import { prisma } from "@/backend/db/client";
import { Prisma } from "@prisma/client";
import type { IntegrationCollectionResult } from "@/backend/integrations/types";
import { storeAutomatedEvidence } from "@/backend/evidence/storage";

const CONTROL_MAP: Record<string, string> = {
  AWS_S3_PUBLIC_ACCESS: "A.8.9",
  AWS_CLOUDTRAIL_ENABLED: "A.8.15",
  AWS_IAM_MFA_ENFORCED: "A.9.2.3",
  AWS_EBS_ENCRYPTION: "A.8.10",
  GH_BRANCH_PROTECTION: "CC6.1",
  GH_MFA_REQUIRED: "CC6.2",
  GH_PR_REVIEW_REQUIRED: "CC8.1",
  OKTA_MFA_ENFORCED: "A.9.4.2",
  OKTA_SUSPICIOUS_LOGIN_POLICY: "A.5.7",
  GW_MFA_ENFORCED: "A.9.2.3",
  GW_DKIM_ENABLED: "A.5.14",
  AZ_DEFENDER_ENABLED: "A.8.16",
  AZ_DISK_ENCRYPTION: "A.8.10",
  AZ_AAD_CONDITIONAL_ACCESS: "CC6.1"
};

async function resolveControlId(orgId: string, checkId: string) {
  const controlCode = CONTROL_MAP[checkId];
  if (!controlCode) return undefined;
  const control = await prisma.control.findFirst({
    where: { orgId, controlId: controlCode },
    select: { id: true }
  });
  return control?.id;
}

export async function collectIntegrationEvidence(orgId: string, collection: IntegrationCollectionResult) {
  const evidenceIds: string[] = [];

  for (const check of collection.checks) {
    const controlId = await resolveControlId(orgId, check.checkId);
    const payload = JSON.parse(
      JSON.stringify({
        provider: collection.provider,
        accountName: collection.accountName,
        check,
        collectedAt: collection.collectedAt
      })
    ) as Prisma.InputJsonValue;

    const evidence = await storeAutomatedEvidence({
      orgId,
      source: collection.provider,
      controlId,
      data: payload
    });
    evidenceIds.push(evidence.id);
  }

  return evidenceIds;
}
