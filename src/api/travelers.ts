export interface TravelerListItem {
  id: number;
  passportNumber: string;
  fullName: string;
  nationality: string;
  gender: string;
  dateOfBirth: string;
  email: string | null;
  phoneNumber: string;
  umrahCount: number;
  isBlocked: boolean;
  isDeleted: boolean;
  blockReason: string | null;
  blockedAt: string | null;
  notes: string | null;
  passportImagePath: string | null;
  passportExpiryDate: string | null;
  createdAt: string;
  tripCount: number;
  deletedAt: string | null;
  deletedBy: string | null;
}

export interface TravelerTripItem {
  id: number;
  tripType: string;
  tripDate: string;
  notes: string | null;
}

export interface TravelerDocumentItem {
  id: number;
  documentType: string;
  fileName: string;
  filePath: string;
  notes: string | null;
  uploadedAt: string;
}

export interface TravelerDetail extends TravelerListItem {
  passportImagePath: string | null;
  residenceNumber: string | null;
  blockReason: string | null;
  blockedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  trips: TravelerTripItem[];
  documents: TravelerDocumentItem[];
}

export interface TravelerUpsertRequest {
  passportNumber: string;
  passportImagePath?: string | null;
  fullName: string;
  nationality: string;
  gender: string;
  dateOfBirth: string;
  email?: string | null;
  residenceNumber?: string | null;
  passportExpiryDate?: string | null;
  phoneNumber: string;
  notes?: string | null;
  isBlocked?: boolean;
  blockReason?: string | null;
}

export interface TravelerBlockRequest {
  blockReason: string;
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
      // Fallback to text below.
    }
  }

  const text = await response.text();
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

export async function getTravelers(
  search = "",
  includeDeleted = true,
  onlyActive = false
): Promise<TravelerListItem[]> {
  const params = new URLSearchParams({
    includeDeleted: String(includeDeleted)
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (onlyActive) {
    params.set("onlyActive", "true");
  }

  const query = `?${params.toString()}`;
  const response = await fetch(`/api/travelers${query}`);
  return requestJson<TravelerListItem[]>(response);
}

export async function getTraveler(id: number): Promise<TravelerDetail> {
  const response = await fetch(`/api/travelers/${id}`);
  return requestJson<TravelerDetail>(response);
}

export async function createTraveler(request: FormData): Promise<TravelerDetail> {
  const response = await fetch("/api/travelers", {
    method: "POST",
    credentials: "include",
    body: request
  });

  return requestJson<TravelerDetail>(response);
}

export async function updateTraveler(id: number, request: FormData): Promise<TravelerDetail> {
  const response = await fetch(`/api/travelers/${id}`, {
    method: "PUT",
    credentials: "include",
    body: request
  });

  return requestJson<TravelerDetail>(response);
}

export async function blockTraveler(id: number, request: TravelerBlockRequest): Promise<TravelerDetail> {
  const response = await fetch(`/api/travelers/${id}/block`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<TravelerDetail>(response);
}

export async function unblockTraveler(id: number): Promise<TravelerDetail> {
  const response = await fetch(`/api/travelers/${id}/unblock`, {
    method: "POST",
    credentials: "include"
  });

  return requestJson<TravelerDetail>(response);
}

export async function deleteTraveler(id: number): Promise<void> {
  const response = await fetch(`/api/travelers/${id}/delete`, {
    method: "POST",
    credentials: "include"
  });

  await requestJson<void>(response);
}

export async function restoreTraveler(id: number): Promise<void> {
  const response = await fetch(`/api/travelers/${id}/restore`, {
    method: "POST",
    credentials: "include"
  });

  await requestJson<void>(response);
}
