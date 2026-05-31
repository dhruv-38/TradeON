import express,{ type Router } from "express";
import { protectRoute } from "../../middleware/auth.middleware.js";

import {getPositionsController,closePositionController, getPositionHistoryController} from "./position.controller.js";

export const positionRouter: Router = express.Router();

positionRouter.use(protectRoute);

positionRouter.get("/",getPositionsController);

positionRouter.post("/:id/close",closePositionController);

positionRouter.get("/history", getPositionHistoryController);