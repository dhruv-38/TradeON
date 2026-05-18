import express, { type Router } from "express";
import { depositController } from "./wallet.controller.js";

export const walletRouter: Router = express.Router();

walletRouter.post("/deposit",depositController);