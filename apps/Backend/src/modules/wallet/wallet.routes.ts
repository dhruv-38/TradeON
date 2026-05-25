import express, { type Router } from "express";
import { depositController, withdrawController } from "./wallet.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";

export const walletRouter: Router = express.Router();

walletRouter.use(protectRoute);

walletRouter.post("/deposit",depositController);
walletRouter.post("/withdraw",withdrawController);