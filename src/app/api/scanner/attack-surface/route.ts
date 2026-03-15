export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/backend/db/client";
import { getSession } from "@/backend/auth/session";
import { runAttackSurfaceScan } from "@/backend/scanner/report";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const target = String(body.target ?? "").trim();
  if (!target) {
    return NextResponse.json({ error: "target is required" }, { status: 400 });
  }

  const report = await runAttackSurfaceScan(target);

  const scan = await prisma.scan.create({
    data: {
      orgId: session.orgId,
      type: "attack_surface",
      status: "complete",
      sourceType: "url",
      sourceUrl: target,
      sourceName: target,
      riskLevel: report.riskLevel,
      riskScore: report.findings.filter((item) => item.status === "fail").length
    }
  });

  const failingFindings = report.findings.filter((item) => item.status === "fail");

  if (failingFindings.length > 0) {
    await prisma.finding.createMany({
      data: failingFindings.map((item) => ({
          scanId: scan.id,
          controlId: null,
          severity: item.severity,
          status: "Open",
          summary: `${item.title}: ${item.detail}`,
          remediation: "Review scanner output and enforce hardened baseline settings."
        }))
    });
  }

  return NextResponse.json({
    scanId: scan.id,
    riskLevel: report.riskLevel,
    findingsCreated: failingFindings.length,
    checks: report.checks
  });
}
