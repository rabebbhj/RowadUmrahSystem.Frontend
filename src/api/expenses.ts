import { PaymentMethod } from "./invoices";

export interface ExpenseListItem {
  id: number;
  expenseDate: string;
  category: string;
  title: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccountId: number | null;
  bankAccountName: string | null;
  tripId: number | null;
  tripLabel: string | null;
  journalEntryId: number | null;
  journalEntryNumber: string | null;
  createdAt: string;
}

export interface ExpenseDetail extends ExpenseListItem {
  journalEntryDate: string | null;
  journalEntryDescription: string | null;
  journalEntryIsPosted: boolean;
  notes: string;
}

export interface ExpenseLookupOption {
  id: number;
  label: string;
}

export interface ExpenseLookups {
  bankAccounts: ExpenseLookupOption[];
  trips: ExpenseLookupOption[];
}

export interface ExpenseUpsertRequest {
  expenseDate: string;
  category: string;
  title: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccountId: number | null;
  tripId: number | null;
  notes: string;
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

export async function getExpenses(params: {
  search?: string;
  fromDate?: string | null;
  toDate?: string | null;
  bankAccountId?: number | null;
} = {}): Promise<ExpenseListItem[]> {
  const url = new URL("/api/expenses", window.location.origin);

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

  return requestJson<ExpenseListItem[]>(response);
}

export async function getExpense(id: number): Promise<ExpenseDetail> {
  const response = await fetch(`/api/expenses/${id}`, {
    credentials: "include"
  });

  return requestJson<ExpenseDetail>(response);
}

export async function getExpenseLookups(): Promise<ExpenseLookups> {
  const response = await fetch("/api/expenses/lookups", {
    credentials: "include"
  });

  return requestJson<ExpenseLookups>(response);
}

export async function createExpense(request: ExpenseUpsertRequest): Promise<ExpenseDetail> {
  const response = await fetch("/api/expenses", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<ExpenseDetail>(response);
}
