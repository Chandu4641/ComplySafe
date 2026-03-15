export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { buildFrameworkCoverageReport } from "@/backend/reporting/frameworkCoverage";
import { ensurePhase2FrameworkCatalogs } from "@/backend/frameworks/service";
import { calculateComplianceScore } from "@/backend/compliance/score";
import { prisma } from "@/backend/db/client";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensurePhase2FrameworkCatalogs();

  const enabled = await prisma.organizationFramework.findMany({
    where: { organizationId: session.orgId, enabled: true },
    select: { frameworkId: true }
  });

  for (const item of enabled) {
    await calculateComplianceScore(session.orgId, item.frameworkId);
  }

  const report = await buildFrameworkCoverageReport(session.orgId);
  return NextResponse.json({ report });
}
