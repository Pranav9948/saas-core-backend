import type { ZodError } from 'zod';

export type FieldError = {
  field: string;
  message: string;
};

const WRAPPER_KEYS = new Set(['body', 'query', 'params']);

export function zodErrorToFieldErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue) => {
    const parts = issue.path.map(String).filter((part) => !WRAPPER_KEYS.has(part));
    return {
      field: parts.length > 0 ? parts.join('.') : 'request',
      message: issue.message,
    };
  });
}

export function prismaUniqueConstraintMessage(target: unknown): string {
  const fields = Array.isArray(target) ? target.map(String) : [];

  if (fields.includes('email')) {
    return 'An account with this email already exists';
  }

  if (fields.includes('slug')) {
    return 'A gym with this name already exists';
  }

  if (fields.includes('name') && fields.includes('interval')) {
    return 'A plan with this name and billing interval already exists';
  }

  if (fields.includes('name')) {
    return 'A record with this name already exists';
  }

  return 'A record with these values already exists';
}
