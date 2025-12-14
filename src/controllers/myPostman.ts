import { Request, Response } from "express";

export const getMyPostman = (req: Request, res: Response) => {
  console.log("");
  return res.status(200).send("Hello from myPostman");
};
