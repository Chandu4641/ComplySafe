import { prisma } from "@/backend/db/client";
import { PHASE2_CANONICAL_MAPPINGS } from "./catalog";

export async function ensureCrossFrameworkMappings() {
  for (const group of PHASE2_CANONICAL_MAPPINGS) {
    const sources = group.sources;
    for (const source of sources) {
      for (const target of sources) {
        if (source.frameworkKey === target.frameworkKey && source.clauseCode === target.clauseCode) continue;

        await prisma.crossFrameworkMapping.upsert({
          where: {
            canonicalControlId_sourceFrameworkKey_sourceClauseCode_targetFrameworkKey_targetClauseCode: {
              canonicalControlId: group.canonicalControlId,
              sourceFrameworkKey: source.frameworkKey,
              sourceClauseCode: source.clauseCode,
              targetFrameworkKey: target.frameworkKey,
              targetClauseCode: target.clauseCode
            }
          },
          update: {
            relationType: "equivalent",
            notes: group.title
          },
          create: {
            canonicalControlId: group.canonicalControlId,
            sourceFrameworkKey: source.frameworkKey,
            sourceClauseCode: source.clauseCode,
            targetFrameworkKey: target.frameworkKey,
            targetClauseCode: target.clauseCode,
            relationType: "equivalent",
            notes: group.title
          }
        });
      }
    }
  }

  return prisma.crossFrameworkMapping.count();
}

export async function getFrameworkMappings(frameworkKey: string) {
  return prisma.crossFrameworkMapping.findMany({
    where: {
      OR: [{ sourceFrameworkKey: frameworkKey }, { targetFrameworkKey: frameworkKey }]
    },
    orderBy: [{ canonicalControlId: "asc" }, { sourceClauseCode: "asc" }, { targetClauseCode: "asc" }]
  });
}
