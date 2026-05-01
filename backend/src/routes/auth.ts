import { Router } from "express";
import { clerkClient } from "@clerk/express";
import { z } from "zod";
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
  const currentRole = req.marketplaceAuth!.role;

  if (currentRole === "ADMIN" && body.role !== "ADMIN") {
    return res.json(req.marketplaceAuth);
  }

  if (body.role === "ADMIN" && (!email || !adminEmails.has(email))) {
    return res.status(403).json({ message: "Only allow-listed admin emails can become ADMIN" });
  }

  const user = await clerkClient.users.updateUserMetadata(req.marketplaceAuth!.clerkId, {
    publicMetadata: { role: body.role }
  });

  res.json({
    clerkId: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    name: user.fullName ?? undefined,
    role: normalizeRole(user.publicMetadata.role, user.emailAddresses[0]?.emailAddress)
  });
});
