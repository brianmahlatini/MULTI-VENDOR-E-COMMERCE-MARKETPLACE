import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { clerkMiddleware } from "@clerk/express";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { cartRouter } from "./routes/cart.js";
import { checkoutRouter } from "./routes/checkout.js";
import { ordersRouter } from "./routes/orders.js";
import { productsRouter } from "./routes/products.js";
import { sellerRouter } from "./routes/seller.js";
import { webhooksRouter } from "./routes/webhooks.js";

export const app = express();

app.use("/api/webhooks", webhooksRouter);
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(compression());
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/billing", webhooksRouter);
app.use("/api/products", productsRouter);
app.use("/api/auth", clerkMiddleware(), authRouter);
app.use("/api/cart", clerkMiddleware(), cartRouter);
app.use("/api/checkout", clerkMiddleware(), checkoutRouter);
app.use("/api/orders", clerkMiddleware(), ordersRouter);
app.use("/api/seller", clerkMiddleware(), sellerRouter);
app.use("/api/admin", clerkMiddleware(), adminRouter);
app.use(errorHandler);
