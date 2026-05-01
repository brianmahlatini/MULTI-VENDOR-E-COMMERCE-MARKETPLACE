import { Router } from "express";
import { clerkClient } from "@clerk/express";
import { z } from "zod";
import { prisma } from "../db/postgres.js";
import { normalizeRole, requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json(req.marketplaceAuth);
});

authRouter.post("/role", requireAuth, async (req, res) => {
  const body = z.object({ role: z.enum(["BUYER", "SELLER", "ADMIN"]) }).parse(req.body);
  const email = req.marketplaceAuth?.email?.toLowerCase();
  const assignedRole = req.marketplaceAuth!.assignedRole;

  if (body.role === "ADMIN" && (!email || !adminEmails.has(email))) {
    return res.status(403).json({ message: "Only the approved admin email can use ADMIN access" });
  }

  if (req.marketplaceAuth!.role === "ADMIN" && body.role !== "ADMIN") {
    return res.status(409).json({
      message: "This approved admin email belongs to the admin account. Sign out and use a different account for buyer or seller access."
    });
  }

  if (assignedRole && assignedRole !== body.role) {
    return res.status(409).json({
      message: `This account is already a ${assignedRole} account. Sign out and use a different account for ${body.role}.`
    });
  }

  const user = await clerkClient.users.updateUserMetadata(req.marketplaceAuth!.clerkId, {
    publicMetadata: { role: body.role }
  });

  const nextRole = normalizeRole(user.publicMetadata.role, user.emailAddresses[0]?.emailAddress);

  await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {
      email: user.emailAddresses[0]?.emailAddress ?? `${user.id}@clerk.local`,
      name: user.fullName ?? undefined,
      role: nextRole
    },
    create: {
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? `${user.id}@clerk.local`,
      name: user.fullName ?? undefined,
      role: nextRole
    }
  });

  res.json({
    clerkId: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    name: user.fullName ?? undefined,
    role: nextRole,
    assignedRole: nextRole
  });
});
