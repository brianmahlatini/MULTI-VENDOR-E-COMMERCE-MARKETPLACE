import { Router, raw } from "express";
import { env } from "../config/env.js";
import { prisma } from "../db/postgres.js";
import { orderQueue } from "../jobs/queues.js";
import { stripe } from "../services/stripe.js";

export const webhooksRouter = Router();

webhooksRouter.post("/stripe", raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) return res.status(400).send("Missing signature");

  const event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    const sellerClerkId = session.metadata?.sellerClerkId;

    if (orderId) {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          payments: {
            updateMany: {
              where: { orderId },
              data: { status: "SUCCEEDED", stripePaymentIntentId: session.payment_intent?.toString() }
            }
          },
          logs: { create: { event: "STRIPE_PAYMENT_CONFIRMED", metadata: { sessionId: session.id } } }
        }
      });
      await orderQueue.add("process-paid-order", { orderId: order.id });
    }

    if (sellerClerkId && session.subscription && session.customer) {
      await prisma.sellerSubscription.upsert({
        where: { sellerClerkId },
        update: {
          active: true,
          stripeSubscriptionId: session.subscription.toString(),
          stripeCustomerId: session.customer.toString()
        },
        create: {
          sellerClerkId,
          active: true,
          stripeSubscriptionId: session.subscription.toString(),
          stripeCustomerId: session.customer.toString()
        }
      });
    }
  }

  res.json({ received: true });
});
