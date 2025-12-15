import { Router } from "express";
import { handleSendRequest } from "../controllers/sendRequest";

export const sendRequestRouter = Router();

sendRequestRouter.post("/", handleSendRequest);