import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import createHttpError from "http-errors";
import { generateVerificationCode, sendVerificationCode } from "./emailService";

export const register = async (data: {
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
