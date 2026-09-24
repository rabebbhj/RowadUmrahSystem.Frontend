import { useEffect, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { getTraveler, type TravelerDetail } from "../../api/travelers";
import { formatDate } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type TravelerDetailsPanelProps = {
  user: AuthUser;
  activePath: string;
  travelerId: number;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

function formatDateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString("fr-FR") : "-";
}

function extractAntiForgeryToken(html: string) {
  const match = html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/i);
  return match?.[1] ?? null;
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

function documentTypeLabel(type: string) {
  const labels: Record<string, string> = {
    PersonalPhoto: "صورة شخصية",
    Visa: "تأشيرة",
    PassportCopy: "نسخة جواز",
    CivilId: "بطاقة الهوية",
    PDF: "ملف PDF",
    Other: "أخرى"
  };

  return labels[type] ?? normalizeDisplayText(type);
}

export function TravelerDetailsPanel({
  user,
  activePath,
  travelerId,
  onNavigate,
  onLogout
}: TravelerDetailsPanelProps) {
  const [traveler, setTraveler] = useState<TravelerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [documentType, setDocumentType] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentNotes, setDocumentNotes] = useState("");
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentSuccess, setDocumentSuccess] = useState<string | null>(null);
  const [documentSubmitting, setDocumentSubmitting] = useState(false);
  const [documentDeletingId, setDocumentDeletingId] = useState<number | null>(null);

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

        setError(error instanceof Error ? error.message : "تعذر تحميل بيانات المسافر.");
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
  }, [onLogout, refreshToken, travelerId]);

  async function getDocumentToken() {
    const response = await fetch(`/Travelers/Details/${travelerId}`, {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("تعذر تجهيز رفع المستند.");
    }

    const html = await response.text();
    const token = extractAntiForgeryToken(html);

    if (!token) {
      throw new Error("تعذر قراءة رمز الحماية.");
    }

    return token;
  }

  async function handleDocumentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!traveler) {
      return;
    }

    if (!documentType || !documentFile) {
      setDocumentError("الرجاء اختيار نوع المستند والملف.");
      return;
    }

    setDocumentSubmitting(true);
    setDocumentError(null);
    setDocumentSuccess(null);

    try {
      const token = await getDocumentToken();
      const formData = new FormData();
      formData.append("__RequestVerificationToken", token);
      formData.append("travelerId", String(traveler.id));
      formData.append("documentType", documentType);
      formData.append("file", documentFile);
      formData.append("notes", documentNotes);

      const response = await fetch("/TravelerDocuments/Upload", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!response.ok) {
        throw new Error("تعذر رفع المستند.");
      }

      setDocumentSuccess("تم رفع المستند بنجاح.");
      setDocumentType("");
      setDocumentFile(null);
      setDocumentNotes("");
      setRefreshToken((current) => current + 1);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setDocumentError(error instanceof Error ? error.message : "تعذر رفع المستند.");
    } finally {
      setDocumentSubmitting(false);
    }
  }

  async function handleDeleteDocument(id: number) {
    if (!traveler) {
      return;
    }

    setDocumentError(null);
    setDocumentSuccess(null);

    try {
      const token = await getDocumentToken();
      const formData = new FormData();
      formData.append("__RequestVerificationToken", token);
      formData.append("id", String(id));

      const response = await fetch("/TravelerDocuments/Delete", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!response.ok) {
        throw new Error("تعذر أرشفة المستند.");
      }

      setDocumentSuccess("تم أرشفة المستند بنجاح.");
      setDocumentDeletingId(null);
      setRefreshToken((current) => current + 1);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setDocumentError(error instanceof Error ? error.message : "تعذر أرشفة المستند.");
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          {error && <div className="alert alert-danger">{error}</div>}
          {documentError && <div className="alert alert-danger">{documentError}</div>}
          {documentSuccess && <div className="alert alert-success">{documentSuccess}</div>}
          {loading && <div className="state-box">جاري تحميل ملف المسافر...</div>}

          {traveler && (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-start mb-4">
                <div>
                  <h1 className="page-title mb-1">{normalizeDisplayText(traveler.fullName)}</h1>
                  <p className="text-muted mb-2">
                    رقم الجواز: <strong>{traveler.passportNumber}</strong>
                  </p>

                  {traveler.isBlocked ? (
                    <span className="badge badge-soft-danger">محظور</span>
                  ) : (
                    <span className="badge badge-soft-success">مسموح</span>
                  )}
                  <span className="badge badge-soft-warning">عدد العمرات: {traveler.tripCount}</span>
                </div>

                <div className="action-bar mb-0">
                  <button type="button" className="btn btn-outline-gold" onClick={() => onNavigate(`/travelers/${traveler.id}/edit`)}>
                    تعديل
                  </button>

                  <button type="button" className="btn btn-gold" onClick={() => onNavigate(`/trips/create?travelerId=${traveler.id}`)}>
                    + إضافة عمرة
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => window.location.assign(`/Travelers/TravelerPdf/${traveler.id}`)}
                  >
                    PDF
                  </button>

                  <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/travelers")}>
                    رجوع
                  </button>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-4 mb-4">
                  <div className="page-card h-100">
                    <h4 className="section-title">صورة الجواز</h4>

                    {traveler.passportImagePath ? (
                      <img src={traveler.passportImagePath} alt="صورة الجواز" className="img-fluid rounded border" />
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
                        <small className="text-muted">الرقم</small>
                        <div><strong>{traveler.id}</strong></div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <small className="text-muted">الاسم الكامل</small>
                        <div><strong>{normalizeDisplayText(traveler.fullName)}</strong></div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <small className="text-muted">الجنسية</small>
                        <div>{normalizeDisplayText(traveler.nationality)}</div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <small className="text-muted">الجنس</small>
                        <div>{normalizeDisplayText(traveler.gender)}</div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <small className="text-muted">تاريخ الميلاد</small>
                        <div>{formatDate(traveler.dateOfBirth)}</div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <small className="text-muted">رقم الهاتف</small>
                        <div>{traveler.phoneNumber}</div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <small className="text-muted">البريد الإلكتروني</small>
                        <div>{traveler.email || "-"}</div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <small className="text-muted">تاريخ انتهاء الجواز</small>
                        <div>{traveler.passportExpiryDate ? formatDate(traveler.passportExpiryDate) : <span className="text-muted">غير مسجل</span>}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {traveler.isBlocked && (
                <div className="page-card mb-4 border-danger">
                  <h4 className="section-title text-danger">بيانات الحظر</h4>

                  <div className="row">
                    <div className="col-md-8 mb-3">
                      <small className="text-muted">سبب الحظر</small>
                      <div>{normalizeDisplayText(traveler.blockReason) || "-"}</div>
                    </div>

                    <div className="col-md-4 mb-3">
                      <small className="text-muted">تاريخ الحظر</small>
                      <div>{formatDateTime(traveler.blockedAt)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="page-card mb-4">
                <h4 className="section-title">الملاحظات</h4>

                {traveler.notes ? (
                  <p className="mb-0">{normalizeDisplayText(traveler.notes)}</p>
                ) : (
                  <div className="alert alert-info mb-0">لا توجد ملاحظات لهذا المسافر.</div>
                )}
              </div>

              <div className="page-card mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                  <h4 className="section-title mb-0">مركز الوثائق</h4>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-gold"
                    onClick={() => window.location.assign("/TravelerDocuments/ExportToExcel")}
                  >
                    تصدير جميع الوثائق Excel
                  </button>
                </div>

                <form onSubmit={handleDocumentSubmit} className="mb-4">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label">نوع المستند</label>
                      <select className="form-select" required value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
                        <option value="">اختر النوع</option>
                        <option value="PersonalPhoto">صورة شخصية</option>
                        <option value="Visa">تأشيرة</option>
                        <option value="PassportCopy">نسخة جواز</option>
                        <option value="CivilId">بطاقة الهوية</option>
                        <option value="PDF">ملف PDF</option>
                        <option value="Other">أخرى</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">الملف</label>
                      <input type="file" className="form-control" required onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)} />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">ملاحظات</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="اختياري"
                        value={documentNotes}
                        onChange={(event) => setDocumentNotes(event.target.value)}
                      />
                    </div>

                    <div className="col-md-2 d-flex align-items-end">
                      <button type="submit" className="btn btn-gold w-100" disabled={documentSubmitting}>
                        رفع
                      </button>
                    </div>
                  </div>
                </form>

                {traveler.documents.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped align-middle">
                      <thead>
                        <tr>
                          <th>النوع</th>
                          <th>اسم الملف</th>
                          <th>الملاحظات</th>
                          <th>تاريخ الرفع</th>
                          <th>إجراءات</th>
                        </tr>
                      </thead>

                      <tbody>
                        {traveler.documents
                          .slice()
                          .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
                          .map((doc) => (
                            <tr key={doc.id}>
                              <td>{documentTypeLabel(doc.documentType)}</td>
                              <td>{normalizeDisplayText(doc.fileName)}</td>
                              <td>{normalizeDisplayText(doc.notes) || "-"}</td>
                              <td>{formatDateTime(doc.uploadedAt)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-gold me-2"
                                  onClick={() => window.open(`/TravelerDocuments/Download/${doc.id}`, "_blank", "noreferrer")}
                                >
                                  فتح
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  disabled={documentDeletingId === doc.id}
                                  onClick={() => {
                                    if (window.confirm("هل أنت متأكد من أرشفة هذا المستند؟")) {
                                      setDocumentDeletingId(doc.id);
                                      void handleDeleteDocument(doc.id).finally(() => {
                                        setDocumentDeletingId((current) => (current === doc.id ? null : current));
                                      });
                                    }
                                  }}
                                >
                                  أرشفة
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-warning mb-0">لا توجد مستندات إضافية لهذا المسافر.</div>
                )}
              </div>

              <div className="page-card">
                <h4 className="section-title">سجل الرحلات</h4>

                {traveler.trips.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped align-middle">
                      <thead>
                        <tr>
                          <th>رقم الرحلة</th>
                          <th>نوع الرحلة</th>
                          <th>تاريخ الرحلة</th>
                          <th>ملاحظات</th>
                        </tr>
                      </thead>

                      <tbody>
                        {traveler.trips
                          .slice()
                          .sort((left, right) => right.tripDate.localeCompare(left.tripDate))
                          .map((trip) => (
                            <tr key={trip.id}>
                              <td>{trip.id}</td>
                              <td>{normalizeDisplayText(trip.tripType)}</td>
                              <td>{formatDate(trip.tripDate)}</td>
                              <td>{normalizeDisplayText(trip.notes) || "-"}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-warning mb-0">لا توجد رحلات مسجلة لهذا المسافر.</div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
