import { useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { AdminWelcomeBanner } from "../Layout/AdminWelcomeBanner";
import { SignedInSidebar } from "../Layout/SignedInSidebar";
import { PackageSectionsTabs } from "../Settings/PackageSectionsTabs";

type ServicesAddonsPageProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

type ServiceItem = {
  id: string;
  code: string;
  name: string;
  image: string;
  type: string;
  pricing: string;
  linked: boolean;
  active: boolean;
};

const categories = [
  { key: "visa", label: "التأشيرة", count: 6, icon: "▣" },
  { key: "flight", label: "الطيران", count: 5, icon: "✈" },
  { key: "transport", label: "المواصلات", count: 4, icon: "▣" },
  { key: "hotels", label: "الفنادق", count: 6, icon: "▥" },
  { key: "extras", label: "الإضافات", count: 8, icon: "◇" }
];

const services: ServiceItem[] = [
  { id: "s1", code: "S001", name: "تأشيرة فقط", image: "/landingpage/auth-login-bg.png", type: "التأشيرة", pricing: "لكل شخص", linked: true, active: true },
  { id: "s2", code: "S002", name: "سيارة خاصة", image: "/landingpage/reservation-bg.png", type: "المواصلات", pricing: "سعر ثابت", linked: true, active: true },
  { id: "s3", code: "S003", name: "باص مشترك", image: "/landingpage/bus.png", type: "المواصلات", pricing: "لكل شخص", linked: false, active: false },
  { id: "s4", code: "S004", name: "حجز طيران", image: "/landingpage/avion.png", type: "الطيران", pricing: "سعر ثابت", linked: true, active: true },
  { id: "s5", code: "S005", name: "ترقية غرفة", image: "/landingpage/chambre.png", type: "الفنادق", pricing: "لكل شخص", linked: true, active: true },
  { id: "s6", code: "S006", name: "استقبال من المطار", image: "/landingpage/mains.png", type: "المواصلات", pricing: "سعر ثابت", linked: true, active: true }
];

export function ServicesAddonsPage({ user, activePath, onNavigate, onLogout }: ServicesAddonsPageProps) {
  const [activeCategory, setActiveCategory] = useState("visa");
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceState, setServiceState] = useState(services);
  const [paymentActive, setPaymentActive] = useState(true);

  const filteredServices = useMemo(() => {
    const selectedLabel = categories.find((category) => category.key === activeCategory)?.label;
    return serviceState.filter((service) => {
      const matchesCategory = activeCategory === "extras" || service.type === selectedLabel;
      const matchesSearch = !searchTerm.trim() || service.name.includes(searchTerm.trim()) || service.code.includes(searchTerm.trim());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm, serviceState]);

  const toggleService = (id: string) => {
    setServiceState((current) => current.map((service) => (service.id === id ? { ...service, active: !service.active } : service)));
  };

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel pricing-admin-page services-addons-page" dir="rtl">
        <AdminWelcomeBanner
          eyebrow="الخدمات"
          title="الخدمات والإضافات"
          description="تعريف كل ما يمكن إضافته على الحجز وربطه بالقواعد"
        />

        <PackageSectionsTabs active="services" onNavigate={onNavigate} />

        <section className="service-category-grid">
          {categories.map((category) => (
            <button
              key={category.key}
              className={activeCategory === category.key ? "is-active" : ""}
              type="button"
              onClick={() => setActiveCategory(category.key)}
            >
              <span>{category.icon}</span>
              <strong>{category.label}</strong>
              <small>{category.count} خدمات</small>
            </button>
          ))}
        </section>

        <section className="services-layout">
          <aside className="services-settings">
            <div className="pricing-card">
              <h2>مصدر التأشيرة السابقة</h2>
              <label className="radio-line"><input name="visa-source" type="radio" defaultChecked /> شركة رواد</label>
              <label className="radio-line"><input name="visa-source" type="radio" /> شركة أخرى</label>
              <label className="radio-line"><input name="visa-source" type="radio" /> لا توجد</label>
              <p className="settings-note">يستخدم هذا الخيار لتحديد مصدر التأشيرة في الحجوزات السابقة والربط مع القواعد.</p>
            </div>

            <div className="pricing-card">
              <h2>إعدادات MyFatorah</h2>
              <div className="gateway-row">
                <span>تفعيل بوابة MyFatoorah للدفع</span>
                <button className={paymentActive ? "switch is-on" : "switch"} type="button" onClick={() => setPaymentActive((value) => !value)}>
                  <i />
                </button>
              </div>
              <p className="settings-note">عند التفعيل سيتم إتاحة الدفع للخدمات والإضافات عبر بوابة MyFatoorah.</p>
            </div>

            <div className="pricing-card">
              <h2>إعدادات مصدر الفنادق</h2>
              <label className="ng-field">
                <span>مصدر بيانات الفنادق</span>
                <select defaultValue="شركة رواد"><option>شركة رواد</option><option>مزود خارجي</option></select>
              </label>
              <p className="settings-note">يتم استخدام هذا المصدر في عرض الفنادق وإضافتها كخدمة في الحجوزات.</p>
            </div>
          </aside>

          <div className="services-main">
            <section className="services-toolbar">
              <button className="ng-primary" type="button">+ إضافة خدمة</button>
              <label><span>نوع الخدمة</span><select><option>الكل</option><option>التأشيرة</option><option>المواصلات</option></select></label>
              <label><span>طريقة التسعير</span><select><option>الكل</option><option>لكل شخص</option><option>سعر ثابت</option></select></label>
              <label><span>حالة الخدمة</span><select><option>الكل</option><option>مفعلة</option><option>معطلة</option></select></label>
              <label><span>بحث</span><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="بحث في الخدمات..." /></label>
            </section>

            <section className="service-list">
              {filteredServices.map((service) => (
                <article className="service-row" key={service.id}>
                  <img src={service.image} alt="" />
                  <div className={service.active ? "service-status active" : "service-status"}>
                    <span>{service.active ? "مفعلة" : "معطلة"}</span>
                    <button type="button" onClick={() => toggleService(service.id)}><i /></button>
                  </div>
                  <div className="service-meta"><span>الربط بالقواعد</span><strong>{service.linked ? "مربوط" : "غير مربوط"}</strong></div>
                  <div className="service-meta"><span>طريقة التسعير</span><strong>{service.pricing}</strong></div>
                  <div className="service-meta"><span>نوع الخدمة</span><strong>{service.type}</strong></div>
                  <div className="service-title">
                    <small>#{service.code}</small>
                    <h3>{service.name}</h3>
                  </div>
                  <div className="service-actions">
                    <button type="button">تعديل</button>
                    <button type="button" className="danger">{service.active ? "تعطيل" : "تفعيل"}</button>
                    <button type="button">⋮</button>
                  </div>
                </article>
              ))}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
