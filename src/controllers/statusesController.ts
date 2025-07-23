import { Request, Response } from "express";
import * as statusesService from "../services/statusesService";
import { AuthenticateRequest } from "../types/AuthenticatedRequest";

export async function createStatusController(
  req: AuthenticateRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const status = await statusesService.createStatus({
      content,
      userId: req.user.id,
    });

    res.status(201).json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create status" });
  }
}
