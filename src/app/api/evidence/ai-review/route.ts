export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { prisma } from "@/backend/db/client";
import { validateEvidenceWithAi } from "@/backend/evidence-ai/validator";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const evidenceId = String(body.evidenceId ?? "").trim();
  if (!evidenceId) return NextResponse.json({ error: "evidenceId is required" }, { status: 400 });

  const evidence = await prisma.evidence.findFirst({ where: { id: evidenceId, orgId: session.orgId } });
  if (!evidence) return NextResponse.json({ error: "Evidence not found" }, { status: 404 });

  const review = validateEvidenceWithAi({
    source: evidence.source,
    fileRef: evidence.fileRef,
    uploadedAt: evidence.uploadedAt
  });

  return NextResponse.json({ evidenceId, review });
}
