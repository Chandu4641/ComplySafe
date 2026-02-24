export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { activateFrameworkForOrganization, ensureIsoFrameworkCatalog } from "@/backend/frameworks/service";
import { calculateComplianceScore } from "@/backend/compliance/score";
import { assertAdmin } from "@/backend/auth/rbac";

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

  await ensureIsoFrameworkCatalog();

  const body = await request.json().catch(() => ({}));
  const frameworkKey = String(body.frameworkKey ?? "").trim();
  if (!frameworkKey) {
    return NextResponse.json({ error: "frameworkKey is required" }, { status: 400 });
  }

  try {
    const framework = await activateFrameworkForOrganization(session.orgId, frameworkKey);
    const score = await calculateComplianceScore(session.orgId, framework.id);
    return NextResponse.json({ framework, score, status: "activated" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Activation failed" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
