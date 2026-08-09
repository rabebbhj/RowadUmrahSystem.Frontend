export interface UserListItem {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  isMainAdmin: boolean;
  roles: string[];
  hasPermissions: boolean;
}

export interface UserCreateRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface UserPermissions {
  id: number;
  userId: string;
  userFullName: string;
  userEmail: string;
  canManageUsers: boolean;
  canViewTravelers: boolean;
  canCreateTravelers: boolean;
  canEditTravelers: boolean;
  canArchiveTravelers: boolean;
  canRestoreTravelers: boolean;
  canViewTrips: boolean;
  canCreateTrips: boolean;
  canArchiveTrips: boolean;
  canRestoreTrips: boolean;
  canViewDocuments: boolean;
  canUploadDocuments: boolean;
  canArchiveDocuments: boolean;
  canRestoreDocuments: boolean;
  canViewBlocks: boolean;
  canBlockTravelers: boolean;
  canUnblockTravelers: boolean;
  canViewReports: boolean;
  canExportReports: boolean;
  canViewAuditLogs: boolean;
  canViewAccounting: boolean;
  canManageAccounting: boolean;
  canManageChartOfAccounts: boolean;
  canManageJournalEntries: boolean;
  canManageInvoices: boolean;
  canManageReceiptVouchers: boolean;
  canManagePaymentVouchers: boolean;
  canManageExpenses: boolean;
  canManageBanks: boolean;
  canViewFinancialReports: boolean;
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
      // Fall back to the text body below.
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

export async function getUsers(): Promise<UserListItem[]> {
  const response = await fetch("/api/users", {
    credentials: "include"
  });

  return requestJson<UserListItem[]>(response);
}

export async function createUser(request: UserCreateRequest): Promise<UserListItem> {
  const response = await fetch("/api/users", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return requestJson<UserListItem>(response);
}

export async function toggleUserActive(id: string): Promise<UserListItem> {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}/toggle-active`, {
    method: "POST",
    credentials: "include"
  });

  return requestJson<UserListItem>(response);
}

export async function getUserPermissions(id: string): Promise<UserPermissions> {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}/permissions`, {
    credentials: "include"
  });

  return requestJson<UserPermissions>(response);
}

export async function updateUserPermissions(
  id: string,
  permissions: UserPermissions
): Promise<UserPermissions> {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}/permissions`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(permissions)
  });

  return requestJson<UserPermissions>(response);
}
