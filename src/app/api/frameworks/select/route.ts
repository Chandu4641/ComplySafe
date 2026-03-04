export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { activateFrameworkForOrganization, ensurePhase2FrameworkCatalogs } from "@/backend/frameworks/service";
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

  await ensurePhase2FrameworkCatalogs();

  const body = await request.json().catch(() => ({}));
  const frameworkKeysInput = Array.isArray(body.frameworkKeys)
    ? body.frameworkKeys
    : [body.frameworkKey];
  const frameworkKeys = frameworkKeysInput
    .map((key: unknown) => String(key ?? "").trim().toUpperCase())
    .filter(Boolean);

  if (!frameworkKeys.length) {
    return NextResponse.json({ error: "frameworkKey or frameworkKeys[] is required" }, { status: 400 });
  }

  try {
    const activated = [];
    for (const key of frameworkKeys) {
      const framework = await activateFrameworkForOrganization(session.orgId, key);
      const score = await calculateComplianceScore(session.orgId, framework.id);
      activated.push({ framework, score });
    }
    return NextResponse.json({ activated, status: "activated" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Activation failed" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
