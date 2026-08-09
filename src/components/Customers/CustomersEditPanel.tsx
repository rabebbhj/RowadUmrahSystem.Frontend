import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { getCustomer, updateCustomer, type CustomerUpsertRequest } from "../../api/customers";
import { getTravelers, type TravelerListItem } from "../../api/travelers";
import { SignedInSidebar } from "../Layout/SignedInSidebar";
import { createEmptyCustomerForm, mapCustomerToForm, type CustomerFormState } from "./customerHelpers";

type CustomersEditPanelProps = {
  user: AuthUser;
  activePath: string;
  customerId: number;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function CustomersEditPanel({ user, activePath, customerId, onNavigate, onLogout }: CustomersEditPanelProps) {
  const [travelers, setTravelers] = useState<TravelerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerFormState>(createEmptyCustomerForm());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [details, travelerItems] = await Promise.all([getCustomer(customerId), getTravelers("", false, true)]);

        if (!cancelled) {
          setCustomer(mapCustomerToForm(details));
          setTravelers(travelerItems);
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

  const travelerOptions = useMemo(() => travelers.slice().sort((a, b) => a.fullName.localeCompare(b.fullName)), [travelers]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setError(null);

    try {
      const payload: CustomerUpsertRequest = {
        name: customer.name.trim(),
        civilId: customer.civilId.trim(),
        passportNumber: customer.passportNumber.trim(),
        phoneNumber: customer.phoneNumber.trim(),
        email: customer.email.trim(),
        address: customer.address.trim(),
        travelerId: customer.travelerId ? Number(customer.travelerId) : null,
        isActive: customer.isActive
      };

      const saved = await updateCustomer(customerId, payload);
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
              <h1 className="page-title mb-1">تعديل عميل</h1>
              <p className="text-muted mb-0">تحديث بيانات العميل الحالي.</p>
            </div>

            <div className="d-flex gap-2 mt-3 mt-md-0">
              <button type="button" className="btn btn-outline-gold" onClick={() => onNavigate(`/customers/${customerId}`)}>
                عرض
              </button>
              <button type="button" className="btn btn-light" onClick={() => onNavigate("/customers")}>
                رجوع
              </button>
            </div>
          </div>

          {formError && <div className="alert alert-danger">{formError}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل بيانات العميل...</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label">الاسم</label>
                <input
                  type="text"
                  className="form-control"
                  value={customer.name}
                  onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))}
                  placeholder="اسم العميل"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">الرقم المدني</label>
                <input
                  type="text"
                  className="form-control"
                  value={customer.civilId}
                  onChange={(event) => setCustomer((current) => ({ ...current, civilId: event.target.value }))}
                  placeholder="الرقم المدني"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">رقم الجواز</label>
                <input
                  type="text"
                  className="form-control"
                  value={customer.passportNumber}
                  onChange={(event) => setCustomer((current) => ({ ...current, passportNumber: event.target.value }))}
                  placeholder="رقم الجواز"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">رقم الهاتف</label>
                <input
                  type="text"
                  className="form-control"
                  value={customer.phoneNumber}
                  onChange={(event) => setCustomer((current) => ({ ...current, phoneNumber: event.target.value }))}
                  placeholder="+966..."
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">البريد الإلكتروني</label>
                <input
                  type="email"
                  className="form-control"
                  value={customer.email}
                  onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">المسافر</label>
                <select
                  className="form-select"
                  value={customer.travelerId}
                  onChange={(event) => setCustomer((current) => ({ ...current, travelerId: event.target.value }))}
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
                  value={customer.address}
                  onChange={(event) => setCustomer((current) => ({ ...current, address: event.target.value }))}
                  placeholder="عنوان العميل"
                />
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    id="customer-edit-is-active"
                    type="checkbox"
                    className="form-check-input"
                    checked={customer.isActive}
                    onChange={(event) => setCustomer((current) => ({ ...current, isActive: event.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="customer-edit-is-active">
                    العميل فعال
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 d-flex gap-2">
              <button type="submit" className="btn btn-gold" disabled={saving || loading}>
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
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
