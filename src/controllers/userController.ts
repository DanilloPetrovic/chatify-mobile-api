import { Request, Response } from "express";
import * as userService from "../services/userService";
import { resendVerificationCode, verifyCode } from "../services/emailService";
import { AuthenticateRequest } from "../types/AuthenticatedRequest";

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

export async function getMe(req: AuthenticateRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await userService.getUserProfile(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function editProfile(req: AuthenticateRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { username, bio } = req.body;

    const user = await userService.editProfile(req.user.id, {
      username,
      bio,
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
