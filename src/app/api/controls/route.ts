export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { prisma } from "@/backend/db/client";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const frameworkId = url.searchParams.get("frameworkId");

  const controls = await prisma.control.findMany({
    where: {
      orgId: session.orgId,
      ...(frameworkId ? { frameworkId } : {})
    },
    orderBy: { controlId: "asc" }
  });

  return NextResponse.json({ controls });
}
