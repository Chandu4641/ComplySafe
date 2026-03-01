export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { prisma } from "@/backend/db/client";
import { ensurePhase2FrameworkCatalogs } from "@/backend/frameworks/service";

export async function GET(): Promise<NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Ensure framework catalogs are seeded
  await ensurePhase2FrameworkCatalogs();

  // Fetch frameworks + org enablement in parallel
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

  // Build lookup map
  const enabledMap = new Map<string, boolean>();
  for (const entry of orgFrameworks) {
    enabledMap.set(entry.frameworkId, entry.enabled);
  }

  // Attach enablement flag
  const enrichedFrameworks = frameworks.map((fw) => ({
    ...fw,
    enabled: enabledMap.get(fw.id) ?? false
  }));

  return NextResponse.json({
    frameworks: enrichedFrameworks
  });
}
