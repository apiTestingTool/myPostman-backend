import { StatusCode, Status, HttpMethodType, ValidationResult } from '../config';

export class HttpMethodService {
  static validateHttpMethod(httpMethod: string): ValidationResult {
    // Check if exists
    if (httpMethod === undefined || httpMethod === null) {
      return {
        valid: false,
        meta: { status: Status.FAILED, message: 'httpMethod is required' }
      };
    }
    console.log(`httpMethod is not null`);

    // Check type
    if (typeof httpMethod !== 'string') {
      return {
        valid: false,
        meta: { status: Status.FAILED, message: 'httpMethod must be a string' }
      };
    }
    console.log(`httpMethod is a string`);

    // Check empty string
    const trimmed = httpMethod.trim();
    if (trimmed.length === 0) {
      return {
        valid: false,
        meta: { status: Status.FAILED, message: 'httpMethod cannot be empty' }
      };
    }
    console.log(`httpMethod is a string with content`);

    // Valid http methods
    const allowedMethods: HttpMethodType[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!allowedMethods.includes(trimmed.toUpperCase() as HttpMethodType)) {
      return {
        valid: false,
        meta: { status: Status.FAILED, message: `httpMethod must be one of: ${allowedMethods.join(', ')}` }
      };
    }
    console.log(`httpMethod is a valid HTTP method`);

    return {
      valid: true,
      meta: { status: Status.SUCCESS, message: 'httpMethod is valid' }
    };
  }
}
