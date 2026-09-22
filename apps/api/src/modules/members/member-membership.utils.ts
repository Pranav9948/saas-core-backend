const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addUtcDays(date: Date, days: number): Date {
  const next = startOfUtcDay(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function daysRemaining(
  expiresAt: Date | null | undefined,
  now = new Date(),
): number | null {
  if (!expiresAt) {
    return null;
  }

  const diff = startOfUtcDay(expiresAt).getTime() - startOfUtcDay(now).getTime();
  return Math.round(diff / MS_PER_DAY);
}

export type DisplayPaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export function resolvePaymentStatus(
  stored: 'PAID' | 'PENDING',
  expiresAt: Date | null | undefined,
  now = new Date(),
): DisplayPaymentStatus {
  const remaining = daysRemaining(expiresAt, now);
  if (remaining !== null && remaining < 0) {
    return 'OVERDUE';
  }
  return stored === 'PAID' ? 'PAID' : 'PENDING';
}

export function isExpiringOrExpired(expiresAt: Date | null | undefined): boolean {
  const remaining = daysRemaining(expiresAt);
  return remaining !== null && remaining <= 7;
}

export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error('Invalid date');
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function monthRange(reference = new Date()): { from: Date; to: Date } {
  const from = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
  const to = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 0));
  return { from, to };
}

export function previousMonthRange(reference = new Date()): { from: Date; to: Date } {
  const from = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - 1, 1));
  const to = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 0));
  return { from, to };
}
