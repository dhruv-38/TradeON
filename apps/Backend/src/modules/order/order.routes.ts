import express, { type Router } from "express";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { createOrderController, getOrdersController } from "./order.controller.js";

export const orderRouter:Router = express.Router();

orderRouter.use(protectRoute);
orderRouter.get("/",getOrdersController);
orderRouter.post("/",createOrderController);