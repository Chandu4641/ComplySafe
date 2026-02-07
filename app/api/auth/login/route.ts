import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").toLowerCase();
  const orgName = String(body.orgName ?? "");

  if (!email || !orgName) {
    return NextResponse.json({ error: "Email and company are required." }, { status: 400 });
  }

  const org =
    (await prisma.organization.findFirst({ where: { name: orgName } })) ??
    (await prisma.organization.create({ data: { name: orgName } }));

  const user =
    (await prisma.user.findUnique({ where: { email } })) ??
    (await prisma.user.create({
      data: {
        email,
        role: "owner",
        orgId: org.id
      }
    }));

  await createSession(user.id, org.id);

  return NextResponse.json({ ok: true });
}
