export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { runRiskDriftDetection } from "@/backend/monitoring/risk-drift";

function parseThreshold(value: string | null) {
  const parsed = Number(value ?? "3");
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(10, Math.max(1, Math.round(parsed)));
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const threshold = parseThreshold(url.searchParams.get("threshold"));

  const report = await runRiskDriftDetection(session.orgId, threshold);
  return NextResponse.json({ report });
}
