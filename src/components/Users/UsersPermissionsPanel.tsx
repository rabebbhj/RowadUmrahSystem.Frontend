import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { getUsers, getUserPermissions, updateUserPermissions, type UserPermissions } from "../../api/users";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type UsersPermissionsPanelProps = {
  user: AuthUser;
  activePath: string;
  userId: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

type PermissionFieldKey = Exclude<keyof UserPermissions, "id" | "userId" | "userFullName" | "userEmail">;

type PermissionAction = {
  key: string;
  label: string;
};

type PermissionUnit = {
  key: string;
  title: string;
  description: string;
  icon: string;
  fields: Partial<Record<string, PermissionFieldKey>>;
};

const ACTIONS: PermissionAction[] = [
  { key: "view", label: "عرض" },
  { key: "add", label: "إضافة" },
  { key: "edit", label: "تعديل" },
  { key: "delete", label: "حذف" },
  { key: "archive", label: "أرشفة" },
  { key: "restore", label: "استرجاع" },
  { key: "export", label: "تصدير" }
];

const PERMISSION_UNITS: PermissionUnit[] = [
  {
    key: "dashboard",
    title: "لوحة التحكم",
    description: "الوصول إلى مؤشرات النظام والملخصات.",
    icon: "لو",
    fields: { view: "canAccessDashboard" }
  },
  {
    key: "travelers",
    title: "المسافرون",
    description: "إدارة بيانات المسافرين.",
    icon: "مس",
    fields: {
      view: "canViewTravelers",
      add: "canCreateTravelers",
      edit: "canEditTravelers",
      archive: "canArchiveTravelers",
      restore: "canRestoreTravelers"
    }
  },
  {
    key: "trips",
    title: "الرحلات",
    description: "إدارة رحلات العمرة.",
    icon: "رح",
    fields: {
      view: "canViewTrips",
      add: "canCreateTrips",
      archive: "canArchiveTrips",
      restore: "canRestoreTrips"
    }
  },
  {
    key: "documents",
    title: "الوثائق",
    description: "إدارة المستندات والوثائق.",
    icon: "وث",
    fields: {
      view: "canViewDocuments",
      add: "canUploadDocuments",
      archive: "canArchiveDocuments",
      restore: "canRestoreDocuments"
    }
  },
  {
    key: "blocks",
    title: "الحظر والشكاوى",
    description: "صلاحيات حساسة متعلقة بمنع أو رفع المنع.",
    icon: "حظ",
    fields: {
      view: "canViewBlocks",
      add: "canBlockTravelers",
      delete: "canUnblockTravelers"
    }
  },
  {
    key: "reports",
    title: "التقارير والرقابة",
    description: "عرض التقارير وسجل العمليات.",
    icon: "تق",
    fields: {
      view: "canViewReports",
      export: "canExportReports",
      archive: "canViewAuditLogs"
    }
  },
  {
    key: "notifications",
    title: "الإشعارات",
    description: "الوصول إلى إشعارات النظام الخاصة بالمستخدم.",
    icon: "إش",
    fields: { view: "canViewNotifications" }
  },
  {
    key: "accounting",
    title: "المحاسبة والمالية",
    description: "إدارة الحسابات والفواتير والمصاريف.",
    icon: "ما",
    fields: {
      view: "canViewAccounting",
      add: "canManageAccounting",
      edit: "canManageInvoices",
      delete: "canManageExpenses",
      restore: "canManageReceiptVouchers",
      archive: "canManagePaymentVouchers",
      export: "canViewFinancialReports"
    }
  },
  {
    key: "accounting-details",
    title: "تفاصيل المحاسبة",
    description: "البنوك، القيود اليومية ودليل الحسابات.",
    icon: "حس",
    fields: {
      view: "canManageChartOfAccounts",
      edit: "canManageJournalEntries",
      archive: "canManageBanks"
    }
  },
  {
    key: "system",
    title: "إدارة النظام",
    description: "إعدادات النظام وإدارة المستخدمين.",
    icon: "نظ",
    fields: {
      view: "canManageUsers"
    }
  }
];

const EMPTY_FILTER = "all";

const ALL_PERMISSION_FIELDS = Array.from(
  new Set(PERMISSION_UNITS.flatMap((unit) => Object.values(unit.fields).filter(Boolean)))
) as PermissionFieldKey[];

function createEmptyPermissions(): UserPermissions {
  return {
    id: 0,
    userId: "",
    userFullName: "",
    userEmail: "",
    canAccessDashboard: false,
    canViewNotifications: false,
    canManageUsers: false,
    canViewTravelers: false,
    canCreateTravelers: false,
    canEditTravelers: false,
    canArchiveTravelers: false,
    canRestoreTravelers: false,
    canViewTrips: false,
    canCreateTrips: false,
    canArchiveTrips: false,
    canRestoreTrips: false,
    canViewDocuments: false,
    canUploadDocuments: false,
    canArchiveDocuments: false,
    canRestoreDocuments: false,
    canViewBlocks: false,
    canBlockTravelers: false,
    canUnblockTravelers: false,
    canViewReports: false,
    canExportReports: false,
    canViewAuditLogs: false,
    canViewAccounting: false,
    canManageAccounting: false,
    canManageChartOfAccounts: false,
    canManageJournalEntries: false,
    canManageInvoices: false,
    canManageReceiptVouchers: false,
    canManagePaymentVouchers: false,
    canManageExpenses: false,
    canManageBanks: false,
    canViewFinancialReports: false
  };
}

type SelectedUser = {
  fullName: string;
  email: string;
  isActive?: boolean;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 12a8 8 0 1 0 2.3-5.6" />
      <path d="M4 4v6h6" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

export function UsersPermissionsPanel({
  user,
  activePath,
  userId,
  onNavigate,
  onLogout
}: UsersPermissionsPanelProps) {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [initialPermissions, setInitialPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [query, setQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState(EMPTY_FILTER);

  const selectedUserLabel = selectedUser?.fullName || permissions?.userFullName || "—";
  const selectedUserEmail = selectedUser?.email || permissions?.userEmail || "—";

  const filteredUnits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return PERMISSION_UNITS.filter((unit) => {
      const matchesUnit = unitFilter === EMPTY_FILTER || unit.key === unitFilter;
      const searchableText = `${unit.title} ${unit.description}`.toLowerCase();
      return matchesUnit && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [query, unitFilter]);

  const selectedCount = useMemo(() => {
    if (!permissions) {
      return 0;
    }

    return ALL_PERMISSION_FIELDS.filter((field) => permissions[field]).length;
  }, [permissions]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const [permissionsData, users] = await Promise.all([getUserPermissions(userId), getUsers()]);
        if (cancelled) {
          return;
        }

        const foundUser = users.find((item) => item.id === userId);
        setPermissions(permissionsData);
        setInitialPermissions(permissionsData);
        setSelectedUser(foundUser ? {
          fullName: foundUser.fullName,
          email: foundUser.email,
          isActive: foundUser.isActive
        } : {
          fullName: permissionsData.userFullName,
          email: permissionsData.userEmail
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load permissions");
        setPermissions(null);
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
  }, [onLogout, userId]);

  function handlePermissionChange(field: PermissionFieldKey, checked: boolean) {
    setPermissions((current) => (current ? ({ ...current, [field]: checked } as UserPermissions) : current));
  }

  function handleUnitToggle(unit: PermissionUnit, checked: boolean) {
    setPermissions((current) => {
      if (!current) {
        return current;
      }

      const next = { ...current } as UserPermissions;
      Object.values(unit.fields).forEach((field) => {
        if (field) {
          next[field] = checked;
        }
      });
      return next;
    });
  }

  function handleReset() {
    setPermissions(initialPermissions ?? createEmptyPermissions());
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!permissions) {
      return;
    }

    setSaving(true);
    setBusyMessage("جاري حفظ الصلاحيات...");
    setError(null);
    setMessage(null);

    try {
      const updated = await updateUserPermissions(userId, permissions);
      setPermissions(updated);
      setInitialPermissions(updated);
      setMessage("تم حفظ الصلاحيات.");
      onNavigate("/users");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "Failed to save permissions");
    } finally {
      setSaving(false);
      setBusyMessage("");
    }
  }

  return (
    <div className="app-shell permissions-page-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        {busyMessage && (
          <div className="rowad-loading-overlay" role="status" aria-live="polite">
            <span className="rowad-loading-spinner" />
            <strong>{busyMessage}</strong>
          </div>
        )}

        <div className="page-card permissions-manager" dir="rtl">
          <div className="permissions-header">
            <div>
              <div className="permissions-breadcrumb">إدارة النظام / المستخدمون / صلاحيات المستخدم</div>
              <h1 className="page-title mb-1">صلاحيات المستخدم</h1>
              <p className="rowad-text-muted mb-0">
                إدارة دقيقة لصلاحيات الموظف حسب الوحدات والعمليات داخل النظام.
              </p>
            </div>

            <button type="button" className="btn btn-outline-gold permissions-back-button" onClick={() => onNavigate("/users")}>
              رجوع
            </button>
          </div>

          <div className="permissions-user-strip">
            <div className="permissions-user-cell">
              <span className="permissions-user-icon"><UserIcon /></span>
              <div>
                <small>اسم الموظف</small>
                <strong>{selectedUserLabel}</strong>
              </div>
            </div>
            <div className="permissions-user-cell">
              <span className="permissions-user-icon"><MailIcon /></span>
              <div>
                <small>البريد الإلكتروني</small>
                <strong>{selectedUserEmail}</strong>
              </div>
            </div>
            <div className="permissions-status-chip">
              <span />
              {selectedUser?.isActive === false ? "غير نشط" : "نشط"}
            </div>
            <div className="permissions-count-chip">{selectedCount} صلاحية</div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          {loading && <div className="state-box">جاري تحميل الصلاحيات...</div>}

          {permissions && (
            <form onSubmit={handleSubmit}>
              <input type="hidden" name="id" value={permissions.id} />
              <input type="hidden" name="userId" value={permissions.userId} />

              <div className="permissions-toolbar">
                <div className="permissions-search">
                  <SearchIcon />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="البحث في الوحدات..."
                  />
                </div>

                <select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} aria-label="تصفية الوحدات">
                  <option value={EMPTY_FILTER}>جميع الوحدات</option>
                  {PERMISSION_UNITS.map((unit) => (
                    <option key={unit.key} value={unit.key}>{unit.title}</option>
                  ))}
                </select>

                <button type="button" className="btn btn-outline-gold permissions-reset-button" onClick={handleReset} disabled={saving}>
                  <ResetIcon />
                  إعادة تعيين
                </button>
              </div>

              <div className="permissions-table-wrap">
                <table className="permissions-table">
                  <thead>
                    <tr>
                      <th className="permissions-unit-col">الوحدة</th>
                      <th>الوصف</th>
                      {ACTIONS.map((action) => (
                        <th key={action.key}>{action.label}</th>
                      ))}
                      <th>الكل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.map((unit) => {
                      const unitFields = Object.values(unit.fields).filter(Boolean) as PermissionFieldKey[];
                      const canToggleAll = unitFields.length > 1;
                      const allChecked = canToggleAll && unitFields.every((field) => permissions[field]);

                      return (
                        <tr key={unit.key}>
                          <td className="permissions-unit-name">
                            <strong>{unit.title}</strong>
                          </td>
                          <td className="permissions-unit-description">{unit.description}</td>
                          {ACTIONS.map((action) => {
                            const field = unit.fields[action.key];
                            return (
                              <td key={action.key} className="permissions-check-cell">
                                {field ? (
                                  <label className="permissions-checkbox">
                                    <input
                                      type="checkbox"
                                      checked={permissions[field]}
                                      onChange={(event) => handlePermissionChange(field, event.target.checked)}
                                      disabled={saving}
                                      aria-label={`${unit.title} - ${action.label}`}
                                    />
                                    <span />
                                  </label>
                                ) : (
                                  <span className="permissions-empty-cell" aria-hidden="true" />
                                )}
                              </td>
                            );
                          })}
                          <td className="permissions-check-cell">
                            <label className="permissions-checkbox">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                onChange={(event) => handleUnitToggle(unit, event.target.checked)}
                                disabled={saving || !canToggleAll}
                                aria-label={`${unit.title} - الكل`}
                              />
                              <span />
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredUnits.length === 0 && (
                <div className="state-box">لا توجد وحدات مطابقة للبحث.</div>
              )}

              <div className="permission-guidance permissions-note">
                <strong>ملاحظة مهمة:</strong>
                <span>
                  بعض الصلاحيات حساسة مثل الحظر، الأرشفة، التصدير، وسجل العمليات. يجب أن تعطى فقط للمستخدمين المصرح لهم.
                </span>
              </div>

              <div className="permissions-actions">
                <button type="submit" className="btn btn-gold" disabled={saving}>
                  <SaveIcon />
                  {saving ? "جاري الحفظ..." : "حفظ الصلاحيات"}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/users")} disabled={saving}>
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
