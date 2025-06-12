import express from "express";
import * as userController from "../controllers/userController";
import asyncHandler from "../middlewares/asyncHandler";
import { validate } from "../middlewares/validate";
import {
  loginSchema,
  registerSchema,
} from "../models/validators/userValidator";
import authMiddleware from "../middlewares/authMiddleware";

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
router.post(
  "/edit-profile",
  authMiddleware,
  asyncHandler(userController.editProfile)
);

router.post("/verify-email", asyncHandler(userController.verifyEmail));
router.post("/resend-email", asyncHandler(userController.resendEmail));
router.get("/me", authMiddleware, asyncHandler(userController.getMe));

export default router;
