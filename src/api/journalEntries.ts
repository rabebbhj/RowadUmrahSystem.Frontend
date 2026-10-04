export interface JournalEntryListItem {
  id: number;
  entryNumber: string;
  entryDate: string;
  description: string;
  sourceType: string;
  isPosted: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  lineCount: number;
  createdAt: string;
}

export interface JournalEntryLine {
  id: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  notes: string;
}

export interface JournalEntryDetail extends JournalEntryListItem {
  sourceId: number | null;
  lines: JournalEntryLine[];
}

export interface JournalEntryLookupOption {
  id: number;
  label: string;
}

export interface JournalEntryLookups {
  accounts: JournalEntryLookupOption[];
}

export interface JournalEntryLineUpsertRequest {
  accountId: number;
  debit: number;
  credit: number;
  notes: string;
}

export interface JournalEntryUpsertRequest {
  entryDate: string;
  description: string;
  sourceType: string;
  lines: JournalEntryLineUpsertRequest[];
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

export async function getJournalEntries(params: {
  search?: string;
  fromDate?: string | null;
  toDate?: string | null;
  isPosted?: boolean | null;
} = {}): Promise<JournalEntryListItem[]> {
  const url = new URL("/api/journal-entries", window.location.origin);

  if (params.search) {
    url.searchParams.set("search", params.search);
  }

  if (params.fromDate) {
    url.searchParams.set("fromDate", params.fromDate);
  }

  if (params.toDate) {
    url.searchParams.set("toDate", params.toDate);
  }

  if (params.isPosted !== undefined && params.isPosted !== null) {
    url.searchParams.set("isPosted", String(params.isPosted));
  }

  const response = await fetch(url.toString(), {
    credentials: "include"
  });

  return requestJson<JournalEntryListItem[]>(response);
}

export async function getJournalEntry(id: number): Promise<JournalEntryDetail> {
  const response = await fetch(`/api/journal-entries/${id}`, {
    credentials: "include"
  });

  return requestJson<JournalEntryDetail>(response);
}

export async function getJournalEntryLookups(): Promise<JournalEntryLookups> {
  const response = await fetch("/api/journal-entries/lookups", {
    credentials: "include"
  });

  return requestJson<JournalEntryLookups>(response);
}

export async function createJournalEntry(
  request: JournalEntryUpsertRequest
): Promise<JournalEntryDetail> {
  const response = await fetch("/api/journal-entries", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<JournalEntryDetail>(response);
}

export async function toggleJournalEntryPosted(id: number): Promise<JournalEntryDetail> {
  const response = await fetch(`/api/journal-entries/${id}/toggle-posted`, {
    method: "POST",
    credentials: "include"
  });

  return requestJson<JournalEntryDetail>(response);
}
