import axios from "axios";
import { RequestPayload } from "../config";


const getSizeInBytes = (data: any): number => {
  if (!data) return 0;
  const jsonString = typeof data === "string" ? data : JSON.stringify(data);
  return Buffer.byteLength(jsonString, "utf8");
};

export const sendRequest = async (payload: RequestPayload) => {
  console.log(payload);
  const { requestUrl, httpMethod, body, cookies, authorization } = payload;

  const headers: Record<string, string> = {};
  if (authorization) headers["Authorization"] = authorization;

  if (cookies) {
    headers["Cookie"] = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  const startTime = process.hrtime.bigint();

  try {
    const response = await axios({
      url: requestUrl,
      method: httpMethod,
      data: body,
      headers,
    });

    const endTime = process.hrtime.bigint();
    const timeMs = Number(endTime - startTime) / 1_000_000;

    return {
      status: "success",
      meta: {
        httpStatus: response.status,
        timeMilliSeconds: Number(timeMs.toFixed(4)),
        sizeBytes: getSizeInBytes(response.data),
      },
      request: {
        url: requestUrl,
        method: httpMethod,
        body: body || {},
      },
      response: {
        headers: response.headers,
        body: response.data,
      },
    };
  } catch (error: any) {
    const endTime = process.hrtime.bigint();
    const timeMs = Number(endTime - startTime) / 1_000_000;

    const errorData = error.response?.data || { message: error.message };

    return {
      status: "failed",
      meta: {
        httpStatus: error.response?.status || 500,
        timeMilliSeconds: Number(timeMs.toFixed(2)),
        sizeBytes: getSizeInBytes(errorData),
      },
      request: {
        url: requestUrl,
        method: httpMethod,
      },
      response: {
        headers: error.response?.headers || {},
        body: errorData,
      },
    };
  }
};
