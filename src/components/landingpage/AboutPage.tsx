import {
  BadgeIcon,
  BuildingIcon,
  HeadsetIcon,
  LocationIcon,
  MosqueIcon,
  ShieldIcon,
  TagIcon,
  UsersIcon,
  WhatsAppIcon
} from "./landingShared";
import type { ReactNode } from "react";

function AboutStat({
  value,
  label,
  icon
}: {
  value: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <article className="about-stat">
      <span className="about-stat__icon">{icon}</span>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function AboutReason({
  icon,
  title,
  subtitle
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <article className="about-reason">
      <span className="about-reason__icon">{icon}</span>
      <strong>{title}</strong>
      <p>{subtitle}</p>
    </article>
  );
}

function AboutPillar({
  title,
  text,
  icon
}: {
  title: string;
  text: string;
  icon: ReactNode;
}) {
  return (
    <div className="about-pillars__item">
      <span className="about-pillars__icon">{icon}</span>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

export function AboutPage({ onStartBooking }: { onStartBooking: () => void }) {
  return (
    <section className="about-page">
      <div className="container">
        <div className="about-hero">
          <div className="about-hero__copy">
            <div className="booking-breadcrumbs about-breadcrumbs">
              <button type="button">الرئيسية</button>
              <span>›</span>
              <strong>من نحن</strong>
            </div>
            <h1>من نحن</h1>
            <p>خدمتكم شرف... ورضاكم هدفنا</p>
          </div>
          <div className="about-hero__visual">
            <img src="/landingpage/kaaba.png" alt="الكعبة المشرفة" />
          </div>
        </div>

        <section className="about-panel">
          <div className="about-panel__aside">
            <div className="about-pillars">
              <AboutPillar title="رؤيتنا" text="أن نكون الخيار الأول في خدمات العمرة للأفراد والشركات في العالم الإسلامي." icon={<MosqueIcon className="icon icon-md" />} />
              <AboutPillar title="رسالتنا" text="تقديم خدمات عمرة متكاملة وموثوقة تضمن راحة ضيوف الرحمن منذ البداية حتى العودة." icon={<TagIcon className="icon icon-md" />} />
              <AboutPillar title="قيمنا" text="الإخلاص · الجودة · المصداقية · الإتقان · الاحترام · روح الفريق" icon={<BadgeIcon className="icon icon-md" />} />
            </div>
          </div>

          <div className="about-panel__content">
            <h2>رواد العمرة... بخدمتكم منذ أكثر من 10 سنوات</h2>
            <p>
              نحن في رواد العمرة نسعى لتقديم تجربة روحانية متكاملة لضيوف الرحمن من خلال خدمات متميزة وبرامج مدروسة
              وعناية تلبي احتياجات الأفراد والشركات والمؤسسات بأعلى معايير الجودة والاحترافية.
            </p>
            <p>
              نفخر بثقة آلاف المعتمرين والشركات التي اختارتنا لنكون شريكهم في الرحلة الإيمانية، ونتلزم بأن نكون دائماً عند حسن ظنكم.
            </p>
          </div>

          <div className="about-panel__visual">
            <img src="/landingpage/dormir.png" alt="فنادق وخدمات العمرة" />
          </div>
        </section>

        <div className="about-stats">
          <AboutStat value="24/7" label="دعم على مدار الساعة" icon={<HeadsetIcon className="icon icon-md" />} />
          <AboutStat value="+500" label="شركة ومؤسسة" icon={<UsersIcon className="icon icon-md" />} />
          <AboutStat value="+50,000" label="معتمر ومعتمرة" icon={<UsersIcon className="icon icon-md" />} />
          <AboutStat value="10+" label="سنوات من الخبرة" icon={<ShieldIcon className="icon icon-md" />} />
          <AboutStat value="+20" label="برامج متنوعة" icon={<BuildingIcon className="icon icon-md" />} />
        </div>

        <section className="about-why">
          <div className="about-section-title">
            <h3>لماذا تختار رواد العمرة؟</h3>
          </div>
          <div className="about-reasons">
            <AboutReason icon={<ShieldIcon className="icon icon-md" />} title="موثوقون ومعتمدون" subtitle="مرخصون من الجهات الرسمية وملتزمون بأعلى معايير الجودة." />
            <AboutReason icon={<TagIcon className="icon icon-md" />} title="أفضل الأسعار" subtitle="نوفر لك أفضل الأسعار مع جودة الخدمات." />
            <AboutReason icon={<HeadsetIcon className="icon icon-md" />} title="دعم مخصص" subtitle="فريق متخصص لمتابعة رحلتك قبل وأثناء وبعد العمرة." />
            <AboutReason icon={<MosqueIcon className="icon icon-md" />} title="مرونة في الحجز" subtitle="خيارات مرنة في الحجز والدفع تناسب احتياجاتك." />
            <AboutReason icon={<UsersIcon className="icon icon-md" />} title="برامج مخصصة" subtitle="تصميم برامج خاصة للشركات والمجموعات وفق احتياجاتكم." />
            <AboutReason icon={<BuildingIcon className="icon icon-md" />} title="راحة وطمأنينة" subtitle="نهتم بكل التفاصيل لتضمن رحلة مريحة ومطمئنة." />
          </div>
        </section>

        <section className="about-cta">
          <button className="btn btn-gold about-cta__primary" type="button" onClick={onStartBooking}>
            <span>اطلب عرض سعر</span>
            <LocationIcon className="icon icon-sm" />
          </button>
          <div className="about-cta__copy">
            <strong>جاهز لرحلة روحانية مميزة؟</strong>
            <p>تواصل معنا الآن للحصول على عرض يناسب احتياجاتك.</p>
          </div>
          <a className="btn btn-ghost about-cta__whatsapp" href="https://wa.me/965551234567" target="_blank" rel="noreferrer">
            <WhatsAppIcon className="icon icon-sm" />
            <span>تواصل عبر واتساب</span>
          </a>
        </section>
      </div>
    </section>
  );
}
