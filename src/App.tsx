import { useEffect, useState, type ReactNode } from "react";

type IconProps = {
  className?: string;
};

function SvgIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function LocationIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </SvgIcon>
  );
}

function MailIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m4.5 7.5 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

function PhoneIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M6.5 4.8h2.1c.5 0 .9.3 1.1.8l1.2 3c.2.5.1 1.1-.3 1.5l-1.5 1.4c1.1 2.1 2.8 3.8 4.9 4.9l1.4-1.5c.4-.4 1-.5 1.5-.3l3 1.2c.5.2.8.6.8 1.1v2.1c0 .7-.5 1.3-1.2 1.5-1.2.3-2.6.3-4.1-.1C11 19.1 4.9 13 4.6 7c-.4-1.5-.4-2.9-.1-4.1.2-.7.8-1.2 1.5-1.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </SvgIcon>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 3.5v3M17 3.5v3M3.5 9h17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

function WhatsAppIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M20 11.7a8.2 8.2 0 0 1-11.9 7L4 20l1.4-3.9A8.2 8.2 0 1 1 20 11.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.4 8.8c.2-.4.4-.4.7-.4h.6c.2 0 .5 0 .7.5l.9 2.1c.1.3.1.6-.1.8l-.7.8c.5 1 1.4 1.8 2.4 2.4l.8-.7c.2-.2.5-.2.8-.1l2.1.9c.4.2.5.4.5.7v.6c0 .3 0 .5-.4.7-.7.3-1.5.3-2.4.1-2.7-.7-5.2-3.2-5.9-5.9-.2-.9-.2-1.7.1-2.4Z" fill="currentColor" />
    </SvgIcon>
  );
}

function ChatIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M6 18.3V20l2.7-1.5a8.7 8.7 0 0 0 3.3.6c4.2 0 7.5-2.7 7.5-6.2S16.2 6.7 12 6.7 4.5 9.4 4.5 12.9c0 1.8.8 3.4 2.1 4.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.3 12.7h7.4M8.3 10.1h4.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

function SearchIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m15 15 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

function HeadsetIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M4.8 13.2v-1.1a7.2 7.2 0 0 1 14.4 0v1.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.8 13.2a2.2 2.2 0 0 0 0 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M19.2 13.2a2.2 2.2 0 0 1 0 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 18.8c.9.9 2.2 1.4 4 1.4 1.8 0 3.1-.5 4-1.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

function ShieldIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M12 3.8 19 6.4v5.1c0 4.6-2.8 7.9-7 9.7-4.2-1.8-7-5.1-7-9.7V6.4L12 3.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m9.2 12.1 1.9 1.9 3.7-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

function TagIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M4 12.4V6.6c0-1.4 1.1-2.6 2.6-2.6h5.8l7.6 7.6-8.4 8.4L4 12.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="8.3" cy="8.3" r="1.2" fill="currentColor" />
    </SvgIcon>
  );
}

function BuildingIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M5 20.2V6.8h14v13.4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 20.2v-4h3.2v4M12.8 20.2v-4H16v4M8 8.6h1.8M8 11.9h1.8M14.2 8.6H16M14.2 11.9H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

function BusIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <rect x="4" y="5" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 16v2M17 16v2M6.3 10h11.4M9 5v5M15 5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="8" cy="13.2" r="1" fill="currentColor" />
      <circle cx="16" cy="13.2" r="1" fill="currentColor" />
    </SvgIcon>
  );
}

function UsersIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M14.2 19v-1.5c0-1.7-1.5-3-3.5-3s-3.5 1.3-3.5 3V19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="10.7" cy="9" r="2.7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19.3 18.7v-1c0-1.4-1-2.5-2.4-3.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16.5 8.8a2.2 2.2 0 0 1 0 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.7 18.7v-1c0-1.4 1-2.5 2.4-3.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7.5 8.8a2.2 2.2 0 0 0 0 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

function StarIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="m12 3 2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </SvgIcon>
  );
}

function MedalIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <circle cx="12" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m9 14.2-1 5.8 4-2.2 4 2.2-1-5.8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </SvgIcon>
  );
}

function BadgeIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M7 4.8h10l2 3v9.4l-7 2.8-7-2.8V7.8l2-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m9.2 12 1.7 1.7 4-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

function MosqueIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M4.5 18.8h15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 18.8V12l2.4-2.3v9.1M18 18.8V12l-2.4-2.3v9.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.4 18.8V10c0-1.8 1.2-3 2.6-3s2.6 1.2 2.6 3v8.8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 3.8c0 .9-.8 1.5-1.7 1.5.9.1 1.7.7 1.7 1.5 0-.8.8-1.4 1.7-1.5-.9 0-1.7-.6-1.7-1.5Z" fill="currentColor" />
    </SvgIcon>
  );
}

function MenuIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

function CloseIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

function ArrowLeftIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M14.5 5.5 8 12l6.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

function ChevronDownIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="m6.5 9 5.5 5.5L17.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="section-heading">
      <span className="section-heading__line" />
      <span className="section-heading__ornament">◆</span>
      <h2>{title}</h2>
      <span className="section-heading__ornament">◆</span>
      <span className="section-heading__line" />
    </div>
  );
}

function TopBar() {
  return (
    <div className="topbar">
      <div className="container topbar__inner">
        <div className="topbar__actions">
          <a className="topbar__book btn btn-gold" href="#programs">
            <CalendarIcon className="icon icon-sm" />
            <span>احجز الآن</span>
          </a>
          <a className="topbar__circle" href="https://wa.me/965551234567" aria-label="WhatsApp">
            <WhatsAppIcon className="icon icon-sm" />
          </a>
        </div>

        <div className="topbar__contact">
          <span className="topbar__item">
            <PhoneIcon className="icon icon-sm" />
            <span>+965 55 123 4567</span>
          </span>
          <span className="topbar__item">
            <MailIcon className="icon icon-sm" />
            <span>info@rawad-omrah.com</span>
          </span>
          <span className="topbar__item topbar__location">
            <LocationIcon className="icon icon-sm" />
            <span>الكويت - حولي - شارع الخليج العربي</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function MainNavbar({ menuOpen, onToggle }: { menuOpen: boolean; onToggle: () => void }) {
  const navItems = [
    "تواصل معنا",
    "من نحن",
    "عروض الشركات",
    "خدماتنا",
    "رحلات العمرة",
    "الرئيسية"
  ];

  return (
    <div className="main-nav">
      <div className="container main-nav__inner">
        <button className="nav-toggle" type="button" onClick={onToggle} aria-label="فتح القائمة">
          {menuOpen ? <CloseIcon className="icon icon-md" /> : <MenuIcon className="icon icon-md" />}
        </button>

        <nav className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          {navItems.map((item, index) => (
            <a key={item} className={`nav-link ${index === 1 ? "is-active" : ""}`} href="#">
              {item}
            </a>
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

function CustomerSupportBadge() {
  return (
    <aside className="support-badge" aria-label="خدمة العملاء 24/7">
      <HeadsetIcon className="support-badge__icon icon icon-lg" />
      <strong>خدمة عملاء</strong>
      <span className="support-badge__clock">24/7</span>
      <p>
        نحن معك
        <br />
        قبل الرحلة وأثناءها
        <br />
        وبعدها
      </p>
    </aside>
  );
}

function HeroSection() {
  return (
    <section className="hero section-shell">
      <div className="container hero__inner">
        <div className="hero__copy">
          <span className="hero__eyebrow">رحلة إيمانية · تنظيم راقٍ</span>
          <h1>تجربة روحانية لا تُنسى</h1>
          <p>
            برامج عمرة متكاملة بخدمات عالية الجودة
            <br />
            نهتم بكل التفاصيل لرحلتك ونرافقك من بيت الله الحرام
          </p>

          <div className="hero__actions">
            <a className="btn btn-gold hero__primary" href="#programs">
              <ArrowLeftIcon className="icon icon-sm" />
              <span>استعرض رحلات العمرة</span>
            </a>
            <a className="btn btn-ghost" href="#footer">
              <ChatIcon className="icon icon-sm" />
              <span>تواصل معنا</span>
            </a>
          </div>
        </div>

        <div className="hero__visual">
          <CustomerSupportBadge />
        </div>
      </div>
    </section>
  );
}

function SearchBar() {
  const fields = [
    { title: "عدد المعتمرين", placeholder: "اختر العدد", icon: <UsersIcon className="icon icon-sm" /> },
    { title: "المدينة", placeholder: "اختر المدينة", icon: <LocationIcon className="icon icon-sm" /> },
    { title: "المدة", placeholder: "اختر المدة", icon: <ChevronDownIcon className="icon icon-sm" /> },
    { title: "تاريخ الانطلاق", placeholder: "اختر التاريخ", icon: <CalendarIcon className="icon icon-sm" /> }
  ];

  return (
    <section className="search-shell">
      <div className="container search-bar">
        <button className="search-bar__submit btn btn-gold" type="button">
          <SearchIcon className="icon icon-sm" />
          <span>بحث</span>
        </button>

        {fields.map((field) => (
          <div key={field.title} className="search-bar__field">
            <span className="search-bar__title">{field.title}</span>
            <button className="search-bar__input" type="button">
              <span>{field.placeholder}</span>
              {field.icon}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function BenefitsStrip() {
  const benefits = [
    { icon: <ShieldIcon className="icon icon-md" />, title: "خبرة موثوقة", subtitle: "سنوات من النجاح" },
    { icon: <HeadsetIcon className="icon icon-md" />, title: "دعم على مدار الساعة", subtitle: "خدمة عملاء 24/7" },
    { icon: <TagIcon className="icon icon-md" />, title: "أسعار تنافسية", subtitle: "أفضل قيمة مقابل سعر" },
    { icon: <BadgeIcon className="icon icon-md" />, title: "مشرفون محترفون", subtitle: "إصدار خلال 24 ساعة" },
    { icon: <BuildingIcon className="icon icon-md" />, title: "فنادق مختارة", subtitle: "قريبة من الحرم" },
    { icon: <BusIcon className="icon icon-md" />, title: "تنقل ومواصلات", subtitle: "حديثة ومريحة" },
    { icon: <UsersIcon className="icon icon-md" />, title: "مشرفون محترفون", subtitle: "يرافقونك طوال الرحلة" },
    { icon: <HeadsetIcon className="icon icon-md" />, title: "دعم على مدار الساعة", subtitle: "خدمة عملاء 24/7" }
  ];

  return (
    <section className="benefits-shell">
      <div className="container benefits-strip">
        {benefits.map((benefit) => (
          <article key={benefit.title + benefit.subtitle} className="benefit-item">
            <span className="benefit-item__icon">{benefit.icon}</span>
            <strong>{benefit.title}</strong>
            <span>{benefit.subtitle}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

type ProgramCardProps = {
  badge: string;
  title: string;
  details: string[];
  price: string;
  priceSuffix?: string;
  image: string;
};

function ProgramCard({ badge, title, details, price, priceSuffix, image }: ProgramCardProps) {
  return (
    <article className="program-card">
      <div className="program-card__content">
        <span className="program-card__badge">{badge}</span>
        <div className="program-card__details">
          {details.map((item) => (
            <div key={item} className="program-card__detail">
              {item}
            </div>
          ))}
        </div>
        <div className="program-card__bottom">
          <div>
            <strong className="program-card__price">{price}</strong>
            <span className="program-card__suffix">{priceSuffix || "للشخص د.ك"}</span>
          </div>
          <a className="btn btn-gold program-card__cta" href="#footer">
            <ArrowLeftIcon className="icon icon-sm" />
            <span>{title}</span>
          </a>
        </div>
      </div>

      <div className="program-card__media" style={{ backgroundImage: `url('${image}')` }} />
    </article>
  );
}

function ProgramsSection() {
  const programs = [
    {
      badge: "اقتصادية",
      title: "عرض التفاصيل",
      details: ["فندق 3 نجوم", "7 ليالي - مكة", "طيران اقتصادي", "نقل مشترك"],
      price: "2,490",
      priceSuffix: "للشخص د.ك",
      image: "/umrah/card1-photo-only-b.jpg"
    },
    {
      badge: "الأكثر طلباً",
      title: "عرض التفاصيل",
      details: ["فندق 4 نجوم", "10 ليالي - مكة", "طيران اقتصادي", "نقل خاص"],
      price: "4,590",
      priceSuffix: "د.ك",
      image: "/umrah/card2-pure-b.jpg"
    },
    {
      badge: "VIP",
      title: "عرض التفاصيل",
      details: ["فندق 5 نجوم", "14 ليلة - مكة", "طيران درجة أعمال", "نقل خاص"],
      price: "7,990",
      priceSuffix: "للشخص د.ك",
      image: "/umrah/card3-pure-b.jpg"
    }
  ];

  return (
    <section className="programs-shell" id="programs">
      <div className="container">
        <SectionHeading title="اختر البرنامج المناسب لك" />
        <div className="programs-grid">
          {programs.map((program) => (
            <ProgramCard
              key={program.badge}
              badge={program.badge}
              title={program.title}
              details={program.details}
              price={program.price}
              priceSuffix={program.priceSuffix}
              image={program.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatisticsStrip() {
  const stats = [
    { icon: <BadgeIcon className="icon icon-md" />, value: "10+", title: "سنوات خبرة", subtitle: "في تنظيم رحلات العمرة" },
    { icon: <UsersIcon className="icon icon-md" />, value: "25K+", title: "معتمر سنوياً", subtitle: "" },
    { icon: <MedalIcon className="icon icon-md" />, value: "500+", title: "شريك نجاح", subtitle: "حول العالم" },
    { icon: <StarIcon className="icon icon-md" />, value: "98%", title: "رضا العملاء", subtitle: "بفضل ثقة عملائنا" }
  ];

  return (
    <section className="stats-shell">
      <div className="container stats-strip">
        <div className="stats-strip__image">
          <img src="/umrah/mosque.jpg" alt="" />
        </div>

        {stats.map((stat) => (
          <article key={stat.value} className="stats-item">
            <span className="stats-item__icon">{stat.icon}</span>
            <div className="stats-item__content">
              <strong>{stat.value}</strong>
              <span>{stat.title}</span>
              {stat.subtitle ? <small>{stat.subtitle}</small> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const footerLinks = ["عمرة اقتصادية", "عمرة مميزة", "عمرة VIP", "عمرة رمضان", "العمرة في المواسم"];
  const quickLinks = ["الرئيسية", "رحلات العمرة", "خدماتنا", "عروض الشركات", "من نحن", "تواصل معنا"];
  const socials = ["IG", "SC", "YT", "X", "TT", "FB"];

  return (
    <footer className="footer" id="footer">
      <div className="container footer__grid">
        <section className="footer__newsletter">
          <h3>اشترك في نشرتنا البريدية</h3>
          <p>ليصلك كل جديد عن العروض والبرامج</p>

          <div className="newsletter">
            <button className="btn btn-gold newsletter__button" type="button">
              <MailIcon className="icon icon-sm" />
              <span>اشتراك الآن</span>
            </button>
            <input type="email" defaultValue="" placeholder="أدخل بريدك الإلكتروني" />
          </div>

          <div className="socials">
            {socials.map((item) => (
              <a key={item} href="#" aria-label={item} className="socials__item">
                {item}
              </a>
            ))}
          </div>
        </section>

        <section className="footer__links">
          <h4>روابط سريعة</h4>
          <ul>
            {quickLinks.map((item) => (
              <li key={item}>
                <a href="#">{item}</a>
              </li>
            ))}
          </ul>
        </section>

        <section className="footer__links">
          <h4>رحلات العمرة</h4>
          <ul>
            {footerLinks.map((item) => (
              <li key={item}>
                <a href="#programs">{item}</a>
              </li>
            ))}
          </ul>
        </section>

        <section className="footer__brand">
          <div className="brand brand--footer">
            <div className="brand__mark">
              <MosqueIcon className="icon icon-lg" />
            </div>
            <div className="brand__text">
              <strong>رواد للعمرة</strong>
            </div>
          </div>

          <p>
            شركة كويتية متخصصة في تنظيم رحلات العمرة
            <br />
            خدماتنا من الكويت إلى بيت الله الحرام
          </p>

          <ul className="footer__contact">
            <li>
              <PhoneIcon className="icon icon-sm" />
              <span>+965 55 123 4567</span>
            </li>
            <li>
              <MailIcon className="icon icon-sm" />
              <span>info@rawad-omrah.com</span>
            </li>
            <li>
              <LocationIcon className="icon icon-sm" />
              <span>الكويت - حولي - شارع الخليج العربي</span>
            </li>
          </ul>
        </section>
      </div>

      <div className="container footer__copyright">جميع الحقوق محفوظة © 2026 رواد العمرة</div>
    </footer>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.body.classList.add("umrah-body");

    return () => {
      document.body.classList.remove("umrah-body");
    };
  }, []);

  return (
    <div className="umrah-page" dir="rtl" lang="ar">
      <TopBar />
      <MainNavbar menuOpen={menuOpen} onToggle={() => setMenuOpen((value) => !value)} />
      <main>
        <HeroSection />
        <SearchBar />
        <BenefitsStrip />
        <ProgramsSection />
        <StatisticsStrip />
      </main>
      <Footer />
    </div>
  );
}
