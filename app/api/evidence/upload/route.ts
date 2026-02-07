import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const evidence = await prisma.evidence.create({
    data: {
      orgId: session.orgId,
      controlId: "CC6.1",
      source: "manual",
      status: "collected"
    }
  });

  return NextResponse.json({ evidenceId: evidence.id, status: "stored" });
}
