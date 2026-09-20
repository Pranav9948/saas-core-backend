export type BillingPaymentStatus =
  | 'PAID'
  | 'OPEN'
  | 'DRAFT'
  | 'VOID'
  | 'UNCOLLECTIBLE';

export interface BillingPaymentHistoryItemDto {
  invoiceNumber: string | null;
  status: BillingPaymentStatus;
  amount: number;
  currency: string;
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

export interface BillingPaymentHistoryPaginationDto {
  hasMore: boolean;
  nextStartingAfter: string | null;
}

export interface BillingPaymentHistoryResponseDto {
  payments: BillingPaymentHistoryItemDto[];
  pagination: BillingPaymentHistoryPaginationDto;
}

export interface BillingPaymentHistoryQuery {
  limit: number;
  startingAfter?: string;
}
