import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PhoneDeck } from "./PhoneDeck";
import { appDownloadUrl, storeLinks, withUtm } from "../../config/appLinks";
import type { StoreLink } from "../../config/appLinks";
import { qrMatrix, qrPath } from "../../lib/qr";
import {
  cooldownDays,
  maxCloses,
  modalBlocker,
  readMemory,
  shouldTrigger,
  track,
  writeMemory
} from "../../lib/appPromoRules";

// Les deux rappels de l'application sur le site : la barre posee dans la page, et le popup.
//
// CE QU'ILS NE FONT PAS
// Tant qu'aucune adresse de magasin n'est renseignee dans config/appLinks.ts, les boutons
// annoncent « قريباً على » et ne sont pas des liens, et le QR n'apparait pas : il n'y a rien a
// encoder. C'est exactement ce que la maquette prevoit — le designer avait deja ecrit
// « قريباً على » — et cela evite d'envoyer quelqu'un vers une page d'erreur.

const logo = `${import.meta.env.BASE_URL}landingpage/company-logo.png`;

/** Vrai des que l'application est reellement telechargeable quelque part. */
const published = storeLinks("site").some((store) => store.href !== "");

// --- Morceaux partages ------------------------------------------------------

/** `source` sert uniquement a la mesure : d'ou vient le clic, de la barre ou du popup. */
function StoreCard({ store }: { store: StoreLink & { source?: string } }) {
  const inner = (
    <>
      <span className="rwa-store__mark" aria-hidden="true">
        {store.id === "ios" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
            <path d="M11 18.5h2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4l13 8-13 8z" />
          </svg>
        )}
      </span>
      <span className="rwa-store__text">
        <span>{store.href ? store.label : "قريباً على"}</span>
        <b dir="ltr">{store.store}</b>
      </span>
    </>
  );

  if (!store.href) {
    return <span className="rwa-store is-soon">{inner}</span>;
  }
  return (
    <a
      className="rwa-store"
      href={store.href}
      target="_blank"
      rel="noreferrer"
      onClick={() => track("app_store_click", { store: store.id, source: store.source ?? "site" })}
    >
      {inner}
    </a>
  );
}

/**
 * Le QR. Il n'existe que s'il y a une adresse a encoder : un QR decoratif qui ne mene nulle part
 * serait une promesse en l'air, et celui de la maquette pointait vers un domaine qui n'appartient
 * pas a l'agence.
 */
function AppQr({ size, source, dark }: { size: number; source: string; dark?: boolean }) {
  const matrix = useMemo(() => {
    if (!appDownloadUrl) return null;
    try {
      return qrMatrix(withUtm(appDownloadUrl, source));
    } catch {
      return null;
    }
  }, [source]);

  useEffect(() => {
    if (matrix) track("app_qr_view", { source });
  }, [matrix, source]);

  if (!matrix) return null;

  return (
    <span className={`rwa-qr${dark ? " rwa-qr--dark" : ""}`} style={{ width: size, height: size }}>
      <svg viewBox={`-2 -2 ${matrix.length + 4} ${matrix.length + 4}`} shapeRendering="crispEdges" aria-hidden="true">
        <path d={qrPath(matrix)} fill={dark ? "#fbf4e4" : "#1B1A17"} />
      </svg>
      <span className="rwa-qr__badge">
        <img src={logo} alt="" decoding="async" />
      </span>
      <span className="rwa-qr__scan" aria-hidden="true" />
    </span>
  );
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M8 12h8" />
    </svg>
  );
}

function Decor() {
  return (
    <>
      <svg className="rwa-decor__star" viewBox="0 0 300 300" fill="none" stroke="#D4AE62" strokeWidth="1" aria-hidden="true">
        <path d="M150 10 L189 56 L249 51 L244 111 L290 150 L244 189 L249 249 L189 244 L150 290 L111 244 L51 249 L56 189 L10 150 L56 111 L51 51 L111 56 Z" />
        <rect x="75" y="75" width="150" height="150" />
        <rect x="75" y="75" width="150" height="150" transform="rotate(45 150 150)" />
      </svg>
      <span className="rwa-decor__halo" aria-hidden="true" />
      <span className="rwa-decor__lines" aria-hidden="true" />
      {[12, 30, 55, 72, 88].map((left, index) => (
        <span
          key={left}
          className="rwa-decor__spark"
          aria-hidden="true"
          style={{ left: `${left}%`, animationDelay: `${index * -2}s`, animationDuration: `${7 + index}s` }}
        />
      ))}
    </>
  );
}

// --- La barre dans la page --------------------------------------------------

export function AppPromoBar() {
  const stores = storeLinks("app_bar").map((store) => ({ ...store, source: "bar" }));
  const [qrOpen, setQrOpen] = useState(false);

  return (
    // Le lien « خدماتنا » de la barre de navigation vise cet identifiant. Il vivait sur
    // l'ancienne grande section ; il vit ici maintenant, sinon le lien ne menerait nulle part.
    <section className="rwa-bar" id="gv-our-services" aria-label="تطبيق روّاد للجوال">
      <div className="rwa-bar__card">
        <Decor />

        <div className="rwa-bar__copy">
          <h3 className="rwa-bar__title">
            تطبيق <span className="rwa-gold">روّاد</span> {published ? "الآن على المتاجر" : "قريباً على جوالك"}
          </h3>

          {/* Le QR, son libelle, et les deux boutons : tous sur la meme ligne. */}
          <span className="rwa-bar__actions">
            {appDownloadUrl ? (
              <button
                type="button"
                className="rwa-bar__qrBtn"
                onClick={() => setQrOpen(true)}
              >
                <span className="rwa-bar__qrLabel">
                  <ScanIcon />
                  <span>امسح</span>
                  <span>بكاميرا جوالك</span>
                </span>
                <AppQr size={72} source="app_bar" dark />
              </button>
            ) : null}
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </span>
        </div>

        <div className="rwa-bar__deck">
          <PhoneDeck phoneWidth={140} phoneHeight={290} spread={104} />
        </div>
      </div>

      {qrOpen && (
        <div className="rwa-qrPopup__overlay" onClick={() => setQrOpen(false)}>
          <div className="rwa-qrPopup" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="rwa-qrPopup__close" onClick={() => setQrOpen(false)} aria-label="إغلاق">×</button>
            <AppQr size={240} source="app_bar_zoom" />
            <p className="rwa-qrPopup__hint">امسح الرمز بكاميرا جوالك</p>
          </div>
        </div>
      )}
    </section>
  );
}

// --- Le popup ---------------------------------------------------------------

type ModalProps = {
  /** Vrai pendant que le tunnel de reservation est ouvert : on n'interrompt pas. */
  bookingOpen: boolean;
};

export function AppPromoModal({ bookingOpen }: ModalProps) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const stores = storeLinks("app_modal").map((store) => ({ ...store, source: "modal" }));

  const show = useCallback(() => {
    if (done) return;
    const blocker = modalBlocker({
      memory: readMemory(),
      nowMs: Date.now(),
      isDesktop: window.matchMedia("(min-width: 1024px) and (min-height: 620px)").matches,
      bookingOpen
    });
    if (blocker !== "ok") return;

    opener.current = document.activeElement as HTMLElement | null;
    setOpen(true);
    setDone(true);
    const memory = readMemory();
    writeMemory({ ...memory, lastShownAt: Date.now() });
    track("app_modal_view");
  }, [bookingOpen, done]);

  // Les trois declencheurs : le temps passe, la moitie de la page, ou la souris qui remonte
  // vers la barre d'adresse — le geste de quelqu'un qui s'apprete a partir.
  useEffect(() => {
    if (done) return undefined;

    const timer = window.setTimeout(show, 25000);
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = height > 0 ? window.scrollY / height : 0;
      if (shouldTrigger({ secondsOnSite: 0, scrollRatio: ratio, exitIntent: false })) show();
    };
    const onLeave = (event: MouseEvent) => {
      if (event.clientY <= 0 && shouldTrigger({ secondsOnSite: 0, scrollRatio: 0, exitIntent: true })) show();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseout", onLeave);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [done, show]);

  const close = useCallback(() => {
    setOpen(false);
    const memory = readMemory();
    writeMemory({ ...memory, closeCount: memory.closeCount + 1 });
    track("app_modal_close");
    opener.current?.focus?.();
  }, []);

  // Echap pour fermer, et le clavier qui reste enferme dans la fenetre tant qu'elle est ouverte.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="rwa-overlay" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div
        className="rwa-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rwa-modal-title"
        ref={dialogRef}
      >
        <Decor />

        <button type="button" className="rwa-modal__close" aria-label="إغلاق" onClick={close}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="rwa-modal__head">
          <span className="rwa-modal__badge">
            <em>جديد</em>
            تطبيق روّاد للعمرة
          </span>
          <h2 id="rwa-modal-title" className="rwa-modal__title">
            عمرتك كلّها <span className="rwa-gold">في جيبك</span>
          </h2>
        </div>

        <div className="rwa-modal__deck">
          <PhoneDeck phoneWidth={206} phoneHeight={424} spread={146} />
        </div>

        <div className="rwa-modal__glass">
          <AppQr size={120} source="app_modal" />
          <div className="rwa-modal__glassText">
            <b>
              <ScanIcon />
              {appDownloadUrl ? "امسح بكاميرا جوالك" : "تطبيق روّاد للعمرة"}
            </b>
            {/* Tant que l'application n'est pas dans les magasins, on n'invite pas a l'y chercher :
                le visiteur ne la trouverait pas et croirait s'etre trompe. */}
            <span>
              {!appDownloadUrl
                ? "سيصلك إشعار عند توفّره في المتاجر"
                : published
                  ? "أو ابحث عن «روّاد» في متجر التطبيقات"
                  : "لمتابعة كل جديد عن التطبيق"}
            </span>
            <span className="rwa-modal__stores">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </span>
          </div>
        </div>

        <button type="button" className="rwa-modal__continue" onClick={close}>
          المتابعة على الموقع
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export { cooldownDays, maxCloses };
