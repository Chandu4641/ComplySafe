import { cookies } from "next/headers";
import { prisma } from "../db/client";
import crypto from "crypto";

const SESSION_COOKIE = "cs_session";

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

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });

  return token;
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await prisma.session.delete({ where: { token } });
    } catch {
      // ignore
    }
  }
  cookies().delete(SESSION_COOKIE);
}

export async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true, org: true }
    });
    if (!session) return null;
    if (session.expiresAt < new Date()) return null;
    return session;
  } catch {
    return null;
  }
}
