import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { BadRequestException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { zodErrorToFieldErrors } from '@/core/validation-errors.js';

export const validate =
  (schema: ZodObject) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = zodErrorToFieldErrors(error);
        return next(
          new BadRequestException(
            fieldErrors[0]?.message ?? 'Validation failed',
            ErrorCode.VALIDATION_FAILED,
            fieldErrors,
          ),
        );
      }

      return next(error);
    }
  };
