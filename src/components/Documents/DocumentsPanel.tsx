import { useEffect, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getTravelers, type TravelerListItem } from "../../api/travelers";
import { formatDate } from "../../utils/dates";
import { displayTravelerPhone } from "../../utils/permissions";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type DocumentsPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

function formatDateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString("fr-FR") : "-";
}

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

export function DocumentsPanel({ user, activePath, onNavigate, onLogout }: DocumentsPanelProps) {
  const [travelers, setTravelers] = useState<TravelerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await getTravelers("", false, false, true);

        if (!cancelled) {
          setTravelers(result);
        }
      } catch (loadError) {
        if (loadError instanceof Error && loadError.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "تعذر تحميل قائمة الوثائق.");
        }
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

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-start mb-4">
            <div>
              <span className="section-eyebrow">Documents</span>
              <h1 className="page-title mb-1">الوثائق</h1>
              <p className="text-muted mb-0">المسافرون الذين تم تدقيق وثائقهم.</p>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="state-box">جاري تحميل الوثائق...</div>}

          {!loading && !error && (
            travelers.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-bordered table-striped align-middle documents-travelers-table">
                  <thead>
                    <tr>
                      <th>المسافر</th>
                      <th>رقم الجواز</th>
                      <th>الجنسية</th>
                      <th>رقم الهاتف</th>
                      <th>تاريخ الميلاد</th>
                      <th>تاريخ التدقيق</th>
                      <th>إجراء</th>
                    </tr>
                  </thead>

                  <tbody>
                    {travelers.map((traveler) => (
                      <tr key={traveler.id}>
                        <td>
                          <strong>{normalizeDisplayText(traveler.fullName)}</strong>
                        </td>
                        <td>{traveler.passportNumber}</td>
                        <td>{normalizeDisplayText(traveler.nationality) || "-"}</td>
                        <td>{displayTravelerPhone(user, traveler.phoneNumber)}</td>
                        <td>{formatDate(traveler.dateOfBirth)}</td>
                        <td>{formatDateTime(traveler.documentsReviewedAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-gold"
                            onClick={() => onNavigate(`/documents/travelers/${traveler.id}`)}
                          >
                            فتح
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-warning mb-0">لا توجد وثائق مدققة حالياً.</div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
