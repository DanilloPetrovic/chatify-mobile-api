import { Request, Response } from "express";
import * as userService from "../services/userService";
import { resendVerificationCode, verifyCode } from "../services/emailService";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;
    const user = await userService.register({ email, password, username });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await userService.login({ email, password });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export async function verifyEmail(req: Request, res: Response) {
  const { code, email } = req.body;

  await verifyCode(code, email);
  res.json({ message: "Email successfully is verified" });
}

export async function resendEmail(req: Request, res: Response) {
  const { email } = req.body;

  await resendVerificationCode(email);
  res.json({ message: "New code sent!" });
}
