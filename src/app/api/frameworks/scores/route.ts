export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { prisma } from "@/backend/db/client";
import { calculateComplianceScore } from "@/backend/compliance/score";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const enabled = await prisma.organizationFramework.findMany({
    where: { organizationId: session.orgId, enabled: true },
    include: { framework: true }
  });

  const scores = [];
  for (const row of enabled) {
    const score = await calculateComplianceScore(session.orgId, row.frameworkId);
    scores.push({ framework: row.framework, score });
  }

  return NextResponse.json({ scores, count: scores.length });
}
