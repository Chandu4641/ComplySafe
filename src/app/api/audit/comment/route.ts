export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { addAuditComment } from "@/backend/audit/collaboration";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const assignmentId = String(body.assignmentId ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!assignmentId) return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

  try {
    const comment = await addAuditComment({
      orgId: session.orgId,
      assignmentId,
      authorId: session.userId,
      message,
      parentCommentId: body.parentCommentId ? String(body.parentCommentId) : undefined
    });

    return NextResponse.json({ comment });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Comment creation failed" }, { status: 400 });
  }
}
