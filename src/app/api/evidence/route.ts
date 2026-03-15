import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { prisma } from "@/backend/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const evidence = await prisma.evidence.findMany({
    where: { orgId: session.orgId },
    include: { control: { select: { controlId: true } }, risk: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ evidence });
}
