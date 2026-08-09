import type { AuthUser } from "../../api/auth";

type SignedInSidebarProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function SignedInSidebar({
  user,
  activePath,
  onNavigate,
  onLogout
}: SignedInSidebarProps) {
  const canManageUsers = user.roles.includes("Admin");
  const canViewAccounting = user.roles.includes("Admin");

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-badge">R</div>
        <div>
          <div className="brand-title">Rowad Umrah</div>
          <div className="brand-subtitle">Backend + Frontend split</div>
        </div>
      </div>

      <div className="sidebar-card">
        <span className="eyebrow">Logged in</span>
        <h1>{user.fullName || user.email || "User"}</h1>
        <p>React talks to the ASP.NET Core API through clean routes.</p>
      </div>

      <nav className="sidebar-nav">
        <button
          type="button"
          className={activePath === "/" ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate("/")}
        >
          Travelers
        </button>
        <button
          type="button"
          className={activePath === "/trips" ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate("/trips")}
        >
          Trips
        </button>
        <button
          type="button"
          className={activePath === "/accounts" ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate("/accounts")}
        >
          Accounts
        </button>
        <button
          type="button"
          className={activePath === "/bank-accounts" ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate("/bank-accounts")}
        >
          Bank Accounts
        </button>
        {canViewAccounting && (
          <button
            type="button"
            className={activePath === "/accounting" ? "nav-link active" : "nav-link"}
            onClick={() => onNavigate("/accounting")}
          >
            Accounting
          </button>
        )}
        <button
          type="button"
          className={activePath === "/customers" ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate("/customers")}
        >
          Customers
        </button>
        <button
          type="button"
          className={activePath === "/invoices" ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate("/invoices")}
        >
          Invoices
        </button>
        <button
          type="button"
          className={activePath === "/receipt-vouchers" ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate("/receipt-vouchers")}
        >
          Receipt Vouchers
        </button>
        <button
          type="button"
          className={activePath === "/payment-vouchers" ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate("/payment-vouchers")}
        >
          Payment Vouchers
        </button>
        <button
          type="button"
          className={activePath === "/journal-entries" ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate("/journal-entries")}
        >
          Journal Entries
        </button>
        <button
          type="button"
          className={activePath === "/expenses" ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate("/expenses")}
        >
          Expenses
        </button>
        {canManageUsers && (
          <button
            type="button"
            className={activePath === "/users" ? "nav-link active" : "nav-link"}
            onClick={() => onNavigate("/users")}
          >
            Users
          </button>
        )}
      </nav>

      <div className="sidebar-note">
        <span>Backend</span>
        <strong>localhost:5000</strong>
      </div>

      <button className="logout-button" type="button" onClick={onLogout}>
        Logout
      </button>
    </aside>
  );
}
