import { PaymentMethod } from "./invoices";

export interface PaymentVoucherListItem {
  id: number;
  voucherNumber: string;
  voucherDate: string;
  paidTo: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccountId: number | null;
  bankAccountName: string | null;
  journalEntryId: number | null;
  journalEntryNumber: string | null;
  createdAt: string;
}

export interface PaymentVoucherDetail extends PaymentVoucherListItem {
  description: string;
  journalEntryDate: string | null;
  journalEntryDescription: string | null;
  journalEntryIsPosted: boolean;
}

export interface PaymentVoucherLookupOption {
  id: number;
  label: string;
}

export interface PaymentVoucherLookups {
  bankAccounts: PaymentVoucherLookupOption[];
}

export interface PaymentVoucherUpsertRequest {
  voucherDate: string;
  paidTo: string;
  amount: number;
  paymentMethod: PaymentMethod;
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

export async function getPaymentVouchers(params: {
  search?: string;
  fromDate?: string | null;
  toDate?: string | null;
  bankAccountId?: number | null;
} = {}): Promise<PaymentVoucherListItem[]> {
  const url = new URL("/api/payment-vouchers", window.location.origin);

  if (params.search) url.searchParams.set("search", params.search);
  if (params.fromDate) url.searchParams.set("fromDate", params.fromDate);
  if (params.toDate) url.searchParams.set("toDate", params.toDate);
  if (params.bankAccountId !== undefined && params.bankAccountId !== null) {
    url.searchParams.set("bankAccountId", String(params.bankAccountId));
  }

  const response = await fetch(url.toString(), {
    credentials: "include"
  });

  return requestJson<PaymentVoucherListItem[]>(response);
}

export async function getPaymentVoucher(id: number): Promise<PaymentVoucherDetail> {
  const response = await fetch(`/api/payment-vouchers/${id}`, {
    credentials: "include"
  });

  return requestJson<PaymentVoucherDetail>(response);
}

export async function getPaymentVoucherLookups(): Promise<PaymentVoucherLookups> {
  const response = await fetch("/api/payment-vouchers/lookups", {
    credentials: "include"
  });

  return requestJson<PaymentVoucherLookups>(response);
}

export async function createPaymentVoucher(
  request: PaymentVoucherUpsertRequest
): Promise<PaymentVoucherDetail> {
  const response = await fetch("/api/payment-vouchers", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<PaymentVoucherDetail>(response);
}
