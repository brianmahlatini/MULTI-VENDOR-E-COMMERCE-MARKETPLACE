import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db/postgres.js";
import { Product } from "../models/Product.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/dashboard", async (_req, res) => {
  const [users, orders, products, logs] = await Promise.all([
    prisma.user.count(),
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    Product.countDocuments({ active: true }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 })
  ]);

  res.json({
    metrics: {
      users,
      activeProducts: products,
      orders: orders.length,
      revenue: orders.reduce((sum, order) => sum + Number(order.total), 0)
    },
    orders,
    logs
  });
});
