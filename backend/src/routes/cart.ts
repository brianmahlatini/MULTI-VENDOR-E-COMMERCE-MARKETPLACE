import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db/postgres.js";
import { Product } from "../models/Product.js";

export const cartRouter = Router();

cartRouter.use(requireAuth, requireRole("BUYER"));

async function getOrCreateCart(userId: string, email?: string, name?: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { email: email ?? `${userId}@marketplace.local`, name }
  });
  return prisma.cart.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, buyerId: user.id },
    include: { items: true }
  });
}

cartRouter.get("/", async (req, res) => {
  const cart = await getOrCreateCart(req.marketplaceAuth!.userId, req.marketplaceAuth!.email, req.marketplaceAuth!.name);
  res.json(cart);
});

cartRouter.post("/items", async (req, res) => {
  const body = z.object({ productId: z.string(), quantity: z.number().int().min(1).max(50) }).parse(req.body);
  const product = await Product.findById(body.productId);
  if (!product || !product.active) return res.status(404).json({ message: "Product not found" });
  if (product.inventory < body.quantity) return res.status(409).json({ message: "Not enough inventory" });

  const cart = await getOrCreateCart(req.marketplaceAuth!.userId, req.marketplaceAuth!.email, req.marketplaceAuth!.name);
  const item = await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: body.productId } },
    update: { quantity: { increment: body.quantity } },
    create: {
      cartId: cart.id,
      productId: body.productId,
      sellerId: product.sellerId,
      quantity: body.quantity,
      price: product.price,
      title: product.title,
      imageUrl: product.imageUrls[0]
    }
  });
  res.status(201).json(item);
});

cartRouter.patch("/items/:id", async (req, res) => {
  const body = z.object({ quantity: z.number().int().min(1).max(50) }).parse(req.body);
  const cart = await getOrCreateCart(req.marketplaceAuth!.userId, req.marketplaceAuth!.email, req.marketplaceAuth!.name);
  const item = await prisma.cartItem.findFirst({ where: { id: req.params.id, cartId: cart.id } });
  if (!item) return res.status(404).json({ message: "Cart item not found" });
  const updatedItem = await prisma.cartItem.update({ where: { id: item.id }, data: body });
  res.json(updatedItem);
});

cartRouter.delete("/items/:id", async (req, res) => {
  const cart = await getOrCreateCart(req.marketplaceAuth!.userId, req.marketplaceAuth!.email, req.marketplaceAuth!.name);
  const item = await prisma.cartItem.findFirst({ where: { id: req.params.id, cartId: cart.id } });
  if (!item) return res.status(404).json({ message: "Cart item not found" });
  await prisma.cartItem.delete({ where: { id: item.id } });
  res.status(204).send();
});
