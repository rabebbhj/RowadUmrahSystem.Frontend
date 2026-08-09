import { useEffect, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { cancelInvoice, getInvoice, type InvoiceDetail, InvoiceStatus } from "../../api/invoices";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type InvoicesDetailsPanelProps = {
  user: AuthUser;
  activePath: string;
  invoiceId: number;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

function formatDateOnly(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "-";
}

function getStatusClass(status: InvoiceStatus) {
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

function getPaymentMethodText(value: number) {
  switch (value) {
    case 1:
      return "نقدي";
    case 2:
      return "تحويل بنكي";
    case 3:
      return "KNet";
    case 4:
      return "Visa";
    case 5:
      return "شيك";
    case 6:
      return "أخرى";
    default:
      return String(value);
  }
}

export function InvoicesDetailsPanel({
  user,
  activePath,
  invoiceId,
  onNavigate,
  onLogout
}: InvoicesDetailsPanelProps) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const item = await getInvoice(invoiceId);
        if (!cancelled) {
          setInvoice(item);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load invoice");
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
  }, [invoiceId, onLogout]);

  async function handleCancel() {
    if (!invoice) {
      return;
    }

    if (!window.confirm("هل أنت متأكد من إلغاء هذه الفاتورة؟")) {
      return;
    }

    setCancelling(true);
    setActionMessage(null);
    setError(null);

    try {
      const updated = await cancelInvoice(invoice.id);
      setInvoice(updated);
      setActionMessage("تم إلغاء الفاتورة.");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "Failed to cancel invoice");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">تفاصيل الفاتورة</h1>
              <p className="text-muted mb-0">عرض الفاتورة والبنود والقيد المحاسبي المرتبط بها.</p>
            </div>

            <div className="d-flex gap-2 mt-3 mt-md-0">
              {invoice && invoice.status !== InvoiceStatus.Cancelled && invoice.status !== InvoiceStatus.Paid && (
                <button type="button" className="btn btn-outline-danger" onClick={() => void handleCancel()} disabled={cancelling}>
                  إلغاء الفاتورة
                </button>
              )}

              <button type="button" className="btn btn-light" onClick={() => onNavigate("/invoices")}>
                رجوع
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {actionMessage && <div className="alert alert-success">{actionMessage}</div>}
          {loading && <div className="state-box">جاري تحميل الفاتورة...</div>}

          {invoice && (
            <>
              <div className="row g-4 mb-4">
                <div className="col-md-3">
                  <div className="stat-card">
                    <span>رقم الفاتورة</span>
                    <strong>{invoice.invoiceNumber}</strong>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="stat-card">
                    <span>الإجمالي النهائي</span>
                    <strong>{invoice.totalAmount.toFixed(3)}</strong>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="stat-card">
                    <span>المدفوع</span>
                    <strong>{invoice.paidAmount.toFixed(3)}</strong>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="stat-card">
                    <span>المتبقي</span>
                    <strong>{invoice.remainingAmount.toFixed(3)}</strong>
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-lg-6">
                  <div className="accounting-panel h-100">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h3>بيانات الفاتورة</h3>
                        <p className="text-muted mb-0">معلومات العميل والرحلة.</p>
                      </div>

                      <span className={getStatusClass(invoice.status)}>{getStatusText(invoice.status)}</span>
                    </div>

                    <div className="accounting-summary-row">
                      <span>العميل</span>
                      <strong>{invoice.customerName}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>رقم الجواز</span>
                      <strong>{invoice.passportNumber || "-"}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>المسافر</span>
                      <strong>{invoice.travelerName || "-"}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>الرحلة</span>
                      <strong>{invoice.tripLabel || "-"}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>تاريخ الفاتورة</span>
                      <strong>{formatDateOnly(invoice.invoiceDate)}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>تاريخ الاستحقاق</span>
                      <strong>{formatDateOnly(invoice.dueDate)}</strong>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="accounting-panel h-100">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h3>معلومات مالية</h3>
                        <p className="text-muted mb-0">العملة، طريقة الدفع، ومركز التكلفة.</p>
                      </div>
                      <span className="accounting-panel-badge">Finance</span>
                    </div>

                    <div className="accounting-summary-row">
                      <span>العملة</span>
                      <strong>{invoice.currencyCode || "-"}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>مركز التكلفة</span>
                      <strong>{invoice.costCenterCode || "-"}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>شروط الدفع</span>
                      <strong>{invoice.paymentTermName || "-"}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>طريقة الدفع</span>
                      <strong>{getPaymentMethodText(invoice.paymentMethod)}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>رقم المرجع</span>
                      <strong>{invoice.referenceNumber || "-"}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>القيد المحاسبي</span>
                      <strong>{invoice.journalEntryNumber || "-"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="accounting-panel mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                  <div>
                    <h3>بنود الفاتورة</h3>
                    <p className="text-muted mb-0">الخدمات والأسعار والخصومات والضرائب.</p>
                  </div>
                  <span className="accounting-panel-badge">Items</span>
                </div>

                <div className="table-responsive">
                  <table className="table rowad-table align-middle">
                    <thead>
                      <tr>
                        <th>الوصف</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>الخصم</th>
                        <th>الضريبة %</th>
                        <th>الإجمالي</th>
                      </tr>
                    </thead>

                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.description}</td>
                          <td>{item.quantity.toFixed(3)}</td>
                          <td>{item.unitPrice.toFixed(3)}</td>
                          <td>{item.discountAmount.toFixed(3)}</td>
                          <td>{item.taxRate.toFixed(2)}</td>
                          <td>
                            <strong>{item.lineTotal.toFixed(3)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-lg-7">
                  <div className="accounting-panel h-100">
                    <h3>ملاحظات</h3>
                    <p className="text-muted mb-0">{invoice.notes || "لا توجد ملاحظات."}</p>
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="accounting-panel h-100">
                    <h3>الملخص المالي</h3>

                    <div className="accounting-summary-row">
                      <span>الإجمالي قبل الخصم</span>
                      <strong>{invoice.subTotal.toFixed(3)}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>إجمالي الخصم</span>
                      <strong>{invoice.discountAmount.toFixed(3)}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>إجمالي الضريبة</span>
                      <strong>{invoice.taxAmount.toFixed(3)}</strong>
                    </div>

                    <div className="accounting-summary-row">
                      <span>الإجمالي النهائي</span>
                      <strong>{invoice.totalAmount.toFixed(3)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {invoice.journalEntryLines.length > 0 && (
                <div className="accounting-panel">
                  <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                    <div>
                      <h3>القيد المحاسبي المرتبط</h3>
                      <p className="text-muted mb-0">القيد الذي تم إنشاؤه تلقائيًا عند إصدار الفاتورة.</p>
                    </div>
                    <span className="accounting-panel-badge">{invoice.journalEntryNumber || "-"}</span>
                  </div>

                  <div className="table-responsive">
                    <table className="table rowad-table align-middle">
                      <thead>
                        <tr>
                          <th>الحساب</th>
                          <th>مدين</th>
                          <th>دائن</th>
                          <th>ملاحظات</th>
                        </tr>
                      </thead>

                      <tbody>
                        {invoice.journalEntryLines.map((line) => (
                          <tr key={line.id}>
                            <td>
                              <strong>{line.accountCode}</strong>
                              <br />
                              <small className="text-muted">{line.accountName}</small>
                            </td>
                            <td>{line.debit.toFixed(3)}</td>
                            <td>{line.credit.toFixed(3)}</td>
                            <td>{line.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
