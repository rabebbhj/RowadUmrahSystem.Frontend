import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import {
  createBankAccount,
  getBankAccount,
  getBankAccounts,
  toggleBankAccountStatus,
  type BankAccountDetail,
  type BankAccountListItem,
  type BankAccountUpsertRequest,
  updateBankAccount
} from "../../api/bankAccounts";
import { formatDateTime } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type BankAccountsPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

type BankAccountFormState = {
  bankName: string;
  accountNumber: string;
  iban: string;
  openingBalance: string;
  isCashBox: boolean;
  isActive: boolean;
};

type BankAccountStatusFilter = "all" | "active" | "inactive";

function createEmptyBankAccountForm(): BankAccountFormState {
  return {
    bankName: "",
    accountNumber: "",
    iban: "",
    openingBalance: "0",
    isCashBox: false,
    isActive: true
  };
}

export function BankAccountsPanel({ user, activePath, onNavigate, onLogout }: BankAccountsPanelProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BankAccountStatusFilter>("all");
  const [bankAccounts, setBankAccounts] = useState<BankAccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingBankAccountId, setEditingBankAccountId] = useState<number | null>(null);
  const [form, setForm] = useState<BankAccountFormState>(createEmptyBankAccountForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | null>(null);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccountDetail | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [togglingBankAccountId, setTogglingBankAccountId] = useState<number | null>(null);

  const stats = useMemo(() => {
    const total = bankAccounts.length;
    const active = bankAccounts.filter((item) => item.isActive).length;
    const cashBoxes = bankAccounts.filter((item) => item.isCashBox).length;
    const totalOpeningBalance = bankAccounts.reduce((sum, item) => sum + item.openingBalance, 0);

    return { total, active, cashBoxes, totalOpeningBalance };
  }, [bankAccounts]);

  const filteredBankAccounts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return bankAccounts.filter((item) => {
      const matchesTerm =
        !term ||
        [item.bankName, item.accountNumber, item.iban].join(" ").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.isActive) ||
        (statusFilter === "inactive" && !item.isActive);

      return matchesTerm && matchesStatus;
    });
  }, [bankAccounts, searchTerm, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadBankAccounts() {
      setLoading(true);
      setError(null);

      try {
        const items = await getBankAccounts({
          search: searchTerm || undefined,
          isActive:
            statusFilter === "all"
              ? null
              : statusFilter === "active"
                ? true
                : false
        });

        if (cancelled) {
          return;
        }

        setBankAccounts(items);
        setSelectedBankAccountId((current) => {
          if (current && items.some((item) => item.id === current)) {
            return current;
          }

          return items[0]?.id ?? null;
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "تعذر تحميل الحسابات البنكية");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBankAccounts();
    return () => {
      cancelled = true;
    };
  }, [onLogout, refreshToken, searchTerm, statusFilter]);

  useEffect(() => {
    const bankAccountId = selectedBankAccountId;

    if (bankAccountId === null) {
      setSelectedBankAccount(null);
      return;
    }

    let cancelled = false;

    async function loadDetails() {
      setSelectedLoading(true);
      setSelectedError(null);

      try {
        const details = await getBankAccount(bankAccountId as number);
        if (!cancelled) {
          setSelectedBankAccount(details);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setSelectedError(error instanceof Error ? error.message : "تعذر تحميل بيانات الحساب البنكي");
        setSelectedBankAccount(null);
      } finally {
        if (!cancelled) {
          setSelectedLoading(false);
        }
      }
    }

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [onLogout, refreshToken, selectedBankAccountId]);

  function beginCreate() {
    setMode("create");
    setEditingBankAccountId(null);
    setForm(createEmptyBankAccountForm());
    setFormError(null);
    setFormMessage(null);
  }

  function beginEdit(item: BankAccountListItem) {
    setMode("edit");
    setEditingBankAccountId(item.id);
    setForm({
      bankName: item.bankName,
      accountNumber: item.accountNumber,
      iban: item.iban,
      openingBalance: String(item.openingBalance),
      isCashBox: item.isCashBox,
      isActive: item.isActive
    });
    setFormError(null);
    setFormMessage(null);
    setSelectedBankAccountId(item.id);
  }

  async function handleToggleStatus(id: number) {
    setActionMessage(null);
    setTogglingBankAccountId(id);

    try {
      const updated = await toggleBankAccountStatus(id);
      setActionMessage(updated.isActive ? `تم تفعيل الحساب ${updated.bankName}.` : `تم تعطيل الحساب ${updated.bankName}.`);
      setRefreshToken((value) => value + 1);
      setSelectedBankAccountId(updated.id);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setActionMessage(error instanceof Error ? error.message : "تعذر تحديث الحساب البنكي");
    } finally {
      setTogglingBankAccountId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormMessage(null);
    setActionMessage(null);

    const payload: BankAccountUpsertRequest = {
      bankName: form.bankName.trim(),
      accountNumber: form.accountNumber.trim(),
      iban: form.iban.trim(),
      openingBalance: Number(form.openingBalance) || 0,
      isCashBox: form.isCashBox,
      isActive: form.isActive
    };

    try {
      const saved =
        mode === "edit" && editingBankAccountId
          ? await updateBankAccount(editingBankAccountId, payload)
          : await createBankAccount(payload);

      setFormMessage(mode === "edit" ? "تم تحديث الحساب البنكي بنجاح." : "تم إنشاء الحساب البنكي بنجاح.");
      setSelectedBankAccountId(saved.id);
      setRefreshToken((value) => value + 1);

      if (mode === "create") {
        setMode("create");
        setEditingBankAccountId(null);
        setForm(createEmptyBankAccountForm());
        setFormError(null);
      } else {
        setMode("edit");
        setEditingBankAccountId(saved.id);
        setForm({
          bankName: saved.bankName,
          accountNumber: saved.accountNumber,
          iban: saved.iban,
          openingBalance: String(saved.openingBalance),
          isCashBox: saved.isCashBox,
          isActive: saved.isActive
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setFormError(error instanceof Error ? error.message : "تعذر حفظ الحساب البنكي");
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-panel">
        <header className="hero">
          <div>
            <span className="eyebrow">المحاسبة</span>
            <h2>البنوك والصناديق</h2>
            <p>إدارة الحسابات البنكية والصناديق النقدية داخل النظام.</p>
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
              placeholder="بحث باسم البنك أو رقم الحساب أو الآيبان"
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as BankAccountStatusFilter)}>
              <option value="all">كل الحالات</option>
              <option value="active">فعال</option>
              <option value="inactive">معطل</option>
            </select>
            <button type="submit">بحث</button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setSearchInput("");
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              إعادة
            </button>
            <button type="button" className="ghost" onClick={beginCreate}>
              حساب بنكي جديد
            </button>
          </form>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <span>الإجمالي</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="stat-card">
            <span>الحسابات الفعالة</span>
            <strong>{stats.active}</strong>
          </article>
          <article className="stat-card">
            <span>الصناديق النقدية</span>
            <strong>{stats.cashBoxes}</strong>
          </article>
          <article className="stat-card">
            <span>الرصيد الافتتاحي</span>
            <strong>{stats.totalOpeningBalance.toFixed(3)}</strong>
          </article>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <h3>{mode === "edit" ? "تعديل حساب بنكي" : "إضافة حساب بنكي"}</h3>
            <span>{mode === "edit" ? "تحديث بيانات حساب موجود" : "تسجيل حساب بنكي جديد"}</span>
          </div>

          {formError && <div className="state-box error">{formError}</div>}
          {formMessage && <div className="state-box">{formMessage}</div>}
          {actionMessage && <div className="state-box">{actionMessage}</div>}
          {error && <div className="state-box error">{error}</div>}

          <form className="account-form bank-account-form" onSubmit={handleSubmit}>
            <label>
              اسم البنك
              <input
                type="text"
                value={form.bankName}
                onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))}
                placeholder="مثال: بنك الراجحي"
              />
            </label>
            <label>
              رقم الحساب
              <input
                type="text"
                value={form.accountNumber}
                onChange={(event) =>
                  setForm((current) => ({ ...current, accountNumber: event.target.value }))
                }
                placeholder="1234567890"
              />
            </label>
            <label>
              IBAN
              <input
                type="text"
                value={form.iban}
                onChange={(event) => setForm((current) => ({ ...current, iban: event.target.value }))}
                placeholder="SA00..."
              />
            </label>
            <label>
              الرصيد الافتتاحي
              <input
                type="number"
                step="0.001"
                value={form.openingBalance}
                onChange={(event) =>
                  setForm((current) => ({ ...current, openingBalance: event.target.value }))
                }
              />
            </label>
            <label className="checkbox-row account-full">
              <input
                type="checkbox"
                checked={form.isCashBox}
                onChange={(event) => setForm((current) => ({ ...current, isCashBox: event.target.checked }))}
              />
              صندوق نقدي
            </label>
            <label className="checkbox-row account-full">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              الحساب فعال
            </label>
            <div className="account-form-actions account-full">
              <button type="submit" className="btn btn-gold" disabled={formLoading}>
                {formLoading ? "جاري الحفظ..." : mode === "edit" ? "حفظ التعديلات" : "إنشاء الحساب"}
              </button>
              {mode === "edit" && (
                <button type="button" className="ghost-row" onClick={beginCreate}>
                  إلغاء التعديل
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <h3>قائمة الحسابات البنكية</h3>
            <span>{searchTerm ? `بحث: ${searchTerm}` : "كل الحسابات البنكية"}</span>
          </div>

          {loading && <div className="state-box">جاري تحميل الحسابات البنكية...</div>}
          {!loading && !error && filteredBankAccounts.length === 0 && (
            <div className="state-box">لا توجد حسابات بنكية مطابقة.</div>
          )}

          {!loading && !error && filteredBankAccounts.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>البنك</th>
                    <th>رقم الحساب</th>
                    <th>IBAN</th>
                    <th>الرصيد الافتتاحي</th>
                    <th>صندوق نقدي</th>
                    <th>الحالة</th>
                    <th>الحركات</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBankAccounts.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.bankName}</strong>
                      </td>
                      <td>{item.accountNumber || "-"}</td>
                      <td>{item.iban || "-"}</td>
                      <td>{item.openingBalance.toFixed(3)}</td>
                      <td>{item.isCashBox ? "نعم" : "لا"}</td>
                      <td>
                        <span className={item.isActive ? "pill success" : "pill danger"}>
                          {item.isActive ? "فعال" : "معطل"}
                        </span>
                      </td>
                      <td>{item.transactionCount}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="ghost-row" onClick={() => setSelectedBankAccountId(item.id)}>
                            عرض
                          </button>
                          <button type="button" className="ghost-row" onClick={() => beginEdit(item)}>
                            تعديل
                          </button>
                          <button
                            type="button"
                            className="ghost-row"
                            disabled={togglingBankAccountId === item.id}
                            onClick={() => void handleToggleStatus(item.id)}
                          >
                            {item.isActive ? "تعطيل" : "تفعيل"}
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
            <h3>تفاصيل الحساب البنكي</h3>
            <span>{selectedBankAccount ? selectedBankAccount.bankName : "اختر حساباً بنكياً"}</span>
          </div>

          {selectedLoading && <div className="state-box">جاري تحميل التفاصيل...</div>}
          {selectedError && <div className="state-box error">{selectedError}</div>}

          {!selectedLoading && !selectedBankAccount && (
            <div className="state-box">اختر حساباً بنكياً من الجدول لعرض تفاصيله.</div>
          )}

          {selectedBankAccount && (
            <>
              <div className="account-summary-box">
                <div className="account-summary-row">
                  <span>اسم البنك</span>
                  <strong>{selectedBankAccount.bankName}</strong>
                </div>
                <div className="account-summary-row">
                  <span>رقم الحساب</span>
                  <strong>{selectedBankAccount.accountNumber || "-"}</strong>
                </div>
                <div className="account-summary-row">
                  <span>IBAN</span>
                  <strong>{selectedBankAccount.iban || "-"}</strong>
                </div>
                <div className="account-summary-row">
                  <span>الرصيد الافتتاحي</span>
                  <strong>{selectedBankAccount.openingBalance.toFixed(3)}</strong>
                </div>
                <div className="account-summary-row">
                  <span>صندوق نقدي</span>
                  <strong>{selectedBankAccount.isCashBox ? "نعم" : "لا"}</strong>
                </div>
                <div className="account-summary-row">
                  <span>الحالة</span>
                  <strong>{selectedBankAccount.isActive ? "فعال" : "معطل"}</strong>
                </div>
                <div className="account-summary-row">
                  <span>الحركات</span>
                  <strong>{selectedBankAccount.transactionCount}</strong>
                </div>
                <div className="account-summary-row">
                  <span>تاريخ الإنشاء</span>
                  <strong>{formatDateTime(selectedBankAccount.createdAt)}</strong>
                </div>
              </div>

              <div className="section-title-row">
                <h3>آخر الحركات</h3>
                <span>عدد الحركات: {selectedBankAccount.recentTransactions.length}</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>النوع</th>
                      <th>المبلغ</th>
                      <th>المرجع</th>
                      <th>الوصف</th>
                      <th>القيد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBankAccount.recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center">
                          لا توجد حركات مسجلة.
                        </td>
                      </tr>
                    ) : (
                      selectedBankAccount.recentTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td>{formatDateTime(transaction.transactionDate)}</td>
                          <td>{transaction.transactionType}</td>
                          <td>{transaction.amount.toFixed(3)}</td>
                          <td>{transaction.referenceNumber || "-"}</td>
                          <td>{transaction.description || "-"}</td>
                          <td>{transaction.journalEntryNumber || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
