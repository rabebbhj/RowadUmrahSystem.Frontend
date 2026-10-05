import type { AuthUser } from "../../api/auth";

type SignedInSidebarProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

type IconProps = {
  className?: string;
};

type SidebarItem = {
  label: string;
  path: string;
  activePaths?: string[];
  canShow: (user: AuthUser) => boolean;
  icon: (props: IconProps) => JSX.Element;
};

type PageTitle = {
  eyebrow?: string;
  title: string;
};

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false
} as const;

function UsersRoundIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BusFrontIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M6 3h12a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Z" />
      <path d="M4 11h16" />
      <path d="M8 19v2" />
      <path d="M16 19v2" />
      <path d="M8 7h.01" />
      <path d="M16 7h.01" />
      <path d="M8 15h.01" />
      <path d="M16 15h.01" />
    </svg>
  );
}

function CalculatorIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <path d="M8 6h8" />
      <path d="M8 10h.01" />
      <path d="M12 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function LandmarkIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 10h14" />
      <path d="M7 10v8" />
      <path d="M11 10v8" />
      <path d="M15 10v8" />
      <path d="M19 10v8" />
      <path d="M4 18h16" />
      <path d="M3 22h18" />
    </svg>
  );
}

function FileTextIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function BellIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10.3 21a2 2 0 0 0 3.4 0" />
    </svg>
  );
}

function ClockIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ListChecksIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="m3 7 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="m3 17 2 2 4-4" />
      <path d="M13 16h8" />
    </svg>
  );
}

function SettingsIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const sidebarItems: SidebarItem[] = [
  { label: "لوحة التحكم", path: "/admin", canShow: (user) => Boolean(user.permissions?.canAccessDashboard), icon: ListChecksIcon },
  { label: "المسافرون", path: "/travelers", canShow: (user) => Boolean(user.permissions?.canViewTravelers), icon: UsersRoundIcon },
  { label: "الرحلات", path: "/trips", canShow: (user) => Boolean(user.permissions?.canViewTrips), icon: BusFrontIcon },
  { label: "المحاسبة", path: "/accounting", canShow: (user) => Boolean(user.permissions?.canViewAccounting), icon: CalculatorIcon },
  {
    label: "الباقات",
    path: "/settings",
    activePaths: ["/settings", "/pricing-rules", "/pricing-exceptions", "/nationality-groups", "/services-addons"],
    canShow: (user) => user.roles.some((role) => role.toLowerCase() === "admin"),
    icon: LandmarkIcon
  },
  { label: "الوثائق", path: "/documents", canShow: (user) => Boolean(user.permissions?.canViewDocuments), icon: FileTextIcon },
  {
    label: "الشكاوى والحظر",
    path: "/travelers/blocked",
    activePaths: ["/travelers/blocked"],
    canShow: (user) => Boolean(user.permissions?.canViewBlocks),
    icon: LandmarkIcon
  },
  { label: "سجل العمليات", path: "/audit-logs", canShow: (user) => Boolean(user.permissions?.canViewAuditLogs), icon: ClockIcon },
  { label: "المستخدمون", path: "/users", canShow: (user) => user.roles.some((role) => role.toLowerCase() === "admin"), icon: UsersRoundIcon },
  { label: "الإعدادات", path: "/settings/general", activePaths: ["/settings/general"], canShow: (user) => user.roles.some((role) => role.toLowerCase() === "admin"), icon: SettingsIcon },
  { label: "الإشعارات", path: "/notifications", canShow: (user) => Boolean(user.permissions?.canViewNotifications), icon: BellIcon }
];

const rowadLogoSrc = `${import.meta.env.BASE_URL}landingpage/company-logo.png`;

const pageTitles: { match: (path: string) => boolean; title: PageTitle }[] = [
  { match: (path) => path === "/admin", title: { eyebrow: "Dashboard", title: "لوحة التحكم" } },
  { match: (path) => path.startsWith("/travelers/blocked"), title: { eyebrow: "Travelers", title: "الشكاوى والحظر" } },
  { match: (path) => path.startsWith("/travelers/deleted"), title: { eyebrow: "Travelers", title: "أرشيف المسافرين" } },
  { match: (path) => path.startsWith("/travelers/create"), title: { eyebrow: "Travelers", title: "تسجيل مسافر جديد" } },
  { match: (path) => path.startsWith("/travelers"), title: { title: "المسافرون / الرحلات" } },
  { match: (path) => path.startsWith("/trips/create"), title: { eyebrow: "Trips", title: "إضافة رحلة" } },
  { match: (path) => path.startsWith("/trips/deleted"), title: { eyebrow: "Trips", title: "أرشيف الرحلات" } },
  { match: (path) => path.startsWith("/trips"), title: { eyebrow: "Trips", title: "الرحلات" } },
  { match: (path) => path.startsWith("/users/create"), title: { eyebrow: "Users", title: "إضافة موظف جديد" } },
  { match: (path) => path.startsWith("/users") && path.includes("/permissions"), title: { eyebrow: "Users", title: "صلاحيات المستخدم" } },
  { match: (path) => path.startsWith("/users"), title: { eyebrow: "Users", title: "إدارة المستخدمين" } },
  { match: (path) => path.startsWith("/accounting"), title: { eyebrow: "Accounting", title: "المحاسبية" } },
  { match: (path) => path.startsWith("/financial-reports"), title: { eyebrow: "Reports", title: "التقارير المالية" } },
  { match: (path) => path.startsWith("/accounts"), title: { eyebrow: "Accounting", title: "دليل الحسابات" } },
  { match: (path) => path.startsWith("/bank-accounts"), title: { eyebrow: "Accounting", title: "الحسابات البنكية" } },
  { match: (path) => path.startsWith("/customers"), title: { eyebrow: "Accounting", title: "العملاء" } },
  { match: (path) => path.startsWith("/invoices"), title: { eyebrow: "Accounting", title: "الفواتير" } },
  { match: (path) => path.startsWith("/expenses"), title: { eyebrow: "Accounting", title: "المصاريف" } },
  { match: (path) => path.startsWith("/journal-entries"), title: { eyebrow: "Accounting", title: "القيود اليومية" } },
  { match: (path) => path.startsWith("/receipt-vouchers"), title: { eyebrow: "Accounting", title: "سندات القبض" } },
  { match: (path) => path.startsWith("/payment-vouchers"), title: { eyebrow: "Accounting", title: "سندات الصرف" } },
  { match: (path) => path.startsWith("/settings/general"), title: { eyebrow: "Settings", title: "الإعدادات" } },
  { match: (path) => path.startsWith("/settings"), title: { eyebrow: "Packages", title: "الباقات" } },
  { match: (path) => path.startsWith("/nationality-groups"), title: { eyebrow: "Pricing", title: "مجموعات الجنسيات" } },
  { match: (path) => path.startsWith("/pricing-rules"), title: { eyebrow: "Pricing", title: "قواعد التسعير" } },
  { match: (path) => path.startsWith("/pricing-exceptions"), title: { eyebrow: "Pricing", title: "الاستثناءات" } },
  { match: (path) => path.startsWith("/services-addons"), title: { eyebrow: "Services", title: "الخدمات والإضافات" } },
  { match: (path) => path.startsWith("/documents"), title: { eyebrow: "Documents", title: "الوثائق" } },
  { match: (path) => path.startsWith("/audit"), title: { eyebrow: "Audit", title: "سجل العمليات" } },
  { match: (path) => path.startsWith("/notifications"), title: { eyebrow: "Notifications", title: "الإشعارات" } }
];

function isItemActive(item: SidebarItem, activePath: string) {
  const paths = item.activePaths ?? [item.path];
  return paths.some((path) => activePath === path || activePath.startsWith(`${path}/`));
}

export function SignedInSidebar({ user, activePath, onNavigate, onLogout }: SignedInSidebarProps) {
  const userName = user.fullName || user.email || "مستخدم";
  const initial = userName.trim().charAt(0) || "ر";
  const headerTitle = pageTitles.find((item) => item.match(activePath))?.title ?? { eyebrow: "Rowad", title: "رواد العمرة" };

  return (
    <>
    <aside className="rowad-sidebar" aria-label="القائمة الرئيسية">
      <div className="rowad-brand">
        <div className="rowad-brand-logo">
          <img src={rowadLogoSrc} alt="رواد العمرة" />
        </div>
        <div className="rowad-brand-copy">
          <div className="rowad-brand-title">رواد العمرة</div>
          <div className="rowad-brand-subtitle">نظام الإدارة الذكي</div>
        </div>
      </div>

      <nav className="rowad-nav">
        {sidebarItems.filter((item) => item.canShow(user)).map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item, activePath);

          return (
            <button
              key={item.path}
              type="button"
              className={active ? "rowad-nav-link active" : "rowad-nav-link"}
              onClick={() => onNavigate(item.path)}
              aria-current={active ? "page" : undefined}
              title={item.label}
            >
              <Icon className="rowad-nav-icon" />
              <strong>{item.label}</strong>
            </button>
          );
        })}
      </nav>

      <div className="rowad-sidebar-footer">
        <div className="rowad-user-mini">
          <div className="rowad-user-avatar">{initial}</div>
          <div>
            <strong>{userName}</strong>
            <small>مستخدم نشط</small>
          </div>
        </div>
      </div>

      <button className="rowad-logout-button" type="button" onClick={onLogout}>
        تسجيل الخروج
      </button>
    </aside>
      <header className="rowad-app-header">
        <div className="rowad-app-header-title">
          {headerTitle.eyebrow && <span>{headerTitle.eyebrow}</span>}
          <h1>{headerTitle.title}</h1>
        </div>
        <div className="rowad-app-header-user">
          <div>
            <strong>{userName}</strong>
            <small>{user.email}</small>
          </div>
          <div className="rowad-app-header-avatar">{initial}</div>
        </div>
      </header>
    </>
  );
}
