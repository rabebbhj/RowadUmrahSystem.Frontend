import { useEffect, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { deleteTraveler, getTraveler, type TravelerDetail } from "../../api/travelers";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type TravelerDeletePanelProps = {
  user: AuthUser;
  activePath: string;
  travelerId: number;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function TravelerDeletePanel({
  user,
  activePath,
  travelerId,
  onNavigate,
  onLogout
}: TravelerDeletePanelProps) {
  const [traveler, setTraveler] = useState<TravelerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
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
      await deleteTraveler(traveler.id);
      onNavigate("/");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "Failed to archive traveler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">أرشفة المسافر</h1>
              <p className="text-muted mb-0">سيتم نقل المسافر إلى الأرشيف بدلاً من حذفه نهائياً.</p>
            </div>
            <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate(`/travelers/${travelerId}`)}>
              رجوع
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل بيانات المسافر...</div>}

          {traveler && (
            <>
              <div className="alert alert-warning">
                <strong>تنبيه:</strong> لن يتم حذف بيانات المسافر نهائياً، وإنما سيتم أرشفته ويمكن استعادته لاحقاً.
              </div>

              <div className="row">
                <div className="col-lg-4 mb-4">
                  <div className="page-card h-100">
                    {traveler.passportImagePath ? (
                      <img src={traveler.passportImagePath} className="img-fluid rounded border" alt="صورة الجواز" />
                    ) : (
                      <div className="alert alert-info mb-0">لا توجد صورة جواز.</div>
                    )}
                  </div>
                </div>

                <div className="col-lg-8 mb-4">
                  <div className="page-card h-100">
                    <h4 className="section-title">بيانات المسافر</h4>
                    <div className="row">
                      <div className="col-md-6 mb-3"><small className="text-muted">رقم الجواز</small><div><strong>{traveler.passportNumber}</strong></div></div>
                      <div className="col-md-6 mb-3"><small className="text-muted">الاسم الكامل</small><div><strong>{traveler.fullName}</strong></div></div>
                      <div className="col-md-6 mb-3"><small className="text-muted">الجنسية</small><div>{traveler.nationality}</div></div>
                      <div className="col-md-6 mb-3"><small className="text-muted">عدد العمرات</small><div>{traveler.tripCount}</div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="page-card border-danger">
                <h4 className="text-danger mb-3">تأكيد الأرشفة</h4>
                <p className="text-muted">سيتم نقل المسافر إلى قسم الأرشيف مع الاحتفاظ بكامل:</p>
                <ul>
                  <li>بيانات المسافر</li>
                  <li>الرحلات</li>
                  <li>الوثائق</li>
                  <li>سجل العمليات</li>
                </ul>

                <form onSubmit={handleSubmit}>
                  <div className="action-bar">
                    <button type="submit" className="btn btn-danger" disabled={saving}>
                      تأكيد الأرشفة
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate(`/travelers/${travelerId}`)}>
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
