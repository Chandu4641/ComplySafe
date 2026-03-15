export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { getCopilotRecommendations } from "@/backend/copilot/service";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? undefined;

  const report = await getCopilotRecommendations(session.orgId, { category });
  return NextResponse.json({ report });
}
