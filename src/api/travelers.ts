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

export interface PassportOcrResult {
  passportNumber: string;
  fullName: string;
  nationality: string;
  gender: string;
  dateOfBirth: string | null;
  passportExpiryDate: string | null;
  mode: "ready" | "demo";
  message: string;
}

export interface CivilIdOcrResult extends PassportOcrResult {
  civilId: string;
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = await response.json();
      if (typeof data === "string") {
        return normalizeArabicMessage(data);
      }

      if (data && typeof data.message === "string") {
        return normalizeArabicMessage(data.message);
      }

      if (data && data.errors && typeof data.errors === "object") {
        const messages = Object.entries(data.errors)
          .flatMap(([field, value]) => {
            const label = getArabicFieldLabel(field);
            const values = Array.isArray(value) ? value : [value];

            return values
              .filter((item): item is string => typeof item === "string")
              .map((message) => translateValidationMessage(label, message));
          })
          .filter(Boolean);

        if (messages.length > 0) {
          return normalizeArabicMessage(messages.join("\n"));
        }
      }

      if (data && typeof data.title === "string") {
        return normalizeArabicMessage(translateProblemTitle(data.title, response.status));
      }
    } catch {
      // Fallback to text below.
    }
  }

  const text = await response.text();
  return normalizeArabicMessage(text || translateProblemTitle("", response.status));
}

function normalizeArabicMessage(message: string): string {
  if (!/[ØÙÃÂ]/.test(message)) {
    return message;
  }

  try {
    const bytes = Uint8Array.from(Array.from(message, (char) => char.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return message;
  }
}

function getArabicFieldLabel(field: string): string {
  const normalized = field.replace(/^.*\./, "");

  const labels: Record<string, string> = {
    PassportNumber: "رقم الجواز",
    FullName: "الاسم الكامل",
    Nationality: "الجنسية",
    Gender: "الجنس",
    DateOfBirth: "تاريخ الميلاد",
    PassportExpiryDate: "تاريخ انتهاء الجواز",
    PhoneNumber: "رقم الهاتف",
    Email: "البريد الإلكتروني",
    Notes: "الملاحظات"
  };

  return labels[normalized] ?? "هذا الحقل";
}

function translateValidationMessage(fieldLabel: string, message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("field is required") || lower.includes("is required")) {
    return `${fieldLabel} مطلوب.`;
  }

  if (lower.includes("not a valid e-mail") || lower.includes("not a valid email")) {
    return "البريد الإلكتروني غير صحيح.";
  }

  return message;
}

function translateProblemTitle(title: string, status: number): string {
  if (title === "One or more validation errors occurred." || status === 400) {
    return "يرجى مراجعة البيانات المدخلة وتصحيح الحقول المطلوبة.";
  }

  if (status === 401) {
    return "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.";
  }

  if (status === 403) {
    return "ليس لديك صلاحية لتنفيذ هذه العملية.";
  }

  return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
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

export async function readPassportOcr(passportImage: File): Promise<PassportOcrResult> {
  const formData = new FormData();
  formData.append("passportImage", passportImage);

  const response = await fetch("/api/travelers/read-passport", {
    method: "POST",
    credentials: "include",
    body: formData
  });

  return requestJson<PassportOcrResult>(response);
}

export async function readCivilIdOcr(civilIdImage: File): Promise<CivilIdOcrResult> {
  const formData = new FormData();
  formData.append("civilIdImage", civilIdImage);

  const response = await fetch("/api/travelers/read-civil-id", {
    method: "POST",
    credentials: "include",
    body: formData
  });

  return requestJson<CivilIdOcrResult>(response);
}

