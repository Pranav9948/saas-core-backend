import { HttpException, ErrorCode } from './root.js';

export class BadRequestException extends HttpException {
  constructor(message: string, errorCode: ErrorCode = ErrorCode.VALIDATION_FAILED) {
    super(message, 400, errorCode, null);
  }
}