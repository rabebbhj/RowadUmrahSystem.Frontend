export enum AccountType {
  Asset = 1,
  Liability = 2,
  Equity = 3,
  Revenue = 4,
  Expense = 5
}

export interface AccountListItem {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  parentAccountId: number | null;
  parentAccountName: string | null;
  isActive: boolean;
  isSystemAccount: boolean;
  createdAt: string;
}

export interface AccountJournalLine {
  id: number;
  entryDate: string;
  entryNumber: string;
  description: string;
  debit: number;
  credit: number;
  notes: string;
}

export interface AccountDetail extends AccountListItem {
  totalDebit: number;
  totalCredit: number;
  balance: number;
  recentLines: AccountJournalLine[];
}

export interface AccountUpsertRequest {
  code: string;
  name: string;
  type: AccountType;
  parentAccountId: number | null;
  isActive: boolean;
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

export function accountTypeLabel(type: AccountType): string {
  switch (type) {
    case AccountType.Asset:
      return "Asset";
    case AccountType.Liability:
      return "Liability";
    case AccountType.Equity:
      return "Equity";
    case AccountType.Revenue:
      return "Revenue";
    case AccountType.Expense:
      return "Expense";
    default:
      return "Unknown";
  }
}

export async function getAccounts(params: {
  search?: string;
  type?: AccountType | null;
  isActive?: boolean | null;
} = {}): Promise<AccountListItem[]> {
  const url = new URL("/api/accounts", window.location.origin);

  if (params.search) {
    url.searchParams.set("search", params.search);
  }

  if (params.type !== undefined && params.type !== null) {
    url.searchParams.set("type", String(params.type));
  }

  if (params.isActive !== undefined && params.isActive !== null) {
    url.searchParams.set("isActive", String(params.isActive));
  }

  const response = await fetch(url.toString(), {
    credentials: "include"
  });

  return requestJson<AccountListItem[]>(response);
}

export async function getAccount(id: number): Promise<AccountDetail> {
  const response = await fetch(`/api/accounts/${id}`, {
    credentials: "include"
  });

  return requestJson<AccountDetail>(response);
}

export async function createAccount(request: AccountUpsertRequest): Promise<AccountDetail> {
  const response = await fetch("/api/accounts", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<AccountDetail>(response);
}

export async function updateAccount(
  id: number,
  request: AccountUpsertRequest
): Promise<AccountDetail> {
  const response = await fetch(`/api/accounts/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<AccountDetail>(response);
}

export async function toggleAccountStatus(id: number): Promise<AccountDetail> {
  const response = await fetch(`/api/accounts/${id}/toggle-status`, {
    method: "POST",
    credentials: "include"
  });

  return requestJson<AccountDetail>(response);
}

export async function exportAccounts(): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch("/api/accounts/export", {
    credentials: "include"
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const contentDisposition = response.headers.get("content-disposition") ?? "";
  const match = /filename="?([^"]+)"?/i.exec(contentDisposition);

  return {
    blob: await response.blob(),
    filename: match?.[1] ?? "ChartOfAccounts.xlsx"
  };
}
