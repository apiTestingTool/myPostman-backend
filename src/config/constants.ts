export const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  HEAD: "HEAD",
  OPTIONS: "OPTIONS",
};

export const StatusCode = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const Status = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  FAILED: "Failed",
  PENDING: "Pending",
  SUCCESS: "Success",
};

export const Message = {
  BACKEND_RUNNING: "Backend service (myPostman-backend) is running",
  ERROR_FETCHING_DATA: "Error fetching data. Please try again later",
  INTERNAL_SERVER_ERROR: "Error occurred in the server. Please try again later",
  INVALID_INPUT: "The input provided is invalid. Please check and try again",
  OPERATION_SUCCESSFUL: "The operation was completed successfully",
  USER_NOT_AUTHORIZED: "You are not authorized to perform this action",
};

export const Endpoints = {
  HEALTH: "health",
  MY_POSTMAN: "my-postman",
  SEND_REQUEST: "send-request",
};
