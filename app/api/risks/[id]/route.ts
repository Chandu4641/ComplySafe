export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { updateRisk } from "@/lib/risk/service";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  try {
    const risk = await updateRisk({
      orgId: session.orgId,
      riskId: id,
      actorId: session.userId,
      frameworkId: body.frameworkId ? String(body.frameworkId) : undefined,
      patch: {
        title: body.title,
        description: body.description,
        likelihood: body.likelihood,
        impact: body.impact,
        residualRiskScore: body.residualRiskScore,
        status: body.status,
        owner: body.owner,
        acceptedReason: body.acceptedReason,
        nextReviewAt: body.nextReviewAt ? new Date(body.nextReviewAt) : undefined
      }
    });

    return NextResponse.json({ risk });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Risk update failed" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
