import { HttpException, ErrorCode } from './root.js'

export class UnprocessableEntityException extends HttpException {
  constructor(errors: any, message: string = "Validation Error") {
    super(message, 422, ErrorCode.VALIDATION_FAILED, errors);
  }
}