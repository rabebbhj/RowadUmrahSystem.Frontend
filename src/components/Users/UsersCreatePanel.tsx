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

type PermissionField = {
  key: PermissionKey;
  title: string;
  note: string;
};

type PermissionGroup = {
  title: string;
  fields: PermissionField[];
};

type PermissionPreset = {
  id: string;
  label: string;
  description: string;
  permissions: Partial<Record<PermissionKey, boolean>>;
};

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: "المسافرون والرحلات",
    fields: [
      { key: "canViewTravelers", title: "مشاهدة المسافرين", note: "عرض قائمة المسافرين والملفات." },
      { key: "canCreateTravelers", title: "إضافة مسافر", note: "إنشاء ملف مسافر جديد." },
      { key: "canEditTravelers", title: "تعديل مسافر", note: "تحديث بيانات المسافر والجواز." },
      { key: "canArchiveTravelers", title: "أرشفة مسافر", note: "نقل المسافر إلى الأرشيف." },
      { key: "canRestoreTravelers", title: "استرجاع مسافر", note: "إرجاع مسافر من الأرشيف." },
      { key: "canViewTrips", title: "مشاهدة الرحلات", note: "عرض سجل الرحلات." },
      { key: "canCreateTrips", title: "إضافة رحلة", note: "تسجيل رحلة لمسافر." },
      { key: "canArchiveTrips", title: "أرشفة رحلة", note: "إخفاء رحلة من السجل النشط." },
      { key: "canRestoreTrips", title: "استرجاع رحلة", note: "إرجاع رحلة مؤرشفة." }
    ]
  },
  {
    title: "الوثائق والحظر",
    fields: [
      { key: "canViewDocuments", title: "مشاهدة الوثائق", note: "عرض وثائق المسافر." },
      { key: "canUploadDocuments", title: "رفع وثائق", note: "إضافة صور أو ملفات PDF." },
      { key: "canArchiveDocuments", title: "أرشفة وثائق", note: "نقل الوثائق إلى الأرشيف." },
      { key: "canRestoreDocuments", title: "استرجاع وثائق", note: "إرجاع الوثائق المؤرشفة." },
      { key: "canViewBlocks", title: "مشاهدة الحظر", note: "عرض قائمة المحظورين." },
      { key: "canBlockTravelers", title: "حظر مسافر", note: "منع مسافر من المتابعة." },
      { key: "canUnblockTravelers", title: "رفع الحظر", note: "إلغاء حظر مسافر." }
    ]
  },
  {
    title: "المحاسبة والمالية",
    fields: [
      { key: "canViewAccounting", title: "مشاهدة المحاسبة", note: "فتح شاشة المحاسبة." },
      { key: "canManageAccounting", title: "إدارة المحاسبة بالكامل", note: "صلاحية شاملة لكل المالية." },
      { key: "canManageChartOfAccounts", title: "دليل الحسابات", note: "إدارة شجرة الحسابات." },
      { key: "canManageJournalEntries", title: "القيود اليومية", note: "إدارة القيود." },
      { key: "canManageInvoices", title: "الفواتير", note: "إدارة الفواتير." },
      { key: "canManageReceiptVouchers", title: "سندات القبض", note: "إدارة سندات القبض." },
      { key: "canManagePaymentVouchers", title: "سندات الصرف", note: "إدارة سندات الصرف." },
      { key: "canManageExpenses", title: "المصاريف", note: "إدارة مصاريف الرحلات." },
      { key: "canManageBanks", title: "البنوك", note: "إدارة الحسابات البنكية." },
      { key: "canViewFinancialReports", title: "التقارير المالية", note: "عرض التقارير المالية." }
    ]
  },
  {
    title: "التقارير والنظام",
    fields: [
      { key: "canViewReports", title: "مشاهدة التقارير", note: "عرض تقارير النظام." },
      { key: "canExportReports", title: "تصدير التقارير", note: "تصدير PDF و Excel." },
      { key: "canViewAuditLogs", title: "سجل العمليات", note: "عرض نشاط النظام." },
      { key: "canManageUsers", title: "إدارة المستخدمين", note: "إنشاء المستخدمين وتعديل صلاحياتهم." }
    ]
  }
];

const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((group) => group.fields.map((field) => field.key));

const PRESETS: PermissionPreset[] = [
  {
    id: "hr",
    label: "HR / العمليات",
    description: "يرى المسافرين والرحلات والوثائق بدون المحاسبة.",
    permissions: {
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
    label: "Finance / Compta",
    description: "يرى فقط أجزاء التمويل والمحاسبة.",
    permissions: {
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
    id: "operations",
    label: "Opérations كاملة",
    description: "المسافرون، الرحلات، الوثائق، الحظر والتقارير.",
    permissions: {
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
    label: "Lecture seule",
    description: "مشاهدة فقط بدون إنشاء أو تعديل.",
    permissions: {
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
    label: "Personnalisé",
    description: "اختيار الصلاحيات يدوياً.",
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

export function UsersCreatePanel({ user, activePath, onNavigate, onLogout }: UsersCreatePanelProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [presetId, setPresetId] = useState("hr");
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(() => ({
    ...createEmptyPermissionState(),
    ...PRESETS[0].permissions
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedCount = useMemo(() => Object.values(permissions).filter(Boolean).length, [permissions]);

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
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">إضافة موظف جديد</h1>
              <p className="text-muted mb-0">إنشاء الحساب وتحديد الصلاحيات في نفس الخطوة.</p>
            </div>

            <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/users")}>
              رجوع
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4 mb-4">
                <div className="page-card h-100">
                  <h4 className="section-title">نوع الصلاحيات</h4>
                  <p className="text-muted">اختر قالباً سريعاً ثم عدّل التفاصيل حسب حاجة الموظف.</p>

                  <div className="permission-grid">
                    {PRESETS.map((preset) => (
                      <label key={preset.id} className={presetId === preset.id ? "permission-card active" : "permission-card"}>
                        <input
                          type="radio"
                          name="permissionPreset"
                          checked={presetId === preset.id}
                          onChange={() => applyPreset(preset.id)}
                        />
                        <span>
                          <strong>{preset.label}</strong>
                          <small>{preset.description}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-lg-8 mb-4">
                <div className="page-card h-100">
                  <h4 className="section-title">بيانات الموظف</h4>

                  <div className="user-form-grid">
                    <div className="user-form-field">
                      <label className="form-label" htmlFor="user-full-name">اسم الموظف</label>
                      <input className="form-control" placeholder="الاسم الكامل" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                    </div>

                    <div className="user-form-field">
                      <label className="form-label" htmlFor="user-email">البريد الإلكتروني / اسم المستخدم</label>
                      <input type="email" className="form-control" placeholder="employee@rowad.com" value={email} onChange={(event) => setEmail(event.target.value)} />
                    </div>

                    <div className="user-form-field">
                      <label className="form-label" htmlFor="user-phone">رقم الهاتف</label>
                      <input className="form-control" placeholder="+965 XXXXXXXX" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
                    </div>

                    <div className="user-form-field">
                      <label className="form-label" htmlFor="user-password">كلمة المرور</label>
                      <input type="password" className="form-control" placeholder="********" value={password} onChange={(event) => setPassword(event.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="permission-guidance mb-4">
              <strong>الصلاحيات المختارة:</strong> {selectedCount} صلاحية. يمكن للمدير تعديلها لاحقاً من صفحة المستخدمين.
            </div>

            {PERMISSION_GROUPS.map((group) => (
              <div className="permission-section mb-4" key={group.title}>
                <div className="permission-section-header">
                  <h4>{group.title}</h4>
                </div>

                <div className="permission-grid">
                  {group.fields.map((field) => (
                    <label key={field.key} className={permissions[field.key] ? "permission-card active" : "permission-card"}>
                      <input
                        type="checkbox"
                        checked={permissions[field.key]}
                        onChange={(event) => togglePermission(field.key, event.target.checked)}
                        disabled={saving}
                      />
                      <span>
                        <strong>{field.title}</strong>
                        <small>{field.note}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="page-card">
              <div className="d-flex flex-wrap justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">إنشاء الحساب مع الصلاحيات</h5>
                  <small className="text-muted">سيتم إنشاء المستخدم وتطبيق الصلاحيات مباشرة.</small>
                </div>

                <div className="action-bar mb-0">
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving ? "جاري الحفظ..." : "إنشاء الموظف"}
                  </button>

                  <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/users")}>
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
