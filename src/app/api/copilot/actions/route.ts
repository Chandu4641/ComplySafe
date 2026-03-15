export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { executeCopilotAction, type CopilotRecommendation } from "@/backend/copilot/service";

type ActionRequest = {
  approved?: boolean;
  recommendationId?: string;
  action?: CopilotRecommendation["suggestedAction"];
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ActionRequest;
  if (!body.action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }
  if (!body.action.targetId) {
    return NextResponse.json({ error: "action.targetId is required" }, { status: 400 });
  }
  if (!body.action.justification) {
    return NextResponse.json({ error: "action.justification is required" }, { status: 400 });
  }

  const result = await executeCopilotAction({
    orgId: session.orgId,
    actorId: session.userId,
    action: body.action,
    approved: Boolean(body.approved),
    recommendationId: body.recommendationId
  });
  return NextResponse.json({ result });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Use POST to execute copilot actions" });
}
