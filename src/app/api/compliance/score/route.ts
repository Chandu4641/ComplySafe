export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { calculateComplianceScore } from "@/backend/compliance/score";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const frameworkId = String(body.frameworkId ?? "").trim();
  if (!frameworkId) {
    return NextResponse.json({ error: "frameworkId is required" }, { status: 400 });
  }

  const score = await calculateComplianceScore(session.orgId, frameworkId);
  return NextResponse.json({ score });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
