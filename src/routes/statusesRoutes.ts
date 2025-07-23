import express from "express";
import * as statusesController from "../controllers/statusesController";
import asyncHandler from "../middlewares/asyncHandler";
import { validate } from "../middlewares/validate";
import authMiddleware from "../middlewares/authMiddleware";
import { StatusSchema } from "../models/validators/statusValidator";

const router = express.Router();

router.post(
  "/create-status",
  authMiddleware,
  validate(StatusSchema),
  asyncHandler(statusesController.createStatusController)
);

export default router;
