import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const policy = await prisma.policy.create({
    data: {
      orgId: session.orgId,
      title: "Access Control Policy",
      status: "draft",
      version: 1,
      generatedFrom: "GDPR:Art.32"
    }
  });

  return NextResponse.json({ policyId: policy.id, status: "generated" });
}
