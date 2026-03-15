export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/db/client";
import { getSession } from "@/backend/auth/session";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scan = await prisma.scan.findFirst({
    where: { id, orgId: session.orgId },
    include: { findings: true }
  });

  if (!scan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: scan.id,
    status: scan.status,
    findings: scan.findings.length
  });
}
