import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { getCurrentUser, login, logout, type AuthUser } from "./api/auth";
import LandingPage from "./components/landingpage/LandingPage";
import { LoginPanel } from "./components/Auth/LoginPanel";
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

const publicPaths = new Set(["/", "/services", "/about", "/corporate", "/contact"]);

function currentPath() {
  return window.location.pathname || "/";
}

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : 0;
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
  const isPublicLanding = publicPaths.has(path) && !user?.isAuthenticated;

  if (isPublicLanding) {
    return <LandingPage />;
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

  if (path === "/admin" || path === "/travelers") return <TravelersPanel {...commonProps} />;
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

  return <TravelersPanel {...commonProps} />;
}
