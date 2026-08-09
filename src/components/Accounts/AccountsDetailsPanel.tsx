import { useEffect, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getAccount, type AccountDetail, AccountType } from "../../api/accounts";
import { formatDateTime } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type AccountsDetailsPanelProps = {
  user: AuthUser;
  activePath: string;
  accountId: number;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

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

function formatAmount(value: number) {
  return value.toFixed(3);
}

export function AccountsDetailsPanel({ user, activePath, accountId, onNavigate, onLogout }: AccountsDetailsPanelProps) {
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const item = await getAccount(accountId);
        if (!cancelled) {
          setAccount(item);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load account");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [accountId, onLogout]);

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">تفاصيل الحساب</h1>
              <p className="text-muted mb-0">عرض بيانات الحساب وآخر الحركات المسجلة عليه.</p>
            </div>

            <div className="d-flex gap-2 mt-3 mt-md-0">
              <button
                type="button"
                className="btn btn-outline-gold"
                onClick={() => onNavigate(`/accounts/${accountId}/edit`)}
                disabled={!account}
              >
                تعديل
              </button>

              <button type="button" className="btn btn-light" onClick={() => onNavigate("/accounts")}>
                رجوع
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل الحساب...</div>}

          {account && (
            <>
              <div className="row g-4 mb-4">
                <div className="col-md-3">
                  <div className="stat-card">
                    <span>رقم الحساب</span>
                    <strong>{account.code}</strong>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="stat-card">
                    <span>إجمالي المدين</span>
                    <strong>{formatAmount(account.totalDebit)}</strong>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="stat-card">
                    <span>إجمالي الدائن</span>
                    <strong>{formatAmount(account.totalCredit)}</strong>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="stat-card">
                    <span>الرصيد</span>
                    <strong>{formatAmount(account.balance)}</strong>
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-lg-6">
                  <div className="page-card h-100">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h4 className="section-title mb-1">بيانات الحساب</h4>
                        <p className="text-muted mb-0">معلومات الحساب الأساسية والتصنيف.</p>
                      </div>
                      <span className="accounting-panel-badge">Account</span>
                    </div>

                    <div className="accounting-summary-row">
                      <span>اسم الحساب</span>
                      <strong>{account.name}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>نوع الحساب</span>
                      <strong>{accountTypeText(account.type)}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>الحساب الرئيسي</span>
                      <strong>{account.parentAccountName ?? "-"}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>الحالة</span>
                      <strong>{account.isActive ? "فعال" : "معطل"}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>حساب نظامي</span>
                      <strong>{account.isSystemAccount ? "نعم" : "لا"}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>تاريخ الإنشاء</span>
                      <strong>{formatDateTime(account.createdAt)}</strong>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="page-card h-100">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h4 className="section-title mb-1">ملخص الحساب</h4>
                        <p className="text-muted mb-0">الأرقام الأساسية المرتبطة بالحساب.</p>
                      </div>
                      <span className="accounting-panel-badge">Summary</span>
                    </div>

                    <div className="accounting-summary-row">
                      <span>المدين</span>
                      <strong>{formatAmount(account.totalDebit)}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>الدائن</span>
                      <strong>{formatAmount(account.totalCredit)}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>الرصيد الحالي</span>
                      <strong>{formatAmount(account.balance)}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>عدد الحركات</span>
                      <strong>{account.recentLines.length}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="page-card">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                  <div>
                    <h4 className="section-title mb-1">آخر الحركات</h4>
                    <p className="text-muted mb-0">آخر 100 حركة على هذا الحساب.</p>
                  </div>
                  <span className="accounting-panel-badge">Lines</span>
                </div>

                <div className="table-responsive">
                  <table className="table rowad-table align-middle">
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>رقم القيد</th>
                        <th>البيان</th>
                        <th>مدين</th>
                        <th>دائن</th>
                        <th>ملاحظات</th>
                      </tr>
                    </thead>

                    <tbody>
                      {account.recentLines.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            لا توجد حركات على هذا الحساب.
                          </td>
                        </tr>
                      ) : (
                        account.recentLines.map((line) => (
                          <tr key={line.id}>
                            <td>{formatDateTime(line.entryDate)}</td>
                            <td>{line.entryNumber}</td>
                            <td>{line.description}</td>
                            <td>{formatAmount(line.debit)}</td>
                            <td>{formatAmount(line.credit)}</td>
                            <td>{line.notes || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
