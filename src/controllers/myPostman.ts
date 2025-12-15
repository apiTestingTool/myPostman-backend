import { Request, Response } from "express";
import { StatusCode, Endpoints } from "../config/constants";

// Official API of myPostman
export const getMyPostman = (req: Request, res: Response) => {
  try {
    console.log(`Request received for endpoint: ${Endpoints.MY_POSTMAN}`);
    return res.status(StatusCode.OK).send("Hello from myPostman");
  } catch (error: any) {
    console.error("Error in myPostman API:", error);
    return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(error.message);
  }
};
