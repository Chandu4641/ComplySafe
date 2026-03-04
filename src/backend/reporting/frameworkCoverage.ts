import { prisma } from "@/backend/db/client";
import { getEnabledFrameworkForOrg } from "@/backend/frameworks/service";
import { calculateSoc2CriteriaReadiness } from "@/backend/frameworks/soc2Scoring";

const pct = (num: number, den: number) => (den <= 0 ? 0 : Number(((num / den) * 100).toFixed(2)));

export async function buildFrameworkCoverageReport(orgId: string) {
  const enabledFrameworkLinks = await prisma.organizationFramework.findMany({
    where: { organizationId: orgId, enabled: true },
    include: { framework: true },
    orderBy: { activatedAt: "desc" }
  });

  const enabledFrameworks = enabledFrameworkLinks.map((row) => row.framework);

  const perFramework = await Promise.all(
    enabledFrameworks.map(async (framework) => {
      const controls = await prisma.control.findMany({
        where: { orgId, frameworkId: framework.id },
        include: { applicability: true }
      });

      const applicable = controls.filter((c) => {
        const rule = c.applicability.find((a) => a.orgId === orgId);
        return rule ? rule.applicable : true;
      });
      const implemented = applicable.filter((c) => c.status === "IMPLEMENTED").length;

      const score = await prisma.complianceScore.findUnique({
        where: {
          orgId_frameworkId: {
            orgId,
            frameworkId: framework.id
          }
        }
      });

      const soc2Readiness =
        framework.key === "SOC2"
          ? await calculateSoc2CriteriaReadiness(orgId, framework.id)
          : null;

      return {
        frameworkId: framework.id,
        frameworkKey: framework.key,
        frameworkName: framework.name,
        version: framework.version,
        controlsTotal: controls.length,
        controlsApplicable: applicable.length,
        controlsImplemented: implemented,
        coveragePercent: pct(implemented, applicable.length || controls.length || 1),
        soc2ReadinessPercent: soc2Readiness?.overallReadinessPercent ?? null,
        complianceScore: score?.overallScore ?? null,
        scoreCalculatedAt: score?.calculatedAt ?? null
      };
    })
  );

  const mappingCoverage = await prisma.crossFrameworkMapping.groupBy({
    by: ["canonicalControlId"],
    _count: { _all: true }
  });

  const activeFramework = await getEnabledFrameworkForOrg(orgId);

  return {
    generatedAt: new Date().toISOString(),
    orgId,
    activeFrameworkKey: activeFramework?.key ?? null,
    enabledFrameworkCount: enabledFrameworks.length,
    perFramework,
    crossFramework: {
      canonicalControlsMapped: mappingCoverage.length,
      mappingsTotal: mappingCoverage.reduce((sum, row) => sum + row._count._all, 0)
    }
  };
}
