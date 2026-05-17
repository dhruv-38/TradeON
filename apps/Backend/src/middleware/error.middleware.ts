import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors/AppError.js";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  console.error("Unexpected Error:", err);

  return res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
};