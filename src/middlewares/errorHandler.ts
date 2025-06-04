import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation error",
      errors: err.errors,
    });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
};

export default errorHandler;
