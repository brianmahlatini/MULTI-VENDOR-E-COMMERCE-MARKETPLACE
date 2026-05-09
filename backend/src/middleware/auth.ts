import { createHmac, timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/postgres.js";

export type AuthRole = "BUYER" | "SELLER" | "ADMIN";
export const SESSION_COOKIE = "marketplace_session";

declare global {
  namespace Express {
    interface Request {
      marketplaceAuth?: {
        userId: string;
        email?: string;
        username?: string;
        name?: string;
        role: AuthRole;
        assignedRole?: AuthRole;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = verifySession(readCookie(req.headers.cookie, SESSION_COOKIE));
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    req.marketplaceAuth = {
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name ?? undefined,
      role: user.role,
      assignedRole: user.role
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function parseRole(role: unknown): AuthRole | undefined {
  return role === "ADMIN" || role === "SELLER" || role === "BUYER" ? role : undefined;
}

export function requireRole(...roles: AuthRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.marketplaceAuth) return res.status(401).json({ message: "Authentication required" });
    if (!roles.includes(req.marketplaceAuth.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

export function createSession(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7
    })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifySession(value?: string) {
  if (!value) return undefined;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return undefined;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; exp?: number };
    if (!data.sub || !data.exp || data.exp < Date.now()) return undefined;
    return data.sub;
  } catch {
    return undefined;
  }
}

function sign(payload: string) {
  return createHmac("sha256", process.env.AUTH_SECRET || process.env.STRIPE_SECRET_KEY || "marketplace-dev-session-secret")
    .update(payload)
    .digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function readCookie(cookieHeader: string | undefined, name: string) {
  return cookieHeader
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
