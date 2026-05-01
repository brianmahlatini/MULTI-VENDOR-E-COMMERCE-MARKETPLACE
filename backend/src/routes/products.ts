import { Router } from "express";
import { clerkMiddleware } from "@clerk/express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { bustProductCache, getCachedJson, setCachedJson } from "../services/cache.js";
import { createUploadUrl } from "../services/storage.js";

export const productsRouter = Router();

const productSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  category: z.string().min(2),
  price: z.number().positive(),
  inventory: z.number().int().min(0),
  imageUrls: z.array(z.string().url()).min(1)
});

productsRouter.get("/", async (req, res) => {
  const query = z
    .object({
      q: z.string().optional(),
      category: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(48).default(12)
    })
    .parse(req.query);

  const cacheKey = `products:${JSON.stringify(query)}`;
  const cached = await getCachedJson(cacheKey);
  if (cached) return res.json(cached);

  const filter: Record<string, unknown> = { active: true };
  if (query.category) filter.category = query.category;
  if (query.q) filter.$text = { $search: query.q };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Product.countDocuments(filter)
  ]);

  const payload = { items, total, page: query.page, pages: Math.ceil(total / query.limit) };
  await setCachedJson(cacheKey, payload, 45);
  res.json(payload);
});

productsRouter.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product || !product.active) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

productsRouter.post("/", clerkMiddleware(), requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const body = productSchema.parse(req.body);
  const product = await Product.create({ ...body, sellerId: req.marketplaceAuth!.clerkId });
  await bustProductCache();
  res.status(201).json(product);
});

productsRouter.patch("/:id", clerkMiddleware(), requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const body = productSchema.partial().parse(req.body);
  const filter = req.marketplaceAuth!.role === "ADMIN" ? { _id: req.params.id } : { _id: req.params.id, sellerId: req.marketplaceAuth!.clerkId };
  const product = await Product.findOneAndUpdate(filter, body, { new: true });
  if (!product) return res.status(404).json({ message: "Product not found" });
  await bustProductCache();
  res.json(product);
});

productsRouter.delete("/:id", clerkMiddleware(), requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const filter = req.marketplaceAuth!.role === "ADMIN" ? { _id: req.params.id } : { _id: req.params.id, sellerId: req.marketplaceAuth!.clerkId };
  const product = await Product.findOneAndUpdate(filter, { active: false }, { new: true });
  if (!product) return res.status(404).json({ message: "Product not found" });
  await bustProductCache();
  res.status(204).send();
});

productsRouter.post("/:id/reviews", clerkMiddleware(), requireAuth, async (req, res) => {
  const body = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().min(3).max(1200) }).parse(req.body);
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $push: { reviews: { ...body, buyerId: req.marketplaceAuth!.clerkId, buyerName: req.marketplaceAuth!.name ?? "Customer" } } },
    { new: true }
  );
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.status(201).json(product);
});

productsRouter.post("/uploads/sign", clerkMiddleware(), requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const body = z.object({ fileName: z.string().min(1), contentType: z.string().min(1) }).parse(req.body);
  const key = `products/${req.marketplaceAuth!.clerkId}/${Date.now()}-${body.fileName}`;
  res.json(await createUploadUrl(key, body.contentType));
});
