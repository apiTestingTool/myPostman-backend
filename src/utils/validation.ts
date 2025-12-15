import { Status, StatusCode, HttpMethodType } from '../config';
import { UrlValidationService } from './urlValidation.service';
import { HttpMethodService } from './httpMethod.service';
import { ValidationResult } from '../config/types';

export const validateSendRequest = (data: any): ValidationResult => {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      meta: { status: Status.FAILED, message: 'Request body must be an object' }
    };
  }

  let { requestUrl, httpMethod, body, cookies, authorization } = data;

  // requestUrl check
  const requestUrlValidation: ValidationResult = UrlValidationService.validateRequestUrl(requestUrl);
  if (!requestUrlValidation?.valid) return requestUrlValidation;
  
  // httpMethod check
  const httpMethodValidation: ValidationResult = HttpMethodService.validateHttpMethod(httpMethod);
  if (!httpMethodValidation?.valid) return httpMethodValidation;

  // requestBody check - TBA
  // cookies check - TBA
  // authorization check - TBA

  return {
    valid: true,
    meta: { status: Status.SUCCESS, message: 'Payload is valid' },
  };
};
