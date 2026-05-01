import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db/postgres.js";

export const ordersRouter = Router();

ordersRouter.get("/mine", requireAuth, requireRole("BUYER", "ADMIN"), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { clerkId: req.marketplaceAuth!.clerkId } });
  if (!user) return res.json([]);
  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    include: { items: true, logs: true, payments: true },
    orderBy: { createdAt: "desc" }
  });
  res.json(orders);
});

ordersRouter.get("/seller", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const items = await prisma.orderItem.findMany({
    where: req.marketplaceAuth!.role === "ADMIN" ? {} : { sellerId: req.marketplaceAuth!.clerkId },
    include: { order: true },
    orderBy: { order: { createdAt: "desc" } }
  });
  res.json(items);
});

ordersRouter.get("/:id", requireAuth, async (req, res) => {
  const orderId = String(req.params.id);
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true, logs: true, buyer: true }
  });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (req.marketplaceAuth!.role !== "ADMIN" && order.buyer.clerkId !== req.marketplaceAuth!.clerkId) return res.status(403).json({ message: "Forbidden" });
  res.json(order);
});
