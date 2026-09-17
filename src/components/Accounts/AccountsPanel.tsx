import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import {
  exportAccounts,
  getAccounts,
  toggleAccountStatus,
  type AccountListItem,
  AccountType
} from "../../api/accounts";
import { formatDateTime } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type AccountsPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

type AccountStatusFilter = "all" | "active" | "inactive";

const ACCOUNT_TYPE_OPTIONS: AccountType[] = [
  AccountType.Asset,
  AccountType.Liability,
  AccountType.Equity,
  AccountType.Revenue,
  AccountType.Expense
];

function accountTypeText(type: AccountType) {
  switch (type) {
    case AccountType.Asset:
      return "أصول";
    case AccountType.Liability:
      return "التزامات";
    case AccountType.Equity:
      return "حقوق ملكية";
    case AccountType.Revenue:
      return "إيرادات";
    case AccountType.Expense:
      return "مصروفات";
    default:
      return "غير محدد";
  }
}

function createStatusText(isActive: boolean) {
  return isActive ? "فعال" : "معطل";
}

export function AccountsPanel({ user, activePath, onNavigate, onLogout }: AccountsPanelProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccountType | "">("");
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>("all");
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccounts() {
      setLoading(true);
      setError(null);

      try {
        const items = await getAccounts({
          search: searchTerm || undefined,
          type: typeFilter === "" ? null : typeFilter,
          isActive: statusFilter === "all" ? null : statusFilter === "active"
        });

        if (!cancelled) {
          setAccounts(items);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "تعذر تحميل الحسابات");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAccounts();

    return () => {
      cancelled = true;
    };
  }, [onLogout, refreshToken, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((item) => item.isActive).length;
    const inactive = accounts.filter((item) => !item.isActive).length;
    const system = accounts.filter((item) => item.isSystemAccount).length;
    return { total, active, inactive, system };
  }, [accounts]);

  async function handleExport() {
    setExporting(true);

    try {
      const { blob, filename } = await exportAccounts();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      setActionMessage("تم بدء التصدير.");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setActionMessage(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function handleToggleStatus(id: number) {
    if (!window.confirm("هل أنت متأكد من تغيير حالة الحساب؟")) {
      return;
    }

    setActionMessage(null);

    try {
      const updated = await toggleAccountStatus(id);
      setActionMessage(updated.isActive ? "تم تفعيل الحساب بنجاح." : "تم تعطيل الحساب بنجاح.");
      setRefreshToken((current) => current + 1);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setActionMessage(error instanceof Error ? error.message : "تعذر تحديث الحساب");
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">دليل الحسابات</h1>
              <p className="text-muted mb-0">إدارة الحسابات الرئيسية والفرعية المستخدمة في النظام المحاسبي.</p>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-3 mt-md-0">
              <button type="button" className="btn btn-gold" onClick={() => onNavigate("/accounts/create")}>
                إضافة حساب
              </button>

              <button type="button" className="btn btn-outline-gold" onClick={() => void handleExport()} disabled={exporting}>
                {exporting ? "جاري التصدير..." : "تصدير Excel"}
              </button>

              <button type="button" className="btn btn-light" onClick={() => onNavigate("/accounting")}>
                رجوع
              </button>
            </div>
          </div>

          <form className="row g-3 mb-4" onSubmit={(event) => {
            event.preventDefault();
            setSearchTerm(searchInput);
          }}>
            <div className="col-md-4">
              <input
                name="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="form-control"
                placeholder="بحث برقم الحساب أو الاسم..."
              />
            </div>

            <div className="col-md-3">
              <select
                name="type"
                className="form-select"
                value={typeFilter === "" ? "" : String(typeFilter)}
                onChange={(event) => setTypeFilter(event.target.value === "" ? "" : (Number(event.target.value) as AccountType))}
              >
                <option value="">كل الأنواع</option>
                {ACCOUNT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={String(type)}>
                    {accountTypeText(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <select
                name="isActive"
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as AccountStatusFilter)}
              >
                <option value="all">كل الحالات</option>
                <option value="active">فعال</option>
                <option value="inactive">معطل</option>
              </select>
            </div>

            <div className="col-md-2 d-grid">
              <button className="btn btn-outline-gold" type="submit">
                بحث
              </button>
            </div>
          </form>

          {actionMessage && <div className="alert alert-success">{actionMessage}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل الحسابات...</div>}

          {!loading && !error && accounts.length === 0 ? (
            <div className="alert alert-info mb-0">لا توجد حسابات مطابقة.</div>
          ) : (
            !loading &&
            !error && (
              <div className="table-responsive">
                <table className="table rowad-table align-middle">
                  <thead>
                    <tr>
                      <th>رقم الحساب</th>
                      <th>اسم الحساب</th>
                      <th>النوع</th>
                      <th>الحساب الرئيسي</th>
                      <th>الحالة</th>
                      <th>نظامي</th>
                      <th className="text-center">إجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {accounts.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.code}</strong>
                        </td>
                        <td>{item.name}</td>
                        <td>{accountTypeText(item.type)}</td>
                        <td>{item.parentAccountName || "-"}</td>
                        <td>
                          <span className={item.isActive ? "badge bg-success" : "badge bg-secondary"}>
                            {createStatusText(item.isActive)}
                          </span>
                        </td>
                        <td>
                          {item.isSystemAccount ? <span className="badge bg-warning text-dark">نعم</span> : <span className="text-muted">لا</span>}
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            <button type="button" className="btn btn-light" onClick={() => onNavigate(`/accounts/${item.id}`)}>
                              عرض
                            </button>

                            <button type="button" className="btn btn-outline-gold" onClick={() => onNavigate(`/accounts/${item.id}/edit`)}>
                              تعديل
                            </button>

                            {!item.isSystemAccount && (
                              <button type="button" className="btn btn-light" onClick={() => void handleToggleStatus(item.id)}>
                                {item.isActive ? "تعطيل" : "تفعيل"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
