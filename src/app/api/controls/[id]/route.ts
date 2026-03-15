export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { prisma } from "@/backend/db/client";
import { writeAuditLog } from "@/backend/audit/service";
import { calculateComplianceScore } from "@/backend/compliance/score";

// Valid status values for controls
const VALID_STATUSES = ["active", "inactive", "pending", "not_applicable"];

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

function isValidStatus(status: unknown): boolean {
  return typeof status === "string" && VALID_STATUSES.includes(status.toLowerCase());
}

function isValidDate(dateString: unknown): boolean {
  if (!dateString || typeof dateString !== "string") return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function isValidOwner(owner: unknown): boolean {
  return typeof owner === "string" && owner.trim().length > 0 && owner.trim().length <= 255;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  
  // Validate URL param is a valid UUID before querying database
  if (!isValidUUID(id)) {
    return NextResponse.json(
      { error: "Invalid control ID format. Must be a valid UUID" },
      { status: 400 }
    );
  }
  
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const current = await prisma.control.findFirst({
    where: { id, orgId: session.orgId }
  });
  if (!current) {
    return NextResponse.json({ error: "Control not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  
  // Validate status if provided
  if (body.status !== undefined && !isValidStatus(body.status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }
  
  // Validate owner if provided
  if (body.owner !== undefined && !isValidOwner(body.owner)) {
    return NextResponse.json(
      { error: "Invalid owner. Must be a non-empty string (max 255 characters)" },
      { status: 400 }
    );
  }
  
  // Validate reviewDate if provided
  if (body.reviewDate !== undefined && !isValidDate(body.reviewDate)) {
    return NextResponse.json(
      { error: "Invalid reviewDate. Must be a valid ISO date string" },
      { status: 400 }
    );
  }

  const next = await prisma.control.update({
    where: { id: current.id },
    data: {
      status: body.status ? body.status.toLowerCase() : current.status,
      owner: body.owner ?? current.owner,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : current.reviewDate
    }
  });

  await writeAuditLog({
    orgId: session.orgId,
    actorId: session.userId,
    action: "control.updated",
    targetType: "Control",
    targetId: next.id,
    before: current,
    after: next
  });

  await calculateComplianceScore(session.orgId, next.frameworkId);

  return NextResponse.json({ control: next });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
