export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/rbac";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    assertAdmin(session);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const industry = String(body.industry ?? "");
  const region = String(body.region ?? "");
  const frameworksEnabled = String(body.frameworksEnabled ?? "");

  const org = await prisma.organization.update({
    where: { id: session.orgId },
    data: { industry, region, frameworksEnabled }
  });

  return NextResponse.json({ org });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
