import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getBankAccounts, type BankAccountListItem } from "../../api/bankAccounts";
import { getExpenses, type ExpenseListItem } from "../../api/expenses";
import { getInvoices, type InvoiceListItem } from "../../api/invoices";
import { getPaymentVouchers, type PaymentVoucherListItem } from "../../api/paymentVouchers";
import { getReceiptVouchers, type ReceiptVoucherListItem } from "../../api/receiptVouchers";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type AccountingPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

function money(value: number) {
  return `${value.toFixed(3)} د.ك`;
}

function calcTotal(items: Array<{ amount: number }>) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

function calcInvoiceTotal(items: InvoiceListItem[]) {
  return items.reduce((sum, item) => sum + item.totalAmount, 0);
}

export function AccountingPanel({ user, activePath, onNavigate, onLogout }: AccountingPanelProps) {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [receipts, setReceipts] = useState<ReceiptVoucherListItem[]>([]);
  const [payments, setPayments] = useState<PaymentVoucherListItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [invoiceItems, receiptItems, paymentItems, expenseItems, bankItems] = await Promise.all([
          getInvoices(),
          getReceiptVouchers(),
          getPaymentVouchers(),
          getExpenses(),
          getBankAccounts()
        ]);

        if (cancelled) {
          return;
        }

        setInvoices(invoiceItems);
        setReceipts(receiptItems);
        setPayments(paymentItems);
        setExpenses(expenseItems);
        setBankAccounts(bankItems);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load accounting data");
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
  }, [onLogout]);

  const totals = useMemo(() => {
    const totalInvoices = calcInvoiceTotal(invoices);
    const totalReceipts = calcTotal(receipts);
    const totalPayments = calcTotal(payments);
    const totalExpenses = calcTotal(expenses);
    const bankOpeningBalances = bankAccounts.reduce((sum, item) => sum + item.openingBalance, 0);
    const netBalance = totalReceipts + bankOpeningBalances - totalPayments - totalExpenses;
    const outstandingInvoices = totalInvoices - totalReceipts;
    const totalOutflow = totalPayments + totalExpenses;

    return {
      totalInvoices,
      totalReceipts,
      totalPayments,
      totalExpenses,
      bankOpeningBalances,
      netBalance,
      outstandingInvoices,
      totalOutflow
    };
  }, [bankAccounts, expenses, invoices, payments, receipts]);

  const canManageAccounting = user.roles.includes("Admin");

  if (!canManageAccounting) {
    return (
      <div className="app-shell">
        <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />
        <main className="main-panel">
          <div className="page-card">
            <h1 className="page-title mb-2">المحاسبة</h1>
            <div className="alert alert-danger mb-0">ليس لديك صلاحية الدخول إلى المحاسبة.</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="accounting-dashboard">
          <div className="accounting-hero mb-4">
            <div className="accounting-hero-content">
              <div className="accounting-kicker">النظام المالي</div>

              <h1>المحاسبة</h1>

              <p>
                مركز موحد لإدارة دليل الحسابات، القيود، الفواتير، سندات القبض والصرف، المصاريف، البنوك، والتقارير
                المالية.
              </p>

              <div className="accounting-hero-actions">
                <button type="button" className="btn btn-gold" onClick={() => onNavigate("/invoices/create")}>
                  🧾 إنشاء فاتورة
                </button>

                <button type="button" className="btn btn-outline-gold" onClick={() => onNavigate("/receipt-vouchers")}>
                  💵 سند قبض
                </button>

                <button type="button" className="btn btn-light" onClick={() => onNavigate("/payment-vouchers")}>
                  💸 سند صرف
                </button>
              </div>
            </div>

            <div className="accounting-hero-panel">
              <span>الرصيد الصافي</span>
              <strong>{money(totals.netBalance)}</strong>
              <small>المقبوضات + الأرصدة الافتتاحية - المدفوعات والمصاريف</small>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل البيانات المالية...</div>}

          <div className="accounting-stats-grid mb-4">
            <div className="accounting-stat-card">
              <div className="accounting-stat-icon">🧾</div>
              <div>
                <span>إجمالي الفواتير</span>
                <strong>{money(totals.totalInvoices)}</strong>
                <small>قيمة الفواتير المسجلة</small>
              </div>
            </div>

            <div className="accounting-stat-card">
              <div className="accounting-stat-icon">💵</div>
              <div>
                <span>المقبوضات</span>
                <strong>{money(totals.totalReceipts)}</strong>
                <small>إجمالي سندات القبض</small>
              </div>
            </div>

            <div className="accounting-stat-card">
              <div className="accounting-stat-icon">💸</div>
              <div>
                <span>المدفوعات والمصاريف</span>
                <strong>{money(totals.totalOutflow)}</strong>
                <small>الصرف + المصروفات</small>
              </div>
            </div>

            <div className="accounting-stat-card">
              <div className="accounting-stat-icon">🏦</div>
              <div>
                <span>الأرصدة الافتتاحية</span>
                <strong>{money(totals.bankOpeningBalances)}</strong>
                <small>أرصدة البنوك والصندوق</small>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-5">
              <div className="accounting-panel h-100">
                <div className="accounting-panel-header">
                  <div>
                    <h3>ملخص مالي سريع</h3>
                    <p>نظرة مختصرة على الوضع المالي الحالي.</p>
                  </div>
                  <span className="accounting-panel-badge">Live</span>
                </div>

                <div className="accounting-summary-row">
                  <span>فواتير غير محصلة تقريبًا</span>
                  <strong>{money(totals.outstandingInvoices)}</strong>
                </div>

                <div className="accounting-summary-row">
                  <span>إجمالي المصاريف</span>
                  <strong>{money(totals.totalExpenses)}</strong>
                </div>

                <div className="accounting-summary-row">
                  <span>إجمالي سندات الصرف</span>
                  <strong>{money(totals.totalPayments)}</strong>
                </div>

                <div className="accounting-summary-row">
                  <span>صافي الحركة</span>
                  <strong>{money(totals.netBalance)}</strong>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="accounting-panel h-100">
                <div className="accounting-panel-header">
                  <div>
                    <h3>جاهزية النظام المحاسبي</h3>
                    <p>الخطوات الأساسية قبل التشغيل الكامل.</p>
                  </div>
                  <span className="accounting-panel-badge">ERP</span>
                </div>

                <div className="accounting-progress-list">
                  <div className="accounting-progress-item">
                    <div className="progress-dot done" />
                    <div>
                      <strong>دليل الحسابات</strong>
                      <span>الأساس الذي تُبنى عليه القيود والتقارير.</span>
                    </div>
                  </div>

                  <div className="accounting-progress-item">
                    <div className="progress-dot pending" />
                    <div>
                      <strong>القيود اليومية</strong>
                      <span>كل فاتورة أو سند سيتم ربطه بقيد محاسبي تلقائي.</span>
                    </div>
                  </div>

                  <div className="accounting-progress-item">
                    <div className="progress-dot pending" />
                    <div>
                      <strong>الفواتير والسندات</strong>
                      <span>إدارة التحصيل والصرف وربطها بالحسابات.</span>
                    </div>
                  </div>

                  <div className="accounting-progress-item">
                    <div className="progress-dot pending" />
                    <div>
                      <strong>التقارير المالية</strong>
                      <span>ميزان المراجعة، الأرباح والخسائر، وكشوف الحساب.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="accounting-section-title mb-3">
            <div>
              <h3>أقسام المحاسبة</h3>
              <p>اختر القسم الذي تريد إدارته.</p>
            </div>
          </div>

          <div className="accounting-modules-grid">
            <button type="button" className="accounting-module-card" onClick={() => onNavigate("/accounts")}>
              <div className="module-icon">📒</div>
              <div>
                <h4>دليل الحسابات</h4>
                <p>إدارة الحسابات الرئيسية والفرعية مثل الصندوق، البنك، الإيرادات، والمصاريف.</p>
              </div>
              <span>فتح</span>
            </button>

            <button type="button" className="accounting-module-card" onClick={() => onNavigate("/journal-entries")}>
              <div className="module-icon">🧮</div>
              <div>
                <h4>القيود اليومية</h4>
                <p>عرض وتدقيق القيود المحاسبية الناتجة عن العمليات المالية.</p>
              </div>
              <span>فتح</span>
            </button>

            <button type="button" className="accounting-module-card" onClick={() => onNavigate("/invoices")}>
              <div className="module-icon">🧾</div>
              <div>
                <h4>الفواتير</h4>
                <p>إنشاء وإدارة فواتير العملاء والرحلات ومتابعة التحصيل.</p>
              </div>
              <span>فتح</span>
            </button>

            <button type="button" className="accounting-module-card" onClick={() => onNavigate("/receipt-vouchers")}>
              <div className="module-icon">💵</div>
              <div>
                <h4>سندات القبض</h4>
                <p>تسجيل المبالغ المستلمة نقدًا أو عبر البنك من العملاء.</p>
              </div>
              <span>فتح</span>
            </button>

            <button type="button" className="accounting-module-card" onClick={() => onNavigate("/payment-vouchers")}>
              <div className="module-icon">💸</div>
              <div>
                <h4>سندات الصرف</h4>
                <p>تسجيل المدفوعات الخارجة من الصندوق أو البنك.</p>
              </div>
              <span>فتح</span>
            </button>

            <button type="button" className="accounting-module-card" onClick={() => onNavigate("/expenses")}>
              <div className="module-icon">📉</div>
              <div>
                <h4>المصاريف</h4>
                <p>إدارة مصاريف الشركة والرحلات مثل الفنادق، النقل، والتشغيل.</p>
              </div>
              <span>فتح</span>
            </button>

            <button type="button" className="accounting-module-card" onClick={() => onNavigate("/bank-accounts")}>
              <div className="module-icon">🏦</div>
              <div>
                <h4>البنوك والصندوق</h4>
                <p>إدارة الحسابات البنكية وأرصدة البداية والصندوق النقدي.</p>
              </div>
              <span>فتح</span>
            </button>

            <button type="button" className="accounting-module-card" onClick={() => onNavigate("/financial-reports")}>
              <div className="module-icon">📊</div>
              <div>
                <h4>التقارير المالية</h4>
                <p>عرض الأرباح والخسائر، ميزان المراجعة، وكشوف الحساب.</p>
              </div>
              <span>فتح</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
