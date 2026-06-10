import { Request, Response } from "express";
import { config } from "@repo/config";
import { LoginUserSchema, RegisterUserSchema } from "@repo/schemas-types";
import { loginAuthService, signupAuthService } from "./auth.service.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ValidationError } from "../../lib/errors/ValidationError.js";


export const signupController = asyncHandler(async (req: Request, res: Response) => {
  const result = RegisterUserSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  const { token, newUser,wallet } = await signupAuthService(result.data);

  res.cookie("jwt", token, {
    maxAge: 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks: cross-site scripting
    sameSite: "strict", // CSRF attacks
    secure: config.NODE_ENV === "development" ? false : true,
  });
  res.status(201).json({
    message: "User created successfully",
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      walletid:wallet.id
    }
  });
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const result = LoginUserSchema.safeParse(req.body)

  if (!result.success) {
    throw new ValidationError(result.error.message);
  }

  const { token, existingUser } = await loginAuthService(result.data);

  res.cookie("jwt", token, {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: config.NODE_ENV !== "development",
  })

  return res.status(200).json({
    message: "Login successful",
    user: {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
    },
  })
});

export const getCurrentUserController = asyncHandler(async (req: Request, res: Response) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

export const logoutController = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "strict",
    secure: config.NODE_ENV !== "development",
  });

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
});
