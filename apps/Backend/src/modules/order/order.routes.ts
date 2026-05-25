import { Router } from "express";

import { protectRoute } from "../../middleware/auth.middleware.js";

import { createOrderController } from "./order.controller.js";

const router = Router();

router.post(
  "/",
  protectRoute,
  createOrderController
);

export default router;