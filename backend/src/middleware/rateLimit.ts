import rateLimit from "express-rate-limit";

export const checkoutLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many checkout attempts. Please wait and try again." }
});
