export enum ErrorCode {
  EMAIL_ALREADY_EXISTS = 1001,
  VALIDATION_FAILED = 2002,
  INTERNAL_EXCEPTION = 5005,
  UNAUTHORIZED = 4001,
  NOT_FOUND = 4004,
}

export class HttpException extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public errorCode: ErrorCode,
    public errors: any = null,
  ) {
    super(message);
    // This captures the line number where the error happened for  logs
    Error.captureStackTrace(this, this.constructor);
  }
}
