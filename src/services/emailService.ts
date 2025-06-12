// @ts-ignore
import nodemailer from "nodemailer";
import prisma from "../prisma";
import createHttpError from "http-errors";
import crypto from "crypto";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendVerificationCode = async (
  email: string,
  code: string,
  username: string
) => {
  const name = username[0].toUpperCase() + username.slice(1);

  await transporter.sendMail({
    from: `"Chatify Support" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Your Chatify Verification Code",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 24px; color: #111;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 32px;">
          <h2 style="color: #1DB954;">Welcome to Chatify, ${name}!</h2>
          <p style="font-size: 16px;">
            We're thrilled to have you join our chat community. To get started, please verify your email address.
          </p>
          <p style="font-size: 16px;">Your verification code is:</p>
          <p style="font-size: 24px; font-weight: bold; color: #1DB954; margin: 16px 0;">${code}</p>
          <p style="font-size: 14px; color: #666;">
            This code is valid for the next 5 minutes. If you didn’t request this, you can safely ignore this message.
          </p>
          <hr style="margin: 24px 0;" />
          <p style="font-size: 14px; color: #999;">
            Need help? Contact our support team any time.
          </p>
          <p style="font-size: 14px; color: #999;">– The Chatify Team</p>
        </div>
      </div>
    `,
  });
};

async function generateVerificationCode(email: string) {
  await z.string().email().parseAsync(email);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw createHttpError(404, "User not found");
  }
  if (user.isEmailVerified) {
    throw createHttpError(400, "Email is already verified");
  }

  const verificationCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: { verificationCode, expiresAt },
  });

  return verificationCode;
}

async function verifyCode(code: string, email: string) {
  await z.string().email().parseAsync(email);
  await z.coerce.number().int().min(100000).max(999999).parseAsync(code);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  if (
    user.verificationCode === code &&
    user.expiresAt &&
    user.expiresAt > new Date()
  ) {
    await prisma.user.update({
      where: { email },
      data: {
        isEmailVerified: true,
      },
    });
    return;
  }

  throw createHttpError(400, "Invalid code");
}

async function resendVerificationCode(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { username: true },
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const verificationCode = await generateVerificationCode(email);
  await sendVerificationCode(email, verificationCode, user.username);
}

const sendEmailChangeVerificationCode = async (
  email: string,
  code: string,
  username: string,
  newEmail: string
) => {
  const name = username[0].toUpperCase() + username.slice(1);

  await transporter.sendMail({
    from: `"Chatify Security" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Confirm Email Change Request",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 24px; color: #111;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 32px;">
          <h2 style="color: #d97706;">Email Change Request</h2>
          <p style="font-size: 16px;">
            Hi ${name}, someone (hopefully you) requested to change the email address on your Chatify account.
          </p>
          <p style="font-size: 16px;">
            The new requested email address is: <strong>${newEmail}</strong>
          </p>
          <p style="font-size: 16px;">To confirm this change, please use the verification code below:</p>
          <p style="font-size: 24px; font-weight: bold; color: #d97706; margin: 16px 0;">${code}</p>
          <p style="font-size: 14px; color: #666;">
            This code is valid for the next 5 minutes. If you did not request this, please ignore this message or secure your account.
          </p>
          <hr style="margin: 24px 0;" />
          <p style="font-size: 14px; color: #999;">
            If you have any concerns, contact our support team.
          </p>
          <p style="font-size: 14px; color: #999;">– The Chatify Security Team</p>
        </div>
      </div>
    `,
  });
};

export {
  generateVerificationCode,
  verifyCode,
  resendVerificationCode,
  sendVerificationCode,
  sendEmailChangeVerificationCode,
};
