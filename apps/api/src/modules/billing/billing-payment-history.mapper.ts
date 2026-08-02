import type Stripe from 'stripe';
import type {
  BillingPaymentHistoryItemDto,
  BillingPaymentHistoryResponseDto,
  BillingPaymentStatus,
} from './billing-payment-history.dto.js';

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

const PAYMENT_STATUS_BY_STRIPE: Record<string, BillingPaymentStatus> = {
  paid: 'PAID',
  open: 'OPEN',
  draft: 'DRAFT',
  void: 'VOID',
  uncollectible: 'UNCOLLECTIBLE',
};

function toIsoString(unixSeconds: number | null | undefined): string | null {
  if (unixSeconds == null) {
    return null;
  }

  return new Date(unixSeconds * 1000).toISOString();
}

function stripeAmountToDisplayAmount(amount: number, currency: string): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())) {
    return amount;
  }

  return amount / 100;
}

function mapInvoiceStatus(
  status: Stripe.Invoice.Status | null,
): BillingPaymentStatus {
  if (!status) {
    return 'OPEN';
  }

  return PAYMENT_STATUS_BY_STRIPE[status] ?? 'OPEN';
}

export function mapStripeInvoiceToPaymentDto(
  invoice: Stripe.Invoice,
): BillingPaymentHistoryItemDto {
  const currency = invoice.currency?.toUpperCase() ?? 'INR';
  const amountSource =
    invoice.status === 'paid'
      ? invoice.amount_paid
      : (invoice.amount_due ?? invoice.total ?? 0);

  return {
    invoiceNumber: invoice.number,
    status: mapInvoiceStatus(invoice.status),
    amount: stripeAmountToDisplayAmount(amountSource, currency),
    currency,
    paidAt: toIsoString(invoice.status_transitions?.paid_at),
    periodStart: toIsoString(invoice.period_start),
    periodEnd: toIsoString(invoice.period_end),
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
  };
}

export function mapStripeInvoicesToPaymentHistory(
  invoices: Stripe.ApiList<Stripe.Invoice>,
): BillingPaymentHistoryResponseDto {
  const payments = invoices.data.map(mapStripeInvoiceToPaymentDto);
  const lastInvoice = invoices.data[invoices.data.length - 1];

  return {
    payments,
    pagination: {
      hasMore: invoices.has_more,
      nextStartingAfter:
        invoices.has_more && lastInvoice ? lastInvoice.id : null,
    },
  };
}
