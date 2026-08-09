export interface AuthUser {
  isAuthenticated: boolean;
  email: string | null;
  fullName: string | null;
  roles: string[];
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
