export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/backend/db/client";
import { createSession } from "@/backend/auth/session";

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

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail && existingByEmail.orgId !== org.id) {
    return NextResponse.json(
      { error: "This email is already assigned to another organization." },
      { status: 403 }
    );
  }

  const user =
    existingByEmail ??
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

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
