import { Request, Response } from "express";
import { Status, Message } from "../config";

// Controller function for health check
export const getHealth = (req: Request, res: Response) => {
  res.status(200).json({
    status: Status.SUCCESS,
    message: Message.BACKEND_RUNNING,
    timestamp: new Date().toISOString(),
  });
};
