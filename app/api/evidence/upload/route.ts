import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/service";
import { calculateComplianceScore } from "@/lib/compliance/score";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const controlId = body.controlId ? String(body.controlId).trim() : "";
  const riskId = body.riskId ? String(body.riskId).trim() : "";

  if (!controlId && !riskId) {
    return NextResponse.json({ error: "controlId or riskId is required." }, { status: 400 });
  }

  let control = null;
  if (controlId) {
    control = await prisma.control.findFirst({
      where: { id: controlId, orgId: session.orgId }
    });
    if (!control) return NextResponse.json({ error: "Control not found." }, { status: 404 });
  }

  if (riskId) {
    const risk = await prisma.risk.findFirst({
      where: { id: riskId, orgId: session.orgId }
    });
    if (!risk) return NextResponse.json({ error: "Risk not found." }, { status: 404 });
  }

  const evidence = await prisma.evidence.create({
    data: {
      orgId: session.orgId,
      controlId: control?.id ?? null,
      riskId: riskId || null,
      source: String(body.source ?? "manual"),
      fileRef: body.fileRef ? String(body.fileRef) : null,
      uploadedBy: session.userId,
      status: "VALID",
      version: Number(body.version ?? 1),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      reviewFrequency: body.reviewFrequency ?? "QUARTERLY",
      lastReviewedAt: new Date()
    }
  });

  await writeAuditLog({
    orgId: session.orgId,
    actorId: session.userId,
    action: "evidence.created",
    targetType: "Evidence",
    targetId: evidence.id,
    after: evidence
  });

  if (control?.frameworkId) {
    await calculateComplianceScore(session.orgId, control.frameworkId);
  }

  return NextResponse.json({ evidenceId: evidence.id, status: "stored" });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
