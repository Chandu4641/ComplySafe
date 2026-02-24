export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { prisma } from "@/backend/db/client";
import { createRisk } from "@/backend/risk/service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const risks = await prisma.risk.findMany({
    where: { orgId: session.orgId },
    orderBy: { updatedAt: "desc" }
  });

  return NextResponse.json({ risks });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const likelihood = Number(body.likelihood ?? 3);
  const impact = Number(body.impact ?? 3);
  const frameworkId = body.frameworkId ? String(body.frameworkId) : undefined;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const risk = await createRisk({
    orgId: session.orgId,
    actorId: session.userId,
    frameworkId,
    assetId: body.assetId ? String(body.assetId) : undefined,
    title,
    description: body.description ? String(body.description) : undefined,
    likelihood,
    impact
  });

  return NextResponse.json({ risk });
}
