import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { runMockScan } from "@/lib/scanner";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scan = await prisma.scan.create({
    data: { orgId: session.orgId, type: "baseline", status: "running" }
  });

  const findings = runMockScan();
  await prisma.finding.createMany({
    data: findings.map((f) => ({
      scanId: scan.id,
      controlId: f.controlId,
      severity: f.severity,
      status: f.status,
      summary: f.summary
    }))
  });

  await prisma.scan.update({ where: { id: scan.id }, data: { status: "complete" } });

  return NextResponse.json({ scanId: scan.id, status: "complete", findings: findings.length });
}
