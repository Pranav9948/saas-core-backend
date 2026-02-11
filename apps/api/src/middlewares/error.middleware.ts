import { NextFunction, Request, Response } from 'express';
import { HttpException, ErrorCode } from '../exceptions/root.js';
import { ZodError } from 'zod';
import { Prisma } from '@/generated/prisma/client.js';

export const errorMiddleware = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // 1. Handle our Custom Exceptions
  if (error instanceof HttpException) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errorCode: error.errorCode,
      errors: error.errors,
    });
  }

  // 2. Handle Zod Validation Errors (Input Validation)
  if (error instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: 'Validation Error',
      errorCode: ErrorCode.VALIDATION_FAILED,
      errors: error.flatten().fieldErrors, // Returns clear { field: [error] } mapping
    });
  }

  // 3. Handle Prisma Database Errors (Unique constraints, etc.)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint failed
      return res.status(409).json({
        success: false,
        message: `Unique constraint failed on the ${error.meta?.target}`,
        errorCode: ErrorCode.EMAIL_ALREADY_EXISTS,
      });
    }
  }

  // 4. Default Fallback for everything else (The 500)
  console.error('🔥 SYSTEM ERROR:', error);

  return res.status(500).json({
    success: false,
    message: 'An internal server error occurred',
    errorCode: ErrorCode.INTERNAL_EXCEPTION,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
