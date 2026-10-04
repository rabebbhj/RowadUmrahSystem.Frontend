export interface AuthPermissions {
  canAccessDashboard: boolean;
  canViewNotifications: boolean;
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

export interface AuthUser {
  isAuthenticated: boolean;
  email: string | null;
  fullName: string | null;
  roles: string[];
  permissions: AuthPermissions | null;
}

export interface LoginResult {
  succeeded: boolean;
  message: string;
  user: AuthUser | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterTravelerRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
  rememberMe: boolean;
}

export interface EmailRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
}

const fetchOptions = {
  credentials: "include" as const,
  headers: {
    "Content-Type": "application/json"
  }
};

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await fetch("/api/auth/me", {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function login(request: LoginRequest): Promise<LoginResult> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    ...fetchOptions,
    body: JSON.stringify(request)
  });

  const data = (await response.json()) as LoginResult;

  if (!response.ok) {
    return data;
  }

  return data;
}

export async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
}

async function postAuth(path: string, body: unknown): Promise<LoginResult> {
  const response = await fetch(path, {
    method: "POST",
    ...fetchOptions,
    body: JSON.stringify(body)
  });

  const data = (await response.json()) as LoginResult;

  return data;
}

export function registerTraveler(request: RegisterTravelerRequest): Promise<LoginResult> {
  return postAuth("/api/auth/register-traveler", request);
}

export function verifyEmail(request: VerifyEmailRequest): Promise<LoginResult> {
  return postAuth("/api/auth/verify-email", request);
}

export function resendEmailCode(request: EmailRequest): Promise<LoginResult> {
  return postAuth("/api/auth/resend-email-code", request);
}

export function forgotPassword(request: EmailRequest): Promise<LoginResult> {
  return postAuth("/api/auth/forgot-password", request);
}

export function resetPassword(request: ResetPasswordRequest): Promise<LoginResult> {
  return postAuth("/api/auth/reset-password", request);
}
