export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { generateCopilotExplanation } from "@/backend/copilot/engine";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const query = String(body.query ?? "").trim();
  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });

  const result = await generateCopilotExplanation({ orgId: session.orgId, query });
  return NextResponse.json({ result });
}
