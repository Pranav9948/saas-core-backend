import type { HttpFieldError } from './root.js';
import { HttpException, ErrorCode } from './root.js';

export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
export const AUTH_TOKEN_MESSAGE = 'Authentication token missing or expired';
export const FORBIDDEN_ACTION_MESSAGE =
  'You do not have permission to perform this action';

// 400 - Validation/Client Input issues
export class BadRequestException extends HttpException {
  constructor(
    message: string,
    errorCode: ErrorCode = ErrorCode.VALIDATION_FAILED,
    errors: HttpFieldError[] | null = null,
  ) {
    super(message, 400, errorCode, errors);
  }
}

// 401 - Identity issues (Wrong password, expired token)
export class UnauthorizedException extends HttpException {
  constructor(
    message: string = AUTH_TOKEN_MESSAGE,
    errorCode: ErrorCode = ErrorCode.UNAUTHORIZED,
  ) {
    super(message, 401, errorCode, null);
  }
}

// 403 - Permission issues (Valid user, but not allowed here)
export class ForbiddenException extends HttpException {
  constructor(
    message: string = FORBIDDEN_ACTION_MESSAGE,
    errorCode: ErrorCode = ErrorCode.FORBIDDEN,
  ) {
    super(message, 403, errorCode, null);
  }
}

// 404 - Resource not found
export class NotFoundException extends HttpException {
  constructor(message: string, errorCode: ErrorCode = ErrorCode.NOT_FOUND) {
    super(message, 404, errorCode, null);
  }
}

// 409 - Data conflicts (User already exists)
export class ConflictException extends HttpException {
  constructor(
    message: string,
    errorCode: ErrorCode = ErrorCode.RESOURCE_ALREADY_EXISTS,
  ) {
    super(message, 409, errorCode, null);
  }
}

// 502 - Upstream payment provider unavailable
export class BadGatewayException extends HttpException {
  constructor(
    message: string = 'Payment service temporarily unavailable',
    errorCode: ErrorCode = ErrorCode.SERVICE_UNAVAILABLE,
  ) {
    super(message, 502, errorCode, null);
  }
}

// 500 - Something went wrong in our code/database
export class InternalException extends HttpException {
  constructor(
    message: string,
    errors: any,
    errorCode: ErrorCode = ErrorCode.INTERNAL_EXCEPTION,
  ) {
    super(message, 500, errorCode, null);
  }
}
