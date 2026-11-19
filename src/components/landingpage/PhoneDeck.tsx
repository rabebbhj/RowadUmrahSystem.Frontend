import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

// Le paquet de telephones qui defile, partage par la barre et le popup de l'application.
//
// POURQUOI SANS BIBLIOTHEQUE D'ANIMATION
// Le projet n'a que React. Ajouter Framer Motion ou Swiper pour cinq cartes qui glissent
// couterait plus de poids a telecharger que toute cette section n'en pese. Les positions sont
// donc posees en style, et c'est une transition CSS qui fait le mouvement.
//
// LES CAPTURES SONT VRAIES
// Ce sont les memes fichiers que la section « تطبيق روّاد » : ce que le visiteur voit ici, il le
// retrouvera a l'identique apres l'installation.

const appScreen = (name: string) => `${import.meta.env.BASE_URL}app-screens/${name}.webp`;

export type DeckScreen = {
  id: string;
  /** Le nom du fichier dans public/app-screens, sans extension. */
  screen: string;
  alt: string;
  /** Vrai si le haut de la capture est clair : l'heure de la barre passe alors en noir. */
  light?: boolean;
  /** La couleur du haut de la capture, que la barre d'etat prolonge. */
  statusColor: string;
};

/** Les cinq ecrans du paquet, dans l'ordre de la maquette. */
export const deckScreens: DeckScreen[] = [
  { id: "tawaf", screen: "tawaf", alt: "عدّاد الطواف التلقائي", statusColor: "#1F1C17" },
  { id: "manasik", screen: "manasik", alt: "خريطة المناسك", statusColor: "#2C251A" },
  { id: "gate", screen: "gate", alt: "احفظ بابك وفندقك", statusColor: "#1E1B16" },
  { id: "assistant", screen: "assistant", alt: "مساعد روّاد", statusColor: "#F7F2EC", light: true },
  { id: "docs", screen: "docs", alt: "صوّر جوازك والباقي علينا", statusColor: "#2C251A" }
];

/** La duree d'une carte au centre. Les indicateurs en CSS utilisent la meme valeur. */
export const deckMs = 3000;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

type Props = {
  phoneWidth: number;
  phoneHeight: number;
  /** De combien les cartes de cote sont ecartees du centre. */
  spread: number;
  screens?: DeckScreen[];
  className?: string;
};

export function PhoneDeck({ phoneWidth, phoneHeight, spread, screens = deckScreens, className }: Props) {
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const [drag, setDrag] = useState(0);
  const dragStart = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const count = screens.length;
  const rotating = !reducedMotion && !paused && count > 1;

  const goTo = useCallback(
    (next: number) => {
      setActive(((next % count) + count) % count);
      setCycle((value) => value + 1);
    },
    [count]
  );

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => goTo(active + 1), deckMs);
    return () => window.clearTimeout(timer);
  }, [rotating, active, cycle, goTo]);

  // L'onglet cache : inutile de faire tourner des cartes que personne ne regarde.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // --- Le glissement au doigt ou a la souris.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStart.current = event.clientX;
    setPaused(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    setDrag(event.clientX - dragStart.current);
  };

  const onPointerUp = () => {
    if (dragStart.current === null) return;
    // Cinquante pixels : en dessous, c'est un doigt qui a glisse en voulant faire defiler la page.
    if (drag > 50) goTo(active - 1);
    else if (drag < -50) goTo(active + 1);
    dragStart.current = null;
    setDrag(0);
    setPaused(false);
  };

  /** L'ecart entre une carte et le centre, ramene au plus court (le paquet est un anneau). */
  const distance = (index: number) => {
    const raw = index - active;
    const half = count / 2;
    if (raw > half) return raw - count;
    if (raw < -half) return raw + count;
    return raw;
  };

  // L'ecart lateral est exprime en proportion de la hauteur du telephone, pas en pixels fixes :
  // quand le paquet se reduit faute de place, les cartes de cote se rapprochent avec lui.
  const placement = (offset: number): CSSProperties => {
    if (offset === 0) {
      return { transform: `translateX(${drag}px)`, opacity: 1, zIndex: 3 };
    }
    if (offset === -1 || offset === 1) {
      return {
        transform: `translateX(calc(var(--rwd-s) * ${offset} + ${drag * 0.3}px)) translateY(7%) scale(0.8) rotate(${offset * 9}deg)`,
        opacity: 0.85,
        zIndex: 2
      };
    }
    // Les autres sont rangees hors de vue, du cote vers lequel elles partent.
    return {
      transform: `translateX(calc(var(--rwd-s) * ${Math.sign(offset) * 1.7})) translateY(13%) scale(0.66) rotate(${Math.sign(offset) * 16}deg)`,
      opacity: 0,
      zIndex: 0
    };
  };

  return (
    <div
      className={`rwd${className ? ` ${className}` : ""}`}
      style={
        {
          // La hauteur demandee, SAUF si le parent en impose une plus petite (--rwd-max-h).
          // La largeur et l'ecart suivent, donc le telephone garde ses proportions a toute taille.
          "--rwd-h": `min(${phoneHeight}px, var(--rwd-max-h, ${phoneHeight}px))`,
          "--rwd-w": `calc(var(--rwd-h) * ${(phoneWidth / phoneHeight).toFixed(4)})`,
          "--rwd-s": `calc(var(--rwd-h) * ${(spread / phoneHeight).toFixed(4)})`
        } as CSSProperties
      }
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="rwd__stage">
        {screens.map((item, index) => {
          const offset = distance(index);
          return (
            <div
              key={item.id}
              className={`rwd__phone${offset === 0 ? " is-front" : ""}${drag !== 0 ? " is-dragging" : ""}`}
              style={placement(offset)}
              aria-hidden={offset !== 0}
            >
              <div
                className={`rwd__screen${item.light ? " is-light" : ""}`}
                style={{ background: item.statusColor }}
              >
                <span className="rwd__status" aria-hidden="true">
                  <span>9:41</span>
                  <i />
                </span>
                <span className="rwd__notch" aria-hidden="true" />
                <img
                  className="rwd__img"
                  src={appScreen(item.screen)}
                  alt={offset === 0 ? item.alt : ""}
                  draggable={false}
                  decoding="async"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rwd__dots" role="tablist" aria-label="شاشات التطبيق">
        {screens.map((item, index) => (
          <button
            type="button"
            key={item.id}
            role="tab"
            aria-selected={index === active}
            aria-label={item.alt}
            className={`rwd__dot${index === active ? " is-active" : ""}`}
            onClick={() => goTo(index)}
          >
            {index === active ? <i key={`${active}-${cycle}`} /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
