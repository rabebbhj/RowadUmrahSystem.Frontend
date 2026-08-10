import { useState, type ReactNode } from "react";
import {
  BuildingIcon,
  CalendarIcon,
  ClockIcon,
  HeadsetIcon,
  LocationIcon,
  MailIcon,
  PhoneIcon,
  WhatsAppIcon,
  UsersIcon,
  ShieldIcon,
  TagIcon
} from "./landingShared";

function ContactFeature({
  icon,
  title,
  subtitle
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <article className="contact-feature">
      <span className="contact-feature__icon">{icon}</span>
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </article>
  );
}

export function ContactPage({ onStartBooking }: { onStartBooking: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="contact-page">
      <div className="container">
        <div className="contact-hero">
          <div className="contact-hero__copy">
            <div className="booking-breadcrumbs contact-breadcrumbs">
              <button type="button">الرئيسية</button>
              <span>›</span>
              <strong>تواصل معنا</strong>
            </div>
            <h1>تواصل معنا</h1>
            <p>نحن هنا لخدمتك والإجابة على جميع استفساراتكم بكل سرعة واهتمام.</p>
            <div className="contact-hero__actions">
              <button className="btn btn-gold" type="button" onClick={onStartBooking}>
                <span>احجز الآن</span>
              </button>
              <a className="btn btn-ghost" href="https://wa.me/965551234567" target="_blank" rel="noreferrer">
                <WhatsAppIcon className="icon icon-sm" />
                <span>واتساب</span>
              </a>
            </div>
          </div>
          <div className="contact-hero__visual">
            <img src="/landingpage/kaaba.png" alt="الكعبة المشرفة" />
          </div>
        </div>

        <div className="contact-layout">
          <section className="contact-panel contact-panel--form">
            <div className="contact-panel__title">
              <span>✉</span>
              <h2>أرسل لنا رسالة</h2>
            </div>

            <form
              className="contact-form"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="contact-form__grid">
                <label>
                  الاسم الكامل *
                  <input type="text" placeholder="الاسم الكامل" />
                </label>
                <label>
                  البريد الإلكتروني *
                  <input type="email" placeholder="البريد الإلكتروني" />
                </label>
                <label>
                  رقم الهاتف *
                  <input type="tel" placeholder="رقم الهاتف" />
                </label>
                <label>
                  الموضوع *
                  <select defaultValue="">
                    <option value="" disabled>
                      اختر الموضوع
                    </option>
                    <option>حجز عمرة</option>
                    <option>استفسار عام</option>
                    <option>خدمة إضافية</option>
                    <option>مشكلة في الحجز</option>
                  </select>
                </label>
                <label className="contact-form__wide">
                  رسالتك *
                  <textarea placeholder="اكتب رسالتك هنا..." rows={8} />
                </label>
              </div>

              <button className="btn btn-gold contact-form__submit" type="submit">
                <span>إرسال الرسالة</span>
                <CalendarIcon className="icon icon-sm" />
              </button>

              <p className="contact-form__note">
                نحن نحافظ على خصوصية بياناتك، ولن يتم مشاركتها مع أي جهة أخرى.
              </p>
              {submitted ? <p className="contact-form__success">تم استلام رسالتك، وسنعود إليك قريباً.</p> : null}
            </form>
          </section>

          <aside className="contact-panel contact-panel--info">
            <div className="contact-panel__title">
              <span>🎧</span>
              <h2>معلومات التواصل</h2>
            </div>

            <div className="contact-info-list">
              <div className="contact-info-item">
                <span className="contact-info-item__icon">
                  <PhoneIcon className="icon icon-sm" />
                </span>
                <div>
                  <strong>اتصل بنا</strong>
                  <p>+965 55 123 4567</p>
                  <small>متاح 24/7</small>
                </div>
              </div>

              <div className="contact-info-item">
                <span className="contact-info-item__icon">
                  <WhatsAppIcon className="icon icon-sm" />
                </span>
                <div>
                  <strong>واتساب</strong>
                  <p>+965 55 123 4567</p>
                  <small>رد سريع عبر واتساب</small>
                </div>
              </div>

              <div className="contact-info-item">
                <span className="contact-info-item__icon">
                  <MailIcon className="icon icon-sm" />
                </span>
                <div>
                  <strong>البريد الإلكتروني</strong>
                  <p>info@rawad-omrah.com</p>
                  <small>نرد خلال 24 ساعة</small>
                </div>
              </div>

              <div className="contact-info-item">
                <span className="contact-info-item__icon">
                  <ClockIcon className="icon icon-sm" />
                </span>
                <div>
                  <strong>ساعات العمل</strong>
                  <p>24/7</p>
                  <small>خدمة على مدار الساعة</small>
                </div>
              </div>
            </div>

            <div className="contact-social">
              <strong>تابعنا على</strong>
              <div className="contact-social__row">
                {["f", "ig", "x", "yt"].map((item) => (
                  <a key={item} href="#" aria-label={item} className="contact-social__item">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <section className="contact-panel contact-panel--map">
            <div className="contact-panel__title">
              <span>📍</span>
              <h2>موقعنا</h2>
            </div>

            <div className="contact-map">
              <div className="contact-map__surface">
                <div className="contact-map__pin" />
              </div>
              <div className="contact-map__caption">
                <strong>الكويت - حولي - شارع الخليج العربي</strong>
                <span>مبنى رواي وأمجاد للعمرة - الدور 5</span>
              </div>
            </div>

            <div className="contact-branches">
              <div className="contact-panel__title contact-panel__title--small">
                <span>🏢</span>
                <h3>فروعنا</h3>
              </div>

              <div className="contact-branches__grid">
                <article className="contact-branch-card">
                  <BuildingIcon className="icon icon-md" />
                  <strong>الكويت</strong>
                  <span>شارع الخليج العربي</span>
                  <small>+965 55 123 4567</small>
                </article>
                <article className="contact-branch-card">
                  <BuildingIcon className="icon icon-md" />
                  <strong>مكة المكرمة</strong>
                  <span>شارع إبراهيم الخليل</span>
                  <small>+966 12 345 6788</small>
                </article>
                <article className="contact-branch-card">
                  <BuildingIcon className="icon icon-md" />
                  <strong>المدينة المنورة</strong>
                  <span>طريق الملك فهد</span>
                  <small>+966 12 345 6789</small>
                </article>
              </div>
            </div>
          </section>
        </div>

        <div className="contact-features">
          <ContactFeature icon={<ShieldIcon className="icon icon-md" />} title="ثقة وأمان" subtitle="مضمون من الجهات الرسمية" />
          <ContactFeature icon={<HeadsetIcon className="icon icon-md" />} title="دعم على مدار الساعة" subtitle="فريق جاهز لخدمتكم في أي وقت" />
          <ContactFeature icon={<TagIcon className="icon icon-md" />} title="خدمة متميزة" subtitle="نقدم أفضل الخدمات بأعلى معايير الجودة" />
          <ContactFeature icon={<UsersIcon className="icon icon-md" />} title="خبرة واسعة" subtitle="أكثر من 10 سنوات في خدمة المعتمرين" />
        </div>
      </div>
    </section>
  );
}
