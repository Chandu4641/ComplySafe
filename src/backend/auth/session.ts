import { cookies } from "next/headers";
import { prisma } from "../db/client";
import crypto from "crypto";

const SESSION_COOKIE = "cs_session";
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  (process.env.NODE_ENV === "production" && !process.env.NEXT_RUNTIME);

function buildSessionFallback() {
  return {
    id: "build-session",
    orgId: "build-org",
    userId: "build-user",
    token: "build-token",
    expiresAt: new Date(Date.now() + 60_000),
    user: { id: "build-user", role: "owner", orgId: "build-org", email: "build@local" },
    org: { id: "build-org", name: "Build Org" }
  } as any;
}

export async function createSession(userId: string, orgId: string) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  try {
    await prisma.session.create({
      data: { userId, orgId, token, expiresAt }
    });
  } catch {
    return null;
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: expiresAt
    });
  } catch {
    return null;
  }

  return token;
}

export async function destroySession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) {
      try {
        await prisma.session.delete({ where: { token } });
      } catch {
        // ignore
      }
    }
    cookieStore.delete(SESSION_COOKIE);
  } catch {
    // no request context
  }
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return isBuildPhase ? buildSessionFallback() : null;
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true, org: true }
    });
    if (!session) return isBuildPhase ? buildSessionFallback() : null;
    if (session.expiresAt < new Date()) return isBuildPhase ? buildSessionFallback() : null;
    return session;
  } catch {
    return isBuildPhase ? buildSessionFallback() : null;
  }
}
