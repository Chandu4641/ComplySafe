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

  const current = await prisma.evidence.findFirst({
    where: { id, orgId: session.orgId },
    include: { control: true }
  });
  if (!current) return NextResponse.json({ error: "Evidence not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const next = await prisma.evidence.update({
    where: { id: current.id },
    data: {
      status: body.status ?? current.status,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : current.expiresAt,
      reviewFrequency: body.reviewFrequency ?? current.reviewFrequency,
      lastReviewedAt: new Date(),
      fileRef: body.fileRef ?? current.fileRef,
      source: body.source ?? current.source,
      version: body.version ?? current.version
    },
    include: { control: true }
  });

  await writeAuditLog({
    orgId: session.orgId,
    actorId: session.userId,
    action: "evidence.updated",
    targetType: "Evidence",
    targetId: next.id,
    before: current,
    after: next
  });

  if (next.control?.frameworkId) {
    await calculateComplianceScore(session.orgId, next.control.frameworkId);
  }

  return NextResponse.json({ evidence: next });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
