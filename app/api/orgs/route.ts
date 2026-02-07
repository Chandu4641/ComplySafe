import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const industry = String(body.industry ?? "");
  const region = String(body.region ?? "");
  const frameworksEnabled = String(body.frameworksEnabled ?? "GDPR");

  const org = await prisma.organization.update({
    where: { id: session.orgId },
    data: { industry, region, frameworksEnabled }
  });

  return NextResponse.json({ org });
}
