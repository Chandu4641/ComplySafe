export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { prisma } from "@/backend/db/client";
import { writeAuditLog } from "@/backend/audit/service";
import { calculateComplianceScore } from "@/backend/compliance/score";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const current = await prisma.control.findFirst({
    where: { id, orgId: session.orgId }
  });
  if (!current) {
    return NextResponse.json({ error: "Control not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const next = await prisma.control.update({
    where: { id: current.id },
    data: {
      status: body.status ?? current.status,
      owner: body.owner ?? current.owner,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : current.reviewDate
    }
  });

  await writeAuditLog({
    orgId: session.orgId,
    actorId: session.userId,
    action: "control.updated",
    targetType: "Control",
    targetId: next.id,
    before: current,
    after: next
  });

  await calculateComplianceScore(session.orgId, next.frameworkId);

  return NextResponse.json({ control: next });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
