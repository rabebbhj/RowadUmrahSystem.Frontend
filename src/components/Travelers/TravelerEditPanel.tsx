import { useEffect, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { getTraveler, updateTraveler, type TravelerDetail } from "../../api/travelers";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type TravelerEditPanelProps = {
  user: AuthUser;
  activePath: string;
  travelerId: number;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function TravelerEditPanel({
  user,
  activePath,
  travelerId,
  onNavigate,
  onLogout
}: TravelerEditPanelProps) {
  const [traveler, setTraveler] = useState<TravelerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passportImage, setPassportImage] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const item = await getTraveler(travelerId);
        if (!cancelled) {
          setTraveler(item);
          setPassportPreview(item.passportImagePath);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load traveler");
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
  }, [onLogout, travelerId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!traveler) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("PassportNumber", traveler.passportNumber);
      formData.append("PassportImagePath", traveler.passportImagePath || "");
      formData.append("FullName", traveler.fullName);
      formData.append("Nationality", traveler.nationality);
      formData.append("Gender", traveler.gender);
      formData.append("DateOfBirth", traveler.dateOfBirth.slice(0, 10));
      formData.append("Email", traveler.email || "");
      formData.append("ResidenceNumber", traveler.residenceNumber || "");
      formData.append("PassportExpiryDate", traveler.passportExpiryDate || "");
      formData.append("PhoneNumber", traveler.phoneNumber);
      formData.append("Notes", traveler.notes || "");
      formData.append("IsBlocked", String(traveler.isBlocked));
      formData.append("BlockReason", traveler.blockReason || "");

      if (passportImage) {
        formData.append("passportImage", passportImage);
      }

      const updated = await updateTraveler(travelerId, formData);
      onNavigate(`/travelers/${updated.id}`);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "Failed to update traveler");
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
              <h1 className="page-title mb-1">تعديل بيانات المسافر</h1>
              <p className="text-muted mb-0">
                تعديل بيانات: <strong>{traveler?.fullName || ""}</strong>
              </p>
            </div>

            <div className="action-bar mb-0">
              <button type="button" className="btn btn-outline-gold" onClick={() => onNavigate(`/travelers/${travelerId}`)}>
                عرض الملف
              </button>

              <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/")}>
                رجوع
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل بيانات المسافر...</div>}

          {traveler && (
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-lg-4 mb-4">
                  <div className="page-card h-100">
                    <h4 className="section-title">صورة الجواز الحالية</h4>

                    {passportPreview ? (
                      <img src={passportPreview} className="img-fluid rounded border" alt="صورة الجواز" />
                    ) : (
                      <div className="alert alert-info mb-0">لا توجد صورة جواز محفوظة.</div>
                    )}
                  </div>
                </div>

                <div className="col-lg-8 mb-4">
                  <div className="page-card h-100">
                    <h4 className="section-title">البيانات الأساسية</h4>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">رقم الجواز</label>
                        <input className="form-control" value={traveler.passportNumber} onChange={(event) => setTraveler({ ...traveler, passportNumber: event.target.value })} />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">الاسم الكامل</label>
                        <input className="form-control" value={traveler.fullName} onChange={(event) => setTraveler({ ...traveler, fullName: event.target.value })} />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">الجنسية</label>
                        <input className="form-control" value={traveler.nationality} onChange={(event) => setTraveler({ ...traveler, nationality: event.target.value })} />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">الجنس</label>
                        <select className="form-select" value={traveler.gender} onChange={(event) => setTraveler({ ...traveler, gender: event.target.value })}>
                          <option value="">اختر الجنس</option>
                          <option value="M">ذكر</option>
                          <option value="F">أنثى</option>
                        </select>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">تاريخ الميلاد</label>
                        <input type="date" className="form-control" value={traveler.dateOfBirth.slice(0, 10)} onChange={(event) => setTraveler({ ...traveler, dateOfBirth: event.target.value })} />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">تاريخ انتهاء الجواز</label>
                        <input type="date" className="form-control" value={traveler.passportExpiryDate?.slice(0, 10) || ""} onChange={(event) => setTraveler({ ...traveler, passportExpiryDate: event.target.value || null })} />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">رقم الهاتف</label>
                        <input className="form-control" value={traveler.phoneNumber} onChange={(event) => setTraveler({ ...traveler, phoneNumber: event.target.value })} />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">الإيميل</label>
                        <input className="form-control" value={traveler.email || ""} onChange={(event) => setTraveler({ ...traveler, email: event.target.value })} />
                      </div>

                      <div className="col-12 mb-3">
                        <label className="form-label">ملاحظات</label>
                        <textarea className="form-control" rows={4} value={traveler.notes || ""} onChange={(event) => setTraveler({ ...traveler, notes: event.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="page-card mb-4">
                <h4 className="section-title">الحالة</h4>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={traveler.isBlocked} onChange={(event) => setTraveler({ ...traveler, isBlocked: event.target.checked })} />
                  <label className="form-check-label">المسافر محظور</label>
                </div>

                <small className="text-muted d-block mt-2">
                  يفضّل استخدام صفحة الحظر الرسمية عند وجود سبب حظر واضح حتى يتم تسجيل السبب في سجل العمليات.
                </small>
              </div>

              <div className="page-card">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">حفظ التعديلات</h5>
                    <small className="text-muted">سيتم تحديث بيانات المسافر في قاعدة البيانات.</small>
                  </div>

                  <div className="action-bar mb-0">
                    <button type="submit" className="btn btn-gold" disabled={saving}>
                      حفظ التعديل
                    </button>

                    <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate(`/travelers/${travelerId}`)}>
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
