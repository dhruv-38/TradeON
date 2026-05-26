import express, { type Router } from "express";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { createOrderController } from "./order.controller.js";

export const orderRouter:Router = express.Router();

orderRouter.use(protectRoute);
orderRouter.post("/",createOrderController);