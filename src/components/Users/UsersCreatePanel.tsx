import { useMemo, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { createUser, getUserPermissions, updateUserPermissions, type UserPermissions } from "../../api/users";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type UsersCreatePanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

type PermissionKey = Exclude<keyof UserPermissions, "id" | "userId" | "userFullName" | "userEmail">;

type PermissionAction = {
  key: string;
  label: string;
};

type PermissionUnit = {
  key: string;
  title: string;
  description: string;
  icon: string;
  fields: Partial<Record<string, PermissionKey>>;
};

type PermissionPreset = {
  id: string;
  label: string;
  description: string;
  permissions: Partial<Record<PermissionKey, boolean>>;
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
    fields: { view: "canManageUsers" }
  }
];

const EMPTY_FILTER = "all";

const ALL_PERMISSION_KEYS = Array.from(
  new Set(PERMISSION_UNITS.flatMap((unit) => Object.values(unit.fields).filter(Boolean)))
) as PermissionKey[];

const PRESETS: PermissionPreset[] = [
  {
    id: "operations",
    label: "العمليات",
    description: "صلاحيات المسافرين والرحلات والوثائق مع لوحة التحكم والإشعارات.",
    permissions: {
      canAccessDashboard: true,
      canViewNotifications: true,
      canViewTravelers: true,
      canCreateTravelers: true,
      canEditTravelers: true,
      canViewTrips: true,
      canCreateTrips: true,
      canViewDocuments: true,
      canUploadDocuments: true,
      canViewReports: true
    }
  },
  {
    id: "finance",
    label: "المحاسبة",
    description: "صلاحيات المحاسبة والمالية والتقارير المالية.",
    permissions: {
      canAccessDashboard: true,
      canViewNotifications: true,
      canViewAccounting: true,
      canManageAccounting: true,
      canManageChartOfAccounts: true,
      canManageJournalEntries: true,
      canManageInvoices: true,
      canManageReceiptVouchers: true,
      canManagePaymentVouchers: true,
      canManageExpenses: true,
      canManageBanks: true,
      canViewFinancialReports: true
    }
  },
  {
    id: "full-operations",
    label: "تشغيل كامل",
    description: "كل عمليات المسافرين والرحلات والوثائق والحظر والتقارير.",
    permissions: {
      canAccessDashboard: true,
      canViewNotifications: true,
      canViewTravelers: true,
      canCreateTravelers: true,
      canEditTravelers: true,
      canArchiveTravelers: true,
      canRestoreTravelers: true,
      canViewTrips: true,
      canCreateTrips: true,
      canArchiveTrips: true,
      canRestoreTrips: true,
      canViewDocuments: true,
      canUploadDocuments: true,
      canArchiveDocuments: true,
      canRestoreDocuments: true,
      canViewBlocks: true,
      canBlockTravelers: true,
      canUnblockTravelers: true,
      canViewReports: true,
      canExportReports: true,
      canViewAuditLogs: true
    }
  },
  {
    id: "readonly",
    label: "قراءة فقط",
    description: "مشاهدة الشاشات الأساسية بدون تعديل أو أرشفة.",
    permissions: {
      canAccessDashboard: true,
      canViewNotifications: true,
      canViewTravelers: true,
      canViewTrips: true,
      canViewDocuments: true,
      canViewReports: true,
      canViewAccounting: true,
      canViewFinancialReports: true
    }
  },
  {
    id: "custom",
    label: "مخصص",
    description: "اختيار الصلاحيات يدوياً من الجدول.",
    permissions: {}
  }
];

function createEmptyPermissionState(): Record<PermissionKey, boolean> {
  return ALL_PERMISSION_KEYS.reduce(
    (result, key) => {
      result[key] = false;
      return result;
    },
    {} as Record<PermissionKey, boolean>
  );
}

function createPermissionsPayload(base: UserPermissions, selected: Record<PermissionKey, boolean>): UserPermissions {
  return {
    ...base,
    ...selected
  };
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
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

export function UsersCreatePanel({ user, activePath, onNavigate, onLogout }: UsersCreatePanelProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [presetId, setPresetId] = useState("operations");
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(() => ({
    ...createEmptyPermissionState(),
    ...PRESETS[0].permissions
  }));
  const [query, setQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState(EMPTY_FILTER);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedCount = useMemo(() => ALL_PERMISSION_KEYS.filter((key) => permissions[key]).length, [permissions]);

  const filteredUnits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return PERMISSION_UNITS.filter((unit) => {
      const matchesUnit = unitFilter === EMPTY_FILTER || unit.key === unitFilter;
      const searchableText = `${unit.title} ${unit.description}`.toLowerCase();
      return matchesUnit && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [query, unitFilter]);

  function applyPreset(nextPresetId: string) {
    const preset = PRESETS.find((item) => item.id === nextPresetId) ?? PRESETS[0];
    setPresetId(preset.id);
    setPermissions({
      ...createEmptyPermissionState(),
      ...preset.permissions
    });
  }

  function togglePermission(key: PermissionKey, checked: boolean) {
    setPresetId("custom");
    setPermissions((current) => ({
      ...current,
      [key]: checked
    }));
  }

  function toggleUnit(unit: PermissionUnit, checked: boolean) {
    setPresetId("custom");
    setPermissions((current) => {
      const next = { ...current };
      Object.values(unit.fields).forEach((field) => {
        if (field) {
          next[field] = checked;
        }
      });
      return next;
    });
  }

  function resetPermissions() {
    applyPreset(presetId);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const createdUser = await createUser({
        fullName,
        email,
        phoneNumber,
        password
      });

      const currentPermissions = await getUserPermissions(createdUser.id);
      await updateUserPermissions(createdUser.id, createPermissionsPayload(currentPermissions, permissions));

      onNavigate("/users");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card permissions-manager" dir="rtl">
          <div className="permissions-header">
            <div>
              <div className="permissions-breadcrumb">إدارة النظام / المستخدمون / إضافة موظف</div>
              <h1 className="page-title mb-1">إضافة موظف جديد</h1>
              <p className="rowad-text-muted mb-0">إنشاء الحساب وتحديد الصلاحيات في نفس الخطوة.</p>
            </div>

            <button type="button" className="btn btn-outline-gold permissions-back-button" onClick={() => onNavigate("/users")}>
              رجوع
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="users-create-layout">
              <section className="users-create-section">
                <h4 className="section-title">بيانات الموظف</h4>
                <div className="user-form-grid">
                  <div className="user-form-field">
                    <label className="form-label" htmlFor="user-full-name">اسم الموظف</label>
                    <input
                      id="user-full-name"
                      className="form-control"
                      placeholder="الاسم الكامل"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                    />
                  </div>

                  <div className="user-form-field">
                    <label className="form-label" htmlFor="user-email">البريد الإلكتروني / اسم المستخدم</label>
                    <input
                      id="user-email"
                      type="email"
                      className="form-control"
                      placeholder="employee@rowad.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>

                  <div className="user-form-field">
                    <label className="form-label" htmlFor="user-phone">رقم الهاتف</label>
                    <input
                      id="user-phone"
                      className="form-control"
                      placeholder="+965 XXXXXXXX"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                    />
                  </div>

                  <div className="user-form-field">
                    <label className="form-label" htmlFor="user-password">كلمة المرور</label>
                    <input
                      id="user-password"
                      type="password"
                      className="form-control"
                      placeholder="********"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className="users-create-section">
                <div className="permissions-create-title">
                  <div>
                    <h4 className="section-title">نوع الصلاحيات</h4>
                    <p className="rowad-text-muted mb-0">اختر قالباً سريعاً ثم عدل الجدول حسب حاجة الموظف.</p>
                  </div>
                  <div className="permissions-count-chip">{selectedCount} صلاحية</div>
                </div>

                <div className="permission-grid create-preset-grid">
                  {PRESETS.map((preset) => (
                    <label key={preset.id} className={presetId === preset.id ? "permission-card active" : "permission-card"}>
                      <input
                        type="radio"
                        name="permissionPreset"
                        checked={presetId === preset.id}
                        onChange={() => applyPreset(preset.id)}
                        disabled={saving}
                      />
                      <span>
                        <strong>{preset.label}</strong>
                        <small>{preset.description}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="permission-guidance permissions-note">
              <strong>الصلاحيات المختارة:</strong>
              <span>{selectedCount} صلاحية. يمكن للمدير تعديلها لاحقاً من صفحة المستخدمين.</span>
            </div>

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

              <button type="button" className="btn btn-outline-gold permissions-reset-button" onClick={resetPermissions} disabled={saving}>
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
                    const unitFields = Object.values(unit.fields).filter(Boolean) as PermissionKey[];
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
                                    onChange={(event) => togglePermission(field, event.target.checked)}
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
                              onChange={(event) => toggleUnit(unit, event.target.checked)}
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

            <div className="permissions-actions">
              <button type="submit" className="btn btn-gold" disabled={saving}>
                <SaveIcon />
                {saving ? "جاري الحفظ..." : "إنشاء الموظف"}
              </button>

              <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/users")} disabled={saving}>
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
