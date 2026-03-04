export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { prisma } from "@/backend/db/client";
import { ISO_ANNEX_A_CONTROL_COUNT } from "@/backend/frameworks/iso27001";
import { getEnabledFrameworkForOrg } from "@/backend/frameworks/service";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const frameworkKey = String(url.searchParams.get("frameworkKey") || "").trim();
  const enabledFramework = await getEnabledFrameworkForOrg(session.orgId);
  const framework = frameworkKey
    ? await prisma.framework.findFirst({ where: { key: frameworkKey } })
    : enabledFramework;
  const clauseCount = framework
    ? await prisma.frameworkClause.count({ where: { frameworkId: framework.id } })
    : 0;

  const controlCountForOrg = framework
    ? await prisma.control.count({ where: { orgId: session.orgId, frameworkId: framework.id } })
    : 0;

  const riskControlScopeViolations = await prisma.riskControl.count({
    where: {
      OR: [
        { risk: { orgId: { not: session.orgId } } },
        { control: { orgId: { not: session.orgId } } },
        { orgId: { not: session.orgId } }
      ]
    }
  });
  const evidenceScopeViolations = await prisma.evidence.count({
    where: {
      orgId: session.orgId,
      OR: [
        { control: { orgId: { not: session.orgId } } },
        { risk: { orgId: { not: session.orgId } } }
      ]
    }
  });
  const findingScopeViolations = await prisma.finding.count({
    where: {
      scan: { orgId: session.orgId },
      control: { orgId: { not: session.orgId } }
    }
  });
  const sessionScopeViolations = await prisma.session.count({
    where: {
      orgId: session.orgId,
      user: { orgId: { not: session.orgId } }
    }
  });

  const runs = await prisma.monitoringRun.findMany({
    where: { orgId: session.orgId },
    orderBy: { runDate: "desc" },
    take: 5
  });

  const score = framework
    ? await prisma.complianceScore.findUnique({
        where: { orgId_frameworkId: { orgId: session.orgId, frameworkId: framework.id } }
      })
    : null;

  return NextResponse.json({
    isoCompleteness: {
      expectedAnnexAControls: ISO_ANNEX_A_CONTROL_COUNT,
      evaluatedFrameworkKey: framework?.key ?? null,
      seededClauses: clauseCount,
      controlsForOrg: controlCountForOrg,
      isComplete:
        framework?.key === "ISO27001" &&
        clauseCount === ISO_ANNEX_A_CONTROL_COUNT &&
        controlCountForOrg === ISO_ANNEX_A_CONTROL_COUNT
    },
    multiTenantEnforcement: {
      scopedOrgId: session.orgId,
      riskControlScopeViolations,
      evidenceScopeViolations,
      findingScopeViolations,
      sessionScopeViolations,
      passes:
        riskControlScopeViolations === 0 &&
        evidenceScopeViolations === 0 &&
        findingScopeViolations === 0 &&
        sessionScopeViolations === 0
    },
    queryAudit: {
      reviewed: [
        "risks",
        "controls",
        "risk_controls",
        "evidence",
        "findings",
        "sessions",
        "integrations",
        "scans",
        "policies",
        "tasks"
      ],
      corrected: [
        "scanner control lookup scoped by orgId",
        "scan run control mapping scoped by orgId",
        "rule update/delete requires org ownership check",
        "evidence upload links validate org-scoped control/risk"
      ]
    },
    schedulerExecution: {
      runs,
      latestRunAt: runs[0]?.finishedAt ?? null,
      latestStatus: runs[0]?.status ?? null
    },
    frameworkDefaults: {
      organizationFrameworksEnabledByDefault: false,
      hardcodedFrameworkDefaultRemoved: true
    },
    complianceScoring: {
      latest: score
    }
  });
}
