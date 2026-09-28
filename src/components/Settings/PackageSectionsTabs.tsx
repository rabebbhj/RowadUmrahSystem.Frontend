type PackageSection = "packages" | "rules" | "exceptions" | "groups" | "services";

type PackageSectionsTabsProps = {
  active: PackageSection;
  onNavigate: (path: string) => void;
};

const sections: Array<{ key: PackageSection; label: string; path: string }> = [
  { key: "packages", label: "الباقات", path: "/settings" },
  { key: "rules", label: "قواعد التسعير", path: "/pricing-rules" },
  { key: "exceptions", label: "الاستثناءات", path: "/pricing-exceptions" },
  { key: "groups", label: "مجموعات الجنسيات", path: "/nationality-groups" },
  { key: "services", label: "الخدمات والإضافات", path: "/services-addons" }
];

export function PackageSectionsTabs({ active, onNavigate }: PackageSectionsTabsProps) {
  return (
    <section className="package-admin-tabs" aria-label="أقسام الباقات">
      {sections.map((section) => (
        <button
          key={section.key}
          className={active === section.key ? "is-active" : ""}
          type="button"
          onClick={() => onNavigate(section.path)}
        >
          {section.label}
        </button>
      ))}
    </section>
  );
}
