import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { runIntegrationSync } from "@/lib/integrations/registry";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const type = String(body.type ?? "AWS");
  const result = await runIntegrationSync(type, session.orgId);

  return NextResponse.json({ ok: true, result });
}
