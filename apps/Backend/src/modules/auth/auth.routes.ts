import express, { type Router } from "express";
import { loginController, signupController } from "./auth.controller.js";

export const authRouter: Router = express.Router();

authRouter.post("/signup",signupController);
authRouter.post("/login",loginController);