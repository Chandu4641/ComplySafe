export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/lib/audit/service";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const current = await prisma.evidence.findFirst({
    where: { id, orgId: session.orgId }
  });
  if (!current) return NextResponse.json({ error: "Evidence not found" }, { status: 404 });

  const next = await prisma.evidence.update({
    where: { id: current.id },
    data: { downloadCount: { increment: 1 } }
  });

  await writeAuditLog({
    orgId: session.orgId,
    actorId: session.userId,
    action: "evidence.downloaded",
    targetType: "Evidence",
    targetId: next.id,
    before: current,
    after: next
  });

  return NextResponse.json({ evidenceId: next.id, downloads: next.downloadCount });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
