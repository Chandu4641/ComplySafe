export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { linkRiskToControl } from "@/lib/risk/service";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const riskId = String(body.riskId ?? "").trim();
  const controlId = String(body.controlId ?? "").trim();
  if (!riskId || !controlId) {
    return NextResponse.json({ error: "riskId and controlId are required" }, { status: 400 });
  }

  const link = await linkRiskToControl({
    orgId: session.orgId,
    riskId,
    controlId,
    actorId: session.userId
  });

  return NextResponse.json({ link });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
