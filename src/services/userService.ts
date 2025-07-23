import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import createHttpError from "http-errors";
import { generateVerificationCode, sendVerificationCode } from "./emailService";
import crypto from "crypto";
import { z } from "zod";
import {
  sendEmailChangeVerificationCode,
  sendPasswordResetCode,
} from "./emailService";

export const register = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username: string;
}) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (isUserExist) {
    throw createHttpError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      password: hashedPassword,
    },
  });

  try {
    const code = await generateVerificationCode(user.email);
    await sendVerificationCode(user.email, code, user.username);
  } catch (error) {
    console.error("Failed to send code");
  }

  const { password, ...userWithoutPassword } = user;
  return { userWithoutPassword };
};

export const login = async (data: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    throw createHttpError(401, "This user do not exists");
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw createHttpError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};

export const getUserProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
};

export const editProfile = async (
  userId: number,
  data: { bio?: string; username?: string }
) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      bio: data.bio,
      username: data.username,
    },
    select: {
      id: true,
      email: true,
      bio: true,
      username: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

export const changeEmail = async (
  userId: number,
  data: { newEmail: string }
) => {
  await z.string().email().parseAsync(data.newEmail);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }
  const existing = await prisma.user.findUnique({
    where: { email: data.newEmail },
  });

  if (existing) {
    throw createHttpError(400, "This email is already in use");
  }

  const verificationCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailChangeCode: verificationCode,
      emailChangeCodeExpiresAt: expiresAt,
      pendingEmail: data.newEmail,
    },
  });

  await sendEmailChangeVerificationCode(
    user.email,
    verificationCode,
    user.username,
    data.newEmail
  );

  return { message: "Verification code sent to your current email" };
};

export const confirmEmailChange = async (userId: number, code: string) => {
  await z.coerce.number().int().min(100000).max(999999).parseAsync(code);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailChangeCode: true,
      emailChangeCodeExpiresAt: true,
      pendingEmail: true,
    },
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  if (
    !user.emailChangeCode ||
    !user.emailChangeCodeExpiresAt ||
    !user.pendingEmail
  ) {
    throw createHttpError(400, "No pending email change request");
  }

  const now = new Date();

  if (user.emailChangeCode !== code || user.emailChangeCodeExpiresAt < now) {
    throw createHttpError(400, "Invalid or expired code");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: user.pendingEmail,
      pendingEmail: null,
      emailChangeCode: null,
      emailChangeCodeExpiresAt: null,
    },
  });

  return { message: "Email successfully changed" };
};

export const requestPasswordReset = async (email: string) => {
  await z.string().email().parseAsync(email);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: {
      passwordResetCode: code,
      passwordResetExpiresAt: expiresAt,
    },
  });

  await sendPasswordResetCode(email, code, user.username);

  return { message: "Password reset code sent to your email" };
};

export const verifyPasswordResetCode = async (email: string, code: string) => {
  await z.string().email().parseAsync(email);
  await z.coerce.number().int().min(100000).max(999999).parseAsync(code);

  const user = await prisma.user.findUnique({ where: { email } });

  if (
    !user ||
    !user.passwordResetCode ||
    !user.passwordResetExpiresAt ||
    user.passwordResetCode !== code ||
    user.passwordResetExpiresAt < new Date()
  ) {
    throw createHttpError(400, "Invalid or expired code");
  }

  return { message: "Code verified" };
};

export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
) => {
  await verifyPasswordResetCode(email, code);

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashed,
      passwordResetCode: null,
      passwordResetExpiresAt: null,
    },
  });

  return { message: "Password successfully reset" };
};
