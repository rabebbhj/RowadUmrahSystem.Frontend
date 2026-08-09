import type { AuthUser } from "../../api/auth";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type FinancialReportsPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function FinancialReportsPanel({ user, activePath, onNavigate, onLogout }: FinancialReportsPanelProps) {
  const canAccess = user.roles.includes("Admin");

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">التقارير المالية</h1>
              <p className="text-muted mb-0">عرض الأرباح والخسائر، ميزان المراجعة، وكشوف الحساب.</p>
            </div>

            <button type="button" className="btn btn-light" onClick={() => onNavigate("/accounting")}>
              رجوع
            </button>
          </div>

          {!canAccess ? (
            <div className="alert alert-danger mb-0">ليس لديك صلاحية الدخول إلى التقارير المالية.</div>
          ) : (
            <div className="accounting-panel">
              <div className="accounting-panel-header">
                <div>
                  <h3>صفحة التقارير</h3>
                  <p>هذه الصفحة جاهزة للربط مع تقارير الميزان والأرباح والخسائر عند تجهيزها.</p>
                </div>
                <span className="accounting-panel-badge">Coming soon</span>
              </div>

              <div className="accounting-summary-row">
                <span>ميزان المراجعة</span>
                <strong>قيد الإعداد</strong>
              </div>

              <div className="accounting-summary-row">
                <span>الأرباح والخسائر</span>
                <strong>قيد الإعداد</strong>
              </div>

              <div className="accounting-summary-row">
                <span>كشف الحساب</span>
                <strong>قيد الإعداد</strong>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
