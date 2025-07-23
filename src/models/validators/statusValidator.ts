import { z } from "zod";

export const StatusSchema = z.object({
  content: z.string().min(1),
  userId: z.number().int(),
});
