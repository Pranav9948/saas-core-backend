import { NextFunction, Request, Response } from 'express';
import { HttpException, ErrorCode } from '../exceptions/root.js';
import { ZodError } from 'zod';
import { Prisma } from '@/generated/prisma/client.js';
import { logger } from '@/core/logger.js';

export const errorMiddleware = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const requestId = _req.requestId;
  const userId = _req.user?.userId || null;
  const tenantId = _req.user?.tenantId || null;

  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorCode = ErrorCode.INTERNAL_EXCEPTION;
  let errors = null;

  // 1. Handle our Custom Exceptions

  if (error instanceof HttpException) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode;
    errors = error.errors;

    const baseLog = {
      requestId,
      statusCode,
      errorCode,
      message,
      userId,
      tenantId,
    };

    if (statusCode >= 500) {
      logger.error({
        msg: 'Server error',
        ...baseLog,
      });
    } else {
      logger.warn({
        msg: 'Client error',
        ...baseLog,
      });
    }

    return res.status(statusCode).json({
      success: false,
      message,
      errorCode,
      errors,
    });
  }

  // 2. Handle Zod Validation Errors (Input Validation)

  if (error instanceof ZodError) {
    statusCode = 422;
    message = 'Validation Error';
    errorCode = ErrorCode.VALIDATION_FAILED;
    errors = error.flatten().fieldErrors;

    logger.warn({
      msg: 'Validation error',
      requestId,
      statusCode,
      errorCode,
      errors,
      userId,
      tenantId,
    });

    return res.status(statusCode).json({
      success: false,
      message,
      errorCode,
      errors,
    });
  }

  // 3. Handle Prisma Database Errors (Unique constraints, etc.)

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      message = `Unique constraint failed on ${error.meta?.target}`;
      errorCode = ErrorCode.EMAIL_ALREADY_EXISTS;

      logger.warn({
        msg: 'Database constraint error',
        requestId,
        statusCode,
        error: error.message,
        userId,
        tenantId,
      });

      return res.status(statusCode).json({
        success: false,
        message,
        errorCode,
      });
    }
  }

  logger.error({
    msg: 'System error',
    requestId,
    error: {
      message: error.message,
      stack: error.stack,
    },
    userId,
    tenantId,
  });

  return res.status(500).json({
    success: false,
    message: 'An internal server error occurred',
    errorCode: ErrorCode.INTERNAL_EXCEPTION,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
