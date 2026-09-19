import { useEffect } from "react";
import {
  BusIcon,
  CalendarIcon,
  ChatIcon,
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
    badge: "اقتصادية",
    image: "/landingpage/lit.png",
    price: "2,490",
    hotel: "فنادق 3 نجوم",
    flight: "طيران مباشر"
  },
  {
    badge: "مميزة",
    image: "/landingpage/chambre.png",
    price: "4,590",
    hotel: "فنادق 4 نجوم",
    flight: "طيران مباشر"
  },
  {
    badge: "VIP",
    image: "/landingpage/dormir.png",
    price: "7,990",
    hotel: "فنادق 5 نجوم",
    flight: "طيران مباشر"
  }
];

const services = [
  { icon: <ShieldIcon className="icon icon-md" />, title: "تأمين شامل", text: "لحماية رحلتك" },
  { icon: <HeadsetIcon className="icon icon-md" />, title: "دعم على مدار الساعة", text: "نحن معك في كل خطوة" },
  { icon: <BusIcon className="icon icon-md" />, title: "تنقلات مريحة", text: "سيارات حديثة ومكيفة" },
  { icon: <CalendarIcon className="icon icon-md" />, title: "استخراج تأشيرات", text: "بإجراء واضح وموثوق" },
  { icon: <MosqueIcon className="icon icon-md" />, title: "إرشادات دينية", text: "من مشايخ مختصين" },
  { icon: <UsersIcon className="icon icon-md" />, title: "مجموعات صغيرة", text: "خدمة أفضل واهتمام أكبر" }
];

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.body.classList.add("umrah-body");

    return () => {
      document.body.classList.remove("umrah-body");
    };
  }, []);

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
          <span>لا تتواصل معنا في خدمتك</span>
        </aside>
      </section>

      <section className="gv-search">
        <button type="button">
          <SearchIcon className="icon icon-sm" />
          بحث
        </button>
        {["عدد المعتمرين", "المدينة", "المدة", "تاريخ الانطلاق"].map((item) => (
          <label key={item}>
            <span>{item}</span>
            <small>{item === "تاريخ الانطلاق" ? "اختر التاريخ" : item === "المدة" ? "اختر المدة" : item === "المدينة" ? "اختر المدينة" : "اختر العدد"}</small>
          </label>
        ))}
      </section>

      <section className="gv-packages">
        <h2>أفضل باقات العمرة</h2>
        <div className="gv-package-grid">
          {packages.map((program) => (
            <article className="gv-card" key={program.badge}>
              <div className="gv-card__media" style={{ backgroundImage: `url(${program.image})` }}>
                <span>{program.badge}</span>
              </div>
              <div className="gv-card__body">
                <div className="gv-card__features">
                  <span><StarIcon className="icon icon-sm" /> {program.hotel}</span>
                  <span><MosqueIcon className="icon icon-sm" /> إفطار</span>
                  <span><BusIcon className="icon icon-sm" /> التنقلات</span>
                  <span><LocationIcon className="icon icon-sm" /> {program.flight}</span>
                </div>
                <div className="gv-card__footer">
                  <p>تبدأ من <b>{program.price}</b> د.ك</p>
                  <button type="button">عرض التفاصيل</button>
                </div>
              </div>
            </article>
          ))}
        </div>
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
