import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getTravelers, type TravelerListItem } from "../../api/travelers";
import { getTrips, type TripListItem } from "../../api/trips";
import { formatDate, formatDateTime } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type DashboardPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

function normalizeDisplayText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  if (!/[ØÙÃÂ]/.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return value;
  }
}

function isPendingReservationRequest(traveler: TravelerListItem) {
  const notes = normalizeDisplayText(traveler.notes);

  return Boolean(
    notes.includes("قيد التأكيد") ||
    notes.includes("محال إلى خدمة العملاء") ||
    notes.includes("طلب حجز عمرة من الصفحة العامة")
  );
}

export function DashboardPanel({ user, activePath, onNavigate, onLogout }: DashboardPanelProps) {
  const [travelers, setTravelers] = useState<TravelerListItem[]>([]);
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [travelerItems, tripItems] = await Promise.all([
          getTravelers("", false, false),
          getTrips("", false)
        ]);

        if (!cancelled) {
          setTravelers(travelerItems);
          setTrips(tripItems);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "تعذر تحميل بيانات لوحة التحكم.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [onLogout]);

  const stats = useMemo(() => {
    const pendingReservations = travelers.filter(isPendingReservationRequest).length;
    const blockedTravelers = travelers.filter((item) => item.isBlocked).length;
    const activeTravelers = travelers.filter((item) => !item.isBlocked && !isPendingReservationRequest(item)).length;
    const lastTrip = trips.slice().sort((left, right) => right.tripDate.localeCompare(left.tripDate))[0]?.tripDate ?? null;

    return {
      travelers: travelers.length,
      activeTravelers,
      pendingReservations,
      blockedTravelers,
      trips: trips.length,
      tripTravelers: new Set(trips.map((trip) => trip.travelerId)).size,
      lastTrip
    };
  }, [travelers, trips]);

  const recentActivities = useMemo(() => {
    const travelerActivities = travelers.map((traveler) => ({
      id: `traveler-${traveler.id}`,
      title: isPendingReservationRequest(traveler) ? "طلب حجز جديد قيد التأكيد" : "تسجيل مسافر",
      description: `${normalizeDisplayText(traveler.fullName)} - ${traveler.passportNumber}`,
      date: traveler.createdAt,
      target: `/travelers/${traveler.id}`
    }));

    const tripActivities = trips.map((trip) => ({
      id: `trip-${trip.id}`,
      title: "إضافة رحلة عمرة",
      description: `${normalizeDisplayText(trip.travelerName)} - ${formatDate(trip.tripDate)}`,
      date: trip.createdAt,
      target: `/travelers/${trip.travelerId}`
    }));

    return [...travelerActivities, ...tripActivities]
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 8);
  }, [travelers, trips]);

  const latestTravelers = useMemo(() => {
    return travelers
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 6);
  }, [travelers]);

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <section className="hero">
          <div>
            <span className="eyebrow">لوحة الإدارة</span>
            <h1>نظرة عامة على النظام</h1>
            <p>متابعة المسافرين، طلبات الحجز، الرحلات، وآخر النشاطات من مكان واحد.</p>
          </div>

          <div className="action-bar mt-3">
            <button type="button" className="btn btn-gold" onClick={() => onNavigate("/travelers")}>
              إدارة المسافرين
            </button>
            <button type="button" className="btn btn-outline-gold" onClick={() => onNavigate("/trips")}>
              سجل الرحلات
            </button>
          </div>
        </section>

        {error && <div className="state-box error">{error}</div>}
        {loading && <div className="state-box">جاري تحميل لوحة التحكم...</div>}

        {!loading && !error && (
          <>
            <section className="stats-grid">
              <article className="stat-card">
                <span>إجمالي المسافرين</span>
                <strong>{stats.travelers}</strong>
              </article>
              <article className="stat-card">
                <span>طلبات قيد التأكيد</span>
                <strong>{stats.pendingReservations}</strong>
              </article>
              <article className="stat-card">
                <span>إجمالي الرحلات</span>
                <strong>{stats.trips}</strong>
              </article>
              <article className="stat-card">
                <span>آخر رحلة</span>
                <strong>{stats.lastTrip ? formatDate(stats.lastTrip) : "-"}</strong>
              </article>
            </section>

            <section className="stats-grid">
              <article className="stat-card">
                <span>مسافرون نشطون</span>
                <strong>{stats.activeTravelers}</strong>
              </article>
              <article className="stat-card">
                <span>مسافرون محظورون</span>
                <strong>{stats.blockedTravelers}</strong>
              </article>
              <article className="stat-card">
                <span>مسافرون لديهم رحلات</span>
                <strong>{stats.tripTravelers}</strong>
              </article>
              <article className="stat-card">
                <span>متوسط الرحلات</span>
                <strong>{stats.travelers ? (stats.trips / stats.travelers).toFixed(1) : "0"}</strong>
              </article>
            </section>

            <section className="mini-grid">
              <div className="content-card">
                <div className="content-card-header">
                  <h3>آخر النشاطات</h3>
                  <span>{recentActivities.length} عملية حديثة</span>
                </div>

                {recentActivities.length === 0 ? (
                  <div className="state-box">لا توجد نشاطات حديثة.</div>
                ) : (
                  <div className="dashboard-activity-list">
                    {recentActivities.map((activity) => (
                      <button type="button" key={activity.id} onClick={() => onNavigate(activity.target)}>
                        <span>
                          <strong>{activity.title}</strong>
                          <small>{activity.description}</small>
                        </span>
                        <em>{formatDateTime(activity.date)}</em>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="content-card">
                <div className="content-card-header">
                  <h3>آخر المسافرين</h3>
                  <button type="button" className="btn btn-sm btn-outline-gold" onClick={() => onNavigate("/travelers")}>
                    عرض الكل
                  </button>
                </div>

                {latestTravelers.length === 0 ? (
                  <div className="state-box">لا توجد بيانات مسافرين.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead>
                        <tr>
                          <th>الاسم</th>
                          <th>رقم الجواز</th>
                          <th>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestTravelers.map((traveler) => (
                          <tr key={traveler.id}>
                            <td>{normalizeDisplayText(traveler.fullName)}</td>
                            <td><strong>{traveler.passportNumber}</strong></td>
                            <td>
                              {isPendingReservationRequest(traveler) ? (
                                <span className="badge badge-soft-warning">قيد التأكيد</span>
                              ) : traveler.isBlocked ? (
                                <span className="badge badge-soft-danger">محظور</span>
                              ) : (
                                <span className="badge badge-soft-success">مسموح</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
