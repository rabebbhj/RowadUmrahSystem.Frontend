import { useEffect, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getTravelers, unblockTraveler, type TravelerListItem } from "../../api/travelers";
import { formatDateTime } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type TravelersBlockedPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function TravelersBlockedPanel({ user, activePath, onNavigate, onLogout }: TravelersBlockedPanelProps) {
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
          setTravelers(items.filter((item) => item.isBlocked && !item.isDeleted));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load blocked travelers");
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

  async function handleUnblock(id: number) {
    try {
      await unblockTraveler(id);
      setTravelers((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "Failed to unblock traveler");
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">المسافرون المحظورون</h1>
              <p className="text-muted mb-0">عرض المسافرين الممنوعين من التسجيل أو إنشاء رحلات جديدة.</p>
            </div>

            <div className="action-bar mb-0">
              <div className="dropdown">
                <button className="btn btn-outline-gold dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  التقارير
                </button>

                <ul className="dropdown-menu">
                  <li>
                    <button type="button" className="dropdown-item" onClick={() => window.location.assign("/Travelers/ExportBlockedToExcel")}>
                      تصدير Excel
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item" onClick={() => window.location.assign("/Travelers/BlockedPdf")}>
                      تصدير PDF
                    </button>
                  </li>
                </ul>
              </div>

              <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/travelers")}>
                رجوع للمسافرين
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل المحظورين...</div>}

          {!loading && !error && travelers.length === 0 ? (
            <div className="alert alert-success mb-0">لا يوجد مسافرون محظورون حالياً.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>رقم الجواز</th>
                    <th>الجنسية</th>
                    <th>رقم الهاتف</th>
                    <th>سبب الحظر</th>
                    <th>تاريخ الحظر</th>
                    <th className="text-center">الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {travelers.map((traveler) => (
                    <tr key={traveler.id}>
                      <td>
                        <strong>{traveler.fullName}</strong>
                      </td>
                      <td>{traveler.passportNumber}</td>
                      <td>{traveler.nationality}</td>
                      <td>{traveler.phoneNumber}</td>
                      <td>{traveler.blockReason || <span className="text-muted">لا يوجد سبب مسجل</span>}</td>
                      <td>{traveler.blockedAt ? formatDateTime(traveler.blockedAt) : "-"}</td>
                      <td className="text-center">
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline-gold dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            إجراءات
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <button type="button" className="dropdown-item" onClick={() => onNavigate(`/travelers/${traveler.id}`)}>
                                عرض الملف
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                className="dropdown-item text-success"
                                onClick={() => {
                                  if (window.confirm("هل تريد رفع الحظر عن هذا المسافر؟")) {
                                    void handleUnblock(traveler.id);
                                  }
                                }}
                              >
                                رفع الحظر
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
