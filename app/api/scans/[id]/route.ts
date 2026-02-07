import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scan = await prisma.scan.findFirst({
    where: { id: params.id, orgId: session.orgId },
    include: { findings: true }
  });

  if (!scan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: scan.id,
    status: scan.status,
    findings: scan.findings.length
  });
}
