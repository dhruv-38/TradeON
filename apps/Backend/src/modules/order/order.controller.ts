import type {
  Request,
  Response,
} from "express";

import { CreateOrderSchema } from "@repo/schemas-types";

import { createOrderService } from "./order.service.js";

export const createOrderController =
  async (
    req: Request,
    res: Response
  ) => {
    const parsed =
      CreateOrderSchema.parse(req.body);

    const result =
      await createOrderService(
        req.user.id,
        parsed
      );

    return res.status(201).json({
      success: true,
      data: result,
    });
  };
