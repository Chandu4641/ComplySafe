import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_RULES } from "@/lib/scanner/compliance";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.complianceRule.count({ where: { orgId: session.orgId } });
  if (existing > 0) {
    return NextResponse.json({ ok: true, message: "Rules already exist." });
  }

  await prisma.complianceRule.createMany({
    data: DEFAULT_RULES.map((r) => ({
      orgId: session.orgId,
      framework: r.framework,
      requirement: r.requirement,
      keywords: r.keywords.join(", "),
      severity: r.severity,
      enabled: true
    }))
  });

  return NextResponse.json({ ok: true, created: DEFAULT_RULES.length });
}
