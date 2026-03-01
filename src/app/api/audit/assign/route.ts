export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { createAuditAssignment } from "@/backend/audit/collaboration";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const assignedTo = String(body.assignedTo ?? "").trim();
  if (!assignedTo) return NextResponse.json({ error: "assignedTo is required" }, { status: 400 });

  try {
    const assignment = await createAuditAssignment({
      orgId: session.orgId,
      assignedTo,
      controlId: body.controlId ? String(body.controlId) : undefined,
      riskId: body.riskId ? String(body.riskId) : undefined,
      dueDate: body.dueDate ? new Date(String(body.dueDate)) : undefined
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Assignment creation failed" }, { status: 400 });
  }
}
