export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const controlRefs = findings.map((f: any) => f.controlId);
  const controls = await prisma.control.findMany({
    where: { orgId: session.orgId, controlId: { in: controlRefs } },
    select: { id: true, controlId: true }
  });
  const controlMap = new Map(controls.map((c: { controlId: string; id: string }) => [c.controlId, c.id]));

  await prisma.finding.createMany({
    data: findings.map((f) => ({
      scanId: scan.id,
      controlId: controlMap.get(f.controlId) ?? null,
      severity: f.severity,
      status: f.status,
      summary: f.summary
    }))
  });

  await prisma.scan.update({ where: { id: scan.id }, data: { status: "complete" } });

  return NextResponse.json({ scanId: scan.id, status: "complete", findings: findings.length });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
