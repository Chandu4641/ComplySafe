import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  const rule = await prisma.complianceRule.update({
    where: { id: params.id },
    data: {
      framework: String(body.framework ?? "GDPR"),
      requirement: String(body.requirement ?? ""),
      keywords: String(body.keywords ?? ""),
      severity: String(body.severity ?? "Medium"),
      enabled: Boolean(body.enabled ?? true)
    }
  });

  return NextResponse.json({ rule });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.complianceRule.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
