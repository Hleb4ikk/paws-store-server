import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../logger.js";
import { AppError, notFound } from "../utils/AppError.js";

export const notFoundHandler: RequestHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(notFound("Route not found"));
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  });
};
