export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/backend/db/client";
import { getSession } from "@/backend/auth/session";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const policy = await prisma.policy.create({
    data: {
      orgId: session.orgId,
      title: "Access Control Policy",
      status: "draft",
      version: 1,
      generatedFrom: "ISO27001:A.5.15"
    }
  });

  return NextResponse.json({ policyId: policy.id, status: "generated" });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
