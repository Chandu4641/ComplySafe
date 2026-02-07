import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const type = String(body.type ?? "Custom");

  const integration = await prisma.integration.create({
    data: {
      orgId: session.orgId,
      type,
      status: "connected",
      lastSync: new Date()
    }
  });

  return NextResponse.json({ ok: true, integration });
}
