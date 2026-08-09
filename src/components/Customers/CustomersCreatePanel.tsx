import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { createCustomer, type CustomerUpsertRequest } from "../../api/customers";
import { getTravelers, type TravelerListItem } from "../../api/travelers";
import { SignedInSidebar } from "../Layout/SignedInSidebar";
import { createEmptyCustomerForm, type CustomerFormState } from "./customerHelpers";

type CustomersCreatePanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function CustomersCreatePanel({ user, activePath, onNavigate, onLogout }: CustomersCreatePanelProps) {
  const [travelers, setTravelers] = useState<TravelerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerFormState>(createEmptyCustomerForm());

  useEffect(() => {
    let cancelled = false;

    async function loadTravelersList() {
      setLoading(true);
      setError(null);

      try {
        const items = await getTravelers("", false, true);
        if (!cancelled) {
          setTravelers(items);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load travelers");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTravelersList();

    return () => {
      cancelled = true;
    };
  }, [onLogout]);

  const travelerOptions = useMemo(() => travelers.slice().sort((a, b) => a.fullName.localeCompare(b.fullName)), [travelers]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setError(null);

    try {
      const payload: CustomerUpsertRequest = {
        name: form.name.trim(),
        civilId: form.civilId.trim(),
        passportNumber: form.passportNumber.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        travelerId: form.travelerId ? Number(form.travelerId) : null,
        isActive: form.isActive
      };

      const saved = await createCustomer(payload);
      onNavigate(`/customers/${saved.id}`);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setFormError(error instanceof Error ? error.message : "Failed to save customer");
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
              <h1 className="page-title mb-1">إضافة عميل</h1>
              <p className="text-muted mb-0">إنشاء عميل جديد وربطه بمسافر إذا لزم الأمر.</p>
            </div>

            <button type="button" className="btn btn-light mt-3 mt-md-0" onClick={() => onNavigate("/customers")}>
              رجوع
            </button>
          </div>

          {formError && <div className="alert alert-danger">{formError}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل المسافرين...</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label">الاسم</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="اسم العميل"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">الرقم المدني</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.civilId}
                  onChange={(event) => setForm((current) => ({ ...current, civilId: event.target.value }))}
                  placeholder="الرقم المدني"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">رقم الجواز</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.passportNumber}
                  onChange={(event) => setForm((current) => ({ ...current, passportNumber: event.target.value }))}
                  placeholder="رقم الجواز"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">رقم الهاتف</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.phoneNumber}
                  onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                  placeholder="+966..."
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">البريد الإلكتروني</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">المسافر</label>
                <select
                  className="form-select"
                  value={form.travelerId}
                  onChange={(event) => setForm((current) => ({ ...current, travelerId: event.target.value }))}
                >
                  <option value="">بدون ربط بمسافر</option>
                  {travelerOptions.map((traveler) => (
                    <option key={traveler.id} value={String(traveler.id)}>
                      {traveler.fullName} - {traveler.passportNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label">العنوان</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  placeholder="عنوان العميل"
                />
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    id="customer-is-active"
                    type="checkbox"
                    className="form-check-input"
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="customer-is-active">
                    العميل فعال
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 d-flex gap-2">
              <button type="submit" className="btn btn-gold" disabled={saving || loading}>
                {saving ? "جاري الحفظ..." : "حفظ العميل"}
              </button>

              <button type="button" className="btn btn-light" onClick={() => onNavigate("/customers")}>
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
