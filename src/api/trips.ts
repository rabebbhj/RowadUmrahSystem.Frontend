export type TripStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface TripListItem {
  id: number;
  travelerId: number;
  travelerName: string;
  passportNumber: string;
  tripType: string;
  tripDate: string;
  status: TripStatus;
  notes: string | null;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
}

export interface TripCreateRequest {
  travelerId: number;
  tripDate: string;
  notes: string;
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();

  if ((response.headers.get("content-type") ?? "").includes("text/html") || /^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text)) {
    return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
  }

  return text || `API error: ${response.status}`;
}

export async function getTrips(search = "", includeDeleted = false): Promise<TripListItem[]> {
  const params = new URLSearchParams({
    includeDeleted: String(includeDeleted)
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const response = await fetch(`/api/trips?${params.toString()}`, {
    credentials: "include"
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export async function createTrip(request: TripCreateRequest): Promise<TripListItem> {
  const response = await fetch("/api/trips", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export async function archiveTrip(id: number): Promise<TripListItem> {
  const response = await fetch(`/api/trips/${id}/archive`, {
    method: "POST",
    credentials: "include"
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export async function updateTripStatus(id: number, status: TripStatus): Promise<TripListItem> {
  const response = await fetch(`/api/trips/${id}/status`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export async function restoreTrip(id: number): Promise<TripListItem> {
  const response = await fetch(`/api/trips/${id}/restore`, {
    method: "POST",
    credentials: "include"
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}
