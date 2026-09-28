import { useEffect, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import {
  deleteTraveler,
  getTravelers,
  markTravelerDocumentsReviewed,
  unblockTraveler,
  type TravelerListItem
} from "../../api/travelers";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type TravelersPanelProps = {
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

function statusClass(traveler: TravelerListItem) {
  return traveler.isBlocked ? "badge badge-soft-danger" : "badge badge-soft-success";
}

function statusText(traveler: TravelerListItem) {
  return traveler.isBlocked ? "محظور" : "مسموح";
}

function formatDateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString("fr-FR") : "-";
}

function isMainAdmin(user: AuthUser) {
  return user.email?.toLowerCase() === "admin@rowad.local";
}

function can(user: AuthUser, permission: keyof NonNullable<AuthUser["permissions"]>) {
  return isMainAdmin(user) || Boolean(user.permissions?.[permission]);
}

export function TravelersPanel({ user, activePath, onNavigate, onLogout }: TravelersPanelProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [travelers, setTravelers] = useState<TravelerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [reviewingTravelerId, setReviewingTravelerId] = useState<number | null>(null);
  const canCreateTraveler = can(user, "canCreateTravelers");
  const canEditTraveler = can(user, "canEditTravelers");
  const canArchiveTraveler = can(user, "canArchiveTravelers");
  const canCreateTrip = can(user, "canCreateTrips");
  const canViewTrips = can(user, "canViewTrips");
  const canBlockTraveler = can(user, "canBlockTravelers");
  const canUnblockTraveler = can(user, "canUnblockTravelers");
  const canExportReports = can(user, "canExportReports");
  const canReviewDocuments = can(user, "canViewDocuments") && can(user, "canUploadDocuments");

  useEffect(() => {
    let cancelled = false;

    async function loadTravelers() {
      setLoading(true);
      setError(null);

      try {
        const items = await getTravelers(searchTerm, false, false);
        if (!cancelled) {
          setTravelers(items.filter((traveler) => !traveler.documentsReviewed));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "تعذر تحميل بيانات المسافرين.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTravelers();

    return () => {
      cancelled = true;
    };
  }, [onLogout, refreshToken, searchTerm]);

  async function handleUnblock(id: number) {
    setActionMessage(null);
    try {
      await unblockTraveler(id);
      setActionMessage("تم رفع الحظر عن المسافر.");
      setRefreshToken((value) => value + 1);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setActionMessage(error instanceof Error ? error.message : "تعذر رفع الحظر عن المسافر.");
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("هل أنت متأكد من أرشفة هذا المسافر؟")) {
      return;
    }

    setActionMessage(null);
    try {
      await deleteTraveler(id);
      setActionMessage("تم أرشفة المسافر.");
      setRefreshToken((value) => value + 1);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setActionMessage(error instanceof Error ? error.message : "تعذر أرشفة المسافر.");
    }
  }

  async function handleMarkDocumentsReviewed(id: number) {
    setActionMessage(null);
    setReviewingTravelerId(id);

    try {
      await markTravelerDocumentsReviewed(id);
      setActionMessage("تم تدقيق وثائق المسافر ونقله إلى مركز الوثائق.");
      setTravelers((current) => current.filter((traveler) => traveler.id !== id));
      setRefreshToken((value) => value + 1);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setActionMessage(error instanceof Error ? error.message : "تعذر تأكيد تدقيق الوثائق.");
    } finally {
      setReviewingTravelerId((current) => (current === id ? null : current));
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchTerm(searchInput);
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">قاعدة بيانات المسافرين</h1>
              <p className="text-muted mb-0">إدارة المسافرين، البحث، الرحلات، الحظر، والتقارير.</p>
            </div>

            <div className="action-bar mb-0">
              {canCreateTraveler && (
                <button type="button" className="btn btn-gold" onClick={() => onNavigate("/travelers/create")}>
                  + تسجيل مسافر جديد
                </button>
              )}

              {canExportReports && (
                <div className="dropdown">
                  <button className="btn btn-outline-gold dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    التقارير
                  </button>

                  <ul className="dropdown-menu">
                    <li>
                      <button type="button" className="dropdown-item" onClick={() => window.location.assign("/Travelers/ExportToExcel")}>
                        تصدير Excel
                      </button>
                    </li>
                    <li>
                      <button type="button" className="dropdown-item" onClick={() => window.location.assign("/Travelers/ExportToPdf")}>
                        تصدير PDF
                      </button>
                    </li>
                  </ul>
                </div>
              )}

              {canViewTrips && (
                <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/trips")}>
                  سجل الرحلات
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="row g-2">
              <div className="col-md-9">
                <input
                  type="text"
                  name="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="form-control"
                  placeholder="ابحث بالاسم، رقم الجواز، أو رقم الهاتف..."
                />
              </div>

              <div className="col-md-3 d-flex gap-2">
                <button type="submit" className="btn btn-gold w-100">
                  بحث
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setSearchInput("");
                    setSearchTerm("");
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </form>

          {actionMessage && <div className="alert alert-success">{actionMessage}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل المسافرين...</div>}

          {!loading && !error && travelers.length === 0 && (
            <div className="alert alert-info mb-0">لا يوجد مسافرون مطابقون للبحث.</div>
          )}

          {!loading && !error && travelers.length > 0 && (
            <div className="table-responsive travelers-table-wrapper">
              <table className="table table-bordered table-striped align-middle travelers-table">
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>رقم الجواز</th>
                    <th>الاسم</th>
                    <th>الجنسية</th>
                    <th>الهاتف</th>
                    <th>عدد العمرات</th>
                    <th>الحالة</th>
                    <th>تاريخ ووقت الطلب</th>
                    <th className="text-center">الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {travelers.map((traveler) => (
                    <tr key={traveler.id}>
                      <td>{traveler.id}</td>
                      <td><strong>{traveler.passportNumber}</strong></td>
                      <td>{normalizeDisplayText(traveler.fullName)}</td>
                      <td>{normalizeDisplayText(traveler.nationality)}</td>
                      <td>{traveler.phoneNumber}</td>
                      <td><span className="badge badge-soft-warning">{traveler.tripCount}</span></td>
                      <td><span className={statusClass(traveler)}>{statusText(traveler)}</span></td>
                      <td>{formatDateTime(traveler.createdAt)}</td>

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
                              <button type="button" className="dropdown-item" onClick={() => onNavigate(`/travelers/${traveler.id}`)}>
                                عرض التفاصيل
                              </button>
                            </li>

                            {canEditTraveler && (
                              <li>
                                <button type="button" className="dropdown-item" onClick={() => onNavigate(`/travelers/${traveler.id}/edit`)}>
                                  تعديل البيانات
                                </button>
                              </li>
                            )}

                            {canCreateTrip && (
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() => onNavigate(`/trips/create?travelerId=${traveler.id}`)}
                                >
                                  إضافة عمرة
                                </button>
                              </li>
                            )}

                            {canReviewDocuments && !traveler.documentsReviewed && (
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item text-success"
                                  disabled={reviewingTravelerId === traveler.id}
                                  onClick={() => void handleMarkDocumentsReviewed(traveler.id)}
                                >
                                  {reviewingTravelerId === traveler.id ? "جاري التدقيق..." : "تم التدقيق"}
                                </button>
                              </li>
                            )}

                            {(canBlockTraveler || canUnblockTraveler || canArchiveTraveler) && <li><hr className="dropdown-divider" /></li>}

                            {traveler.isBlocked && canUnblockTraveler && (
                              <li>
                                <button type="button" className="dropdown-item text-success" onClick={() => void handleUnblock(traveler.id)}>
                                  رفع الحظر
                                </button>
                              </li>
                            )}

                            {!traveler.isBlocked && canBlockTraveler && (
                              <li>
                                <button type="button" className="dropdown-item text-warning" onClick={() => onNavigate(`/travelers/${traveler.id}/block`)}>
                                  حظر المسافر
                                </button>
                              </li>
                            )}

                            {canArchiveTraveler && (
                              <li>
                                <button type="button" className="dropdown-item text-danger" onClick={() => void handleDelete(traveler.id)}>
                                  حذف / أرشفة
                                </button>
                              </li>
                            )}
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
