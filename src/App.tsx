import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { getCurrentUser, login, logout, type AuthUser } from "./api/auth";
import LandingPage from "./components/landingpage/LandingPage";
import { LoginPanel } from "./components/Auth/LoginPanel";
import { DashboardPanel } from "./components/Dashboard/DashboardPanel";
import { TravelersPanel } from "./components/Travelers/TravelersPanel";
import { TravelersCreatePanel } from "./components/Travelers/TravelersCreatePanel";
import { TravelersDeletedPanel } from "./components/Travelers/TravelersDeletedPanel";
import { TravelersBlockedPanel } from "./components/Travelers/TravelersBlockedPanel";
import { TravelerDetailsPanel } from "./components/Travelers/TravelerDetailsPanel";
import { TravelerEditPanel } from "./components/Travelers/TravelerEditPanel";
import { TravelerDeletePanel } from "./components/Travelers/TravelerDeletePanel";
import { TravelerBlockPanel } from "./components/Travelers/TravelerBlockPanel";
import { TripsPanel } from "./components/Trips/TripsPanel";
import { TripsCreatePanel } from "./components/Trips/TripsCreatePanel";
import { TripsDeletedPanel } from "./components/Trips/TripsDeletedPanel";
import { UsersPanel } from "./components/Users/UsersPanel";
import { UsersCreatePanel } from "./components/Users/UsersCreatePanel";
import { UsersPermissionsPanel } from "./components/Users/UsersPermissionsPanel";
import { AccountingPanel } from "./components/Accounting/AccountingPanel";
import { FinancialReportsPanel } from "./components/Accounting/FinancialReportsPanel";
import { AccountsPanel } from "./components/Accounts/AccountsPanel";
import { AccountsCreatePanel } from "./components/Accounts/AccountsCreatePanel";
import { AccountsDetailsPanel } from "./components/Accounts/AccountsDetailsPanel";
import { AccountsEditPanel } from "./components/Accounts/AccountsEditPanel";
import { BankAccountsPanel } from "./components/BankAccounts/BankAccountsPanel";
import { CustomersPanel } from "./components/Customers/CustomersPanel";
import { CustomersCreatePanel } from "./components/Customers/CustomersCreatePanel";
import { CustomersDetailsPanel } from "./components/Customers/CustomersDetailsPanel";
import { CustomersEditPanel } from "./components/Customers/CustomersEditPanel";
import { InvoicesPanel } from "./components/Invoices/InvoicesPanel";
import { InvoicesCreatePanel } from "./components/Invoices/InvoicesCreatePanel";
import { InvoicesDetailsPanel } from "./components/Invoices/InvoicesDetailsPanel";
import { ExpensesPanel } from "./components/Expenses/ExpensesPanel";
import { JournalEntriesPanel } from "./components/JournalEntries/JournalEntriesPanel";
import { ReceiptVouchersPanel } from "./components/ReceiptVouchers/ReceiptVouchersPanel";
import { PaymentVouchersPanel } from "./components/PaymentVouchers/PaymentVouchersPanel";
import { SignedInSidebar } from "./components/Layout/SignedInSidebar";
import { AdminPlaceholderPanel } from "./components/Layout/AdminPlaceholderPanel";

const publicPaths = new Set(["/", "/globalview", "/booking/login"]);
const backendAdminOrigin = "http://localhost:5045";
const frontendDevPorts = new Set(["5173"]);
const adminRoutePrefixes = [
  "/login",
  "/admin",
  "/travelers",
  "/trips",
  "/users",
  "/accounting",
  "/documents",
  "/audit-logs",
  "/auditlogs",
  "/notifications",
  "/financial-reports",
  "/accounts",
  "/bank-accounts",
  "/customers",
  "/invoices",
  "/expenses",
  "/journal-entries",
  "/receipt-vouchers",
  "/payment-vouchers"
];

function currentPath() {
  return (window.location.pathname || "/").toLowerCase();
}

function isAdminRoute(pathname: string) {
  const normalizedPath = pathname.toLowerCase();
  return adminRoutePrefixes.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));
}

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

function hasRole(user: AuthUser, role: string) {
  return user.roles.some((item) => item.toLowerCase() === role.toLowerCase());
}

function can(user: AuthUser, permission: keyof NonNullable<AuthUser["permissions"]>) {
  return hasRole(user, "Admin") || Boolean(user.permissions?.[permission]);
}

export default function App() {
  const [path, setPath] = useState(currentPath);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("admin@rowad.local");
  const [loginPassword, setLoginPassword] = useState("Admin@12345");
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const navigate = useCallback((nextPath: string) => {
    window.history.pushState({}, "", nextPath);
    setPath(currentPath());
  }, []);

  const refreshUser = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const current = await getCurrentUser();
      setUser(current);
    } catch (error) {
      setUser(null);
      setAuthError(error instanceof Error ? error.message : "Failed to read current user.");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      // Clear local state even when the cookie has already expired server-side.
    }

    setUser(null);
    navigate("/login");
  }, [navigate]);

  const handleLoginSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoginLoading(true);
      setLoginError(null);

      try {
        const result = await login({
          email: loginEmail,
          password: loginPassword,
          rememberMe
        });

        if (!result.succeeded || !result.user) {
          setLoginError(result.message || "Login failed.");
          return;
        }

        setUser(result.user);
        navigate("/admin");
      } catch (error) {
        setLoginError(error instanceof Error ? error.message : "Login failed.");
      } finally {
        setLoginLoading(false);
      }
    },
    [loginEmail, loginPassword, navigate, rememberMe]
  );

  const loginPanel = (
    <LoginPanel
      email={loginEmail}
      password={loginPassword}
      rememberMe={rememberMe}
      loading={loginLoading}
      error={loginError}
      authError={authError}
      onEmailChange={setLoginEmail}
      onPasswordChange={setLoginPassword}
      onRememberMeChange={setRememberMe}
      onSubmit={handleLoginSubmit}
    />
  );

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    function handlePopState() {
      setPath(currentPath());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const segments = useMemo(() => path.split("/").filter(Boolean), [path]);

  if (frontendDevPorts.has(window.location.port) && isAdminRoute(path)) {
    window.location.replace(`${backendAdminOrigin}${path}${window.location.search}${window.location.hash}`);
    return <div className="state-box">Redirection vers l'administration...</div>;
  }

  const isPublicLanding = publicPaths.has(path);

  if (isPublicLanding) {
    return <LandingPage initialAuthView={path === "/booking/login" ? "login" : null} />;
  }

  if (path === "/login") {
    return loginPanel;
  }

  if (authLoading) {
    return <div className="state-box">Loading session...</div>;
  }

  if (!user?.isAuthenticated) {
    return loginPanel;
  }

  if (authError) {
    return <div className="state-box error">{authError}</div>;
  }

  const commonProps = {
    user,
    activePath: path,
    onNavigate: navigate,
    onLogout: handleLogout
  };

  const forbiddenPanel = (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={path} onNavigate={navigate} onLogout={handleLogout} />
      <main className="main-panel">
        <div className="state-box error">لا تملك صلاحية الدخول إلى هذه الصفحة.</div>
      </main>
    </div>
  );

  if (path === "/admin" && !can(user, "canAccessDashboard")) return forbiddenPanel;
  if (path.startsWith("/travelers/create") && !can(user, "canCreateTravelers")) return forbiddenPanel;
  if (path.startsWith("/travelers/deleted") && !can(user, "canRestoreTravelers")) return forbiddenPanel;
  if (path.startsWith("/travelers/blocked") && !can(user, "canViewBlocks")) return forbiddenPanel;
  if (segments[0] === "travelers" && segments[2] === "edit" && !can(user, "canEditTravelers")) return forbiddenPanel;
  if (segments[0] === "travelers" && segments[2] === "delete" && !can(user, "canArchiveTravelers")) return forbiddenPanel;
  if (segments[0] === "travelers" && segments[2] === "block" && !can(user, "canBlockTravelers")) return forbiddenPanel;
  if (segments[0] === "travelers" && !can(user, "canViewTravelers")) return forbiddenPanel;
  if (path.startsWith("/trips/create") && !can(user, "canCreateTrips")) return forbiddenPanel;
  if (path.startsWith("/trips/deleted") && !can(user, "canRestoreTrips")) return forbiddenPanel;
  if (segments[0] === "trips" && !can(user, "canViewTrips")) return forbiddenPanel;
  if (segments[0] === "users" && !hasRole(user, "Admin")) return forbiddenPanel;
  if (path === "/accounting" && !can(user, "canViewAccounting")) return forbiddenPanel;
  if (path === "/documents" && !can(user, "canViewDocuments")) return forbiddenPanel;
  if ((path === "/audit-logs" || path === "/auditlogs") && !can(user, "canViewAuditLogs")) return forbiddenPanel;
  if (path === "/financial-reports" && !can(user, "canViewFinancialReports")) return forbiddenPanel;
  if (segments[0] === "accounts" && !can(user, "canManageChartOfAccounts")) return forbiddenPanel;
  if (segments[0] === "bank-accounts" && !can(user, "canManageBanks")) return forbiddenPanel;
  if (segments[0] === "customers" && !can(user, "canViewAccounting")) return forbiddenPanel;
  if (segments[0] === "invoices" && !can(user, "canManageInvoices")) return forbiddenPanel;
  if (segments[0] === "expenses" && !can(user, "canManageExpenses")) return forbiddenPanel;
  if (segments[0] === "journal-entries" && !can(user, "canManageJournalEntries")) return forbiddenPanel;
  if (segments[0] === "receipt-vouchers" && !can(user, "canManageReceiptVouchers")) return forbiddenPanel;
  if (segments[0] === "payment-vouchers" && !can(user, "canManagePaymentVouchers")) return forbiddenPanel;

  if (path === "/admin") return <DashboardPanel {...commonProps} />;
  if (path === "/booking/login") return <TravelersCreatePanel {...commonProps} />;
  if (path === "/travelers") return <TravelersPanel {...commonProps} />;
  if (path === "/travelers/create") return <TravelersCreatePanel {...commonProps} />;
  if (path === "/travelers/deleted") return <TravelersDeletedPanel {...commonProps} />;
  if (path === "/travelers/blocked") return <TravelersBlockedPanel {...commonProps} />;
  if (segments[0] === "travelers" && segments[2] === "edit") {
    return <TravelerEditPanel {...commonProps} travelerId={parseId(segments[1])} />;
  }
  if (segments[0] === "travelers" && segments[2] === "delete") {
    return <TravelerDeletePanel {...commonProps} travelerId={parseId(segments[1])} />;
  }
  if (segments[0] === "travelers" && segments[2] === "block") {
    return <TravelerBlockPanel {...commonProps} travelerId={parseId(segments[1])} />;
  }
  if (segments[0] === "travelers" && segments[1]) {
    return <TravelerDetailsPanel {...commonProps} travelerId={parseId(segments[1])} />;
  }

  if (path === "/trips") return <TripsPanel {...commonProps} />;
  if (path === "/trips/deleted") return <TripsDeletedPanel {...commonProps} />;
  if (segments[0] === "trips" && segments[1] === "create") {
    return <TripsCreatePanel {...commonProps} travelerId={parseId(segments[2])} />;
  }

  if (path === "/users") return <UsersPanel {...commonProps} />;
  if (path === "/users/create") return <UsersCreatePanel {...commonProps} />;
  if (segments[0] === "users" && segments[2] === "permissions") {
    return <UsersPermissionsPanel {...commonProps} userId={segments[1] ?? ""} />;
  }

  if (path === "/accounting") return <AccountingPanel {...commonProps} />;
  if (path === "/documents") {
    return (
      <AdminPlaceholderPanel
        {...commonProps}
        eyebrow="Documents"
        title="الوثائق"
        description="إدارة الوثائق تتم من ملف المسافر داخل شاشة المسافرين."
        primaryActionLabel="فتح المسافرين"
        primaryActionPath="/travelers"
      />
    );
  }
  if (path === "/audit-logs" || path === "/auditlogs") {
    return (
      <AdminPlaceholderPanel
        {...commonProps}
        eyebrow="Audit"
        title="سجل العمليات"
        description="واجهة سجل العمليات في React جاهزة كمدخل من القائمة الرئيسية، ويمكن ربط الجدول التفصيلي بها لاحقاً."
      />
    );
  }
  if (path === "/notifications") {
    return (
      <AdminPlaceholderPanel
        {...commonProps}
        eyebrow="Notifications"
        title="الإشعارات"
        description="هنا تظهر إشعارات النظام الخاصة بالمستخدم الحالي."
      />
    );
  }
  if (path === "/financial-reports") return <FinancialReportsPanel {...commonProps} />;

  if (path === "/accounts") return <AccountsPanel {...commonProps} />;
  if (path === "/accounts/create") return <AccountsCreatePanel {...commonProps} />;
  if (segments[0] === "accounts" && segments[2] === "edit") {
    return <AccountsEditPanel {...commonProps} accountId={parseId(segments[1])} />;
  }
  if (segments[0] === "accounts" && segments[1]) {
    return <AccountsDetailsPanel {...commonProps} accountId={parseId(segments[1])} />;
  }

  if (path === "/bank-accounts") return <BankAccountsPanel {...commonProps} />;

  if (path === "/customers") return <CustomersPanel {...commonProps} />;
  if (path === "/customers/create") return <CustomersCreatePanel {...commonProps} />;
  if (segments[0] === "customers" && segments[2] === "edit") {
    return <CustomersEditPanel {...commonProps} customerId={parseId(segments[1])} />;
  }
  if (segments[0] === "customers" && segments[1]) {
    return <CustomersDetailsPanel {...commonProps} customerId={parseId(segments[1])} />;
  }

  if (path === "/invoices") return <InvoicesPanel {...commonProps} />;
  if (path === "/invoices/create") return <InvoicesCreatePanel {...commonProps} />;
  if (segments[0] === "invoices" && segments[1]) {
    return <InvoicesDetailsPanel {...commonProps} invoiceId={parseId(segments[1])} />;
  }

  if (path === "/expenses") return <ExpensesPanel {...commonProps} />;
  if (path === "/journal-entries") return <JournalEntriesPanel {...commonProps} />;
  if (path === "/receipt-vouchers") return <ReceiptVouchersPanel {...commonProps} />;
  if (path === "/payment-vouchers") return <PaymentVouchersPanel {...commonProps} />;

  return <DashboardPanel {...commonProps} />;
}
