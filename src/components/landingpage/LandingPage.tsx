import { useEffect, useMemo, useState } from "react";
import {
  BusIcon,
  CalendarIcon,
  ChatIcon,
  DocumentIcon,
  HeadsetIcon,
  LocationIcon,
  MailIcon,
  MosqueIcon,
  PhoneIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  UsersIcon
} from "./landingShared";

const packages = [
  {
    badge: "الرحلات",
    image: "/landingpage/avion.png",
    price: "2,490",
    features: ["حجوزات طيران", "حجوزات فنادق", "تنظيم الجولات", "دعم مباشر"],
    people: "1-2",
    city: "مكة",
    duration: "7"
  },
  {
    badge: "التأشيرات",
    image: "/landingpage/mains.png",
    price: "490",
    features: ["تأشيرات سياحية", "حجز المواعيد", "متابعة الطلب", "استشارات السفر"],
    people: "3-4",
    city: "مكة والمدينة",
    duration: "10"
  },
  {
    badge: "برامج الشركات",
    image: "/landingpage/reunion.png",
    price: "7,990",
    features: ["رحلات عمل", "حجوزات جماعية", "تنظيم الفعاليات", "خدمة مخصصة"],
    people: "5+",
    city: "المدينة",
    duration: "14"
  }
];

const packageFeatureIcons = [
  <LocationIcon className="icon icon-sm" />,
  <BusIcon className="icon icon-sm" />,
  <MosqueIcon className="icon icon-sm" />,
  <HeadsetIcon className="icon icon-sm" />
];

const services = [
  { icon: <ShieldIcon className="icon icon-md" />, title: "تأمين شامل", text: "لحماية رحلتك" },
  { icon: <HeadsetIcon className="icon icon-md" />, title: "دعم على مدار الساعة", text: "نحن معك في كل خطوة" },
  { icon: <BusIcon className="icon icon-md" />, title: "تنقلات مريحة", text: "سيارات حديثة ومكيفة" },
  { icon: <CalendarIcon className="icon icon-md" />, title: "استخراج تأشيرات", text: "بإجراء واضح وموثوق" },
  { icon: <MosqueIcon className="icon icon-md" />, title: "إرشادات دينية", text: "من مشايخ مختصين" },
  { icon: <UsersIcon className="icon icon-md" />, title: "مجموعات صغيرة", text: "خدمة أفضل واهتمام أكبر" }
];

const emptyFilters = {
  people: "",
  city: "",
  duration: "",
  startDate: ""
};

type Filters = typeof emptyFilters;
type FilterName = keyof Filters;

export default function LandingPage() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [submittedFilters, setSubmittedFilters] = useState<Filters>(emptyFilters);

  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.body.classList.add("umrah-body");

    return () => {
      document.body.classList.remove("umrah-body");
    };
  }, []);

  const filteredPackages = useMemo(() => {
    return packages.filter((program) => {
      return (
        (!submittedFilters.people || program.people === submittedFilters.people) &&
        (!submittedFilters.city || program.city === submittedFilters.city) &&
        (!submittedFilters.duration || program.duration === submittedFilters.duration)
      );
    });
  }, [submittedFilters]);

  const hasActiveFilters = Boolean(
    submittedFilters.people || submittedFilters.city || submittedFilters.duration || submittedFilters.startDate
  );

  const updateFilter = (name: FilterName, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const submitFilters = () => {
    setSubmittedFilters(filters);
    document.getElementById("gv-packages")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setSubmittedFilters(emptyFilters);
  };

  return (
    <main className="globalview-page" dir="rtl" lang="ar">
      <header className="gv-header">
        <div className="gv-topbar">
          <button className="gv-book" type="button">
            <CalendarIcon className="icon icon-sm" />
            احجز الآن
          </button>
          <div className="gv-contact">
            <span><MailIcon className="icon icon-sm" /> info@rawad-omrah.com</span>
            <span><PhoneIcon className="icon icon-sm" /> +965 55 123 4567</span>
            <span><LocationIcon className="icon icon-sm" /> الكويت - حولي - شارع الخليج العربي</span>
          </div>
        </div>
      </header>

      <section className="gv-hero" id="globalview">
        <div className="gv-hero__shade" />
        <div className="gv-hero__content">
          <p>رحلة إيمانية ..</p>
          <h1>تجربة روحانية لا تنسى</h1>
          <span>نقدم لكم عمرة متكاملة بخدمات عالية الجودة تضمن لكم رحلة آمنة ومريحة بأفضل الأسعار</span>
          <div className="gv-actions">
            <button type="button">استعرض باقات العمرة</button>
            <button type="button" className="ghost">
              <ChatIcon className="icon icon-sm" />
              تواصل معنا
            </button>
          </div>
        </div>
        <aside className="gv-support">
          <HeadsetIcon className="icon" />
          <strong>خدمة عملاء</strong>
          <b>24/7</b>
          <span>نحن معك قبل الرحلة وأثناءها وبعدها</span>
        </aside>
      </section>

      <section className="gv-search" aria-label="فلترة باقات العمرة">
        <button type="button" onClick={submitFilters}>
          <SearchIcon className="icon icon-sm" />
          بحث
        </button>
        <label>
          <span>عدد المعتمرين</span>
          <select value={filters.people} onChange={(event) => updateFilter("people", event.target.value)}>
            <option value="">اختر العدد</option>
            <option value="1-2">1 - 2</option>
            <option value="3-4">3 - 4</option>
            <option value="5+">5 وأكثر</option>
          </select>
        </label>
        <label>
          <span>المدينة</span>
          <select value={filters.city} onChange={(event) => updateFilter("city", event.target.value)}>
            <option value="">اختر المدينة</option>
            <option value="مكة">مكة</option>
            <option value="المدينة">المدينة</option>
            <option value="مكة والمدينة">مكة والمدينة</option>
          </select>
        </label>
        <label>
          <span>المدة</span>
          <select value={filters.duration} onChange={(event) => updateFilter("duration", event.target.value)}>
            <option value="">اختر المدة</option>
            <option value="7">7 ليالي</option>
            <option value="10">10 ليالي</option>
            <option value="14">14 ليلة</option>
          </select>
        </label>
        <label>
          <span>تاريخ الانطلاق</span>
          <input
            type="date"
            value={filters.startDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(event) => updateFilter("startDate", event.target.value)}
          />
        </label>
      </section>

      <section className="gv-packages" id="gv-packages">
        <div className="gv-packages__header">
          <h2>أفضل الباقات</h2>
          {hasActiveFilters && (
            <button type="button" onClick={resetFilters}>
              إلغاء الفلتر
            </button>
          )}
        </div>
        <div className="gv-package-grid">
          {filteredPackages.map((program) => (
            <article className="gv-card" key={program.badge}>
              <div className="gv-card__media" style={{ backgroundImage: `url(${program.image})` }}>
                <span>{program.badge}</span>
              </div>
              <div className="gv-card__body">
                <div className="gv-card__features">
                  {program.features.map((feature, index) => (
                    <span key={feature}>
                      {index === 0 && program.badge === "الرحلات" ? <StarIcon className="icon icon-sm" /> : null}
                      {index === 0 && program.badge === "التأشيرات" ? <DocumentIcon className="icon icon-sm" /> : null}
                      {index === 0 && program.badge === "برامج الشركات" ? <CalendarIcon className="icon icon-sm" /> : null}
                      {index > 0 ? packageFeatureIcons[index] : null}
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="gv-card__footer">
                  <p>تبدأ من <b>{program.price}</b> د.ك</p>
                  <button type="button">عرض التفاصيل</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {filteredPackages.length === 0 && (
          <div className="gv-empty">لا توجد باقات مطابقة لهذا البحث. جرّب تعديل المدينة أو المدة.</div>
        )}
      </section>

      <section className="gv-services">
        <h2>خدماتنا المتميزة</h2>
        <div className="gv-service-grid">
          {services.map((service) => (
            <article key={service.title}>
              {service.icon}
              <strong>{service.title}</strong>
              <span>{service.text}</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="gv-footer">
        <div className="gv-footer__brand">
          <MosqueIcon className="icon" />
          <div>
            <strong>رواد العمرة</strong>
            <p>نقدم لكم رحلات عمرة مميزة بأعلى معايير الراحة والثقة.</p>
          </div>
        </div>
        <ul>
          <li>الرئيسية</li>
          <li>رحلات العمرة</li>
          <li>العروض</li>
          <li>خدماتنا</li>
        </ul>
        <ul>
          <li>حجز فوري</li>
          <li>خدمة عملاء</li>
          <li>النقل الداخلي</li>
        </ul>
        <div className="gv-footer__contact">
          <span><PhoneIcon className="icon icon-sm" /> +965 55 123 4567</span>
          <span><MailIcon className="icon icon-sm" /> info@rawad-omrah.com</span>
          <span><LocationIcon className="icon icon-sm" /> الكويت - حولي</span>
        </div>
      </footer>
    </main>
  );
}
