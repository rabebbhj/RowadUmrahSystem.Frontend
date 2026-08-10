import { CloseIcon, MenuIcon, MosqueIcon } from "./landingShared";

export function MainNavbar({
  menuOpen,
  onToggle,
  onNavigate,
  currentView
}: {
  menuOpen: boolean;
  onToggle: () => void;
  onNavigate: (target: "home" | "booking" | "services" | "footer") => void;
  currentView: "home" | "booking";
}) {
  const navItems = [
    { label: "الرئيسية", target: "home" as const },
    { label: "رحلات العمرة", target: "booking" as const },
    { label: "خدماتنا", target: "services" as const },
    { label: "عروض الشركات", target: "booking" as const },
    { label: "من نحن", target: "footer" as const },
    { label: "تواصل معنا", target: "footer" as const }
  ];

  return (
    <div className="main-nav">
      <div className="container main-nav__inner">
        <div className="main-nav__left">
          <button className="nav-toggle" type="button" onClick={onToggle} aria-label="فتح القائمة">
            {menuOpen ? <CloseIcon className="icon icon-md" /> : <MenuIcon className="icon icon-md" />}
          </button>
        </div>

        <nav className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`nav-link ${currentView === "booking" && item.target === "booking" ? "is-active" : ""}`}
              onClick={() => onNavigate(item.target)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="brand" aria-label="رواد العمرة">
          <div className="brand__mark">
            <MosqueIcon className="icon icon-lg" />
          </div>
          <div className="brand__text">
            <strong>رواد العمرة</strong>
            <span>رواد وأمجاد للعمرة</span>
          </div>
        </div>
      </div>
    </div>
  );
}
