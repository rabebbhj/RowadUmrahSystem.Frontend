import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import {
  getJournalEntries,
  toggleJournalEntryPosted,
  type JournalEntryListItem
} from "../../api/journalEntries";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type JournalEntriesPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR");
}

export function JournalEntriesPanel({ user, activePath, onNavigate, onLogout }: JournalEntriesPanelProps) {
  const [entries, setEntries] = useState<JournalEntryListItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isPosted, setIsPosted] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const totals = useMemo(() => {
    const debit = entries.reduce((sum, item) => sum + item.totalDebit, 0);
    const credit = entries.reduce((sum, item) => sum + item.totalCredit, 0);
    const posted = entries.filter((item) => item.isPosted).length;
    return { debit, credit, posted };
  }, [entries]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getJournalEntries({
          search: searchTerm || undefined,
          fromDate: fromDate || null,
          toDate: toDate || null,
          isPosted: isPosted === "" ? null : isPosted === "true"
        });

        if (!cancelled) {
          setEntries(data);
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }
        setError(error instanceof Error ? error.message : "تعذر تحميل القيود اليومية");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fromDate, isPosted, onLogout, refreshToken, searchTerm, toDate]);

  async function handleToggle(id: number) {
    try {
      await toggleJournalEntryPosted(id);
      setRefreshToken((value) => value + 1);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }
      setError(error instanceof Error ? error.message : "تعذر تحديث حالة القيد");
    }
  }

  function resetFilters() {
    setSearchInput("");
    setSearchTerm("");
    setFromDate("");
    setToDate("");
    setIsPosted("");
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-panel">
        <header className="hero">
          <div>
            <span className="eyebrow">المحاسبة</span>
            <h2>القيود اليومية</h2>
            <p>عرض ومراجعة وترحيل القيود المحاسبية المسجلة داخل النظام.</p>
          </div>
          <form className="search-bar" onSubmit={(event) => { event.preventDefault(); setSearchTerm(searchInput); }}>
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="بحث في القيود" />
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            <select value={isPosted} onChange={(event) => setIsPosted(event.target.value)}>
              <option value="">كل الحالات</option>
              <option value="true">مرحل</option>
              <option value="false">مسودة</option>
            </select>
            <button type="submit">بحث</button>
            <button type="button" className="ghost" onClick={resetFilters}>إعادة</button>
          </form>
        </header>

        <section className="stats-grid">
          <article className="stat-card"><span>عدد القيود</span><strong>{entries.length}</strong></article>
          <article className="stat-card"><span>القيود المرحلة</span><strong>{totals.posted}</strong></article>
          <article className="stat-card"><span>إجمالي المدين</span><strong>{totals.debit.toFixed(3)}</strong></article>
          <article className="stat-card"><span>إجمالي الدائن</span><strong>{totals.credit.toFixed(3)}</strong></article>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <h3>سجل القيود اليومية</h3>
            <button type="button" onClick={() => onNavigate("/accounting")}>العودة للمحاسبة</button>
          </div>
          {loading && <div className="state-box">جاري تحميل القيود اليومية...</div>}
          {!loading && error && <div className="state-box error">{error}</div>}
          {!loading && !error && entries.length === 0 && <div className="state-box">لا توجد قيود يومية مطابقة.</div>}
          {!loading && !error && entries.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الرقم</th><th>التاريخ</th><th>الوصف</th><th>المصدر</th><th>مدين</th><th>دائن</th><th>السطور</th><th>الحالة</th><th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.entryNumber}</strong></td>
                      <td>{formatDate(item.entryDate)}</td>
                      <td>{item.description}</td>
                      <td>{item.sourceType || "-"}</td>
                      <td>{item.totalDebit.toFixed(3)}</td>
                      <td>{item.totalCredit.toFixed(3)}</td>
                      <td>{item.lineCount}</td>
                      <td><span className={item.isPosted ? "pill success" : "pill warning"}>{item.isPosted ? "مرحل" : "مسودة"}</span></td>
                      <td><button type="button" className="ghost-row" onClick={() => void handleToggle(item.id)}>{item.isPosted ? "إلغاء الترحيل" : "ترحيل"}</button></td>
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
