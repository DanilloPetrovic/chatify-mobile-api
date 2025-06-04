import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Not valid email"),
  password: z.string().min(6, "Your password must have 6 characters"),
  username: z
    .string()
    .min(6, "Your username must have 6 characters")
    .max(20, "Your username must have less then 20 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Not valid email"),
  password: z.string(),
});
