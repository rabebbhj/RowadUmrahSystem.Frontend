import { useEffect, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getCustomer, toggleCustomerStatus, type CustomerDetail } from "../../api/customers";
import { formatDateTime } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";
import { customerStatusClass, customerStatusText } from "./customerHelpers";

type CustomersDetailsPanelProps = {
  user: AuthUser;
  activePath: string;
  customerId: number;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function CustomersDetailsPanel({ user, activePath, customerId, onNavigate, onLogout }: CustomersDetailsPanelProps) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const item = await getCustomer(customerId);
        if (!cancelled) {
          setCustomer(item);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load customer");
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
  }, [customerId, onLogout]);

  async function handleToggleStatus() {
    if (!customer) {
      return;
    }

    if (!window.confirm(customer.isActive ? "هل تريد تعطيل هذا العميل؟" : "هل تريد تفعيل هذا العميل؟")) {
      return;
    }

    setToggling(true);
    setActionMessage(null);
    setError(null);

    try {
      const updated = await toggleCustomerStatus(customer.id);
      setCustomer(updated);
      setActionMessage(updated.isActive ? "تم تفعيل العميل." : "تم تعطيل العميل.");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "Failed to update customer status");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">تفاصيل العميل</h1>
              <p className="text-muted mb-0">عرض بيانات العميل وربطه بالمسافر والحالة الحالية.</p>
            </div>

            <div className="d-flex gap-2 mt-3 mt-md-0">
              <button
                type="button"
                className="btn btn-outline-gold"
                onClick={() => onNavigate(`/customers/${customerId}/edit`)}
                disabled={!customer}
              >
                تعديل
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => void handleToggleStatus()}
                disabled={!customer || toggling}
              >
                {customer?.isActive ? "تعطيل" : "تفعيل"}
              </button>

              <button type="button" className="btn btn-light" onClick={() => onNavigate("/customers")}>
                رجوع
              </button>
            </div>
          </div>

          {actionMessage && <div className="alert alert-success">{actionMessage}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل بيانات العميل...</div>}

          {customer && (
            <>
              <div className="row g-4 mb-4">
                <div className="col-md-3">
                  <div className="stat-card">
                    <span>الاسم</span>
                    <strong>{customer.name}</strong>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="stat-card">
                    <span>الرقم المدني</span>
                    <strong>{customer.civilId}</strong>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="stat-card">
                    <span>رقم الجواز</span>
                    <strong>{customer.passportNumber}</strong>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="stat-card">
                    <span>الحالة</span>
                    <strong>{customerStatusText(customer.isActive)}</strong>
                  </div>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="page-card h-100">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h4 className="section-title mb-1">معلومات العميل</h4>
                        <p className="text-muted mb-0">البيانات الأساسية والربط بالمسافر.</p>
                      </div>
                      <span className={customerStatusClass(customer.isActive)}>{customerStatusText(customer.isActive)}</span>
                    </div>

                    <div className="customer-summary-box">
                      <div className="customer-summary-row">
                        <span>الاسم</span>
                        <strong>{customer.name}</strong>
                      </div>
                      <div className="customer-summary-row">
                        <span>الرقم المدني</span>
                        <strong>{customer.civilId}</strong>
                      </div>
                      <div className="customer-summary-row">
                        <span>رقم الجواز</span>
                        <strong>{customer.passportNumber}</strong>
                      </div>
                      <div className="customer-summary-row">
                        <span>رقم الهاتف</span>
                        <strong>{customer.phoneNumber}</strong>
                      </div>
                      <div className="customer-summary-row">
                        <span>البريد الإلكتروني</span>
                        <strong>{customer.email}</strong>
                      </div>
                      <div className="customer-summary-row">
                        <span>المسافر</span>
                        <strong>{customer.travelerFullName || "-"}</strong>
                      </div>
                      <div className="customer-summary-row customer-full">
                        <span>العنوان</span>
                        <strong>{customer.address}</strong>
                      </div>
                      <div className="customer-summary-row">
                        <span>تاريخ الإنشاء</span>
                        <strong>{formatDateTime(customer.createdAt)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="page-card h-100">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h4 className="section-title mb-1">بيانات الربط</h4>
                        <p className="text-muted mb-0">العميل مرتبط بمسافر أم لا.</p>
                      </div>
                      <span className="accounting-panel-badge">Customer</span>
                    </div>

                    <div className="accounting-summary-row">
                      <span>المسافر المرتبط</span>
                      <strong>{customer.travelerFullName || "-"}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>رقم المسافر</span>
                      <strong>{customer.travelerId ?? "-"}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>الحالة</span>
                      <strong>{customerStatusText(customer.isActive)}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>تاريخ الإنشاء</span>
                      <strong>{formatDateTime(customer.createdAt)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
