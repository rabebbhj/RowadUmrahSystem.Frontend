import { ArrowLeftIcon, InstagramIcon, SnapchatIcon, TikTokIcon, WhatsAppIcon } from "./landingShared";
import type { LegalDocumentId } from "../../legal";

// Pied de page du site public — version « carte ».
//
// Le pied de page n'occupe plus toute la largeur : c'est une carte sombre posee sur la page,
// avec 24 px de marge tout autour. Deux blocs a l'interieur : une carte d'appel a l'action
// champagne, puis les colonnes et la barre du bas.
//
// La colonne « قانوني » n'est pas une decoration : l'article 9 des Conditions generales exige
// que les documents restent consultables depuis n'importe quelle page. Les liens ouvrent la
// fenetre LegalDialog au lieu de naviguer, pour qu'un client en train de reserver ne perde pas
// sa reservation en lisant les conditions.

const landingAsset = (fileName: string) => `${import.meta.env.BASE_URL}landingpage/${fileName}`;

const whatsappNumber = "96555583203";
const mapsQuery = "الكويت الفروانية شارع حبيب مناور مجمع العربيد جاليري";

/**
 * Le trajet du widget, dans un repere de 330 x 100.
 *
 * L'arc dessine et l'avion qui le suit doivent partager EXACTEMENT le meme tracé : l'un est un
 * <path> SVG, l'autre un `offset-path` CSS. Les deux lisent cette constante, et l'avion la recoit
 * en style en ligne — sinon une retouche du dessin laisserait l'avion voler a cote de sa route.
 */
const routeSize = { width: 330, height: 100 };
const routePath = "M286 66 C 226 8, 104 8, 44 66";

const quickLinks = ["الرئيسية", "رحلات العمرة", "العروض", "خدماتنا"];
const serviceLinks = ["حجز فوري", "خدمة العملاء", "النقل الداخلي", "استخراج التأشيرات"];

const socials = [
  { label: "واتساب", href: `https://wa.me/${whatsappNumber}`, icon: <WhatsAppIcon className="icon" /> },
  { label: "إنستغرام", href: "https://instagram.com/ruwadomra", icon: <InstagramIcon className="icon" /> },
  { label: "سناب شات", href: "https://snapchat.com/add/ruwadomra", icon: <SnapchatIcon className="icon" /> },
  { label: "تيك توك", href: "https://tiktok.com/@ruwadomra", icon: <TikTokIcon className="icon" /> }
];

const phones = ["+965 2228 3558", "+965 2228 3589", "+965 5558 3203", "+965 6500 2927"];

const paymentMethods = ["KNET", "VISA", "Mastercard", "Apple Pay"];

type Props = {
  onOpenLegal: (id: LegalDocumentId) => void;
  onBook?: () => void;
};

export function SiteFooter({ onOpenLegal, onBook }: Props) {
  const legalLinks: { label: string; onClick: () => void }[] = [
    { label: "الشروط والأحكام", onClick: () => onOpenLegal("terms") },
    { label: "التعديل والإلغاء والاسترداد", onClick: () => onOpenLegal("cancellation") },
    { label: "سياسة الخصوصية", onClick: () => onOpenLegal("privacy") },
    {
      label: "الشكاوى",
      onClick: () => document.getElementById("rowad-contact")?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  ];

  return (
    <footer className="rwf" id="footer">
      <div className="rwf__card">
        <span className="rwf__halo" aria-hidden="true" />
        <div className="rwf__body">


          {/* Carte d'appel a l'action. */}
          <section className="rwf-cta">
            <span className="rwf-cta__arch">
              {/* hero-kaaba-premium.png est deja chargee en haut de la page : la reutiliser ici
                  ne coute aucun telechargement. */}
              <img src={landingAsset("hero-kaaba-premium.webp")} alt="الكعبة المشرفة" decoding="async" />
            </span>

            <div className="rwf-cta__copy">
              <b>رحلتك القادمة تبدأ من هنا</b>
              <span>نرافقك من الكويت حتى تقف أمام الكعبة، خطوة بخطوة.</span>
              <span className="rwf-cta__actions">
                <button type="button" className="rwf-cta__book" onClick={onBook}>
                  احجز رحلتك
                  <span className="rwf-cta__arrow"><ArrowLeftIcon className="icon" /></span>
                </button>
                <a className="rwf-cta__whatsapp" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
                  <WhatsAppIcon className="icon" />
                  واتساب
                </a>
              </span>
            </div>

            {/* Le trajet Koweit -> La Mecque. Decoratif : rien a lire pour un lecteur d'ecran. */}
            <span className="rwf-route" aria-hidden="true">
              {/* Le repere garde une taille fixe et se centre : sur un ecran etroit la carte
                  s'elargit sans etirer l'arc, qui se decalerait alors de l'avion. */}
              <span className="rwf-route__track" style={{ width: routeSize.width, height: routeSize.height }}>
                <svg className="rwf-route__arc" viewBox={`0 0 ${routeSize.width} ${routeSize.height}`}>
                  <path d={routePath} fill="none" stroke="#C9A04F" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" />
                </svg>
                <span className="rwf-route__plane" style={{ offsetPath: `path("${routePath}")` }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z" transform="rotate(-90 12 12)" />
                  </svg>
                </span>
                <span className="rwf-route__from">
                  <span className="rwf-route__dot" />
                  <b>الكويت</b>
                </span>
                <span className="rwf-route__to">
                  <span className="rwf-route__square" />
                  <b>مكة المكرمة</b>
                </span>
                <span className="rwf-route__tag">نرافقك في كل الطريق</span>
              </span>
            </span>
          </section>

          {/* Les cinq colonnes. */}
          <div className="rwf-grid">
            <section className="rwf-brand">
              <span className="rwf-brand__head">
                <span className="rwf-brand__logo">
                  <img src={landingAsset("company-logo.png")} alt="شعار روّاد للعمرة" decoding="async" />
                </span>
                <b>روّاد العمرة</b>
              </span>
              <p>رحلات عمرة من الكويت بأعلى معايير الراحة والثقة، من الحجز حتى العودة.</p>
              <ul className="rwf-socials">
                {socials.map((social) => (
                  <li key={social.label}>
                    <a href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>{social.icon}</a>
                  </li>
                ))}
              </ul>
            </section>

            <nav className="rwf-col" aria-label="روابط سريعة">
              <span className="rwf-col__title">روابط سريعة</span>
              {quickLinks.map((link) => <a href="#" key={link}>{link}</a>)}
            </nav>

            <nav className="rwf-col" aria-label="خدماتنا">
              <span className="rwf-col__title">خدماتنا</span>
              {serviceLinks.map((link) => <a href="#" key={link}>{link}</a>)}
            </nav>

            <nav className="rwf-col" aria-label="روابط قانونية">
              <span className="rwf-col__title">قانوني</span>
              {legalLinks.map((link) => (
                <button type="button" key={link.label} onClick={link.onClick}>{link.label}</button>
              ))}
            </nav>

            <section className="rwf-col rwf-contact" id="rowad-contact" aria-label="تواصل معنا">
              <span className="rwf-col__title">تواصل معنا</span>
              <a className="rwf-contact__mail" href="mailto:info@ruwadomra.com">info@ruwadomra.com</a>
              {/* Chaque numero est isole en lecture latine : sans cela le « + » et les chiffres
                  se reorganisent dans une page de droite a gauche. */}
              <span className="rwf-contact__phones">
                {phones.map((phone) => (
                  <a key={phone} dir="ltr" href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
                ))}
              </span>
              <a
                className="rwf-contact__address"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                target="_blank"
                rel="noreferrer"
              >
                الكويت، الفروانية، شارع حبيب مناور — مجمّع العربيد جاليري، مكتب 5
                <span className="rwf-contact__out" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 16L16 8M9 8h7v7" />
                  </svg>
                </span>
              </a>
            </section>
          </div>

          {/* Barre du bas. */}
          <div className="rwf-bottom">
            <span>
              © 2026 روّاد للعمرة · دولة الكويت ·{" "}
              <button type="button" onClick={() => onOpenLegal("company")}>بيانات الشركة</button>
            </span>
            <span className="rwf-pay">
              {paymentMethods.map((method) => <em key={method}>{method}</em>)}
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}
