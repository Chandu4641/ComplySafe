export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { runControlHealthMonitoring } from "@/backend/monitoring/control-health";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await runControlHealthMonitoring(session.orgId);
  return NextResponse.json({ status: "ok", result });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Use POST to execute control health run" });
}
