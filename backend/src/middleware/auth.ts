import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export type AuthRole = "BUYER" | "SELLER" | "ADMIN";

declare global {
  namespace Express {
    interface Request {
      marketplaceAuth?: {
        clerkId: string;
        email?: string;
        name?: string;
        role: AuthRole;
        assignedRole?: AuthRole;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await clerkClient.users.getUser(auth.userId);
    const email = user.emailAddresses[0]?.emailAddress;
    const assignedRole = parseRole(user.publicMetadata.role);
    req.marketplaceAuth = {
      clerkId: user.id,
      email,
      name: user.fullName ?? undefined,
      role: normalizeRole(assignedRole, email),
      assignedRole
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function parseRole(role: unknown): AuthRole | undefined {
  return role === "ADMIN" || role === "SELLER" || role === "BUYER" ? role : undefined;
}

export function normalizeRole(role: unknown, email?: string): AuthRole {
  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );

  if (email && adminEmails.has(email.toLowerCase())) {
    return "ADMIN";
  }

  if (role === "ADMIN") {
    return "ADMIN";
  }

  return role === "SELLER" ? "SELLER" : "BUYER";
}

export function requireRole(...roles: AuthRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.marketplaceAuth) return res.status(401).json({ message: "Authentication required" });
    if (!roles.includes(req.marketplaceAuth.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
