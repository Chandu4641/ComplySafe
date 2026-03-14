export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/backend/db/client";
import { createSession } from "@/backend/auth/session";

// Email validation regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const emailInput = body.email ?? "";
    const orgName = String(body.orgName ?? "").trim();

    // Validate email format
    if (!emailInput || typeof emailInput !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    
    const email = emailInput.toLowerCase().trim();
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    if (!orgName) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
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

    const sessionToken = await createSession(user.id, org.id);
    if (!sessionToken) {
      console.error("Session creation failed for user:", email);
      return NextResponse.json({ error: "Failed to create session. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `An unexpected error occurred: ${errorMessage}` }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
