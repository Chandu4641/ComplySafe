export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { getReadinessTrendSeries } from "@/backend/intelligence/service";

function parseDays(value: string | null) {
  const parsed = Number(value ?? "30");
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(180, Math.max(7, Math.round(parsed)));
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const days = parseDays(url.searchParams.get("days"));

  const trend = await getReadinessTrendSeries(session.orgId, days);
  return NextResponse.json({ trend });
}
