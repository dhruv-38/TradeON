import type { Request, Response} from "express";
import { CreateOrderSchema } from "@repo/schemas-types";
import { createOrderService, getOrdersService } from "./order.service.js";
import { ValidationError } from "../../lib/errors/ValidationError.js";
import { asyncHandler } from "../../lib/asyncHandler.js";

export const createOrderController = asyncHandler(async (req: Request,res: Response) => {
    const result = CreateOrderSchema.safeParse(req.body);
    if (!result.success) {
        throw new ValidationError(result.error.message);
      }
    const {order} = await createOrderService(req.user.id,result.data);

    return res.status(201).json({
      success: true,
      data: order,
    });
  });

export const getOrdersController = asyncHandler(async (req: Request,res: Response) => {
  const orders = await getOrdersService(req.user.id);
      return res.json({
        success: true,
        data: orders,
      });
    }
  );
