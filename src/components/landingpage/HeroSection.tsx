import { ArrowLeftIcon, ChatIcon, HeadsetIcon } from "./landingShared";

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

export function HeroSection({ onStartBooking }: { onStartBooking: () => void }) {
  return (
    <section className="hero section-shell">
      <div className="container hero__inner">
        <div className="hero__copy">
          <span className="hero__eyebrow">رحلة إيمانية · تنظيم راقٍ</span>
          <h1>تجربة روحية لا تُنسى</h1>
          <p>
            برامج عمرة متكاملة بخدمات عالية الجودة
            <br />
            نهتم بكل التفاصيل لرحلتك ونرافقك من بيت الله الحرام
          </p>

          <div className="hero__actions">
            <button className="btn btn-gold hero__primary" type="button" onClick={onStartBooking}>
              <ArrowLeftIcon className="icon icon-sm" />
              <span>استعرض رحلات العمرة</span>
            </button>
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
