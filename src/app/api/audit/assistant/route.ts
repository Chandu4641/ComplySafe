export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { runAuditAssistant } from "@/backend/audit-ai/assistant";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const question = body.question ? String(body.question) : undefined;

  const result = await runAuditAssistant({ orgId: session.orgId, question });
  return NextResponse.json({ result });
}
