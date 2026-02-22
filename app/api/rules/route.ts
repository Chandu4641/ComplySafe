export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rules = await prisma.complianceRule.findMany({
    where: { OR: [{ orgId: session.orgId }, { orgId: null }] },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const rule = await prisma.complianceRule.create({
    data: {
      orgId: session.orgId,
      framework: String(body.framework ?? "ISO27001"),
      requirement: String(body.requirement ?? ""),
      keywords: String(body.keywords ?? ""),
      severity: String(body.severity ?? "Medium"),
      enabled: Boolean(body.enabled ?? true)
    }
  });
  return NextResponse.json({ rule });
}
