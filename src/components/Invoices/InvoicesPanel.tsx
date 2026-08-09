import { useEffect, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getInvoices, type InvoiceListItem, InvoiceStatus } from "../../api/invoices";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type InvoicesPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

function formatDateOnly(value: string) {
  return value ? value.slice(0, 10) : "-";
}

function getStatusBadge(status: InvoiceStatus) {
  switch (status) {
    case InvoiceStatus.Unpaid:
      return "badge bg-warning text-dark";
    case InvoiceStatus.PartiallyPaid:
      return "badge bg-info text-dark";
    case InvoiceStatus.Paid:
      return "badge bg-success";
    case InvoiceStatus.Cancelled:
      return "badge bg-danger";
    default:
      return "badge bg-secondary";
  }
}

function getStatusText(status: InvoiceStatus) {
  switch (status) {
    case InvoiceStatus.Unpaid:
      return "غير مدفوعة";
    case InvoiceStatus.PartiallyPaid:
      return "مدفوعة جزئيًا";
    case InvoiceStatus.Paid:
      return "مدفوعة";
    case InvoiceStatus.Cancelled:
      return "ملغاة";
    default:
      return "";
  }
}

export function InvoicesPanel({ user, activePath, onNavigate, onLogout }: InvoicesPanelProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "Unpaid" | "PartiallyPaid" | "Paid" | "Cancelled">("");
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInvoices() {
      setLoading(true);
      setError(null);

      try {
        const items = await getInvoices({
          search: searchTerm || undefined,
          status: statusFilter || null
        });

        if (!cancelled) {
          setInvoices(items);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load invoices");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInvoices();

    return () => {
      cancelled = true;
    };
  }, [onLogout, searchTerm, statusFilter]);

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">الفواتير</h1>
              <p className="text-muted mb-0">إدارة فواتير العملاء وربطها تلقائيًا بالقيود المحاسبية.</p>
            </div>

            <div className="d-flex gap-2 mt-3 mt-md-0">
              <button type="button" className="btn btn-gold" onClick={() => onNavigate("/invoices/create")}>
                إنشاء فاتورة
              </button>

              <button type="button" className="btn btn-light" onClick={() => onNavigate("/accounting")}>
                رجوع
              </button>
            </div>
          </div>

          <form
            className="row g-3 mb-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSearchTerm(searchInput);
            }}
          >
            <div className="col-md-6">
              <input
                name="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="form-control"
                placeholder="بحث برقم الفاتورة، اسم العميل، أو رقم الجواز..."
              />
            </div>

            <div className="col-md-4">
              <select
                name="status"
                className="form-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "" | "Unpaid" | "PartiallyPaid" | "Paid" | "Cancelled")
                }
              >
                <option value="">كل الحالات</option>
                <option value="Unpaid">غير مدفوعة</option>
                <option value="PartiallyPaid">مدفوعة جزئيًا</option>
                <option value="Paid">مدفوعة</option>
                <option value="Cancelled">ملغاة</option>
              </select>
            </div>

            <div className="col-md-2 d-grid">
              <button className="btn btn-outline-gold" type="submit">
                بحث
              </button>
            </div>
          </form>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل الفواتير...</div>}

          {!loading && !error && invoices.length === 0 ? (
            <div className="alert alert-info mb-0">لا توجد فواتير.</div>
          ) : (
            !loading &&
            !error && (
              <div className="table-responsive">
                <table className="table rowad-table align-middle">
                  <thead>
                    <tr>
                      <th>رقم الفاتورة</th>
                      <th>التاريخ</th>
                      <th>العميل</th>
                      <th>المسافر</th>
                      <th>الإجمالي</th>
                      <th>المدفوع</th>
                      <th>المتبقي</th>
                      <th>الحالة</th>
                      <th className="text-center">إجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {invoices.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.invoiceNumber}</strong>
                          {item.currencyCode && (
                            <>
                              <br />
                              <small className="text-muted">{item.currencyCode}</small>
                            </>
                          )}
                        </td>

                        <td>{formatDateOnly(item.invoiceDate)}</td>

                        <td>
                          {item.customerName}
                          {item.passportNumber && (
                            <>
                              <br />
                              <small className="text-muted">{item.passportNumber}</small>
                            </>
                          )}
                        </td>

                        <td>{item.travelerName || "-"}</td>

                        <td>{item.totalAmount.toFixed(3)}</td>
                        <td>{item.paidAmount.toFixed(3)}</td>
                        <td>{item.remainingAmount.toFixed(3)}</td>

                        <td>
                          <span className={getStatusBadge(item.status)}>{getStatusText(item.status)}</span>
                        </td>

                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-gold"
                            onClick={() => onNavigate(`/invoices/${item.id}`)}
                          >
                            عرض
                          </button>
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
