import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "crypto";
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { promisify } from "util";
import { z } from "zod";
import { prisma } from "../db/postgres.js";
import { createSession, parseRole, requireAuth, SESSION_COOKIE } from "../middleware/auth.js";

export const authRouter = Router();
const scryptAsync = promisify(scrypt);

const registerSchema = z.object({
  role: z.enum(["BUYER", "SELLER", "ADMIN"]),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128)
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1)
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json(req.marketplaceAuth);
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const email = body.email.trim().toLowerCase();
    const username = body.username.trim().toLowerCase();
    const requestedRole = parseRole(body.role)!;
    const passwordHash = await hashPassword(body.password);

    const user = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(87014001)`;

      const [userCount, existingUser] = await Promise.all([
        tx.user.count(),
        tx.user.findFirst({
          where: {
            OR: [{ email }, { username }]
          }
        })
      ]);

      if (existingUser) {
        throw new AccessError(409, "This username or email is already registered. Log in instead.");
      }

      const role = userCount === 0 ? "ADMIN" : requestedRole === "ADMIN" ? undefined : requestedRole;
      if (!role) {
        throw new AccessError(403, "Admin is already assigned. Register as buyer or seller.");
      }

      const id = randomUUID();
      return tx.user.create({
        data: {
          id,
          authId: id,
          email,
          username,
          name: username,
          passwordHash,
          role
        }
      });
    });

    setSessionCookie(res, user.id);
    res.status(201).json(toAuthResponse(user));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const identifier = body.identifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }]
      }
    });

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new AccessError(401, "Invalid username/email or password.");
    }

    setSessionCookie(res, user.id);
    res.json(toAuthResponse(user));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.status(204).send();
});

function setSessionCookie(res: Response, userId: string) {
  res.cookie(SESSION_COOKIE, createSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: "/"
  });
}

function toAuthResponse(user: { id: string; email: string; username: string; name: string | null; role: string }) {
  return {
    userId: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    role: user.role,
    assignedRole: user.role
  };
}

class AccessError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const key = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString("base64url")}`;
}

async function verifyPassword(password: string, passwordHash: string) {
  const [scheme, salt, storedKey] = passwordHash.split(":");
  if (scheme !== "scrypt" || !salt || !storedKey) return false;

  const key = (await scryptAsync(password, salt, 64)) as Buffer;
  const stored = Buffer.from(storedKey, "base64url");
  return key.length === stored.length && timingSafeEqual(key, stored);
}

authRouter.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AccessError) {
    return res.status(error.status).json({ message: error.message });
  }

  next(error);
});
