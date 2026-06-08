import express,{type Router} from "express";
import {getCandlesController} from "./market.controller.js";

export const marketRouter: Router = express.Router();

marketRouter.get("/candles",getCandlesController);