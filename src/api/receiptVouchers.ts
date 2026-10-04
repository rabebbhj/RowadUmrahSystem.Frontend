import { PaymentMethod } from "./invoices";

export interface ReceiptVoucherListItem {
  id: number;
  voucherNumber: string;
  voucherDate: string;
  receivedFrom: string;
  amount: number;
  paymentMethod: PaymentMethod;
  invoiceId: number | null;
  invoiceNumber: string | null;
  invoiceCustomerName: string | null;
  bankAccountId: number | null;
  bankAccountName: string | null;
  journalEntryId: number | null;
  journalEntryNumber: string | null;
  createdAt: string;
}

export interface ReceiptVoucherJournalLine {
  id: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  notes: string;
}

export interface ReceiptVoucherDetail extends ReceiptVoucherListItem {
  invoiceTotalAmount: number | null;
  invoicePaidAmount: number | null;
  invoiceRemainingAmount: number | null;
  description: string;
  journalEntryDate: string | null;
  journalEntryDescription: string | null;
  journalEntryIsPosted: boolean;
  journalEntryLines: ReceiptVoucherJournalLine[];
}

export interface ReceiptVoucherLookupOption {
  id: number;
  label: string;
}

export interface ReceiptVoucherLookups {
  invoices: ReceiptVoucherLookupOption[];
  bankAccounts: ReceiptVoucherLookupOption[];
}

export interface ReceiptVoucherUpsertRequest {
  voucherDate: string;
  receivedFrom: string;
  amount: number;
  paymentMethod: PaymentMethod;
  invoiceId: number | null;
  bankAccountId: number | null;
  description: string;
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();

  if ((response.headers.get("content-type") ?? "").includes("text/html") || /^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text)) {
    return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
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

export async function getReceiptVouchers(params: {
  search?: string;
  fromDate?: string | null;
  toDate?: string | null;
  bankAccountId?: number | null;
} = {}): Promise<ReceiptVoucherListItem[]> {
  const url = new URL("/api/receipt-vouchers", window.location.origin);

  if (params.search) {
    url.searchParams.set("search", params.search);
  }

  if (params.fromDate) {
    url.searchParams.set("fromDate", params.fromDate);
  }

  if (params.toDate) {
    url.searchParams.set("toDate", params.toDate);
  }

  if (params.bankAccountId !== undefined && params.bankAccountId !== null) {
    url.searchParams.set("bankAccountId", String(params.bankAccountId));
  }

  const response = await fetch(url.toString(), {
    credentials: "include"
  });

  return requestJson<ReceiptVoucherListItem[]>(response);
}

export async function getReceiptVoucher(id: number): Promise<ReceiptVoucherDetail> {
  const response = await fetch(`/api/receipt-vouchers/${id}`, {
    credentials: "include"
  });

  return requestJson<ReceiptVoucherDetail>(response);
}

export async function getReceiptVoucherLookups(): Promise<ReceiptVoucherLookups> {
  const response = await fetch("/api/receipt-vouchers/lookups", {
    credentials: "include"
  });

  return requestJson<ReceiptVoucherLookups>(response);
}

export async function createReceiptVoucher(
  request: ReceiptVoucherUpsertRequest
): Promise<ReceiptVoucherDetail> {
  const response = await fetch("/api/receipt-vouchers", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<ReceiptVoucherDetail>(response);
}
