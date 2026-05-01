import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { checkoutLimiter } from "../middleware/rateLimit.js";
import { prisma } from "../db/postgres.js";
import { stripe } from "../services/stripe.js";
import { env } from "../config/env.js";

export const checkoutRouter = Router();

checkoutRouter.post("/", requireAuth, requireRole("BUYER", "ADMIN"), checkoutLimiter, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { clerkId: req.marketplaceAuth!.clerkId } });
  if (!user) return res.status(404).json({ message: "Buyer profile not found" });

  const cart = await prisma.cart.findFirst({ where: { buyerId: user.id }, include: { items: true } });
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });

  const total = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const order = await prisma.order.create({
    data: {
      buyerId: user.id,
      total,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          sellerId: item.sellerId,
          title: item.title,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
          price: item.price
        }))
      },
      payments: { create: { amount: total } },
      logs: { create: { event: "CHECKOUT_CREATED", actorId: req.marketplaceAuth!.clerkId } }
    },
    include: { items: true }
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: req.marketplaceAuth!.email,
    success_url: `${env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/cart`,
    metadata: { orderId: order.id },
    line_items: order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(Number(item.price) * 100),
        product_data: { name: item.title, images: item.imageUrl ? [item.imageUrl] : [] }
      }
    }))
  });

  await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  res.json({ checkoutUrl: session.url, orderId: order.id });
});
