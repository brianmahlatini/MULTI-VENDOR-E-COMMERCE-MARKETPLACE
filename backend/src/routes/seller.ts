import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db/postgres.js";
import { Product } from "../models/Product.js";
import { stripe } from "../services/stripe.js";
import { env } from "../config/env.js";

export const sellerRouter = Router();

sellerRouter.use(requireAuth, requireRole("SELLER", "ADMIN"));

sellerRouter.get("/dashboard", async (req, res) => {
  const sellerId = req.marketplaceAuth!.clerkId;
  const [products, orderItems] = await Promise.all([
    Product.find({ sellerId, active: true }).sort({ createdAt: -1 }),
    prisma.orderItem.findMany({ where: { sellerId }, include: { order: true } })
  ]);

  const revenue = orderItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  res.json({
    products,
    metrics: {
      products: products.length,
      orders: new Set(orderItems.map((item) => item.orderId)).size,
      unitsSold: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      revenue
    },
    recentOrders: orderItems.slice(0, 20)
  });
});

sellerRouter.post("/connect-account", async (req, res) => {
  const account = await stripe.accounts.create({
    type: "express",
    email: req.marketplaceAuth!.email,
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true }
    }
  });

  await prisma.user.upsert({
    where: { clerkId: req.marketplaceAuth!.clerkId },
    update: { stripeAccountId: account.id },
    create: {
      clerkId: req.marketplaceAuth!.clerkId,
      email: req.marketplaceAuth!.email ?? `${req.marketplaceAuth!.clerkId}@clerk.local`,
      name: req.marketplaceAuth!.name,
      role: "SELLER",
      stripeAccountId: account.id
    }
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${env.FRONTEND_URL}/seller`,
    return_url: `${env.FRONTEND_URL}/seller`,
    type: "account_onboarding"
  });

  res.json({ url: link.url });
});

sellerRouter.post("/subscription", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: req.marketplaceAuth!.email,
    success_url: `${env.FRONTEND_URL}/seller?subscription=success`,
    cancel_url: `${env.FRONTEND_URL}/seller?subscription=cancelled`,
    line_items: [{ price: env.STRIPE_SELLER_SUBSCRIPTION_PRICE_ID, quantity: 1 }],
    metadata: { sellerClerkId: req.marketplaceAuth!.clerkId }
  });

  res.json({ checkoutUrl: session.url });
});
