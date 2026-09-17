import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { paymentMethodLabel, PaymentMethod } from "../../api/invoices";
import {
  createExpense,
  getExpense,
  getExpenseLookups,
  getExpenses,
  type ExpenseDetail,
  type ExpenseListItem,
  type ExpenseLookups
} from "../../api/expenses";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type ExpensesPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR");
}

function todayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function expenseMethodClass(method: PaymentMethod) {
  switch (method) {
    case PaymentMethod.Cash:
      return "pill warning";
    case PaymentMethod.BankTransfer:
      return "pill info";
    case PaymentMethod.KNet:
      return "pill success";
    case PaymentMethod.Cheque:
      return "pill danger";
    default:
      return "pill";
  }
}

export function ExpensesPanel({ user, activePath, onNavigate, onLogout }: ExpensesPanelProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [lookups, setLookups] = useState<ExpenseLookups | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [lookupsError, setLookupsError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDetail | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [formExpenseDate, setFormExpenseDate] = useState(todayInputValue());
  const [formCategory, setFormCategory] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [formBankAccountId, setFormBankAccountId] = useState("");
  const [formTripId, setFormTripId] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const expenseStats = useMemo(() => {
    const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
    const linkedToTrips = expenses.filter((item) => item.tripId !== null).length;

    return { totalAmount, linkedToTrips };
  }, [expenses]);

  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      setLookupsLoading(true);
      setLookupsError(null);

      try {
        const data = await getExpenseLookups();
        if (cancelled) {
          return;
        }

        setLookups(data);
        setFormBankAccountId((current) =>
          current || (data.bankAccounts[0] ? String(data.bankAccounts[0].id) : "")
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setLookupsError(error instanceof Error ? error.message : "تعذر تحميل بيانات المصاريف المساعدة");
      } finally {
        if (!cancelled) {
          setLookupsLoading(false);
        }
      }
    }

    loadLookups();

    return () => {
      cancelled = true;
    };
  }, [onLogout]);

  useEffect(() => {
    let cancelled = false;

    async function loadExpenses() {
      setLoading(true);
      setError(null);

      try {
        const items = await getExpenses({
          search: searchTerm || undefined,
          fromDate: fromDate || null,
          toDate: toDate || null,
          bankAccountId: bankAccountId ? Number(bankAccountId) : null
        });

        if (cancelled) {
          return;
        }

        setExpenses(items);
        setSelectedExpenseId((current) =>
          current && items.some((item) => item.id === current)
            ? current
            : items.length > 0
              ? items[0].id
              : null
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "تعذر تحميل المصاريف");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadExpenses();

    return () => {
      cancelled = true;
    };
  }, [bankAccountId, fromDate, onLogout, refreshToken, searchTerm, toDate]);

  useEffect(() => {
    let cancelled = false;

    async function loadSelectedExpense() {
      if (!selectedExpenseId) {
        setSelectedExpense(null);
        return;
      }

      setSelectedLoading(true);
      setSelectedError(null);

      try {
        const expense = await getExpense(selectedExpenseId);
        if (!cancelled) {
          setSelectedExpense(expense);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setSelectedError(error instanceof Error ? error.message : "تعذر تحميل تفاصيل المصروف");
      } finally {
        if (!cancelled) {
          setSelectedLoading(false);
        }
      }
    }

    loadSelectedExpense();

    return () => {
      cancelled = true;
    };
  }, [onLogout, selectedExpenseId]);

  async function handleCreateExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const amount = Number(formAmount);

      if (!formCategory.trim()) {
        setCreateError("التصنيف مطلوب.");
        return;
      }

      if (!formTitle.trim()) {
        setCreateError("العنوان مطلوب.");
        return;
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        setCreateError("يجب أن يكون المبلغ أكبر من صفر.");
        return;
      }

      const result = await createExpense({
        expenseDate: formExpenseDate,
        category: formCategory,
        title: formTitle,
        amount,
        paymentMethod: formPaymentMethod,
        bankAccountId: formBankAccountId ? Number(formBankAccountId) : null,
        tripId: formTripId ? Number(formTripId) : null,
        notes: formNotes
      });

      setCreateSuccess(`تم إنشاء المصروف رقم ${result.id} بنجاح.`);
      setSelectedExpenseId(result.id);
      setRefreshToken((value) => value + 1);
      setFormTitle("");
      setFormAmount("");
      setFormNotes("");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setCreateError(error instanceof Error ? error.message : "تعذر إنشاء المصروف");
    } finally {
      setCreateLoading(false);
    }
  }

  function handleResetFilters() {
    setSearchInput("");
    setSearchTerm("");
    setFromDate("");
    setToDate("");
    setBankAccountId("");
  }

  function handleResetForm() {
    setFormExpenseDate(todayInputValue());
    setFormCategory("");
    setFormTitle("");
    setFormAmount("");
    setFormPaymentMethod(PaymentMethod.Cash);
    setFormBankAccountId(lookups?.bankAccounts[0] ? String(lookups.bankAccounts[0].id) : "");
    setFormTripId("");
    setFormNotes("");
    setCreateError(null);
    setCreateSuccess(null);
  }

  return (
    <div className="app-shell">
      <SignedInSidebar
        user={user}
        activePath={activePath}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="main-panel">
        <header className="hero">
          <div>
            <span className="eyebrow">المحاسبة</span>
            <h2>المصاريف</h2>
            <p>
              تسجيل ومتابعة مصاريف التشغيل والرحلات وربطها بالحسابات والقيود المحاسبية.
            </p>
          </div>

          <form
            className="search-bar"
            onSubmit={(event) => {
              event.preventDefault();
              setSearchTerm(searchInput);
            }}
          >
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="بحث بالتصنيف أو العنوان أو الملاحظات أو البنك أو الرحلة"
            />
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            <select value={bankAccountId} onChange={(event) => setBankAccountId(event.target.value)}>
              <option value="">كل الحسابات البنكية</option>
              {lookups?.bankAccounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <button type="submit">بحث</button>
            <button type="button" className="ghost" onClick={handleResetFilters}>
              إعادة
            </button>
          </form>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <span>عدد المصاريف</span>
            <strong>{expenses.length}</strong>
          </article>
          <article className="stat-card">
            <span>إجمالي المبلغ</span>
            <strong>{expenseStats.totalAmount.toFixed(3)}</strong>
          </article>
          <article className="stat-card">
            <span>مرتبطة برحلات</span>
            <strong>{expenseStats.linkedToTrips}</strong>
          </article>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <h3>مصروف جديد</h3>
            <span>{lookupsLoading ? "جاري تحميل البيانات..." : "جاهز للإضافة"}</span>
          </div>

          {lookupsError && <div className="state-box error">{lookupsError}</div>}
          {createError && <div className="state-box error">{createError}</div>}
          {createSuccess && <div className="state-box">{createSuccess}</div>}

          <form className="invoice-form" onSubmit={handleCreateExpense}>
            <label>
              تاريخ المصروف
              <input
                type="date"
                value={formExpenseDate}
                onChange={(event) => setFormExpenseDate(event.target.value)}
              />
            </label>

            <label>
              التصنيف
              <input
                type="text"
                value={formCategory}
                onChange={(event) => setFormCategory(event.target.value)}
                placeholder="نقل، فندق، مكتب..."
              />
            </label>

            <label>
              العنوان
              <input
                type="text"
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
                placeholder="وصف المصروف"
              />
            </label>

            <label>
              المبلغ
              <input
                type="number"
                step="0.001"
                min="0"
                value={formAmount}
                onChange={(event) => setFormAmount(event.target.value)}
                placeholder="0.000"
              />
            </label>

            <label>
              طريقة الدفع
              <select
                value={formPaymentMethod}
                onChange={(event) => setFormPaymentMethod(Number(event.target.value) as PaymentMethod)}
              >
                <option value={PaymentMethod.Cash}>{paymentMethodLabel(PaymentMethod.Cash)}</option>
                <option value={PaymentMethod.BankTransfer}>
                  {paymentMethodLabel(PaymentMethod.BankTransfer)}
                </option>
                <option value={PaymentMethod.KNet}>{paymentMethodLabel(PaymentMethod.KNet)}</option>
                <option value={PaymentMethod.Visa}>{paymentMethodLabel(PaymentMethod.Visa)}</option>
                <option value={PaymentMethod.Cheque}>{paymentMethodLabel(PaymentMethod.Cheque)}</option>
                <option value={PaymentMethod.Other}>{paymentMethodLabel(PaymentMethod.Other)}</option>
              </select>
            </label>

            <label>
              الحساب البنكي
              <select
                value={formBankAccountId}
                onChange={(event) => setFormBankAccountId(event.target.value)}
              >
                <option value="">بدون حساب بنكي</option>
                {lookups?.bankAccounts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              الرحلة
              <select value={formTripId} onChange={(event) => setFormTripId(event.target.value)}>
                <option value="">بدون رحلة</option>
                {lookups?.trips.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="invoice-full">
              الملاحظات
              <textarea
                value={formNotes}
                onChange={(event) => setFormNotes(event.target.value)}
                placeholder="ملاحظات اختيارية"
              />
            </label>

            <div className="invoice-form-actions invoice-full">
              <button type="submit" disabled={createLoading}>
                {createLoading ? "جاري الحفظ..." : "إنشاء المصروف"}
              </button>
              <button type="button" className="ghost-row" onClick={handleResetForm}>
                إعادة النموذج
              </button>
            </div>
          </form>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <h3>قائمة المصاريف</h3>
            <span>{loading ? "جاري التحميل..." : `عدد السجلات: ${expenses.length}`}</span>
          </div>

          {loading && <div className="state-box">جاري تحميل المصاريف...</div>}

          {!loading && error && <div className="state-box error">{error}</div>}

          {!loading && !error && expenses.length === 0 && (
            <div className="state-box">لا توجد مصاريف مطابقة للفلاتر الحالية.</div>
          )}

          {!loading && !error && expenses.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>التصنيف</th>
                    <th>العنوان</th>
                    <th>المبلغ</th>
                    <th>الطريقة</th>
                    <th>الحساب البنكي</th>
                    <th>الرحلة</th>
                    <th>القيد</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.expenseDate)}</td>
                      <td>{item.category}</td>
                      <td>
                        <strong>{item.title}</strong>
                      </td>
                      <td>{item.amount.toFixed(3)}</td>
                      <td>
                        <span className={expenseMethodClass(item.paymentMethod)}>
                          {paymentMethodLabel(item.paymentMethod)}
                        </span>
                      </td>
                      <td>{item.bankAccountName || "-"}</td>
                      <td>{item.tripLabel || "-"}</td>
                      <td>{item.journalEntryNumber || "-"}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="ghost-row"
                            onClick={() => setSelectedExpenseId(item.id)}
                          >
                            عرض
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <h3>تفاصيل المصروف</h3>
            <span>{selectedExpense ? `#${selectedExpense.id}` : "لا يوجد اختيار"}</span>
          </div>

          {selectedLoading && <div className="state-box">جاري تحميل تفاصيل المصروف...</div>}

          {selectedError && <div className="state-box error">{selectedError}</div>}

          {!selectedLoading && !selectedError && !selectedExpense && (
            <div className="state-box">اختر مصروفاً من القائمة لعرض تفاصيله.</div>
          )}

          {selectedExpense && (
            <>
              <div className="invoice-details-grid">
                <div className="invoice-summary-box">
                  <div className="invoice-summary-row">
                    <span>تاريخ المصروف</span>
                    <strong>{formatDate(selectedExpense.expenseDate)}</strong>
                  </div>
                  <div className="invoice-summary-row">
                    <span>تاريخ الإنشاء</span>
                    <strong>{formatDateTime(selectedExpense.createdAt)}</strong>
                  </div>
                  <div className="invoice-summary-row">
                    <span>التصنيف</span>
                    <strong>{selectedExpense.category}</strong>
                  </div>
                  <div className="invoice-summary-row">
                    <span>العنوان</span>
                    <strong>{selectedExpense.title}</strong>
                  </div>
                </div>

                <div className="invoice-summary-box">
                  <div className="invoice-summary-row">
                    <span>المبلغ</span>
                    <strong>{selectedExpense.amount.toFixed(3)}</strong>
                  </div>
                  <div className="invoice-summary-row">
                    <span>طريقة الدفع</span>
                    <strong>{paymentMethodLabel(selectedExpense.paymentMethod)}</strong>
                  </div>
                  <div className="invoice-summary-row">
                    <span>الحساب البنكي</span>
                    <strong>{selectedExpense.bankAccountName || "-"}</strong>
                  </div>
                  <div className="invoice-summary-row">
                    <span>الرحلة</span>
                    <strong>{selectedExpense.tripLabel || "-"}</strong>
                  </div>
                </div>

                <div className="invoice-summary-box">
                  <div className="invoice-summary-row">
                    <span>القيد اليومي</span>
                    <strong>{selectedExpense.journalEntryNumber || "-"}</strong>
                  </div>
                  <div className="invoice-summary-row">
                    <span>تاريخ القيد</span>
                    <strong>
                      {selectedExpense.journalEntryDate ? formatDate(selectedExpense.journalEntryDate) : "-"}
                    </strong>
                  </div>
                  <div className="invoice-summary-row">
                    <span>مرحل</span>
                    <strong>{selectedExpense.journalEntryIsPosted ? "نعم" : "لا"}</strong>
                  </div>
                  <div className="invoice-summary-row">
                    <span>رابط القيد</span>
                    <strong>{selectedExpense.journalEntryId ? `#${selectedExpense.journalEntryId}` : "-"}</strong>
                  </div>
                </div>
              </div>

              <div className="section-title-row">
                <h3>الملاحظات</h3>
                <span>{selectedExpense.notes ? "توجد ملاحظات" : "لا توجد ملاحظات"}</span>
              </div>
              <div className="state-box">
                {selectedExpense.notes ? selectedExpense.notes : "لا توجد ملاحظات مسجلة."}
              </div>

              <div className="section-title-row">
                <h3>حالة القيد</h3>
                <span>{selectedExpense.journalEntryId ? "مرتبط" : "غير مرتبط"}</span>
              </div>
              {selectedExpense.journalEntryId ? (
                <div className="state-box">
                  {selectedExpense.journalEntryDescription || "يوجد قيد مرتبط بدون وصف."}
                </div>
              ) : (
                <div className="state-box">لا يوجد قيد يومي مرتبط بهذا المصروف.</div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
