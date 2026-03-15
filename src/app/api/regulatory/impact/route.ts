export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { getRegulatoryImpactReport } from "@/backend/regulatory/service";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const framework = url.searchParams.get("framework") ?? undefined;
  const controlId = url.searchParams.get("controlId") ?? undefined;

  const report = await getRegulatoryImpactReport(session.orgId, { framework, controlId });
  return NextResponse.json({ report });
}
