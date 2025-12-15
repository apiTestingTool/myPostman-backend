import { Request, Response } from 'express';
import { StatusCode, Status, Message, Endpoints } from '../config/constants';
import { sendRequest } from '../services/sendRequest';
import { validateSendRequest } from '../utils/validation';

// Main API for sending HTTP requests
export const handleSendRequest = async (req: Request, res: Response) => {
  try {
    console.log(`Request received for endpoint: ${Endpoints.SEND_REQUEST}`);

    // Validate request body
    const validation = validateSendRequest(req.body);
    if (!validation.valid) {
      return res.status(StatusCode.BAD_REQUEST).send(validation);
    }
    console.log('Request payload validated successfully');

    // Destructure the validated payload
    const payload = req.body;

    // Call service
    const result = await sendRequest(payload);

    return res.status(result.meta.httpStatus).send(result);
  } catch (error) {
    console.error(error);
    return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ status: Status.FAILED, message: Message.INTERNAL_SERVER_ERROR });
  }
};
