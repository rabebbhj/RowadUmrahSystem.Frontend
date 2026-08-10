import type { ReactNode } from "react";
import {
  BadgeIcon,
  BuildingIcon,
  BusIcon,
  CalendarIcon,
  HeadsetIcon,
  ShieldIcon,
  StarIcon,
  TagIcon,
  UsersIcon,
  WhatsAppIcon,
  type BookingProgram
} from "./landingShared";

function OfferChip({ active, label }: { active?: boolean; label: string }) {
  return <button type="button" className={`corporate-offers__chip ${active ? "is-active" : ""}`}>{label}</button>;
}

function OfferFeature({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <li className="corporate-offers__feature">
      <span className="corporate-offers__feature-icon">{icon}</span>
      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
    </li>
  );
}

function OfferCard({
  program,
  price,
  accent
}: {
  program: BookingProgram;
  price: string;
  accent: string;
}) {
  return (
    <article className="corporate-offers__card">
      <div className="corporate-offers__card-media" style={{ backgroundImage: `url('${program.image}')` }}>
        <span className={`corporate-offers__badge ${accent}`}>{program.badge}</span>
      </div>
      <div className="corporate-offers__card-body">
        <h3>{program.title.replace("عمرة ", "").replace("7 ليالي", "7 ليالي")}</h3>
        <p>{program.details[0]}</p>
        <ul>
          <OfferFeature icon={<BuildingIcon className="icon icon-sm" />} title={program.nights} subtitle={program.city} />
          <OfferFeature icon={<StarIcon className="icon icon-sm" />} title={program.transport} subtitle={program.transfer} />
          <OfferFeature icon={<BusIcon className="icon icon-sm" />} title="تنقل مريح" subtitle="مناسب للشركات والمجموعات" />
        </ul>
        <div className="corporate-offers__card-footer">
          <div className="corporate-offers__price">
            <strong>{price}</strong>
            <span>للشخص</span>
          </div>
          <button type="button" className="btn btn-gold corporate-offers__details">
            <span>عرض التفاصيل</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function CorporateOffersPage({ onBackHome }: { selectedProgramIndex: number; onSelectProgram: (index: number) => void; onBackHome: () => void }) {
  const offers: Array<{ program: BookingProgram; price: string; accent: string }> = [
    { program: { id: "economy", badge: "اقتصادية", title: "باقة الشركات الاقتصادية", image: "/landingpage/chambre.png", nights: "فندق 3 نجوم", city: "مكة والمدينة", transport: "طيران اقتصادي", transfer: "إفطار يومي", price: "2,390 د.ك", details: ["مثالية للشركات الصغيرة والمتوسطة"] }, price: "2,390", accent: "accent-green" },
    { program: { id: "best", badge: "الأكثر طلباً", title: "باقة الشركات المميزة", image: "/landingpage/kaaba.png", nights: "فندق 4 نجوم", city: "مكة والمدينة", transport: "طيران درجة أعمال", transfer: "إفطار وغداء يومي", price: "3,990 د.ك", details: ["أفضل خيار للمجموعات والشركات الكبيرة"] }, price: "3,990", accent: "accent-gold" },
    { program: { id: "vip", badge: "VIP", title: "باقة الشركات VIP", image: "/landingpage/dormir.png", nights: "فندق 5 نجوم", city: "مكة والمدينة", transport: "طيران درجة أولى", transfer: "جميع الوجبات", price: "6,990 د.ك", details: ["الفخامة والتميز لقادتكم وكبار موظفيكم"] }, price: "6,990", accent: "accent-vip" }
  ];

  const featureItems = [
    { icon: <BadgeIcon className="icon icon-md" />, title: "أسعار خاصة للشركات", subtitle: "خصومات حصرية للعقود الجماعية" },
    { icon: <CalendarIcon className="icon icon-md" />, title: "مرونة في الدفع", subtitle: "خيارات دفع ميسرة ومناسبة لشركتك" },
    { icon: <TagIcon className="icon icon-md" />, title: "برامج مخصصة", subtitle: "تصميم برامج تناسب احتياجات مؤسستك" },
    { icon: <HeadsetIcon className="icon icon-md" />, title: "دعم على مدار الساعة", subtitle: "فريق دعم مخصص لخدمتكم" },
    { icon: <StarIcon className="icon icon-md" />, title: "تقارير مفصلة", subtitle: "تقارير شاملة عن رحلة العمرة" }
  ];

  return (
    <section className="corporate-offers">
      <div className="container">
        <div className="corporate-offers__hero">
          <div className="corporate-offers__copy">
            <div className="booking-breadcrumbs corporate-offers__breadcrumbs">
              <button type="button" onClick={onBackHome}>
                الرئيسية
              </button>
              <span>›</span>
              <strong>عروض الشركات</strong>
            </div>
            <h1>عروض العمرة للشركات والمؤسسات</h1>
            <p>برامج مخصصة تلبي احتياجات شركتك بأفضل الخدمات والأسعار</p>
          </div>
          <div className="corporate-offers__visual">
            <img src="/landingpage/kaaba.png" alt="الكعبة المشرفة" />
          </div>
        </div>

        <div className="corporate-offers__tabs">
          <OfferChip label="جميع العروض" active />
          <OfferChip label="العروض المميزة" />
          <OfferChip label="عروض الموسم" />
          <OfferChip label="العروض المخصصة" />
        </div>

        <div className="corporate-offers__toolbar">
          <span>ترتيب حسب:</span>
          <button type="button" className="corporate-offers__sort">
            <span>الأكثر طلباً</span>
            <Chevron />
          </button>
        </div>

        <div className="corporate-offers__layout">
          <div className="corporate-offers__cards">
            {offers.map((offer) => (
              <OfferCard key={offer.program.id} program={offer.program} price={offer.price} accent={offer.accent} />
            ))}
          </div>

          <aside className="corporate-offers__sidebar">
            <div className="corporate-offers__panel">
              <h3>مزايا العروض للشركات</h3>
              <ul>
                {featureItems.map((item) => (
                  <li key={item.title}>
                    <span className="corporate-offers__panel-icon">{item.icon}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="corporate-offers__help">
              <h4>تحتاج عرض مخصص لشركتك؟</h4>
              <p>تواصل معنا للحصول على عرض يناسب احتياجاتك</p>
              <a className="btn btn-gold corporate-offers__whatsapp" href="https://wa.me/965551234567" target="_blank" rel="noreferrer">
                <WhatsAppIcon className="icon icon-sm" />
                <span>تواصل عبر واتساب</span>
              </a>
            </div>
          </aside>
        </div>

        <div className="corporate-offers__footer-strip">
          <article>
            <ShieldIcon className="icon icon-md" />
            <strong>رضا العملاء</strong>
            <span>أكثر من 500 شركة تثق بنا</span>
          </article>
          <article>
            <HeadsetIcon className="icon icon-md" />
            <strong>خبرة في التنظيم</strong>
            <span>أكثر من 10 سنوات في تنظيم العمرة</span>
          </article>
          <article>
            <UsersIcon className="icon icon-md" />
            <strong>تراخيص معتمدة</strong>
            <span>جميع تراخيصنا معتمدة وموثوقة</span>
          </article>
          <article>
            <StarIcon className="icon icon-md" />
            <strong>جودة مضمونة</strong>
            <span>نضمن جودة الخدمات المقدمة</span>
          </article>
        </div>
      </div>
    </section>
  );
}

function Chevron() {
  return (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m8 10 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
