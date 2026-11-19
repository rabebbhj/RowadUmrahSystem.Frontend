// Quand a-t-on le droit de montrer le rappel de l'application ?
//
// POURQUOI CETTE LOGIQUE EST SEPAREE ET TESTEE
// Un popup est la chose la plus facile a rendre insupportable. S'il revient a chaque visite, s'il
// s'ouvre pendant que quelqu'un remplit son dossier de reservation, ou s'il reapparait apres
// avoir ete ferme trois fois, le visiteur ne se dit pas « quel popup penible » : il se dit « ce
// site est penible » et il s'en va. Les regles vivent donc ici, en clair, et tests/app-promo-
// rules-checks.cjs les verifie une par une.

export type PromoMemory = {
  /** Quand le popup a ete montre pour la derniere fois (millisecondes). */
  lastShownAt: number | null;
  /** Combien de fois le visiteur l'a ferme. */
  closeCount: number;
  /** A-t-il deja clique vers un magasin ? Alors il n'a plus rien a y apprendre. */
  storeClicked: boolean;
};

export const emptyMemory: PromoMemory = { lastShownAt: null, closeCount: 0, storeClicked: false };

export const memoryKey = "rowad_app_modal_last";

/** Combien de jours on laisse le visiteur tranquille entre deux apparitions. */
export const cooldownDays = 3;
/** Au-dela, on considere que la reponse est non, definitivement. */
export const maxCloses = 3;
/** Secondes passees sur le site avant que le rappel soit envisage. */
export const dwellSeconds = 25;
/** Part de la page parcourue qui vaut aussi declenchement. */
export const scrollShare = 0.5;

export type Blocker =
  | "ok"
  | "ecran-trop-petit"
  | "reservation-en-cours"
  | "deja-interesse"
  | "trop-de-refus"
  | "trop-recent";

/**
 * Le droit d'apparaitre. Rend la RAISON du refus et pas seulement un non : sans cela, on ne
 * comprend plus pourquoi le popup ne se montre pas, et on finit par le forcer.
 */
export function modalBlocker({
  memory,
  nowMs,
  isDesktop,
  bookingOpen
}: {
  memory: PromoMemory;
  nowMs: number;
  isDesktop: boolean;
  bookingOpen: boolean;
}): Blocker {
  // Sur un telephone, un popup qui couvre tout l'ecran est une porte fermee au visage.
  if (!isDesktop) return "ecran-trop-petit";
  // Interrompre quelqu'un qui saisit les donnees de son passeport, c'est lui faire perdre son
  // travail. Aucune promotion ne vaut ca.
  if (bookingOpen) return "reservation-en-cours";
  if (memory.storeClicked) return "deja-interesse";
  if (memory.closeCount >= maxCloses) return "trop-de-refus";
  if (memory.lastShownAt !== null && nowMs - memory.lastShownAt < cooldownDays * 24 * 60 * 60 * 1000) {
    return "trop-recent";
  }
  return "ok";
}

/** Le moment est-il venu ? Un seul des trois signaux suffit. */
export function shouldTrigger({
  secondsOnSite,
  scrollRatio,
  exitIntent
}: {
  secondsOnSite: number;
  scrollRatio: number;
  exitIntent: boolean;
}): boolean {
  if (exitIntent) return true;
  if (secondsOnSite >= dwellSeconds) return true;
  return scrollRatio >= scrollShare;
}

// --- La memoire, cote navigateur -------------------------------------------
//
// Tout passe par try/catch : en navigation privee, ou avec le stockage bloque, lire ou ecrire
// leve une exception. Le popup doit alors se comporter comme pour un nouveau visiteur, pas
// faire tomber la page.

export function readMemory(): PromoMemory {
  try {
    const raw = window.localStorage.getItem(memoryKey);
    if (!raw) return emptyMemory;
    const parsed = JSON.parse(raw) as Partial<PromoMemory>;
    return {
      lastShownAt: typeof parsed.lastShownAt === "number" ? parsed.lastShownAt : null,
      closeCount: typeof parsed.closeCount === "number" ? parsed.closeCount : 0,
      storeClicked: parsed.storeClicked === true
    };
  } catch {
    return emptyMemory;
  }
}

export function writeMemory(memory: PromoMemory): void {
  try {
    window.localStorage.setItem(memoryKey, JSON.stringify(memory));
  } catch {
    /* stockage refuse : le visiteur reverra le rappel, ce n'est pas grave. */
  }
}

/** Mesure, seulement si la page a deja un outil de mesure. On n'en installe pas un au passage. */
export function track(event: string, detail?: Record<string, string>): void {
  const layer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(layer)) layer.push({ event, ...detail });
}
