export enum InvoiceStatus {
  Unpaid = 1,
  PartiallyPaid = 2,
  Paid = 3,
  Cancelled = 4
}

export enum PaymentMethod {
  Cash = 1,
  BankTransfer = 2,
  KNet = 3,
  Visa = 4,
  Cheque = 5,
  Other = 6
}

export interface InvoiceListItem {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  customerName: string;
  passportNumber: string | null;
  travelerId: number | null;
  travelerName: string | null;
  tripId: number | null;
  tripLabel: string | null;
  currencyId: number | null;
  currencyCode: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  createdAt: string;
}

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  lineTotal: number;
  sortOrder: number;
}

export interface InvoiceJournalEntryLine {
  id: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  notes: string;
}

export interface InvoiceDetail extends InvoiceListItem {
  costCenterId: number | null;
  costCenterCode: string | null;
  paymentTermId: number | null;
  paymentTermName: string | null;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  paidAt: string | null;
  journalEntryId: number | null;
  journalEntryNumber: string | null;
  journalEntryDate: string | null;
  journalEntryDescription: string | null;
  journalEntryIsPosted: boolean;
  isArchived: boolean;
  items: InvoiceItem[];
  journalEntryLines: InvoiceJournalEntryLine[];
}

export interface InvoiceLookupOption {
  id: number;
  label: string;
}

export interface InvoiceLookups {
  travelers: InvoiceLookupOption[];
  trips: InvoiceLookupOption[];
  currencies: InvoiceLookupOption[];
  costCenters: InvoiceLookupOption[];
  paymentTerms: InvoiceLookupOption[];
  receivableAccounts: InvoiceLookupOption[];
  revenueAccounts: InvoiceLookupOption[];
}

export interface InvoiceItemUpsertRequest {
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
}

export interface InvoiceUpsertRequest {
  travelerId: number | null;
  tripId: number | null;
  currencyId: number | null;
  costCenterId: number | null;
  paymentTermId: number | null;
  customerName: string;
  passportNumber: string | null;
  invoiceDate: string;
  dueDate: string | null;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  receivableAccountId: number;
  revenueAccountId: number;
  notes: string;
  items: InvoiceItemUpsertRequest[];
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();

  if ((response.headers.get("content-type") ?? "").includes("text/html") || /^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text)) {
    return "Erreur serveur. Verifiez les migrations et les journaux de production.";
  }

  return text || `API error: ${response.status}`;
}

async function requestJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

export function invoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.Unpaid:
      return "Unpaid";
    case InvoiceStatus.PartiallyPaid:
      return "Partially paid";
    case InvoiceStatus.Paid:
      return "Paid";
    case InvoiceStatus.Cancelled:
      return "Cancelled";
    default:
      return "Unknown";
  }
}

export function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.Cash:
      return "نقدي";
    case PaymentMethod.BankTransfer:
      return "تحويل بنكي";
    case PaymentMethod.KNet:
      return "KNet";
    case PaymentMethod.Visa:
      return "Visa";
    case PaymentMethod.Cheque:
      return "شيك";
    case PaymentMethod.Other:
      return "أخرى";
    default:
      return "Unknown";
  }
}

export async function getInvoices(params: {
  search?: string;
  status?: string | null;
} = {}): Promise<InvoiceListItem[]> {
  const url = new URL("/api/invoices", window.location.origin);

  if (params.search) {
    url.searchParams.set("search", params.search);
  }

  if (params.status) {
    url.searchParams.set("status", params.status);
  }

  const response = await fetch(url.toString(), {
    credentials: "include"
  });

  return requestJson<InvoiceListItem[]>(response);
}

export async function getInvoice(id: number): Promise<InvoiceDetail> {
  const response = await fetch(`/api/invoices/${id}`, {
    credentials: "include"
  });

  return requestJson<InvoiceDetail>(response);
}

export async function getInvoiceLookups(): Promise<InvoiceLookups> {
  const response = await fetch("/api/invoices/lookups", {
    credentials: "include"
  });

  return requestJson<InvoiceLookups>(response);
}

export async function createInvoice(request: InvoiceUpsertRequest): Promise<InvoiceDetail> {
  const response = await fetch("/api/invoices", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<InvoiceDetail>(response);
}

export async function cancelInvoice(id: number): Promise<InvoiceDetail> {
  const response = await fetch(`/api/invoices/${id}/cancel`, {
    method: "POST",
    credentials: "include"
  });

  return requestJson<InvoiceDetail>(response);
}
