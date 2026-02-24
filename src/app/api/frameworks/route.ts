export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { prisma } from "@/backend/db/client";
import { ensurePhase2FrameworkCatalogs } from "@/backend/frameworks/service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensurePhase2FrameworkCatalogs();

  const [frameworks, enabled] = await Promise.all([
    prisma.framework.findMany({ orderBy: { key: "asc" } }),
    prisma.organizationFramework.findMany({
      where: { organizationId: session.orgId },
      select: { frameworkId: true, enabled: true }
    })
  ]);

  const enabledMap = new Map(enabled.map((x: { frameworkId: string; enabled: boolean }) => [x.frameworkId, x.enabled]));
  return NextResponse.json({
    frameworks: frameworks.map((fw: { id: string }) => ({
      ...fw,
      enabled: enabledMap.get(fw.id) ?? false
    }))
  });
}
