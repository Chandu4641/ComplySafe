export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { getMonitoringDashboard } from "@/backend/dashboard/service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getMonitoringDashboard(session.orgId);
  return NextResponse.json({ data });
}
