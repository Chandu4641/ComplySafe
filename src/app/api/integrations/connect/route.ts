export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/backend/db/client";
import { getSession } from "@/backend/auth/session";
import { normalizeProvider } from "@/backend/integrations/registry";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const type = normalizeProvider(String(body.type ?? "AWS"));

  const integration = await prisma.integration.upsert({
    where: {
      orgId_type: {
        orgId: session.orgId,
        type
      }
    },
    update: {
      provider: type,
      status: "connected",
      metadata: {
        connectedVia: "manual_connect_api"
      },
      lastSync: new Date()
    },
    create: {
      orgId: session.orgId,
      type,
      provider: type,
      status: "connected",
      metadata: {
        connectedVia: "manual_connect_api"
      },
      lastSync: new Date()
    }
  });

  return NextResponse.json({ ok: true, integration });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
