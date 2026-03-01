export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { getLatestControlHealth } from "@/backend/monitoring/control-health";

function parseLimit(value: string | null) {
  const parsed = Number(value ?? "100");
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(500, Math.max(10, Math.round(parsed)));
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));

  const snapshots = await getLatestControlHealth(session.orgId, limit);
  return NextResponse.json({ snapshots, count: snapshots.length, generatedAt: new Date().toISOString() });
}
