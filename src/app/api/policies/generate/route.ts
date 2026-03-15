export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/backend/db/client";
import { getSession } from "@/backend/auth/session";
import { generatePolicyDraft } from "@/backend/policy-ai/generator";
import { reviewPolicyDraft } from "@/backend/policy-ai/review";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const frameworkKey = String(body.frameworkKey ?? "ISO27001").toUpperCase();
  const templateKey = String(body.templateKey ?? "access_control");

  const draft = generatePolicyDraft({
    orgName: session.org.name || "Organization",
    templateKey,
    frameworkKey
  });
  const review = reviewPolicyDraft(draft.content);

  const policy = await prisma.policy.create({
    data: {
      orgId: session.orgId,
      title: draft.title,
      status: "draft",
      version: 1,
      generatedFrom: draft.generatedFrom
    }
  });

  return NextResponse.json({
    policyId: policy.id,
    status: "generated",
    review,
    preview: draft.content
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
