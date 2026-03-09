export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/backend/db/client";
import { getSession } from "@/backend/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const integrations = await prisma.integration.findMany({
      where: { orgId: session.orgId },
      orderBy: { updatedAt: "desc" }
    });
    return NextResponse.json({ integrations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load integrations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
