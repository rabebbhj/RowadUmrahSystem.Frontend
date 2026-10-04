export interface DashboardPermissions {
  canViewTravelers: boolean;
  canViewTrips: boolean;
  canViewDocuments: boolean;
  canViewBlocks: boolean;
  canViewReports: boolean;
  canViewAuditLogs: boolean;
}

export interface TopEmployee {
  employeeName: string;
  count: number;
}

export interface ExpiringPassport {
  id: number;
  fullName: string;
  passportNumber: string;
  nationality: string;
  passportExpiryDate: string | null;
}

export interface LatestAuditLog {
  action: string;
  employeeName: string;
  travelerName: string | null;
  details: string;
  createdAt: string;
}

export interface DashboardData {
  permissions: DashboardPermissions;
  travelersCount: number;
  deletedTravelersCount: number;
  tripsCount: number;
  blockedCount: number;
  documentsCount: number;
  deletedDocumentsCount: number;
  todayAuditCount: number;
  weekAuditCount: number;
  monthAuditCount: number;
  topEmployee: TopEmployee | null;
  recentTravelersCount: number;
  uploadedDocumentsThisMonth: number;
  expiringPassportsCount: number;
  expiredPassportsCount: number;
  expiringPassports: ExpiringPassport[];
  latestAuditLogs: LatestAuditLog[];
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();

  if ((response.headers.get("content-type") ?? "").includes("text/html") || /^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text)) {
    return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
  }

  return text || `API error: ${response.status}`;
}

export async function getDashboard(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard", {
    credentials: "include"
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<DashboardData>;
}
