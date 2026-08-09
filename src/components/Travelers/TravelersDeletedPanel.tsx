import { useEffect, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getTravelers, restoreTraveler, type TravelerListItem } from "../../api/travelers";
import { formatDateTime } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type TravelersDeletedPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function TravelersDeletedPanel({ user, activePath, onNavigate, onLogout }: TravelersDeletedPanelProps) {
  const [travelers, setTravelers] = useState<TravelerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const items = await getTravelers("", true, false);
        if (!cancelled) {
          setTravelers(items.filter((item) => item.isDeleted));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load deleted travelers");
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
  }, [onLogout]);

  async function handleRestore(id: number) {
    try {
      await restoreTraveler(id);
      setTravelers((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "Failed to restore traveler");
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">أرشيف المسافرين</h1>
              <p className="text-muted mb-0">عرض المسافرين المؤرشفين مع إمكانية الاسترجاع عند الحاجة.</p>
            </div>

            <div className="action-bar mb-0">
              <div className="dropdown">
                <button className="btn btn-outline-gold dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  التقارير
                </button>

                <ul className="dropdown-menu">
                  <li>
                    <button type="button" className="dropdown-item" onClick={() => window.location.assign("/Travelers/ExportDeletedToExcel")}>
                      تصدير Excel
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item" onClick={() => window.location.assign("/Travelers/ExportDeletedToPdf")}>
                      تصدير PDF
                    </button>
                  </li>
                </ul>
              </div>

              <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/travelers")}>
                رجوع إلى المسافرين
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل الأرشيف...</div>}

          {!loading && !error && travelers.length === 0 ? (
            <div className="alert alert-info mb-0">لا يوجد مسافرين مؤرشفين.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle">
                <thead>
                  <tr>
                    <th>رقم الجواز</th>
                    <th>الاسم</th>
                    <th>الجنسية</th>
                    <th>رقم الهاتف</th>
                    <th>تاريخ الأرشفة</th>
                    <th>تمت بواسطة</th>
                    <th className="text-center">الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {travelers.map((traveler) => (
                    <tr key={traveler.id}>
                      <td>
                        <strong>{traveler.passportNumber}</strong>
                      </td>
                      <td>{traveler.fullName}</td>
                      <td>{traveler.nationality}</td>
                      <td>{traveler.phoneNumber}</td>
                      <td>{traveler.deletedAt ? formatDateTime(traveler.deletedAt) : "-"}</td>
                      <td>{traveler.deletedBy || "-"}</td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-gold"
                          onClick={() => {
                            if (window.confirm("هل تريد استرجاع هذا المسافر من الأرشيف؟")) {
                              void handleRestore(traveler.id);
                            }
                          }}
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
