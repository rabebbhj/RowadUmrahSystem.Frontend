import { useEffect, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { createTrip } from "../../api/trips";
import { getTraveler, type TravelerDetail } from "../../api/travelers";
import { todayInputValue, formatDate } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type TripsCreatePanelProps = {
  user: AuthUser;
  activePath: string;
  travelerId: number;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function TripsCreatePanel({ user, activePath, travelerId, onNavigate, onLogout }: TripsCreatePanelProps) {
  const [traveler, setTraveler] = useState<TravelerDetail | null>(null);
  const [tripDate, setTripDate] = useState(todayInputValue());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTraveler() {
      if (travelerId <= 0) {
        setTraveler(null);
        setError("معرّف المسافر غير صالح.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const item = await getTraveler(travelerId);
        if (!cancelled) {
          setTraveler(item);
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

    void loadTraveler();

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
      await createTrip({
        travelerId: traveler.id,
        tripDate,
        notes
      });

      onNavigate(`/travelers/${traveler.id}`);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "Failed to create trip");
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
              <h1 className="page-title mb-1">إضافة رحلة عمرة</h1>
              <p className="text-muted mb-0">إنشاء رحلة جديدة وربطها بملف المسافر.</p>
            </div>

            <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate(`/travelers/${travelerId}`)}>
              الرجوع لملف المسافر
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل بيانات المسافر...</div>}

          {traveler && (
            <div className="row">
              <div className="col-lg-4 mb-4">
                <div className="page-card h-100">
                  <h4 className="section-title">معلومات المسافر</h4>

                  <div className="mb-3">
                    <small className="text-muted">اسم المسافر</small>
                    <div>
                      <strong>{traveler.fullName}</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted">رقم الجواز</small>
                    <div>{traveler.passportNumber}</div>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted">الجنسية</small>
                    <div>{traveler.nationality}</div>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted">تاريخ الميلاد</small>
                    <div>{formatDate(traveler.dateOfBirth)}</div>
                  </div>

                  <div className="alert alert-info mb-0">
                    سيتم إضافة رحلة جديدة لهذا المسافر وزيادة عدد رحلاته تلقائياً.
                  </div>
                </div>
              </div>

              <div className="col-lg-8 mb-4">
                <div className="page-card h-100">
                  <h4 className="section-title">بيانات الرحلة</h4>

                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <input type="hidden" value={traveler.id} readOnly />

                      <div className="col-md-6 mb-3">
                        <label className="form-label">تاريخ الرحلة</label>
                        <input type="date" className="form-control" value={tripDate} onChange={(event) => setTripDate(event.target.value)} />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">نوع الرحلة</label>
                        <select className="form-select" disabled value="Umrah">
                          <option value="Umrah">عمرة</option>
                        </select>
                      </div>

                      <div className="col-12 mb-3">
                        <label className="form-label">ملاحظات الرحلة</label>
                        <textarea
                          className="form-control"
                          rows={5}
                          placeholder="أي ملاحظات تخص هذه الرحلة..."
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                        />
                      </div>
                    </div>

                    <hr />

                    <div className="action-bar">
                      <button type="submit" className="btn btn-gold" disabled={saving}>
                        حفظ الرحلة
                      </button>

                      <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate(`/travelers/${traveler.id}`)}>
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
