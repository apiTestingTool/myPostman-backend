export type HttpMethodType = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type StatusType = "Active" | "Completed" | "Failed" | "Pending" | "Success";

export interface ValidationResult {
  valid: boolean;
  meta: { status: string; message: string };
  data?: any;
}

export interface ParsedUrl {
  protocol: string;
  hostname: string;
  port: string | null;
  pathname: string;
  search: string | null;
  hash: string | null;
  origin: string;
  fullUrl: string;
}

export interface RequestPayload {
  requestUrl: string;
  httpMethod: HttpMethodType;
  body?: any;
  cookies?: Record<string, string>;
  authorization?: string;
}
