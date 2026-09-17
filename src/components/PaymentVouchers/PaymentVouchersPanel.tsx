import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { paymentMethodLabel } from "../../api/invoices";
import { getPaymentVouchers, type PaymentVoucherListItem } from "../../api/paymentVouchers";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type PaymentVouchersPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR");
}

export function PaymentVouchersPanel({ user, activePath, onNavigate, onLogout }: PaymentVouchersPanelProps) {
  const [items, setItems] = useState<PaymentVoucherListItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPaymentVouchers({
          search: searchTerm || undefined,
          fromDate: fromDate || null,
          toDate: toDate || null
        });
        if (!cancelled) setItems(data);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }
        setError(error instanceof Error ? error.message : "تعذر تحميل سندات الصرف");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fromDate, onLogout, searchTerm, toDate]);

  function resetFilters() {
    setSearchInput("");
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-panel">
        <header className="hero">
          <div>
            <span className="eyebrow">المحاسبة</span>
            <h2>سندات الصرف</h2>
            <p>عرض المدفوعات الصادرة وربطها بالحسابات البنكية والقيود اليومية.</p>
          </div>
          <form className="search-bar" onSubmit={(event) => { event.preventDefault(); setSearchTerm(searchInput); }}>
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="بحث في سندات الصرف" />
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            <button type="submit">بحث</button>
            <button type="button" className="ghost" onClick={resetFilters}>إعادة</button>
          </form>
        </header>

        <section className="stats-grid">
          <article className="stat-card"><span>عدد السندات</span><strong>{items.length}</strong></article>
          <article className="stat-card"><span>إجمالي المبلغ</span><strong>{total.toFixed(3)}</strong></article>
          <article className="stat-card"><span>مرتبطة بالبنوك</span><strong>{items.filter((item) => item.bankAccountId).length}</strong></article>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <h3>سجل سندات الصرف</h3>
            <button type="button" onClick={() => onNavigate("/accounting")}>العودة للمحاسبة</button>
          </div>
          {loading && <div className="state-box">جاري تحميل سندات الصرف...</div>}
          {!loading && error && <div className="state-box error">{error}</div>}
          {!loading && !error && items.length === 0 && <div className="state-box">لا توجد سندات صرف مطابقة.</div>}
          {!loading && !error && items.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الرقم</th><th>التاريخ</th><th>صرف إلى</th><th>المبلغ</th><th>طريقة الدفع</th><th>البنك</th><th>القيد</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.voucherNumber}</strong></td>
                      <td>{formatDate(item.voucherDate)}</td>
                      <td>{item.paidTo}</td>
                      <td>{item.amount.toFixed(3)}</td>
                      <td>{paymentMethodLabel(item.paymentMethod)}</td>
                      <td>{item.bankAccountName || "-"}</td>
                      <td>{item.journalEntryNumber || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
