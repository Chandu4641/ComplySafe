export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { ensurePhase2FrameworkCatalogs } from "@/backend/frameworks/service";
import { prisma } from "@/backend/db/client";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensurePhase2FrameworkCatalogs();

  const [frameworks, orgFrameworks] = await Promise.all([
    prisma.framework.findMany({
      orderBy: { key: "asc" }
    }),
    prisma.organizationFramework.findMany({
      where: { organizationId: session.orgId },
      select: {
        frameworkId: true,
        enabled: true
      }
    })
  ]);

  const enabledMap = new Map<string, boolean>();
  for (const entry of orgFrameworks) {
    enabledMap.set(entry.frameworkId, entry.enabled);
  }

  const enrichedFrameworks = frameworks.map((fw) => ({
    ...fw,
    enabled: enabledMap.get(fw.id) ?? false
  }));

  return NextResponse.json({
    frameworks: enrichedFrameworks
  });
}
