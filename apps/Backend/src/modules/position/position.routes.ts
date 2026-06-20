import express, { type Router } from "express";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { closePositionController, getLivePositionsController, getPositionHistoryController, getPositionsController } from "./position.controller.js";

export const positionRouter: Router = express.Router();

positionRouter.use(protectRoute);

positionRouter.get("/live", getLivePositionsController);
positionRouter.get("/", getPositionsController);
positionRouter.get("/history", getPositionHistoryController);
positionRouter.post("/:id/close", closePositionController);
