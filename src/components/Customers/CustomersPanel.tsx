import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getCustomers, toggleCustomerStatus, type CustomerListItem } from "../../api/customers";
import { formatDateTime } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";
import { customerStatusClass, customerStatusText, type CustomerStatusFilter } from "./customerHelpers";

type CustomersPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function CustomersPanel({ user, activePath, onNavigate, onLogout }: CustomersPanelProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>("all");
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [togglingCustomerId, setTogglingCustomerId] = useState<number | null>(null);

  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((item) => item.isActive).length;
    const inactive = customers.filter((item) => !item.isActive).length;
    const linked = customers.filter((item) => item.travelerId !== null).length;

    return { total, active, inactive, linked };
  }, [customers]);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      setLoading(true);
      setError(null);

      try {
        const items = await getCustomers({
          search: searchTerm || undefined,
          isActive: statusFilter === "all" ? null : statusFilter === "active"
        });

        if (!cancelled) {
          setCustomers(items);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "تعذر تحميل العملاء");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [onLogout, refreshToken, searchTerm, statusFilter]);

  async function handleToggleStatus(id: number) {
    if (!window.confirm("هل تريد تغيير حالة هذا العميل؟")) {
      return;
    }

    setTogglingCustomerId(id);

    try {
      await toggleCustomerStatus(id);
      setRefreshToken((value) => value + 1);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "تعذر تحديث حالة العميل");
    } finally {
      setTogglingCustomerId(null);
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <header className="hero">
          <div>
            <span className="eyebrow">المحاسبة</span>
            <h2>العملاء</h2>
            <p>إدارة ملفات العملاء وربطها ببيانات المسافرين داخل النظام.</p>
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
              placeholder="بحث بالاسم أو الرقم المدني أو الجواز أو البريد"
            />

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CustomerStatusFilter)}>
              <option value="all">كل الحالات</option>
              <option value="active">فعال</option>
              <option value="inactive">معطل</option>
            </select>

            <button type="submit">بحث</button>

            <button
              type="button"
              className="ghost"
              onClick={() => {
                setSearchInput("");
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              إعادة
            </button>

            <button type="button" className="ghost" onClick={() => onNavigate("/customers/create")}>
              عميل جديد
            </button>
          </form>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <span>الإجمالي</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="stat-card">
            <span>العملاء الفعالون</span>
            <strong>{stats.active}</strong>
          </article>
          <article className="stat-card">
            <span>العملاء المعطلون</span>
            <strong>{stats.inactive}</strong>
          </article>
          <article className="stat-card">
            <span>مرتبطون بمسافرين</span>
            <strong>{stats.linked}</strong>
          </article>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <h3>قائمة العملاء</h3>
            <span>{searchTerm ? `بحث: ${searchTerm}` : "كل العملاء"}</span>
          </div>

          {error && <div className="state-box error">{error}</div>}
          {loading && <div className="state-box">جاري تحميل العملاء...</div>}
          {!loading && !error && customers.length === 0 && <div className="state-box">لا توجد عملاء مطابقون.</div>}

          {!loading && !error && customers.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>الرقم المدني</th>
                    <th>الجواز</th>
                    <th>الهاتف</th>
                    <th>المسافر المرتبط</th>
                    <th>الحالة</th>
                    <th>تاريخ الإنشاء</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.civilId}</td>
                      <td>{item.passportNumber}</td>
                      <td>{item.phoneNumber}</td>
                      <td>{item.travelerFullName || "-"}</td>
                      <td>
                        <span className={customerStatusClass(item.isActive)}>{customerStatusText(item.isActive)}</span>
                      </td>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="ghost-row" onClick={() => onNavigate(`/customers/${item.id}`)}>
                            عرض
                          </button>
                          <button type="button" className="ghost-row" onClick={() => onNavigate(`/customers/${item.id}/edit`)}>
                            تعديل
                          </button>
                          <button
                            type="button"
                            className="ghost-row"
                            disabled={togglingCustomerId === item.id}
                            onClick={() => void handleToggleStatus(item.id)}
                          >
                            {item.isActive ? "تعطيل" : "تفعيل"}
                          </button>
                        </div>
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
