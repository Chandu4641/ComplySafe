export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { normalizeProvider, runIntegrationSync } from "@/backend/integrations/registry";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const provider = normalizeProvider(String(body.type ?? "AWS"));
  const result = await runIntegrationSync(provider, session.orgId);

  return NextResponse.json({ ok: true, provider, result });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
