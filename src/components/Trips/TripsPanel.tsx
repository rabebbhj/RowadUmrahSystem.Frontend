import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { archiveTrip, getTrips, type TripListItem } from "../../api/trips";
import { formatDate } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type TripsPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function TripsPanel({ user, activePath, onNavigate, onLogout }: TripsPanelProps) {
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadTrips() {
      setLoading(true);
      setError(null);

      try {
        const items = await getTrips("", false);
        if (!cancelled) {
          setTrips(items);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load trips");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTrips();

    return () => {
      cancelled = true;
    };
  }, [onLogout, refreshToken]);

  const stats = useMemo(() => {
    const total = trips.length;
    const travelerCount = new Set(trips.map((trip) => trip.travelerId)).size;
    const lastTrip = trips.length > 0 ? trips[0].tripDate : null;

    return { total, travelerCount, lastTrip };
  }, [trips]);

  async function handleArchiveTrip(id: number) {
    if (!window.confirm("هل أنت متأكد من أرشفة هذه الرحلة؟")) {
      return;
    }

    setActionMessage(null);

    try {
      await archiveTrip(id);
      setActionMessage("تمت أرشفة الرحلة بنجاح.");
      setRefreshToken((current) => current + 1);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setActionMessage(error instanceof Error ? error.message : "Failed to archive trip");
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">سجل الرحلات</h1>
              <p className="text-muted mb-0">عرض جميع رحلات العمرة النشطة داخل النظام.</p>
            </div>

            <div className="action-bar mb-0">
              <div className="dropdown">
                <button className="btn btn-outline-gold dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  التقارير
                </button>

                <ul className="dropdown-menu">
                  <li>
                    <button type="button" className="dropdown-item" onClick={() => window.location.assign("/Trips/ExportToExcel")}>
                      تصدير Excel
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item" onClick={() => window.location.assign("/Trips/ExportToPdf")}>
                      تصدير PDF
                    </button>
                  </li>
                </ul>
              </div>

              <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/trips/deleted")}>
                أرشيف الرحلات
              </button>

              <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/travelers")}>
                المسافرون
              </button>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-lg-4 mb-3">
              <div className="stat-card">
                <div className="stat-title">إجمالي الرحلات النشطة</div>
                <div className="stat-number">{stats.total}</div>
              </div>
            </div>

            <div className="col-lg-4 mb-3">
              <div className="stat-card">
                <div className="stat-title">عدد المسافرين المشاركين</div>
                <div className="stat-number">{stats.travelerCount}</div>
              </div>
            </div>

            <div className="col-lg-4 mb-3">
              <div className="stat-card">
                <div className="stat-title">آخر رحلة</div>
                <div className="stat-number" style={{ fontSize: 20 }}>
                  {stats.lastTrip ? formatDate(stats.lastTrip) : "-"}
                </div>
              </div>
            </div>
          </div>

          {actionMessage && <div className="alert alert-success">{actionMessage}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل الرحلات...</div>}

          {!loading && !error && trips.length === 0 ? (
            <div className="alert alert-info mb-0">لا توجد رحلات نشطة حالياً.</div>
          ) : (
            <div className="table-responsive travelers-table-wrapper">
              <table className="table table-bordered table-striped align-middle travelers-table">
                <thead>
                  <tr>
                    <th>رقم الرحلة</th>
                    <th>المسافر</th>
                    <th>رقم الجواز</th>
                    <th>تاريخ الرحلة</th>
                    <th>الملاحظات</th>
                    <th className="text-center">الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {trips.map((trip) => (
                    <tr key={trip.id}>
                      <td>
                        <strong>#{trip.id}</strong>
                      </td>
                      <td>{trip.travelerName}</td>
                      <td>{trip.passportNumber}</td>
                      <td>{formatDate(trip.tripDate)}</td>
                      <td>{trip.notes || "-"}</td>
                      <td className="text-center">
                        <div className="dropdown rowad-actions-dropdown">
                          <button
                            className="btn btn-sm btn-outline-gold dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            data-bs-boundary="viewport"
                            data-bs-display="static"
                            aria-expanded="false"
                          >
                            إجراءات
                          </button>

                          <ul className="dropdown-menu rowad-actions-menu">
                            <li>
                              <button type="button" className="dropdown-item" onClick={() => onNavigate(`/travelers/${trip.travelerId}`)}>
                                ملف المسافر
                              </button>
                            </li>
                            <li>
                              <hr className="dropdown-divider" />
                            </li>
                            <li>
                              <button type="button" className="dropdown-item text-danger" onClick={() => void handleArchiveTrip(trip.id)}>
                                أرشفة الرحلة
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
