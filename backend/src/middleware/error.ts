import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(422).json({ message: "Validation failed", issues: error.flatten() });
  }

  logger.error({ error: serializeError(error), path: req.path }, "Unhandled request error");
  res.status(500).json({ message: "Internal server error" });
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  if (typeof error === "object" && error !== null) {
    return { ...error };
  }

  return error;
}
