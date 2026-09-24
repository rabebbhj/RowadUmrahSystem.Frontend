import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getUsers, type UserListItem } from "../../api/users";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type UsersPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

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

export function UsersPanel({ user, activePath, onNavigate, onLogout }: UsersPanelProps) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError(null);

      try {
        const items = await getUsers();
        if (!cancelled) {
          setUsers(items);
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
        }
      }
    }

    loadUsers();

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
            <div className="table-wrap">
              <table className="table table-bordered table-striped align-middle">
                <thead>
                  <tr>
                    <th>الاسم الكامل</th>
                    <th>اسم المستخدم</th>
                    <th>الإيميل</th>
                    <th>رقم الهاتف</th>
                    <th>الحالة</th>
                    <th>تاريخ الإنشاء</th>
                    <th className="text-center">الصلاحيات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => (
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
                      <td className="text-center">
                        {isMainAdminUser(item) ? (
                          <div className="user-permissions-cell">
                            <span className="badge bg-primary">{getPermissionTypeLabel(item)}</span>
                          </div>
                        ) : (
                          <div className="user-permissions-cell">
                            <span className="badge badge-soft-warning">{getPermissionTypeLabel(item)}</span>
                            <button type="button" className="btn btn-sm btn-outline-gold" onClick={() => onNavigate(`/users/${item.id}/permissions`)}>
                              تعديل
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
