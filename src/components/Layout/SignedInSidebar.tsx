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
  icon: (props: IconProps) => JSX.Element;
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

function BookOpenIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M12 7v14" />
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v18H5.5A2.5 2.5 0 0 1 3 18.5Z" />
      <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H12v18h6.5a2.5 2.5 0 0 0 2.5-2.5Z" />
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

function UserRoundIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
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

function ArrowDownToLineIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function ArrowUpFromLineIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 21h14" />
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

const sidebarItems: SidebarItem[] = [
  { label: "المسافرون", path: "/admin", activePaths: ["/admin", "/travelers"], icon: UsersRoundIcon },
  { label: "الرحلات", path: "/trips", icon: BusFrontIcon },
  { label: "المحاسبة", path: "/accounting", icon: CalculatorIcon },
  { label: "دليل الحسابات", path: "/accounts", icon: BookOpenIcon },
  { label: "البنوك", path: "/bank-accounts", icon: LandmarkIcon },
  { label: "العملاء", path: "/customers", icon: UserRoundIcon },
  { label: "الفواتير", path: "/invoices", icon: FileTextIcon },
  { label: "سندات القبض", path: "/receipt-vouchers", icon: ArrowDownToLineIcon },
  { label: "سندات الصرف", path: "/payment-vouchers", icon: ArrowUpFromLineIcon },
  { label: "القيود اليومية", path: "/journal-entries", icon: ListChecksIcon }
];

function isItemActive(item: SidebarItem, activePath: string) {
  const paths = item.activePaths ?? [item.path];
  return paths.some((path) => activePath === path || activePath.startsWith(`${path}/`));
}

export function SignedInSidebar({ user, activePath, onNavigate, onLogout }: SignedInSidebarProps) {
  const userName = user.fullName || user.email || "مستخدم";
  const initial = userName.trim().charAt(0) || "ر";

  return (
    <aside className="rowad-sidebar" aria-label="القائمة الرئيسية">
      <div className="rowad-brand">
        <div className="rowad-brand-mark">ر</div>
        <div className="rowad-brand-copy">
          <div className="rowad-brand-title">رواد العمرة</div>
          <div className="rowad-brand-subtitle">نظام الإدارة الذكي</div>
        </div>
      </div>

      <nav className="rowad-nav">
        {sidebarItems.map((item) => {
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
  );
}
