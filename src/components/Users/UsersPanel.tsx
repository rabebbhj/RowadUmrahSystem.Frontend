import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getUserPermissions, getUsers, type UserListItem, type UserPermissions } from "../../api/users";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type UsersPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

type PermissionAction =
  | "dashboard"
  | "view"
  | "create"
  | "edit"
  | "archive"
  | "restore"
  | "delete"
  | "export"
  | "manage"
  | "notify";

type PreviewAction = "view" | "create" | "edit" | "delete";

type PermissionPreviewUnit = {
  label: string;
  permissions: Partial<Record<PreviewAction, keyof UserPermissions>>;
};

const PREVIEW_ACTIONS: Array<{ key: PreviewAction; label: string }> = [
  { key: "view", label: "عرض" },
  { key: "create", label: "إضافة" },
  { key: "edit", label: "تعديل" },
  { key: "delete", label: "حذف" }
];

const PERMISSION_PREVIEW_UNITS: PermissionPreviewUnit[] = [
  {
    label: "المسافرون",
    permissions: {
      view: "canViewTravelers",
      create: "canCreateTravelers",
      edit: "canEditTravelers",
      delete: "canArchiveTravelers"
    }
  },
  {
    label: "الرحلات",
    permissions: {
      view: "canViewTrips",
      create: "canCreateTrips",
      delete: "canArchiveTrips"
    }
  },
  {
    label: "الوثائق",
    permissions: {
      view: "canViewDocuments",
      create: "canUploadDocuments",
      delete: "canArchiveDocuments"
    }
  },
  {
    label: "الحظر",
    permissions: {
      view: "canViewBlocks",
      create: "canBlockTravelers",
      delete: "canUnblockTravelers"
    }
  },
  {
    label: "التقارير",
    permissions: {
      view: "canViewReports",
      create: "canExportReports",
      edit: "canViewAuditLogs"
    }
  },
  {
    label: "المحاسبة",
    permissions: {
      view: "canViewAccounting",
      create: "canManageAccounting",
      edit: "canManageInvoices",
      delete: "canManageExpenses"
    }
  },
  {
    label: "النظام",
    permissions: {
      view: "canAccessDashboard",
      create: "canViewNotifications",
      edit: "canManageUsers"
    }
  }
];

function formatDateOnly(value: string) {
  return value ? value.slice(0, 10) : "-";
}

function getStatusBadgeClass(isActive: boolean) {
  return isActive ? "badge badge-soft-success" : "badge badge-soft-danger";
}

function isMainAdminUser(item: UserListItem) {
  return item.email === "admin@rowad.local" || item.isMainAdmin;
}

function getPermissionTypeLabel(item: UserListItem) {
  if (isMainAdminUser(item)) {
    return "المدير الرئيسي";
  }

  if (item.roles.some((role) => role.toLowerCase() === "admin")) {
    return "مدير النظام";
  }

  return item.hasPermissions ? "صلاحيات مخصصة" : "بدون صلاحيات مخصصة";
}

function ActionIcon({ action }: { action: PermissionAction }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false
  } as const;

  switch (action) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="7" height="8" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="15" width="7" height="6" rx="1.5" />
        </svg>
      );
    case "create":
      return (
        <svg {...commonProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "edit":
      return (
        <svg {...commonProps}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    case "archive":
      return (
        <svg {...commonProps}>
          <rect x="3" y="4" width="18" height="4" rx="1" />
          <path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
          <path d="M10 12h4" />
        </svg>
      );
    case "restore":
      return (
        <svg {...commonProps}>
          <path d="M4 12a8 8 0 1 0 2.3-5.6" />
          <path d="M4 4v6h6" />
        </svg>
      );
    case "delete":
      return (
        <svg {...commonProps}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v5" />
          <path d="M14 11v5" />
        </svg>
      );
    case "export":
      return (
        <svg {...commonProps}>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );
    case "manage":
      return (
        <svg {...commonProps}>
          <path d="M4 21v-7" />
          <path d="M4 10V3" />
          <path d="M12 21v-9" />
          <path d="M12 8V3" />
          <path d="M20 21v-5" />
          <path d="M20 12V3" />
          <path d="M2 14h4" />
          <path d="M10 8h4" />
          <path d="M18 16h4" />
        </svg>
      );
    case "notify":
      return (
        <svg {...commonProps}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
          <path d="M10.3 21a2 2 0 0 0 3.4 0" />
        </svg>
      );
    case "view":
    default:
      return (
        <svg {...commonProps}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}

function PencilIcon() {
  return <ActionIcon action="edit" />;
}

function ChevronIcon() {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false
  } as const;

  return (
    <svg {...commonProps}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function UsersIcon() {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false
  } as const;

  return (
    <svg {...commonProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CrownIcon() {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false
  } as const;

  return (
    <svg {...commonProps}>
      <path d="m3 8 4 3 5-7 5 7 4-3-2 11H5Z" />
      <path d="M5 19h14" />
    </svg>
  );
}

function getPreviewRows(permissions: UserPermissions | null | undefined) {
  if (!permissions) {
    return [];
  }

  return PERMISSION_PREVIEW_UNITS.filter((unit) => {
    return Object.values(unit.permissions).some((key) => key && permissions[key]);
  });
}

function getEnabledPermissionActions(permissions: UserPermissions | null | undefined) {
  if (!permissions) {
    return [];
  }

  return PERMISSION_PREVIEW_UNITS.flatMap((unit) => {
    return PREVIEW_ACTIONS
      .filter((action) => {
        const permissionKey = unit.permissions[action.key];
        return Boolean(permissionKey && permissions[permissionKey]);
      })
      .map((action) => ({
        label: `${action.label} ${unit.label}`,
        action: action.key as PermissionAction
      }));
  });
}

function getSinglePermission(permissions: UserPermissions | null | undefined) {
  const enabledPermissions = getEnabledPermissionActions(permissions);

  if (enabledPermissions.length === 1) {
    return enabledPermissions[0];
  }

  return null;
}

export function UsersPanel({ user, activePath, onNavigate, onLogout }: UsersPanelProps) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [permissionsByUserId, setPermissionsByUserId] = useState<Record<string, UserPermissions | null>>({});
  const [loading, setLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [openPermissionsUserId, setOpenPermissionsUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError(null);
      setPermissionsByUserId({});

      try {
        const items = await getUsers();
        if (cancelled) {
          return;
        }

        setUsers(items);
        setLoading(false);
        setPermissionsLoading(true);

        const permissionsEntries = await Promise.all(
          items.map(async (item) => {
            if (isMainAdminUser(item)) {
              return [item.id, null] as const;
            }

            return [item.id, await getUserPermissions(item.id)] as const;
          })
        );

        if (!cancelled) {
          setPermissionsByUserId(Object.fromEntries(permissionsEntries));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load users");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setPermissionsLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [onLogout]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((item) => item.isActive).length,
      inactive: users.filter((item) => !item.isActive).length
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return users;
    }

    return users.filter((item) => {
      return [item.fullName, item.userName, item.email, item.phoneNumber ?? ""].join(" ").toLowerCase().includes(term);
    });
  }, [searchTerm, users]);

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <header className="hero">
          <div>
            <span className="eyebrow">Users</span>
            <h2>إدارة المستخدمين</h2>
            <p>إدارة الموظفين، الصلاحيات، وتفعيل أو تعطيل الحسابات.</p>
          </div>

          <form
            className="search-bar"
            onSubmit={(event) => {
              event.preventDefault();
              setSearchTerm(searchInput);
            }}
          >
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="بحث بالاسم، اسم المستخدم، الإيميل أو الهاتف"
            />
            <button type="submit">بحث</button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setSearchInput("");
                setSearchTerm("");
              }}
            >
              إعادة
            </button>
          </form>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <span>إجمالي المستخدمين</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="stat-card">
            <span>المستخدمون الفعالون</span>
            <strong>{stats.active}</strong>
          </article>
          <article className="stat-card">
            <span>الحسابات المعطلة</span>
            <strong>{stats.inactive}</strong>
          </article>
        </section>

        {error && <div className="state-box error">{error}</div>}
        {loading && <div className="state-box">جاري تحميل المستخدمين...</div>}

        <section className="content-card">
          <div className="content-card-header">
            <h3>إدارة المستخدمين</h3>
            <button type="button" className="btn btn-gold" onClick={() => onNavigate("/users/create")}>
              + إضافة موظف جديد
            </button>
          </div>

          {!loading && !error && filteredUsers.length === 0 && <div className="state-box">لا يوجد مستخدمون مسجلون.</div>}

          {!loading && !error && filteredUsers.length > 0 && (
            <div className="table-wrap users-table-wrap">
              <table className="table table-bordered table-striped align-middle users-table">
                <thead>
                  <tr>
                    <th>الاسم الكامل</th>
                    <th>اسم المستخدم</th>
                    <th>الإيميل</th>
                    <th>رقم الهاتف</th>
                    <th>الحالة</th>
                    <th>تاريخ الإنشاء</th>
                    <th className="text-center users-permissions-column">الصلاحيات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => {
                    const userPermissions = permissionsByUserId[item.id];
                    const previewRows = getPreviewRows(userPermissions);
                    const enabledPermissions = getEnabledPermissionActions(userPermissions);
                    const summaryCount = isMainAdminUser(item) ? 0 : enabledPermissions.length;
                    const singlePermission = getSinglePermission(userPermissions);
                    const popoverId = `permissions-popover-${item.id}`;
                    const isPopoverOpen = openPermissionsUserId === item.id;

                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.fullName}</strong>
                        </td>
                        <td>{item.userName}</td>
                        <td>{item.email}</td>
                        <td>{item.phoneNumber || "-"}</td>
                        <td>
                          {item.isActive ? (
                            <span className={getStatusBadgeClass(true)}>فعال</span>
                          ) : (
                            <span className={getStatusBadgeClass(false)}>معطل</span>
                          )}
                        </td>
                        <td>{formatDateOnly(item.createdAt)}</td>
                        <td className="users-permissions-column">
                          <div className="user-permissions-cell">
                            {isMainAdminUser(item) ? (
                              <span className="permissions-pill permissions-pill-full">
                                <CrownIcon />
                                صلاحيات كاملة
                              </span>
                            ) : permissionsLoading && userPermissions === undefined ? (
                              <button type="button" className="permissions-pill" disabled>
                                جاري التحميل...
                              </button>
                            ) : singlePermission ? (
                              <span className="permissions-pill permissions-pill-single">
                                <ActionIcon action={singlePermission.action} />
                                {singlePermission.label}
                              </span>
                            ) : (
                              <div className="permissions-popover-anchor">
                                <button
                                  type="button"
                                  className={summaryCount > 0 ? "permissions-pill" : "permissions-pill permissions-pill-muted"}
                                  onClick={() => setOpenPermissionsUserId((current) => current === item.id ? null : item.id)}
                                  aria-expanded={isPopoverOpen}
                                  aria-controls={popoverId}
                                >
                                  <span>{summaryCount > 0 ? `صلاحيات مخصصة ${summaryCount}` : "بدون صلاحيات"}</span>
                                  <ChevronIcon />
                                </button>

                                {isPopoverOpen && (
                                  <div className="permissions-popover" id={popoverId}>
                                    <div className="permissions-popover-arrow" />
                                    <div className="permissions-popover-title">
                                      <UsersIcon />
                                      <strong>الصلاحيات المخصصة ({summaryCount})</strong>
                                    </div>

                                    {previewRows.length > 0 ? (
                                      <table className="permissions-mini-table">
                                        <thead>
                                          <tr>
                                            <th>الوحدة</th>
                                            {PREVIEW_ACTIONS.map((action) => (
                                              <th key={action.key}>{action.label}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {previewRows.map((row) => (
                                            <tr key={row.label}>
                                              <td>{row.label}</td>
                                              {PREVIEW_ACTIONS.map((action) => {
                                                const permissionKey = row.permissions[action.key];
                                                const isChecked = Boolean(permissionKey && userPermissions?.[permissionKey]);
                                                return (
                                                  <td key={action.key}>
                                                    <span className={isChecked ? "mini-permission-state allowed" : "mini-permission-state denied"}>
                                                      {isChecked ? "✓" : "-"}
                                                    </span>
                                                  </td>
                                                );
                                              })}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <div className="permissions-popover-empty">لا توجد صلاحيات مفعلة.</div>
                                    )}

                                    <button
                                      type="button"
                                      className="permissions-popover-link"
                                      onClick={() => onNavigate(`/users/${item.id}/permissions`)}
                                    >
                                      عرض جميع الصلاحيات
                                      <span>‹</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {!isMainAdminUser(item) && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-gold user-permissions-edit"
                                onClick={() => onNavigate(`/users/${item.id}/permissions`)}
                                title="تعديل الصلاحيات"
                              >
                                <PencilIcon />
                                تعديل
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
