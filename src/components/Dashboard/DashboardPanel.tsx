import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getDashboard, type DashboardData } from "../../api/dashboard";
import { formatDate, formatDateTime } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type DashboardPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

function formatDashboardDate() {
  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function normalizeDisplayText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  if (!/[Ã˜Ã™ÃƒÃ‚]/.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return value;
  }
}

export function DashboardPanel({ user, activePath, onNavigate, onLogout }: DashboardPanelProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const data = await getDashboard();
        if (!cancelled) {
          setDashboard(data);
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

  const todayText = useMemo(() => formatDashboardDate(), []);
  const permissions = dashboard?.permissions;

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        {error && <div className="state-box error">{error}</div>}
        {loading && <div className="state-box">جاري تحميل لوحة التحكم...</div>}

        {dashboard && permissions && (
          <div className="dashboard-clean">
            <section className="dash-header">
              <div>
                <span className="dash-label">لوحة الإدارة</span>
                <h1>لوحة تحكم رواد العمرة</h1>
                <p>نظرة منظمة على أهم مؤشرات النظام والتنبيهات التشغيلية.</p>
              </div>

              <div className="dash-header-actions">
                <span className="dash-date">{todayText}</span>

                {permissions.canViewTravelers && (
                  <button type="button" className="btn btn-gold" onClick={() => onNavigate("/travelers/create")}>
                    تسجيل مسافر
                  </button>
                )}

                {permissions.canViewReports && (
                  <button type="button" className="btn btn-outline-gold" onClick={() => window.location.assign("/Travelers/ExportExpiringPassportsPdf")}>
                    التقارير
                  </button>
                )}
              </div>
            </section>

            <section className="dash-kpi-grid">
              {permissions.canViewTravelers && (
                <button type="button" className="dash-kpi-card" onClick={() => onNavigate("/travelers")}>
                  <div className="dash-kpi-icon">M</div>
                  <div>
                    <span>إجمالي المسافرين</span>
                    <strong>{dashboard.travelersCount}</strong>
                    <small>{dashboard.recentTravelersCount} مسافر جديد هذا الشهر</small>
                  </div>
                </button>
              )}

              {permissions.canViewTrips && (
                <button type="button" className="dash-kpi-card" onClick={() => onNavigate("/trips")}>
                  <div className="dash-kpi-icon">T</div>
                  <div>
                    <span>إجمالي الرحلات</span>
                    <strong>{dashboard.tripsCount}</strong>
                    <small>سجل رحلات العمرة</small>
                  </div>
                </button>
              )}

              {permissions.canViewDocuments && (
                <div className="dash-kpi-card">
                  <div className="dash-kpi-icon">D</div>
                  <div>
                    <span>الوثائق النشطة</span>
                    <strong>{dashboard.documentsCount}</strong>
                    <small>{dashboard.uploadedDocumentsThisMonth} وثيقة هذا الشهر</small>
                  </div>
                </div>
              )}

              {permissions.canViewBlocks && (
                <button type="button" className="dash-kpi-card" onClick={() => onNavigate("/travelers/blocked")}>
                  <div className="dash-kpi-icon danger">B</div>
                  <div>
                    <span>المحظورون</span>
                    <strong>{dashboard.blockedCount}</strong>
                    <small>قائمة الحظر والمتابعة</small>
                  </div>
                </button>
              )}

              {permissions.canViewTravelers && (
                <a href="#passport-section" className="dash-kpi-card">
                  <div className="dash-kpi-icon warning">P</div>
                  <div>
                    <span>جوازات قريبة الانتهاء</span>
                    <strong>{dashboard.expiringPassportsCount}</strong>
                    <small>خلال 6 أشهر</small>
                  </div>
                </a>
              )}

              {permissions.canViewAuditLogs && (
                <button type="button" className="dash-kpi-card" onClick={() => onNavigate("/audit-logs")}>
                  <div className="dash-kpi-icon info">A</div>
                  <div>
                    <span>عمليات اليوم</span>
                    <strong>{dashboard.todayAuditCount}</strong>
                    <small>{dashboard.monthAuditCount} عملية هذا الشهر</small>
                  </div>
                </button>
              )}
            </section>

            <section className="dash-layout">
              <div className="dash-panel dash-panel-main">
                <div className="dash-panel-header">
                  <div>
                    <h3>الإجراءات السريعة</h3>
                    <p>اختصارات لأهم العمليات اليومية</p>
                  </div>
                </div>

                <div className="dash-actions-grid">
                  {permissions.canViewTravelers && (
                    <>
                      <button type="button" className="dash-action primary" onClick={() => onNavigate("/travelers/create")}>
                        <strong>تسجيل مسافر</strong>
                        <small>إنشاء ملف جديد</small>
                      </button>

                      <button type="button" className="dash-action" onClick={() => onNavigate("/travelers")}>
                        <strong>المسافرون</strong>
                        <small>عرض وإدارة الملفات</small>
                      </button>

                      <button type="button" className="dash-action" onClick={() => onNavigate("/travelers/deleted")}>
                        <strong>أرشيف المسافرين</strong>
                        <small>استرجاع الملفات</small>
                      </button>
                    </>
                  )}

                  {permissions.canViewTrips && (
                    <button type="button" className="dash-action" onClick={() => onNavigate("/trips")}>
                      <strong>الرحلات</strong>
                      <small>سجل رحلات العمرة</small>
                    </button>
                  )}

                  {permissions.canViewDocuments && (
                    <button type="button" className="dash-action" onClick={() => onNavigate("/documents")}>
                      <strong>أرشيف الوثائق</strong>
                      <small>إدارة الوثائق المؤرشفة</small>
                    </button>
                  )}

                  {permissions.canViewBlocks && (
                    <button type="button" className="dash-action" onClick={() => onNavigate("/travelers/blocked")}>
                      <strong>الحظر والشكاوى</strong>
                      <small>متابعة الحالات الحساسة</small>
                    </button>
                  )}

                  {permissions.canViewAuditLogs && (
                    <button type="button" className="dash-action" onClick={() => onNavigate("/audit-logs")}>
                      <strong>سجل العمليات</strong>
                      <small>تدقيق ومراقبة النظام</small>
                    </button>
                  )}

                  <button type="button" className="dash-action" onClick={() => onNavigate("/notifications")}>
                    <strong>الإشعارات</strong>
                    <small>مركز التنبيهات</small>
                  </button>
                </div>
              </div>

              {permissions.canViewAuditLogs && (
                <div className="dash-panel">
                  <div className="dash-panel-header">
                    <div>
                      <h3>نشاط النظام</h3>
                      <p>ملخص سريع</p>
                    </div>
                  </div>

                  <div className="dash-mini-stats">
                    <div>
                      <span>اليوم</span>
                      <strong>{dashboard.todayAuditCount}</strong>
                    </div>

                    <div>
                      <span>الأسبوع</span>
                      <strong>{dashboard.weekAuditCount}</strong>
                    </div>

                    <div>
                      <span>الشهر</span>
                      <strong>{dashboard.monthAuditCount}</strong>
                    </div>
                  </div>

                  <div className="dash-highlight">
                    <span>أكثر موظف نشاطاً</span>

                    {dashboard.topEmployee ? (
                      <>
                        <strong>{normalizeDisplayText(dashboard.topEmployee.employeeName)}</strong>
                        <small>{dashboard.topEmployee.count} عملية</small>
                      </>
                    ) : (
                      <>
                        <strong>لا يوجد بيانات</strong>
                        <small>لم يتم تسجيل نشاط بعد</small>
                      </>
                    )}
                  </div>
                </div>
              )}
            </section>

            {(permissions.canViewTravelers || permissions.canViewBlocks) && (
              <section className="dash-layout" id="passport-section">
                {permissions.canViewTravelers && (
                  <div className="dash-panel dash-panel-main">
                    <div className="dash-panel-header">
                      <div>
                        <h3>أقرب الجوازات انتهاءً</h3>
                        <p>أول 10 جوازات تحتاج متابعة</p>
                      </div>

                      {permissions.canViewReports && (
                        <button type="button" className="btn btn-sm btn-outline-gold" onClick={() => window.location.assign("/Travelers/ExportExpiringPassportsPdf")}>
                          PDF
                        </button>
                      )}
                    </div>

                    {dashboard.expiringPassports.length > 0 ? (
                      <div className="table-responsive clean-table-wrap">
                        <table className="table clean-table align-middle">
                          <thead>
                            <tr>
                              <th>الاسم</th>
                              <th>رقم الجواز</th>
                              <th>الجنسية</th>
                              <th>تاريخ الانتهاء</th>
                              <th>الإجراء</th>
                            </tr>
                          </thead>

                          <tbody>
                            {dashboard.expiringPassports.map((traveler) => (
                              <tr key={traveler.id}>
                                <td>{normalizeDisplayText(traveler.fullName)}</td>
                                <td>{traveler.passportNumber}</td>
                                <td>{normalizeDisplayText(traveler.nationality)}</td>
                                <td>{traveler.passportExpiryDate ? formatDate(traveler.passportExpiryDate) : "-"}</td>
                                <td>
                                  <button type="button" className="btn btn-sm btn-outline-gold" onClick={() => onNavigate(`/travelers/${traveler.id}`)}>
                                    عرض الملف
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="dash-empty">
                        <strong>لا يوجد جوازات قريبة الانتهاء</strong>
                        <small>الوضع الحالي آمن</small>
                      </div>
                    )}
                  </div>
                )}

                <div className="dash-panel">
                  <div className="dash-panel-header">
                    <div>
                      <h3>التنبيهات المهمة</h3>
                      <p>ملخص الحالات التي تحتاج متابعة</p>
                    </div>
                  </div>

                  <div className="dash-alert-list">
                    {permissions.canViewTravelers && (
                      <>
                        <div className="dash-alert danger">
                          <strong>{dashboard.expiredPassportsCount} جواز منتهي</strong>
                          <small>يحتاج متابعة فورية</small>
                        </div>

                        <div className="dash-alert warning">
                          <strong>{dashboard.expiringPassportsCount} جواز قريب الانتهاء</strong>
                          <small>خلال 6 أشهر القادمة</small>
                        </div>
                      </>
                    )}

                    {permissions.canViewBlocks && (
                      <div className="dash-alert">
                        <strong>{dashboard.blockedCount} مسافر محظور</strong>
                        <small>ضمن قائمة الحظر والمتابعة</small>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {permissions.canViewAuditLogs && (
              <section className="dash-panel">
                <div className="dash-panel-header">
                  <div>
                    <h3>آخر العمليات</h3>
                    <p>آخر 10 عمليات تمت داخل النظام</p>
                  </div>

                  <button type="button" className="btn btn-sm btn-outline-gold" onClick={() => onNavigate("/audit-logs")}>
                    عرض الكل
                  </button>
                </div>

                {dashboard.latestAuditLogs.length > 0 ? (
                  <div className="dash-timeline">
                    {dashboard.latestAuditLogs.map((log, index) => (
                      <div className="dash-timeline-item" key={`${log.createdAt}-${index}`}>
                        <div className="dash-timeline-mark"></div>

                        <div className="dash-timeline-body">
                          <div className="d-flex justify-content-between gap-3">
                            <strong>{normalizeDisplayText(log.action)}</strong>
                            <small>{formatDateTime(log.createdAt)}</small>
                          </div>

                          <p>
                            {normalizeDisplayText(log.employeeName)}
                            {log.travelerName ? <span> - {normalizeDisplayText(log.travelerName)}</span> : null}
                          </p>

                          <small>{normalizeDisplayText(log.details)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dash-empty">
                    <strong>لا يوجد عمليات مسجلة</strong>
                    <small>سيظهر النشاط هنا عند استخدام النظام</small>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
