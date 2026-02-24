export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/backend/db/client";
import { getSession } from "@/backend/auth/session";
import { getDashboardStats, getFindings, getRecentScans } from "@/backend/data/queries";
import { getEnabledFrameworkForOrg } from "@/backend/frameworks/service";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const framework = await getEnabledFrameworkForOrg(session.orgId);
  if (!framework) {
    return NextResponse.json({ error: "No framework enabled for organization." }, { status: 400 });
  }

  const audit = await prisma.auditExport.create({
    data: {
      orgId: session.orgId,
      frameworkId: framework.id,
      status: "queued"
    }
  });
  const [stats, findings, scans] = await Promise.all([
    getDashboardStats(session.orgId),
    getFindings(session.orgId),
    getRecentScans(session.orgId)
  ]);

  return NextResponse.json({
    exportId: audit.id,
    status: "queued",
    report: {
      stats,
      findings,
      recentScans: scans
    }
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
