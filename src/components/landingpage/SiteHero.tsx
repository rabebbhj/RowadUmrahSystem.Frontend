import { ArrowLeftIcon, BusIcon, CalendarIcon, MosqueIcon, SearchIcon, UsersIcon, HeadsetIcon, GlobeIcon } from "./landingShared";

// Le haut de la page publique : barre de navigation flottante, colonne de texte et arche.
//
// CE QUI EST VRAI ET CE QUI NE L'EST PAS
// La maquette d'origine montrait une heure de priere (« الفجر · 05:08 »), une date de depart
// (« الأربعاء 11 نوفمبر ») et une barre de reservation deja remplie. Ce sont des valeurs
// inventees pour la mise en page. Ici :
//   - l'heure de priere a ete retiree : le site n'a aucune source pour la calculer, et afficher
//     une heure fausse au-dessus d'un bouton de reservation serait pire que de ne rien montrer ;
//   - la carte « الرحلة القادمة » n'apparait QUE si une vraie date de depart est connue ;
//   - les trois champs de la barre de reservation sont des portes d'entree, pas des donnees :
//     ils affichent ce qu'il y a a choisir, et le choix se fait dans le formulaire de reservation.
//
// Toutes les animations s'arretent pour qui a demande moins de mouvement dans son systeme.

const landingAsset = (fileName: string) => `${import.meta.env.BASE_URL}landingpage/${fileName}`;

/** Les trois mots qui tournent dans le titre. Le premier est repete a la fin : la pile remonte
 *  de quatre crans puis se replace au depart sans que la bascule se voie. */
const rotatingWords = ["روحانية لا تُنسى", "مطمئنة وميسّرة", "تبدأ من الكويت"];

/** Les trois vues de l'arche, en fondu croise. */
const archSlides = [
  { src: "hero-kaaba-premium.webp", alt: "الكعبة المشرفة", position: "30% 50%" },
  { src: "kaaba.webp", alt: "", position: "60% 50%" },
  { src: "paysage.webp", alt: "", position: "50% 50%" }
];

/** Les particules dorees qui montent le long de l'arche. */
const particles = [
  { left: 110, size: 4, duration: 7, delay: 0 },
  { left: 200, size: 3, duration: 9, delay: 2 },
  { left: 320, size: 5, duration: 8, delay: 1 },
  { left: 430, size: 3, duration: 10, delay: 3 },
  { left: 560, size: 4, duration: 7.5, delay: 4 },
  { left: 640, size: 3, duration: 9, delay: 5 },
  { left: 90, size: 3, duration: 11, delay: 6 }
];

const navLinks = [
  { label: "الرئيسية", target: "globalview" },
  { label: "الباقات", target: "gv-packages" },
  { label: "عمرة البدل", target: "gv-packages" },
  { label: "خدماتنا", target: "gv-our-services" },
  { label: "من نحن", target: "rowad-contact" },
  { label: "تواصل", target: "rowad-contact" }
];

const assurances = [
  { label: "فنادق قريبة من الحرم", icon: <MosqueIcon className="icon" /> },
  { label: "باص مكيّف طوال الرحلة", icon: <BusIcon className="icon" /> },
  { label: "مرشد ديني مرافق", icon: <UsersIcon className="icon" /> }
];

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

type Props = {
  /** Ouvre le formulaire de reservation. */
  onBook: () => void;
  /** La prochaine date de depart reellement publiee, ou null si aucune n'est connue. */
  nextDepartureLabel: string | null;
  language: string;
  onLanguageChange: (value: string) => void;
  languages: { value: string; label: string }[];
};

export function SiteHero({ onBook, nextDepartureLabel, language, onLanguageChange, languages }: Props) {
  return (
    <section className="rwh" id="globalview">
      <span className="rwh__glow" aria-hidden="true" />

      {/* Rosace a huit branches, qui tourne tres lentement derriere l'arche. */}
      <svg className="rwh__rosette" viewBox="0 0 300 300" fill="none" aria-hidden="true">
        <path d="M150 10 L189 56 L249 51 L244 111 L290 150 L244 189 L249 249 L189 244 L150 290 L111 244 L51 249 L56 189 L10 150 L56 111 L51 51 L111 56 Z" stroke="#D4AE62" strokeWidth="1" />
        <rect x="75" y="75" width="150" height="150" stroke="#D4AE62" strokeWidth="0.8" />
        <rect x="75" y="75" width="150" height="150" stroke="#D4AE62" strokeWidth="0.8" transform="rotate(45 150 150)" />
        <circle cx="150" cy="150" r="60" stroke="#D4AE62" strokeWidth="0.8" />
      </svg>

      {particles.map((particle, index) => (
        <span
          key={index}
          className="rwh__particle"
          aria-hidden="true"
          style={{
            left: particle.left,
            width: particle.size,
            height: particle.size,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}

      {/* ===== Barre de navigation flottante ===== */}
      <nav className="rwh-nav" aria-label="التنقل الرئيسي">
        <span className="rwh-nav__brand">
          <span className="rwh-nav__logo">
            <img src={landingAsset("company-logo.png")} alt="شعار روّاد للعمرة" decoding="async" />
          </span>
          <span className="rwh-nav__name">
            <b>روّاد</b>
            <span>للعمرة · الكويت</span>
          </span>
        </span>

        <span className="rwh-nav__links">
          {navLinks.map((link, index) => (
            <button
              type="button"
              key={link.label}
              className={index === 0 ? "is-current" : ""}
              onClick={() => scrollTo(link.target)}
            >
              {link.label}
            </button>
          ))}
        </span>

        <span className="rwh-nav__actions">
          <label className="rwh-nav__lang">
            <GlobeIcon className="icon" />
            <select value={language} onChange={(event) => onLanguageChange(event.target.value)} aria-label="اختيار اللغة">
              {languages.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button type="button" className="rwh-nav__book" onClick={onBook}>
            احجز الآن
            <span className="rwh-nav__arrow"><ArrowLeftIcon className="icon" /></span>
          </button>
        </span>
      </nav>

      {/* ===== Colonne de texte ===== */}
      <div className="rwh-copy">
        <span className="rwh-badge">
          <span className="rwh-badge__pill"><span className="rwh-badge__dot" />جديد</span>
          عمرة البدل متاحة الآن
        </span>

        <h1 className="rwh-title">
          رحلة إيمانية..
          <br />
          <span className="rwh-title__row">
            تجربة
            {/* La pile de mots : hauteur d'un cran, le reste deborde et reste cache. */}
            <span className="rwh-words">
              <span className="rwh-words__stack">
                {[...rotatingWords, rotatingWords[0]].map((word, index) => (
                  <span className="rwh-words__item" key={index}>{word}</span>
                ))}
              </span>
            </span>
          </span>
        </h1>

        <p className="rwh-lead">
          نقدّم لكم خدمات العمرة المتكاملة، برعاية واهتمام، لنجعل رحلتكم إلى بيت الله الحرام سهلة وآمنة ومميّزة.
        </p>

        {/* La barre n'affiche pas de reservation deja faite : chaque champ ouvre le formulaire,
            ou les vrais choix sont proposes. */}
        <div className="rwh-search">
          <button type="button" className="rwh-search__field" onClick={onBook}>
            <span className="rwh-search__icon"><MosqueIcon className="icon" /></span>
            <span className="rwh-search__text">
              <span>الباقة</span>
              <b>اختر باقتك</b>
            </span>
          </button>
          <button type="button" className="rwh-search__field" onClick={onBook}>
            <span className="rwh-search__icon"><CalendarIcon className="icon" /></span>
            <span className="rwh-search__text">
              <span>تاريخ السفر</span>
              <b>اختر التاريخ</b>
            </span>
          </button>
          <button type="button" className="rwh-search__field" onClick={onBook}>
            <span className="rwh-search__icon"><UsersIcon className="icon" /></span>
            <span className="rwh-search__text">
              <span>المسافرون</span>
              <b>حدّد العدد</b>
            </span>
          </button>
          <button type="button" className="rwh-search__go" onClick={onBook}>
            <SearchIcon className="icon" />
            ابحث
          </button>
        </div>

        <span className="rwh-assurances">
          {assurances.map((item) => (
            <span key={item.label}>
              <span className="rwh-assurances__icon">{item.icon}</span>
              {item.label}
            </span>
          ))}
        </span>
      </div>

      {/* ===== L'arche ===== */}
      <div className="rwh-arch">
        <svg className="rwh-arch__outline" viewBox="0 0 460 610" fill="none" aria-hidden="true">
          <path d="M8 602 V230 A222 222 0 0 1 452 230 V602" stroke="#D4AE62" strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="2 10" strokeLinecap="round" />
        </svg>
        <span className="rwh-arch__ring" aria-hidden="true" />

        <div className="rwh-arch__frame">
          {archSlides.map((slide, index) => (
            <img
              key={slide.src}
              className={`rwh-arch__slide rwh-arch__slide--${index + 1}`}
              src={landingAsset(slide.src)}
              alt={slide.alt}
              style={{ objectPosition: slide.position }}
              decoding="async"
            />
          ))}
          <span className="rwh-arch__shade" aria-hidden="true" />
          <span className="rwh-arch__inner" aria-hidden="true" />
          <span className="rwh-arch__sweep" aria-hidden="true" />
          <span className="rwh-arch__dots" aria-hidden="true">
            {archSlides.map((slide, index) => (
              <span key={slide.src} className={`rwh-arch__dot rwh-arch__dot--${index + 1}`} />
            ))}
          </span>
        </div>

        <span className="rwh-arch__apex" aria-hidden="true"><span /></span>

        {/* La carte n'existe que si une date de depart est reellement publiee. */}
        {nextDepartureLabel ? (
          <span className="rwh-float rwh-float--departure">
            <span className="rwh-float__head">
              <span>الرحلة القادمة</span>
            </span>
            <b>{nextDepartureLabel}</b>
            <span className="rwh-float__route">
              <b>الكويت</b>
              <span className="rwh-float__dash" />
              <span className="rwh-float__plane">✈</span>
              <span className="rwh-float__dash" />
              <b>مكة</b>
            </span>
          </span>
        ) : null}

        <span className="rwh-float rwh-float--support">
          <span className="rwh-float__badge"><HeadsetIcon className="icon" /></span>
          <span className="rwh-float__text">
            <b>معكم 24/7</b>
            <span>راحتكم مسؤوليتنا</span>
          </span>
        </span>
      </div>

      {/* ===== Transition basse : forme ivoire, bord dore, orbite, etincelle, medaillon etoile ===== */}
      <div className="rwh-transition" aria-hidden="true">
        <svg className="rwh-transition__svg" viewBox="0 0 1440 170" preserveAspectRatio="none">
          <defs>
            <linearGradient id="rwEdge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#D4AE62" stopOpacity="0" />
              <stop offset="0.3" stopColor="#D4AE62" stopOpacity="0.9" />
              <stop offset="0.5" stopColor="#F6E3B0" />
              <stop offset="0.7" stopColor="#D4AE62" stopOpacity="0.9" />
              <stop offset="1" stopColor="#D4AE62" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Forme ivoire pleine */}
          <path d="M0 140 L520 140 C590 140, 610 60, 720 60 C830 60, 850 140, 920 140 L1440 140 L1440 170 L0 170 Z" fill="#F7F3EC" />
          {/* Bord dore degrade */}
          <path d="M0 140 L520 140 C590 140, 610 60, 720 60 C830 60, 850 140, 920 140 L1440 140" fill="none" stroke="url(#rwEdge)" strokeWidth="1.6" />
          {/* Orbite en pointilles */}
          <path className="rwh-transition__dash" d="M0 142 L518 142 C588 142, 612 62, 720 62 C828 62, 852 142, 922 142 L1440 142" fill="none" stroke="#D4AE62" strokeOpacity="0.45" strokeDasharray="2 9" />
        </svg>

        <span className="rwh-transition__glow" />
        <span className="rwh-transition__spark" />

        <span className="rwh-transition__medal">
          <svg viewBox="0 0 200 200" fill="none">
            <path d="M100 0 L118 69 L190 50 L141 109 L200 150 L127 140 L100 200 L73 140 L0 150 L59 109 L10 50 L82 69 Z" stroke="#E9CF8E" strokeWidth="16" />
          </svg>
        </span>

        <button type="button" className="rwh-transition__cue" onClick={() => scrollTo("gv-packages")}>
          اكتشف باقاتنا
        </button>
      </div>
    </section>
  );
}
