export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const current = await prisma.complianceRule.findFirst({
    where: { id, OR: [{ orgId: session.orgId }, { orgId: null }] }
  });
  if (!current || current.orgId === null) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  const rule = await prisma.complianceRule.update({
    where: { id: current.id },
    data: {
      framework: String(body.framework ?? "ISO27001"),
      requirement: String(body.requirement ?? ""),
      keywords: String(body.keywords ?? ""),
      severity: String(body.severity ?? "Medium"),
      enabled: Boolean(body.enabled ?? true)
    }
  });

  return NextResponse.json({ rule });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rule = await prisma.complianceRule.findFirst({
    where: { id, orgId: session.orgId }
  });
  if (!rule) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }
  await prisma.complianceRule.delete({ where: { id: rule.id } });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
