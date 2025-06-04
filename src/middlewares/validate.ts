import { Request, Response, NextFunction } from "express";
import { z, ZodTypeAny } from "zod";

export const validate = <T extends ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ errors: e.errors });
      } else {
        next(e);
      }
    }
  };
};
