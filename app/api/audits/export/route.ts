import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { getDashboardStats, getFindings, getRecentScans } from "@/lib/data/queries";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const audit = await prisma.auditExport.create({
    data: {
      orgId: session.orgId,
      frameworkId: "GDPR",
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
