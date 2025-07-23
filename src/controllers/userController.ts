import { Request, Response } from "express";
import * as userService from "../services/userService";
import { resendVerificationCode, verifyCode } from "../services/emailService";
import { AuthenticateRequest } from "../types/AuthenticatedRequest";

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, username } = req.body;
    const user = await userService.register({
      firstName,
      lastName,
      email,
      password,
      username,
    });
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
    console.log(error);
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

export async function changeEmail(req: AuthenticateRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { newEmail } = req.body;

    const result = await userService.changeEmail(req.user.id, { newEmail });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to initiate email change" });
  }
}

export async function confirmEmailChange(
  req: AuthenticateRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { code } = req.body;

    const result = await userService.confirmEmailChange(req.user.id, code);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid or expired code" });
  }
}

export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;

    await userService.requestPasswordReset(email);

    res.json({ message: "Password reset code sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Could not send reset code" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { email, code, newPassword } = req.body;

    await userService.resetPassword(email, code, newPassword);

    res.json({ message: "Password successfully reset" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to reset password" });
  }
}
