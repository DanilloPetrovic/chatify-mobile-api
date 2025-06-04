import express from "express";
import * as userController from "../controllers/userController";
import asyncHandler from "../middlewares/asyncHandler";
import { validate } from "../middlewares/validate";
import {
  loginSchema,
  registerSchema,
} from "../models/validators/userValidator";

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(userController.register)
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(userController.login)
);

router.post("/verify-email", asyncHandler(userController.verifyEmail));
router.post("/resend-email", asyncHandler(userController.resendEmail));

export default router;
