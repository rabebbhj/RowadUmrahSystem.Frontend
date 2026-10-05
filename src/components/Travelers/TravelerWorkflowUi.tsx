import { useState } from "react";
import type { AuthUser } from "../../api/auth";
import type { TripStatus } from "../../api/trips";
import type { DateTravelPackage, PackageTraveler, TravelDate, TravelerStatus } from "../../types/travelers";
import { displayTravelerPhone, isAdminUser } from "../../utils/permissions";

type IconName = "calendar" | "users" | "briefcase" | "search" | "filter" | "chevron" | "check" | "bed" | "file" | "globe" | "dots" | "clock" | "chair";

function Icon({ name }: { name: IconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const paths: Record<IconName, JSX.Element> = {
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    briefcase: <><path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" /><rect x="3" y="6" width="18" height="15" rx="2" /><path d="M3 12h18" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></>,
    filter: <><path d="M3 5h18l-7 8v5l-4 2v-7z" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    bed: <><path d="M3 12h18v7M3 8v11M7 12V8h5a3 3 0 0 1 3 3v1" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
    globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></>,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    chair: <><path d="M7 13V7a3 3 0 0 1 6 0v6M5 13h14M7 13v6M17 13v6M7 17h10" /></>
  };

  return <svg className="tw-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...common}>{paths[name]}</svg>;
}

export function formatDisplayDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB").format(date).replace(/\//g, " / ");
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((first, second) => first.localeCompare(second, "ar"));
}

export function WorkflowHeader({
  eyebrow,
  title,
  subtitle,
  icon = "calendar",
  actions
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  icon?: IconName;
  actions?: JSX.Element;
}) {
  return (
    <header className="tw-page-header">
      <div className="tw-page-title">
        {eyebrow && <span>{eyebrow}</span>}
        <h2><Icon name={icon} /> {title}</h2>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="tw-header-actions">{actions}</div>}
    </header>
  );
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return <div className="tw-skeleton-grid">{Array.from({ length: count }).map((_, index) => <div className="tw-skeleton-card" key={index} />)}</div>;
}

export function StatePanel({ tone = "info", message, onRetry }: { tone?: "info" | "danger"; message: string; onRetry?: () => void }) {
  return (
    <div className={`tw-state tw-state--${tone}`}>
      <strong>{message}</strong>
      {onRetry && <button type="button" className="tw-btn tw-btn-outline" onClick={onRetry}>إعادة المحاولة</button>}
    </div>
  );
}

export function TravelDateFilters({
  search,
  month,
  status,
  dates,
  onSearchChange,
  onMonthChange,
  onStatusChange,
  onReset
}: {
  search: string;
  month: string;
  status: string;
  dates: TravelDate[];
  onSearchChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
}) {
  const months = uniqueSorted(dates.map((date) => date.departureDate.slice(0, 7)));

  return (
    <div className="tw-toolbar">
      <label className="tw-control tw-search">
        <Icon name="search" />
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="البحث بتاريخ الرحلة أو رمز الرحلة..." />
      </label>
      <label className="tw-control">
        <select value={month} onChange={(event) => onMonthChange(event.target.value)}>
          <option value="">جميع الأشهر</option>
          {months.map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
      </label>
      <label className="tw-control">
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">جميع الحالات</option>
          <option value="upcoming">القادمة</option>
          <option value="active">اليوم</option>
          <option value="past">السابقة</option>
        </select>
      </label>
      <button type="button" className="tw-btn tw-btn-outline" onClick={onReset}><Icon name="filter" /> إعادة تعيين</button>
    </div>
  );
}

export function TravelDateCard({ item, selected, onClick }: { item: TravelDate; selected?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`tw-date-card ${selected ? "is-selected" : ""}`} onClick={onClick}>
      {item.image && <img src={item.image} alt="" />}
      <span className="tw-card-shade" />
      {selected && <span className="tw-selected-mark"><Icon name="check" /></span>}
      <span className="tw-date-icon"><Icon name="calendar" /></span>
      <strong>{item.weekday}</strong>
      <b dir="ltr">{formatDisplayDate(item.departureDate)}</b>
      <span className="tw-card-meta">
        <span><Icon name="users" /> {item.packagesCount}</span>
        <small>{item.packagesCount === 1 ? "رحلة واحدة متاحة" : item.packagesCount === 2 ? "يوجد باقتان" : "رحلات متاحة"}</small>
      </span>
      <span className="tw-card-arrow"><Icon name="chevron" /></span>
    </button>
  );
}

export function PackageTripCard({ item, onOpen }: { item: DateTravelPackage; onOpen: () => void }) {
  return (
    <article className="tw-package-card">
      <div className="tw-package-media">
        {item.image ? <img src={item.image} alt="" /> : <span className="tw-package-media-empty"><Icon name="briefcase" /></span>}
        <span className="tw-package-badge">باقة {item.durationDays} أيام <Icon name="calendar" /></span>
      </div>
      <div className="tw-package-body">
        <div className="tw-package-footer">
          <button type="button" className="tw-btn tw-btn-gold" onClick={onOpen}>عرض المسافرين <Icon name="users" /></button>
        </div>
      </div>
    </article>
  );
}

export function TravelerSummaryCards({ date, packageItem, travelers }: { date: string; packageItem?: DateTravelPackage; travelers: PackageTraveler[] }) {
  const remaining = packageItem?.capacity == null ? "غير محدد" : String(Math.max(0, packageItem.capacity - travelers.length));
  const cards = [
    { label: "تاريخ الرحلة", value: formatDisplayDate(date), icon: "calendar" as IconName, ltr: true },
    { label: "الباقة المحددة", value: packageItem ? `باقة ${packageItem.durationDays} أيام` : "-", icon: "briefcase" as IconName },
    { label: "عدد المسافرين", value: String(travelers.length), icon: "users" as IconName, ltr: true },
    { label: "المقاعد المتبقية", value: remaining, icon: "chair" as IconName, ltr: packageItem?.capacity != null }
  ];

  return (
    <div className="tw-summary-grid">
      {cards.map((card) => (
        <div className="tw-summary-card" key={card.label}>
          <Icon name={card.icon} />
          <span>{card.label}</span>
          <strong dir={card.ltr ? "ltr" : "rtl"}>{card.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function TravelerFilters({
  search,
  nationality,
  status,
  travelers,
  onSearchChange,
  onNationalityChange,
  onStatusChange,
  onReset
}: {
  search: string;
  nationality: string;
  status: string;
  travelers: PackageTraveler[];
  onSearchChange: (value: string) => void;
  onNationalityChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
}) {
  const nationalities = uniqueSorted(travelers.map((traveler) => traveler.nationality));

  return (
    <div className="tw-toolbar tw-toolbar--travelers">
      <label className="tw-control tw-search">
        <Icon name="search" />
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="البحث بالاسم، رقم الجواز، أو رقم الهاتف..." />
      </label>
      <label className="tw-control">
        <select value={nationality} onChange={(event) => onNationalityChange(event.target.value)}>
          <option value="">جميع الجنسيات</option>
          {nationalities.map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
      </label>
      <label className="tw-control">
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">جميع الحالات</option>
          <option value="confirmed">مؤكد</option>
          <option value="pending">قيد المراجعة</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغى</option>
        </select>
      </label>
      <button type="button" className="tw-btn tw-btn-outline" onClick={onReset}>إعادة تعيين <Icon name="filter" /></button>
    </div>
  );
}

export function TravelerStatusBadge({ status }: { status: TravelerStatus }) {
  const labels: Record<TravelerStatus, string> = {
    confirmed: "مؤكد",
    pending: "قيد المراجعة",
    completed: "مكتمل",
    cancelled: "ملغى"
  };

  const icon: Record<TravelerStatus, IconName> = {
    confirmed: "check",
    pending: "clock",
    completed: "check",
    cancelled: "dots"
  };

  return <span className={`tw-status tw-status--${status}`}>{labels[status]} <Icon name={icon[status]} /></span>;
}

function can(user: AuthUser, permission: keyof NonNullable<AuthUser["permissions"]>) {
  return isAdminUser(user) || Boolean(user.permissions?.[permission]);
}

export function TravelersTable({
  user,
  travelers,
  busyTripId,
  onNavigate,
  onStatusChange,
  onArchiveTrip
}: {
  user: AuthUser;
  travelers: PackageTraveler[];
  busyTripId?: number | null;
  onNavigate: (path: string) => void;
  onStatusChange: (tripId: number, status: TripStatus) => void;
  onArchiveTrip: (tripId: number) => void;
}) {
  const canEditTraveler = can(user, "canEditTravelers");
  const canArchiveTrip = can(user, "canArchiveTrips");
  const canCreateTrip = can(user, "canCreateTrips");
  const [openActionTripId, setOpenActionTripId] = useState<number | null>(null);

  const closeActionMenu = () => setOpenActionTripId(null);
  const handleStatusAction = (tripId: number, status: TripStatus) => {
    closeActionMenu();
    onStatusChange(tripId, status);
  };
  const handleReviewAction = (travelerId: number) => {
    closeActionMenu();
    onNavigate(`/travelers/${travelerId}/edit`);
  };
  const handleArchiveAction = (tripId: number) => {
    closeActionMenu();
    onArchiveTrip(tripId);
  };

  return (
    <div className="tw-table-wrap">
      <table className="tw-table">
        <thead>
          <tr>
            <th>الرقم</th>
            <th>رقم الجواز</th>
            <th>الاسم</th>
            <th>الجنسية</th>
            <th>الهاتف</th>
            <th>الحالة</th>
            <th>وقت الحجز</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {travelers.map((traveler, index) => (
            <tr key={traveler.id}>
              <td dir="ltr">{index + 1}</td>
              <td dir="ltr"><strong>{traveler.passportNumber}</strong></td>
              <td>{traveler.fullName}</td>
              <td>{traveler.nationality}</td>
              <td dir="ltr">{displayTravelerPhone(user, traveler.phone)}</td>
              <td><TravelerStatusBadge status={traveler.status} /></td>
              <td dir="ltr">{formatDateTime(traveler.bookedAt)}</td>
              <td>
                <div className={`dropdown rowad-actions-dropdown ${openActionTripId === traveler.tripId ? "show" : ""}`}>
                  <button
                    className="tw-action-button dropdown-toggle"
                    type="button"
                    aria-expanded={openActionTripId === traveler.tripId}
                    disabled={busyTripId === traveler.tripId}
                    onClick={() => setOpenActionTripId((current) => current === traveler.tripId ? null : traveler.tripId)}
                  >
                    {busyTripId === traveler.tripId ? "جار..." : "إجراءات"} <Icon name="chevron" />
                  </button>
                  <ul className={`dropdown-menu rowad-actions-menu ${openActionTripId === traveler.tripId ? "show" : ""}`}>
                    {canCreateTrip && <li><button type="button" className="dropdown-item rowad-action-item rowad-action-item--confirm" onClick={() => handleStatusAction(traveler.tripId, "confirmed")}><Icon name="check" /> تأكيد</button></li>}
                    {canEditTraveler && <li><button type="button" className="dropdown-item rowad-action-item rowad-action-item--review" onClick={() => handleReviewAction(traveler.travelerId)}><Icon name="file" /> مراجعة</button></li>}
                    {canCreateTrip && <li><button type="button" className="dropdown-item rowad-action-item rowad-action-item--complete" onClick={() => handleStatusAction(traveler.tripId, "completed")}><Icon name="clock" /> مكتمل</button></li>}
                    {canArchiveTrip && <li className="rowad-action-divider"><button type="button" className="dropdown-item rowad-action-item rowad-action-item--archive" onClick={() => handleArchiveAction(traveler.tripId)}><Icon name="dots" /> أرشفة</button></li>}
                  </ul>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { Icon };
