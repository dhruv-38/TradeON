import express, { type Router } from "express";
import {
  getCurrentUserController,
  loginController,
  logoutController,
  signupController,
} from "./auth.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";

export const authRouter: Router = express.Router();

authRouter.post("/signup",signupController);
authRouter.post("/login",loginController);
authRouter.get("/me", protectRoute, getCurrentUserController);
authRouter.post("/logout", logoutController);
