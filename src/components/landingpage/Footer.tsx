import { LocationIcon, MailIcon, MosqueIcon, PhoneIcon } from "./landingShared";

export function Footer() {
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
              <span>+965 55583203 - +965 22283558</span>
            </li>
            <li>
              <PhoneIcon className="icon icon-sm" />
              <span>+965 65002927 - +965 22283589</span>
            </li>
            <li>
              <MailIcon className="icon icon-sm" />
              <span>info@ruwadomra.com</span>
            </li>
            <li>
              <LocationIcon className="icon icon-sm" />
              <span>الكويت - الفروانية - شارع حبيب مناور - مجمع العربيد جاليري - مكتب 5</span>
            </li>
          </ul>
        </section>
      </div>
      <div className="container footer__copyright">جميع الحقوق محفوظة © 2026 رواد العمرة</div>
    </footer>
  );
}
