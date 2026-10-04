export interface PackagePricingItem {
  packageDays: string;
  hotelName: string;
  nationality: string;
  price: number;
}

export interface PackagePricing {
  nationalities: string[];
  hotels: string[];
  items: PackagePricingItem[];
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = await response.json();
      if (typeof data === "string") return data;
      if (data && typeof data.message === "string") return data.message;
      if (data && typeof data.title === "string") return data.title;
    } catch {
      // Fall back to plain text.
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

export async function getPackagePricing(): Promise<PackagePricing> {
  const response = await fetch("/api/package-pricing", {
    credentials: "include"
  });

  return requestJson<PackagePricing>(response);
}

export async function savePackagePricing(items: PackagePricingItem[]): Promise<PackagePricing> {
  const response = await fetch("/api/package-pricing", {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ items })
  });

  return requestJson<PackagePricing>(response);
}

export function findPackagePrice(
  pricing: PackagePricing | null,
  packageDays: string,
  hotelName: string,
  nationality: string,
  fallbackPrice: number
) {
  if (!pricing || !nationality) {
    return fallbackPrice;
  }

  const item = pricing.items.find(
    (candidate) =>
      candidate.packageDays === packageDays &&
      candidate.hotelName === hotelName &&
      candidate.nationality === nationality
  );

  return item?.price ?? fallbackPrice;
}
