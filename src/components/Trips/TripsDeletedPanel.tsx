import { useEffect, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getTrips, restoreTrip, type TripListItem } from "../../api/trips";
import { formatDate, formatDateTime } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type TripsDeletedPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function TripsDeletedPanel({ user, activePath, onNavigate, onLogout }: TripsDeletedPanelProps) {
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
        const items = await getTrips("", true);
        if (!cancelled) {
          setTrips(items.filter((item) => item.isDeleted));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load deleted trips");
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

  async function handleRestoreTrip(id: number) {
    if (!window.confirm("هل تريد استرجاع هذه الرحلة من الأرشيف؟")) {
      return;
    }

    setActionMessage(null);

    try {
      await restoreTrip(id);
      setActionMessage("تم استرجاع الرحلة بنجاح.");
      setRefreshToken((current) => current + 1);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setActionMessage(error instanceof Error ? error.message : "Failed to restore trip");
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">أرشيف الرحلات</h1>
              <p className="text-muted mb-0">عرض الرحلات المؤرشفة مع إمكانية الاسترجاع عند الحاجة.</p>
            </div>

            <div className="action-bar mb-0">
              <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/trips")}>
                الرجوع إلى الرحلات
              </button>

              <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/travelers")}>
                المسافرون
              </button>
            </div>
          </div>

          {actionMessage && <div className="alert alert-success">{actionMessage}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل الأرشيف...</div>}

          {!loading && !error && trips.length === 0 ? (
            <div className="alert alert-info mb-0">لا توجد رحلات مؤرشفة.</div>
          ) : (
            <div className="table-responsive travelers-table-wrapper">
              <table className="table table-bordered table-striped align-middle travelers-table">
                <thead>
                  <tr>
                    <th>رقم الرحلة</th>
                    <th>المسافر</th>
                    <th>رقم الجواز</th>
                    <th>تاريخ الرحلة</th>
                    <th>تاريخ الأرشفة</th>
                    <th>تمت بواسطة</th>
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
                      <td>{trip.deletedAt ? formatDateTime(trip.deletedAt) : "-"}</td>
                      <td>{trip.deletedBy || "-"}</td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-gold"
                          onClick={() => void handleRestoreTrip(trip.id)}
                        >
                          استرجاع
                        </button>
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
