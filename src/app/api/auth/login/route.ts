export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/backend/db/client";
import { createSession } from "@/backend/auth/session";
import { checkIpRateLimit, RATE_LIMITS } from "@/backend/security/rate-limit";

// Simple hash function for demo - use bcrypt in production
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function verifyPassword(password: string, storedHash: string): boolean {
  return hashPassword(password) === storedHash;
}

// Login request validation
interface LoginBody {
  email?: unknown;
  password?: unknown;
  orgName?: unknown;
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? 
               request.headers.get("x-real-ip") ?? 
               "unknown";
    
    // Check rate limit - 5 login attempts per minute per IP
    const rateLimit = checkIpRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 5,
      keyPrefix: "rl:login"
    });
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter ?? 60) } }
      );
    }
    
    const body: LoginBody = await request.json().catch(() => ({}));
    
    const emailInput = body.email;
    const passwordInput = body.password;
    const orgNameInput = body.orgName;
    
    // Validate email
    if (!emailInput || typeof emailInput !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    const email = emailInput.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    
    // Validate password
    if (!passwordInput || typeof passwordInput !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }
    
    if (passwordInput.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    
    // Validate org name
    if (!orgNameInput || typeof orgNameInput !== "string") {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }
    
    const orgName = orgNameInput.trim();
    if (orgName.length < 2) {
      return NextResponse.json({ error: "Company name must be at least 2 characters" }, { status: 400 });
    }

    // Find or create organization
    const org =
      (await prisma.organization.findFirst({ where: { name: orgName } })) ??
      (await prisma.organization.create({ data: { name: orgName } }));

    // Find existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    // If user exists, verify password
    if (existingUser) {
      const userWithPassword = existingUser as typeof existingUser & { passwordHash: string | null };
      
      if (!userWithPassword.passwordHash) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
      
      const isValidPassword = verifyPassword(passwordInput, userWithPassword.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
      
      // Check user belongs to the organization
      if (existingUser.orgId !== org.id) {
        return NextResponse.json(
          { error: "This email is already assigned to another organization" },
          { status: 403 }
        );
      }
      
      // Create session for existing user
      const sessionToken = await createSession(existingUser.id, org.id);
      if (!sessionToken) {
        console.error("Session creation failed for user:", email);
        return NextResponse.json({ error: "Failed to create session. Please try again." }, { status: 500 });
      }
      
      return NextResponse.json({ ok: true });
    }

    // Create new user with hashed password
    const passwordHash = hashPassword(passwordInput);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: passwordHash,
        role: "owner",
        orgId: org.id
      } as any
    });

    const sessionToken = await createSession(user.id, org.id);
    if (!sessionToken) {
      console.error("Session creation failed for user:", email);
      return NextResponse.json({ error: "Failed to create session. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
