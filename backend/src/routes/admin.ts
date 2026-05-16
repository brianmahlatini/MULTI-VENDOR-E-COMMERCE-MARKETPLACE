import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db/postgres.js";
import { Product } from "../models/Product.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/dashboard", async (_req, res) => {
  const [userCount, productCount, users, orders, products, logs] = await Promise.all([
    prisma.user.count(),
    Product.countDocuments({ active: true }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      take: 20
    }),
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    Product.find({ active: true }).sort({ createdAt: -1 }).limit(20).select("title category inventory price createdAt").lean(),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 })
  ]);

  res.json({
    metrics: {
      users: userCount,
      activeProducts: productCount,
      orders: orders.length,
      revenue: orders.reduce((sum, order) => sum + Number(order.total), 0)
    },
    users,
    products,
    orders,
    logs
  });
});
