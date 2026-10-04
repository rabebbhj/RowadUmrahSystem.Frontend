export interface CustomerListItem {
  id: number;
  name: string;
  civilId: string;
  passportNumber: string;
  phoneNumber: string;
  email: string;
  address: string;
  travelerId: number | null;
  travelerFullName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerDetail {
  id: number;
  name: string;
  civilId: string;
  passportNumber: string;
  phoneNumber: string;
  email: string;
  address: string;
  travelerId: number | null;
  travelerFullName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerUpsertRequest {
  name: string;
  civilId: string;
  passportNumber: string;
  phoneNumber: string;
  email: string;
  address: string;
  travelerId: number | null;
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
      // Fall back to text below.
    }
  }

  const text = await response.text();
  if (contentType.includes("text/html") || /^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text)) {
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

export async function getCustomers(params: {
  search?: string;
  isActive?: boolean | null;
} = {}): Promise<CustomerListItem[]> {
  const url = new URL("/api/customers", window.location.origin);

  if (params.search) {
    url.searchParams.set("search", params.search);
  }

  if (params.isActive !== undefined && params.isActive !== null) {
    url.searchParams.set("isActive", String(params.isActive));
  }

  const response = await fetch(url.toString(), {
    credentials: "include"
  });

  return requestJson<CustomerListItem[]>(response);
}

export async function getCustomer(id: number): Promise<CustomerDetail> {
  const response = await fetch(`/api/customers/${id}`, {
    credentials: "include"
  });

  return requestJson<CustomerDetail>(response);
}

export async function createCustomer(request: CustomerUpsertRequest): Promise<CustomerDetail> {
  const response = await fetch("/api/customers", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<CustomerDetail>(response);
}

export async function updateCustomer(
  id: number,
  request: CustomerUpsertRequest
): Promise<CustomerDetail> {
  const response = await fetch(`/api/customers/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<CustomerDetail>(response);
}

export async function toggleCustomerStatus(id: number): Promise<CustomerDetail> {
  const response = await fetch(`/api/customers/${id}/toggle-status`, {
    method: "POST",
    credentials: "include"
  });

  return requestJson<CustomerDetail>(response);
}
