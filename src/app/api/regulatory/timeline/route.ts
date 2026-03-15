export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { getRegulatoryTimeline } from "@/backend/regulatory/timeline";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || "50");
  const timeline = await getRegulatoryTimeline(session.orgId, Number.isFinite(limit) ? limit : 50);

  return NextResponse.json({ timeline });
}
