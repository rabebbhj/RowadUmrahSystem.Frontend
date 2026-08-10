import { CalendarIcon, LocationIcon, MailIcon, PhoneIcon, WhatsAppIcon } from "./landingShared";

export function TopBar({ onBookNow }: { onBookNow: () => void }) {
  return (
    <div className="topbar">
      <div className="container topbar__inner">
        <div className="topbar__actions">
          <button className="topbar__book btn btn-gold" type="button" onClick={onBookNow}>
            <CalendarIcon className="icon icon-sm" />
            <span>احجز الآن</span>
          </button>
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
