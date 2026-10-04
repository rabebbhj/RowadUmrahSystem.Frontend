export interface BankAccountListItem {
  id: number;
  bankName: string;
  accountNumber: string;
  iban: string;
  openingBalance: number;
  isCashBox: boolean;
  isActive: boolean;
  createdAt: string;
  transactionCount: number;
}

export interface BankTransactionItem {
  id: number;
  transactionDate: string;
  transactionType: string;
  amount: number;
  referenceNumber: string;
  description: string;
  journalEntryId: number | null;
  journalEntryNumber: string | null;
}

export interface BankAccountDetail {
  id: number;
  bankName: string;
  accountNumber: string;
  iban: string;
  openingBalance: number;
  isCashBox: boolean;
  isActive: boolean;
  createdAt: string;
  transactionCount: number;
  recentTransactions: BankTransactionItem[];
}

export interface BankAccountUpsertRequest {
  bankName: string;
  accountNumber: string;
  iban: string;
  openingBalance: number;
  isCashBox: boolean;
  isActive: boolean;
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = await response.json();
      if (typeof data === "string") {
        return data;
      }

      if (data && typeof data.message === "string") {
        return data.message;
      }

      if (data && typeof data.title === "string") {
        return data.title;
      }
    } catch {
      // Fall back to text body below.
    }
  }

  const text = await response.text();
  if (contentType.includes("text/html") || /^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text)) {
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

export async function getBankAccounts(params: {
  search?: string;
  isActive?: boolean | null;
} = {}): Promise<BankAccountListItem[]> {
  const url = new URL("/api/bank-accounts", window.location.origin);

  if (params.search) {
    url.searchParams.set("search", params.search);
  }

  if (params.isActive !== undefined && params.isActive !== null) {
    url.searchParams.set("isActive", String(params.isActive));
  }

  const response = await fetch(url.toString(), {
    credentials: "include"
  });

  return requestJson<BankAccountListItem[]>(response);
}

export async function getBankAccount(id: number): Promise<BankAccountDetail> {
  const response = await fetch(`/api/bank-accounts/${id}`, {
    credentials: "include"
  });

  return requestJson<BankAccountDetail>(response);
}

export async function createBankAccount(
  request: BankAccountUpsertRequest
): Promise<BankAccountDetail> {
  const response = await fetch("/api/bank-accounts", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<BankAccountDetail>(response);
}

export async function updateBankAccount(
  id: number,
  request: BankAccountUpsertRequest
): Promise<BankAccountDetail> {
  const response = await fetch(`/api/bank-accounts/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<BankAccountDetail>(response);
}

export async function toggleBankAccountStatus(id: number): Promise<BankAccountDetail> {
  const response = await fetch(`/api/bank-accounts/${id}/toggle-status`, {
    method: "POST",
    credentials: "include"
  });

  return requestJson<BankAccountDetail>(response);
}
