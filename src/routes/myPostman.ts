import { Router } from "express";
import { getMyPostman } from "../controllers/myPostman";

export const myPostmanRouter = Router();

myPostmanRouter.get("/", getMyPostman);