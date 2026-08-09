import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { createAccount, getAccounts, type AccountListItem, type AccountUpsertRequest, AccountType } from "../../api/accounts";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type AccountsCreatePanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

type AccountFormState = {
  code: string;
  name: string;
  type: AccountType;
  parentAccountId: string;
  isActive: boolean;
};

const ACCOUNT_TYPE_OPTIONS: AccountType[] = [
  AccountType.Asset,
  AccountType.Liability,
  AccountType.Equity,
  AccountType.Revenue,
  AccountType.Expense
];

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

function createEmptyAccountForm(): AccountFormState {
  return {
    code: "",
    name: "",
    type: AccountType.Asset,
    parentAccountId: "",
    isActive: true
  };
}

export function AccountsCreatePanel({ user, activePath, onNavigate, onLogout }: AccountsCreatePanelProps) {
  const [parentAccounts, setParentAccounts] = useState<AccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<AccountFormState>(createEmptyAccountForm());

  useEffect(() => {
    let cancelled = false;

    async function loadAccounts() {
      setLoading(true);
      setError(null);

      try {
        const items = await getAccounts();
        if (!cancelled) {
          setParentAccounts(items.filter((item) => item.isActive));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load accounts");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAccounts();

    return () => {
      cancelled = true;
    };
  }, [onLogout]);

  const sortedParents = useMemo(() => parentAccounts.slice().sort((a, b) => a.code.localeCompare(b.code)), [parentAccounts]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setError(null);

    try {
      const payload: AccountUpsertRequest = {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        parentAccountId: form.parentAccountId ? Number(form.parentAccountId) : null,
        isActive: form.isActive
      };

      await createAccount(payload);
      onNavigate("/accounts");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setFormError(error instanceof Error ? error.message : "Failed to save account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">إضافة حساب</h1>
              <p className="text-muted mb-0">إنشاء حساب جديد داخل دليل الحسابات.</p>
            </div>

            <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/accounts")}>
              رجوع
            </button>
          </div>

          {formError && <div className="alert alert-danger">{formError}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل الحسابات الرئيسية...</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-4">
                <label className="form-label">رقم الحساب</label>
                <input
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  className="form-control"
                  placeholder="مثال: 1110"
                />
              </div>

              <div className="col-md-8">
                <label className="form-label">اسم الحساب</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="form-control"
                  placeholder="مثال: الصندوق الرئيسي"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">نوع الحساب</label>
                <select
                  value={String(form.type)}
                  onChange={(event) => setForm((current) => ({ ...current, type: Number(event.target.value) as AccountType }))}
                  className="form-select"
                >
                  {ACCOUNT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={String(type)}>
                      {accountTypeText(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">الحساب الرئيسي</label>
                <select
                  value={form.parentAccountId}
                  onChange={(event) => setForm((current) => ({ ...current, parentAccountId: event.target.value }))}
                  className="form-select"
                >
                  <option value="">بدون حساب رئيسي</option>
                  {sortedParents.map((account) => (
                    <option key={account.id} value={String(account.id)}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-12">
                <div className="form-check">
                  <input
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="form-check-input"
                    type="checkbox"
                  />
                  <label className="form-check-label">الحساب فعال</label>
                </div>
              </div>
            </div>

            <div className="mt-4 d-flex gap-2">
              <button type="submit" className="btn btn-gold" disabled={saving || loading}>
                {saving ? "جاري الحفظ..." : "حفظ الحساب"}
              </button>

              <button type="button" className="btn btn-light" onClick={() => onNavigate("/accounts")}>
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
