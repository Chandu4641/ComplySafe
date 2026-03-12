export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { createAuditAssignment } from "@/backend/audit/collaboration";
import { prisma } from "@/backend/db/client";

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const assignedTo = String(body.assignedTo ?? "").trim();
  
  if (!assignedTo) {
    return NextResponse.json({ error: "assignedTo is required" }, { status: 400 });
  }

  // Validate assignedTo is a valid UUID
  if (!isValidUUID(assignedTo)) {
    return NextResponse.json(
      { error: "Invalid assignedTo. Must be a valid user ID (UUID format)" },
      { status: 400 }
    );
  }

  // Validate controlId if provided
  let controlId: string | undefined;
  if (body.controlId !== undefined) {
    controlId = String(body.controlId).trim();
    if (controlId && !isValidUUID(controlId)) {
      return NextResponse.json(
        { error: "Invalid controlId. Must be a valid UUID" },
        { status: 400 }
      );
    }
  }

  // Validate riskId if provided
  let riskId: string | undefined;
  if (body.riskId !== undefined) {
    riskId = String(body.riskId).trim();
    if (riskId && !isValidUUID(riskId)) {
      return NextResponse.json(
        { error: "Invalid riskId. Must be a valid UUID" },
        { status: 400 }
      );
    }
  }

  // Run all existence checks in parallel for better performance
  const [userExists, controlExists, riskExists] = await Promise.all([
    prisma.user.findFirst({
      where: { id: assignedTo, orgId: session.orgId },
      select: { id: true }
    }),
    controlId ? prisma.control.findFirst({
      where: { id: controlId, orgId: session.orgId },
      select: { id: true }
    }) : Promise.resolve(null),
    riskId ? prisma.risk.findFirst({
      where: { id: riskId, orgId: session.orgId },
      select: { id: true }
    }) : Promise.resolve(null)
  ]);

  if (!userExists) {
    return NextResponse.json(
      { error: "User not found. The assigned user does not exist in your organization." },
      { status: 404 }
    );
  }

  if (controlId && !controlExists) {
    return NextResponse.json(
      { error: "Control not found" },
      { status: 404 }
    );
  }

  if (riskId && !riskExists) {
    return NextResponse.json(
      { error: "Risk not found" },
      { status: 404 }
    );
  }

  try {
    const assignment = await createAuditAssignment({
      orgId: session.orgId,
      assignedTo,
      controlId: controlId,
      riskId: riskId,
      dueDate: body.dueDate ? new Date(String(body.dueDate)) : undefined
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Assignment creation failed" }, { status: 400 });
  }
}
