export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { addAuditComment, transitionAuditAssignment } from "@/backend/audit/collaboration";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const assignmentId = String(body.assignmentId ?? "").trim();
  const action = String(body.action ?? "").trim().toLowerCase();
  const message = String(body.message ?? "").trim();

  if (!assignmentId) return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });

  let nextStatus: "IN_REVIEW" | "APPROVED" | "REJECTED";
  if (action === "start_review") {
    nextStatus = "IN_REVIEW";
  } else if (action === "approve") {
    nextStatus = "APPROVED";
  } else if (action === "reject") {
    nextStatus = "REJECTED";
  } else {
    return NextResponse.json({ error: "action must be start_review, approve, or reject" }, { status: 400 });
  }

  try {
    const assignment = await transitionAuditAssignment({
      orgId: session.orgId,
      assignmentId,
      nextStatus
    });

    if (message) {
      await addAuditComment({
        orgId: session.orgId,
        assignmentId,
        authorId: session.userId,
        message
      });
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Assignment transition failed" }, { status: 400 });
  }
}
