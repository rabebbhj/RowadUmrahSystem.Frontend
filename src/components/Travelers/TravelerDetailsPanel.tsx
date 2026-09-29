import { useEffect, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { getTraveler, markTravelerDocumentsReviewed, type TravelerDetail } from "../../api/travelers";
import { formatDate } from "../../utils/dates";
import { displayTravelerPhone } from "../../utils/permissions";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type TravelerDetailsPanelProps = {
  user: AuthUser;
  activePath: string;
  travelerId: number;
  readOnly?: boolean;
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

function isMainAdmin(user: AuthUser) {
  return user.email?.toLowerCase() === "admin@rowad.local";
}

function can(user: AuthUser, permission: keyof NonNullable<AuthUser["permissions"]>) {
  return isMainAdmin(user) || Boolean(user.permissions?.[permission]);
}

export function TravelerDetailsPanel({
  user,
  activePath,
  travelerId,
  readOnly = false,
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
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const canEditTraveler = can(user, "canEditTravelers");
  const canCreateTrip = can(user, "canCreateTrips");
  const canViewTrips = can(user, "canViewTrips");
  const canViewDocuments = can(user, "canViewDocuments");
  const canUploadDocuments = can(user, "canUploadDocuments");
  const canArchiveDocuments = can(user, "canArchiveDocuments");
  const canExportReports = can(user, "canExportReports");
  const canViewTravelerDocuments = can(user, "canViewTravelers") || canEditTraveler || canViewDocuments;
  const canManageDocuments = canViewDocuments && !readOnly;
  const canDownloadDocuments = canViewDocuments;
  const canExportDocumentReports = canViewDocuments && canExportReports;
  const canReviewDocuments = canEditTraveler;

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

  async function handleMarkDocumentsReviewed() {
    if (!traveler || reviewSubmitting) {
      return;
    }

    setReviewSubmitting(true);
    setDocumentError(null);
    setDocumentSuccess(null);

    try {
      await markTravelerDocumentsReviewed(traveler.id);
      if (canViewDocuments) {
        onNavigate("/documents");
      } else {
        onNavigate("/travelers");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setDocumentError(error instanceof Error ? error.message : "تعذر تأكيد تدقيق الوثائق.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  const documentRows = traveler
    ? [
        ...(traveler.passportImagePath
          ? [
              {
                key: "passport",
                documentType: "صورة الجواز",
                fileName: traveler.passportNumber ? `Passport-${traveler.passportNumber}` : "Passport",
                notes: "الصورة الأساسية للجواز",
                uploadedAt: traveler.createdAt,
                viewUrl: traveler.passportImagePath,
                downloadUrl: traveler.passportImagePath,
                documentId: null as number | null,
                canArchive: false
              }
            ]
          : []),
        ...traveler.documents
          .slice()
          .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
          .map((doc) => ({
            key: `document-${doc.id}`,
            documentType: documentTypeLabel(doc.documentType),
            fileName: normalizeDisplayText(doc.fileName),
            notes: normalizeDisplayText(doc.notes) || "-",
            uploadedAt: doc.uploadedAt,
            viewUrl: doc.filePath,
            downloadUrl: `/TravelerDocuments/Download/${doc.id}`,
            documentId: doc.id,
            canArchive: true
          }))
      ]
    : [];

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

                <div className="action-bar traveler-detail-actions mb-0">
                  {canEditTraveler && (
                    <button type="button" className="btn btn-outline-gold" onClick={() => onNavigate(`/travelers/${traveler.id}/edit`)}>
                      تعديل
                    </button>
                  )}

                  {!readOnly && (
                    <>
                      {canCreateTrip && (
                        <button type="button" className="btn btn-gold" onClick={() => onNavigate(`/trips/create?travelerId=${traveler.id}`)}>
                          + إضافة عمرة
                        </button>
                      )}

                      {canExportReports && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => window.location.assign(`/Travelers/TravelerPdf/${traveler.id}`)}
                        >
                          PDF
                        </button>
                      )}

                      {canReviewDocuments && !traveler.documentsReviewed && (
                        <button
                          type="button"
                          className="btn btn-outline-gold"
                          disabled={reviewSubmitting}
                          onClick={handleMarkDocumentsReviewed}
                        >
                          {reviewSubmitting ? "جاري التدقيق..." : "تم التدقيق"}
                        </button>
                      )}

                      <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/travelers")}>
                        رجوع
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="page-card traveler-data-card mb-4">
                <h4 className="section-title">البيانات الأساسية</h4>

                <div className="traveler-detail-grid">
                  <div className="traveler-detail-field">
                    <small>الرقم</small>
                    <strong>{traveler.id}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>رقم الجواز</small>
                    <strong>{traveler.passportNumber}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>الاسم الكامل</small>
                    <strong>{normalizeDisplayText(traveler.fullName) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>الاسم الأول (عربي)</small>
                    <strong>{normalizeDisplayText(traveler.firstNameArabic) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>اسم الأب (عربي)</small>
                    <strong>{normalizeDisplayText(traveler.fatherNameArabic) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>اسم الجد (عربي)</small>
                    <strong>{normalizeDisplayText(traveler.grandFatherNameArabic) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>اسم العائلة (عربي)</small>
                    <strong>{normalizeDisplayText(traveler.familyNameArabic) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>الاسم الأول</small>
                    <strong>{normalizeDisplayText(traveler.firstNameEnglish) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>اسم الأب</small>
                    <strong>{normalizeDisplayText(traveler.fatherNameEnglish) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>اسم الجد</small>
                    <strong>{normalizeDisplayText(traveler.grandFatherNameEnglish) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>اسم العائلة</small>
                    <strong>{normalizeDisplayText(traveler.familyNameEnglish) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>الجنسية</small>
                    <strong>{normalizeDisplayText(traveler.nationality) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>الجنس</small>
                    <strong>{normalizeDisplayText(traveler.gender) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>المهنة</small>
                    <strong>{normalizeDisplayText(traveler.profession) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>دولة الميلاد</small>
                    <strong>{normalizeDisplayText(traveler.birthCountry) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>مدينة الميلاد</small>
                    <strong>{normalizeDisplayText(traveler.birthCity) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>الحالة الاجتماعية</small>
                    <strong>{normalizeDisplayText(traveler.maritalStatus) || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>تاريخ الميلاد</small>
                    <strong>{formatDate(traveler.dateOfBirth)}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>رقم الإقامة</small>
                    <strong>{traveler.residenceNumber || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>تاريخ انتهاء الإقامة</small>
                    <strong>{traveler.residenceExpiryDate ? formatDate(traveler.residenceExpiryDate) : "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>رقم الهاتف</small>
                    <strong>{displayTravelerPhone(user, traveler.phoneNumber)}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>البريد الإلكتروني</small>
                    <strong>{traveler.email || "-"}</strong>
                  </div>

                  <div className="traveler-detail-field">
                    <small>تاريخ انتهاء الجواز</small>
                    <strong>{traveler.passportExpiryDate ? formatDate(traveler.passportExpiryDate) : "-"}</strong>
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

              {canViewTravelerDocuments && (
              <div className="page-card mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                  <h4 className="section-title mb-0">مركز الوثائق</h4>

                  {canExportDocumentReports && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-gold"
                      onClick={() => window.location.assign("/TravelerDocuments/ExportToExcel")}
                    >
                      تصدير جميع الوثائق Excel
                    </button>
                  )}
                </div>

                {canManageDocuments && canUploadDocuments && (
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
                )}

                {documentRows.length > 0 ? (
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
                        {documentRows.map((doc) => (
                            <tr key={doc.key}>
                              <td>{doc.documentType}</td>
                              <td>{doc.fileName}</td>
                              <td>{doc.notes}</td>
                              <td>{formatDateTime(doc.uploadedAt)}</td>
                              <td>
                                <a
                                  className="btn btn-sm btn-outline-secondary me-2"
                                  href={doc.viewUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  عرض
                                </a>

                                {canDownloadDocuments && (
                                  <a
                                    className="btn btn-sm btn-outline-gold me-2"
                                    href={doc.downloadUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                  >
                                    تحميل
                                  </a>
                                )}

                                {canManageDocuments && canArchiveDocuments && doc.canArchive && doc.documentId !== null && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    disabled={documentDeletingId === doc.documentId}
                                    onClick={() => {
                                      const documentId = doc.documentId;
                                      if (documentId === null) {
                                        return;
                                      }

                                      if (window.confirm("هل أنت متأكد من أرشفة هذا المستند؟")) {
                                        setDocumentDeletingId(documentId);
                                        void handleDeleteDocument(documentId).finally(() => {
                                          setDocumentDeletingId((current) => (current === documentId ? null : current));
                                        });
                                      }
                                    }}
                                  >
                                    أرشفة
                                  </button>
                                )}
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
              )}

              {canViewTrips && (
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
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
