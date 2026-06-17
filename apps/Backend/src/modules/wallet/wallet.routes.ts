import express, { type Router } from "express";
import {
  depositController,
  getLedgerController,
  getWalletController,
  withdrawController,
} from "./wallet.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";

export const walletRouter: Router = express.Router();

walletRouter.use(protectRoute);

walletRouter.get("/", getWalletController);
walletRouter.get("/ledger",getLedgerController);
walletRouter.post("/deposit",depositController);
walletRouter.post("/withdraw",withdrawController);
