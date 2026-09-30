import type { ReactNode } from "react";
import {
  ArrowLeftIcon,
  BadgeIcon,
  BuildingIcon,
  BusIcon,
  CalendarIcon,
  HeadsetIcon,
  ShieldIcon,
  StarIcon,
  TagIcon,
  WhatsAppIcon
} from "./landingShared";

function ServiceColumnTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="services-page__column-title">
      <span>{title}</span>
      {icon}
    </div>
  );
}

function FeatureItem({ title, subtitle, icon }: { title: string; subtitle: string; icon: ReactNode }) {
  return (
    <article className="services-page__feature">
      <span className="services-page__feature-icon">{icon}</span>
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </article>
  );
}

function ServiceCard({
  image,
  title,
  subtitle
}: {
  image: string;
  title: string;
  subtitle: string;
}) {
  return (
    <article className="services-page__service-card">
      <img src={image} alt={title} />
      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
    </article>
  );
}

export function ServicesPage({ onStartBooking }: { onStartBooking: () => void }) {
  const coreServices = [
    { image: "/landingpage/avion.png", title: "حجوزات الطيران", subtitle: "حجوزات طيران داخلية ودولية بأفضل الأسعار" },
    { image: "/landingpage/chambre.png", title: "حجوزات الفنادق", subtitle: "فنادق قريبة من الحرم بجميع المستويات" },
    { image: "/landingpage/bus.png", title: "النقل والمواصلات", subtitle: "تنقل آمن ومريح بين المطار والمشاعر" },
    { image: "/landingpage/reunion.png", title: "خدمات المعتمرين", subtitle: "خدمات متكاملة لراحة المعتمر" }
  ];

  const extraServices = [
    { icon: <ShieldIcon className="icon icon-sm" />, title: "التأمين على السفر", subtitle: "تأمين شامل لرحلتك" },
    { icon: <StarIcon className="icon icon-sm" />, title: "الجولات والزيارات", subtitle: "جولات سياحية في مكة والمدينة" },
    { icon: <TagIcon className="icon icon-sm" />, title: "شرائح الإنترنت", subtitle: "شرائح إنترنت محلية ودولية" },
    { icon: <CalendarIcon className="icon icon-sm" />, title: "وجبات إضافية", subtitle: "وجبات متنوعة ولذيذة" },
    { icon: <BusIcon className="icon icon-sm" />, title: "توصيل الأمتعة", subtitle: "توصيل آمن إلى الفندق" }
  ];

  const companyServices = [
    "حلول متكاملة لرحلات الشركات والمجموعات",
    "أسعار خاصة للشركات والمجموعات",
    "تنظيم رحلات حافلة للشركات",
    "خدمة عملاء مخصصة"
  ];

  const usefulInfo = [
    "دليل المعتمر",
    "أسئلة شائعة",
    "الأخبار والمقالات",
    "الأدعية والأذكار",
    "الطقس في مكة والمدينة"
  ];

  return (
    <section className="services-page">
      <div className="container">
        <div className="services-page__hero">
          <div className="services-page__copy">
            <div className="booking-breadcrumbs services-page__breadcrumbs">
              <button type="button">الرئيسية</button>
              <span>›</span>
              <button type="button">رحلات العمرة</button>
              <span>›</span>
              <strong>خدماتنا</strong>
            </div>
            <h1>خدماتنا</h1>
          </div>
          <div className="services-page__visual">
            <img src="/landingpage/kaaba.png" alt="الكعبة المشرفة" />
          </div>
        </div>

        <div className="services-page__panel">
          <div className="services-page__col services-page__col--info">
            <ServiceColumnTitle icon={<BuildingIcon className="icon icon-md" />} title="معلومات تهمك" />
            <div className="services-page__info-list">
              {usefulInfo.map((item) => (
                <div key={item} className="services-page__info-item">
                  <span className="services-page__info-icon">
                    <BadgeIcon className="icon icon-sm" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="services-page__help">
              <div className="services-page__help-visual">
                <HeadsetIcon className="icon icon-lg" />
              </div>
              <div className="services-page__help-copy">
                <strong>تحتاج مساعدة؟</strong>
                <span>فريقنا متاح لخدمتكم على مدار الساعة</span>
                <a href="tel:+96555583203">+965 55583203 - +965 22283558</a>
              </div>
              <a className="btn btn-ghost services-page__help-cta" href="https://wa.me/96555583203" target="_blank" rel="noreferrer">
                <WhatsAppIcon className="icon icon-sm" />
                <span>تواصل عبر واتساب</span>
              </a>
            </div>
          </div>

          <div className="services-page__col services-page__col--core">
            <ServiceColumnTitle icon={<BuildingIcon className="icon icon-md" />} title="خدماتنا الأساسية" />
            <div className="services-page__service-list">
              {coreServices.map((service) => (
                <ServiceCard key={service.title} {...service} />
              ))}
            </div>
          </div>

          <div className="services-page__col services-page__col--extra">
            <ServiceColumnTitle icon={<StarIcon className="icon icon-md" />} title="خدمات إضافية" />
            <div className="services-page__extra-list">
              {extraServices.map((service) => (
                <article key={service.title} className="services-page__extra-item">
                  <div className="services-page__extra-icon">{service.icon}</div>
                  <div>
                    <strong>{service.title}</strong>
                    <span>{service.subtitle}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="services-page__col services-page__col--company">
            <ServiceColumnTitle icon={<BuildingIcon className="icon icon-md" />} title="خدمات الشركات والموظفين" />
            <div className="services-page__company-card">
              <img src="/landingpage/reunion.png" alt="خدمات الشركات والموظفين" />
              <div className="services-page__company-copy">
                <strong>حلول متكاملة للشركات والمجموعات</strong>
                <p>أسعار خاصة للشركات والمجموعات وحلول مرنة تناسب احتياجاتكم.</p>
                <ul>
                  {companyServices.map((item) => (
                    <li key={item}>
                      <CheckMark />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="btn btn-gold services-page__company-cta" type="button" onClick={onStartBooking}>
                  <ArrowLeftIcon className="icon icon-sm" />
                  <span>اعرف المزيد</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="services-page__features">
          <FeatureItem title="أفضل الأسعار" subtitle="نضمن لك أقل الأسعار" icon={<TagIcon className="icon icon-md" />} />
          <FeatureItem title="مرونة في التعديل" subtitle="تعديل مجاني قبل السفر" icon={<CalendarIcon className="icon icon-md" />} />
          <FeatureItem title="خدمة متميزة" subtitle="تقدم أفضل الخدمات بأعلى معايير الجودة" icon={<HeadsetIcon className="icon icon-md" />} />
          <FeatureItem title="حجز آمن ومضمون" subtitle="نضمن لك أفضل الأسعار" icon={<ShieldIcon className="icon icon-md" />} />
        </div>
      </div>
    </section>
  );
}

function CheckMark() {
  return <span className="services-page__check">✓</span>;
}
