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

type PermissionFieldKey = Exclude<
  keyof UserPermissions,
  "id" | "userId" | "userFullName" | "userEmail"
>;

type PermissionField = {
  key: PermissionFieldKey;
  title: string;
  note: string;
  danger?: boolean;
};

type PermissionGroup = {
  title: string;
  description: string;
  fields: PermissionField[];
};

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: "المسافرون",
    description: "التحكم في عرض، إضافة، تعديل، أرشفة واسترجاع بيانات المسافرين.",
    fields: [
      { key: "canViewTravelers", title: "مشاهدة المسافرين", note: "السماح بالدخول إلى شاشة المسافرين وتفاصيلهم." },
      { key: "canCreateTravelers", title: "إضافة مسافر", note: "تسجيل مسافر جديد وقراءة بيانات الجواز." },
      { key: "canEditTravelers", title: "تعديل مسافر", note: "تعديل البيانات الشخصية وبيانات الجواز." },
      {
        key: "canArchiveTravelers",
        title: "أرشفة مسافر",
        note: "نقل المسافر إلى الأرشيف بدون حذف نهائي.",
        danger: true
      },
      { key: "canRestoreTravelers", title: "استرجاع مسافر", note: "إعادة المسافر من الأرشيف إلى السجلات النشطة." }
    ]
  },
  {
    title: "الرحلات",
    description: "إدارة رحلات العمرة وربطها بملفات المسافرين.",
    fields: [
      { key: "canViewTrips", title: "مشاهدة الرحلات", note: "عرض سجل الرحلات والبيانات المرتبطة بها." },
      { key: "canCreateTrips", title: "إضافة رحلة", note: "إضافة رحلة عمرة جديدة لمسافر مسموح." }
    ]
  },
  {
    title: "الوثائق",
    description: "صلاحيات التعامل مع المستندات والصور المرفوعة لملفات المسافرين.",
    fields: [
      { key: "canViewDocuments", title: "مشاهدة الوثائق", note: "عرض الوثائق المرتبطة بالمسافر." },
      { key: "canUploadDocuments", title: "رفع وثائق", note: "رفع صورة شخصية، تأشيرة، نسخة جواز أو ملف PDF." },
      {
        key: "canArchiveDocuments",
        title: "أرشفة وثائق",
        note: "نقل الوثائق إلى الأرشيف.",
        danger: true
      },
      { key: "canRestoreDocuments", title: "استرجاع وثائق", note: "إعادة الوثائق المؤرشفة إلى ملف المسافر." }
    ]
  },
  {
    title: "الحظر والشكاوى",
    description: "صلاحيات حساسة مرتبطة بمنع المسافر أو رفع المنع عنه.",
    fields: [
      { key: "canViewBlocks", title: "مشاهدة المحظورين", note: "عرض قائمة المسافرين المحظورين وأسباب الحظر." },
      {
        key: "canBlockTravelers",
        title: "حظر مسافر",
        note: "منع مسافر من المتابعة داخل النظام.",
        danger: true
      },
      { key: "canUnblockTravelers", title: "رفع الحظر", note: "إلغاء حالة الحظر عن مسافر." }
    ]
  },
  {
    title: "التقارير والرقابة",
    description: "التحكم في التقارير الرسمية وسجل العمليات.",
    fields: [
      { key: "canViewReports", title: "مشاهدة التقارير", note: "عرض تقارير النظام والإحصائيات." },
      {
        key: "canExportReports",
        title: "تصدير التقارير",
        note: "تصدير Excel و PDF للبيانات.",
        danger: true
      },
      {
        key: "canViewAuditLogs",
        title: "مشاهدة سجل العمليات",
        note: "عرض جميع العمليات التي تمت داخل النظام.",
        danger: true
      }
    ]
  },
  {
    title: "المحاسبة والمالية",
    description: "صلاحيات فريق المالية والمحاسبة: الحسابات، البنوك، الفواتير، السندات، المصاريف والتقارير المالية.",
    fields: [
      { key: "canViewAccounting", title: "مشاهدة المحاسبة", note: "إظهار واجهة المحاسبة والملخصات المالية." },
      { key: "canManageAccounting", title: "إدارة المحاسبة بالكامل", note: "صلاحية شاملة على كل عمليات المحاسبة والمالية.", danger: true },
      { key: "canManageChartOfAccounts", title: "دليل الحسابات", note: "عرض وإدارة شجرة الحسابات." },
      { key: "canManageJournalEntries", title: "القيود اليومية", note: "إدارة القيود اليومية والترحيلات المحاسبية." },
      { key: "canManageInvoices", title: "الفواتير", note: "إنشاء ومتابعة فواتير العملاء والمسافرين." },
      { key: "canManageReceiptVouchers", title: "سندات القبض", note: "تسجيل سندات القبض وربطها بالفواتير والبنوك." },
      { key: "canManagePaymentVouchers", title: "سندات الصرف", note: "تسجيل سندات الصرف والمدفوعات." },
      { key: "canManageExpenses", title: "المصاريف", note: "إدارة مصاريف الرحلات والعمليات." },
      { key: "canManageBanks", title: "البنوك", note: "إدارة الحسابات البنكية والحركات المرتبطة بها." },
      { key: "canViewFinancialReports", title: "التقارير المالية", note: "عرض تقارير المالية والتحليلات." }
    ]
  },
  {
    title: "إدارة النظام",
    description: "صلاحيات إدارية عالية يجب أن تمنح للمديرين فقط.",
    fields: [
      {
        key: "canManageUsers",
        title: "إدارة المستخدمين",
        note: "إنشاء المستخدمين، تعطيل الحسابات، وتعديل الصلاحيات.",
        danger: true
      }
    ]
  }
];

function createEmptyPermissions(): UserPermissions {
  return {
    id: 0,
    userId: "",
    userFullName: "",
    userEmail: "",
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
};

export function UsersPermissionsPanel({
  user,
  activePath,
  userId,
  onNavigate,
  onLogout
}: UsersPermissionsPanelProps) {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  const selectedUserLabel = useMemo(() => {
    if (!selectedUser) {
      return "—";
    }

    return selectedUser.fullName;
  }, [selectedUser]);

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

        setPermissions(permissionsData);
        setSelectedUser(users.find((item) => item.id === userId) ? {
          fullName: users.find((item) => item.id === userId)!.fullName,
          email: users.find((item) => item.id === userId)!.email
        } : { fullName: permissionsData.userFullName, email: permissionsData.userEmail });
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!permissions) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await updateUserPermissions(userId, permissions);
      setPermissions(updated);
      setMessage("تم حفظ الصلاحيات.");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
            <div>
              <h1 className="page-title mb-1">صلاحيات المستخدم</h1>
              <p className="rowad-text-muted mb-0">
                إدارة دقيقة لصلاحيات الموظف حسب الشاشات والعمليات الحساسة داخل النظام.
              </p>
            </div>

            <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/users")}>
              رجوع
            </button>
          </div>

          <div className="filter-panel mb-4">
            <div className="row align-items-center">
              <div className="col-md-6 mb-3 mb-md-0">
                <small className="rowad-text-muted d-block mb-1">اسم الموظف</small>
                <div className="permission-user-name">{selectedUserLabel}</div>
              </div>

              <div className="col-md-6">
                <small className="rowad-text-muted d-block mb-1">البريد الإلكتروني</small>
                <div className="permission-user-email">{selectedUser?.email ?? permissions?.userEmail ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="permission-guidance mb-4">
            <div>
              <strong>ملاحظة مهمة:</strong>
              الصلاحيات هنا تحدد ما يستطيع الموظف مشاهدته أو تنفيذه. العمليات الحساسة مثل الحظر، الأرشفة، التصدير،
              وسجل العمليات يجب أن تعطى فقط للموظفين المصرح لهم.
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          {loading && <div className="state-box">جاري تحميل الصلاحيات...</div>}

          {permissions && (
            <form onSubmit={handleSubmit}>
              <input type="hidden" name="id" value={permissions.id} />
              <input type="hidden" name="userId" value={permissions.userId} />

              {PERMISSION_GROUPS.map((group) => (
                <div className="permission-section mb-4" key={group.title}>
                  <div className="permission-section-header">
                    <div>
                      <h4>{group.title}</h4>
                      <p>{group.description}</p>
                    </div>
                  </div>

                  <div className="permission-grid">
                    {group.fields.map((field) => (
                      <label key={field.key} className={field.danger ? "permission-card danger-zone" : "permission-card"}>
                        <input
                          type="checkbox"
                          checked={permissions[field.key]}
                          onChange={(event) => handlePermissionChange(field.key, event.target.checked)}
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

              <div className="permission-save-panel">
                <div>
                  <h5 className="mb-1">حفظ الصلاحيات</h5>
                  <small className="rowad-text-muted">
                    سيتم تطبيق الصلاحيات بعد حفظها، وقد يحتاج الموظف إلى تسجيل الدخول من جديد.
                  </small>
                </div>

                <div className="action-bar mb-0">
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    حفظ الصلاحيات
                  </button>

                  <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/users")}>
                    إلغاء
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
