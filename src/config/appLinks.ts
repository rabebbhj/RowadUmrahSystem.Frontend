// Les liens de telechargement de l'application mobile.
//
// Ils sont VIDES tant que l'application n'est pas publiee sur les magasins. Tout ce qui en
// depend (les boutons App Store / Google Play, le bouton « حمّل مجاناً » du bandeau) disparait
// de la page au lieu d'afficher un lien qui ne menerait nulle part : un bouton de
// telechargement qui ouvre une page d'erreur est pire que pas de bouton.
//
// Pour les activer, il suffit de coller les adresses ici : la page les reprend aussitot.
//
//   appStoreUrl   = "https://apps.apple.com/app/id0000000000";
//   playStoreUrl  = "https://play.google.com/store/apps/details?id=com.rowad.umrah";
//   appDownloadUrl = "https://ruwadomra.com/app";   // lien unique qui redirige selon l'appareil

export const appStoreUrl = "";
export const playStoreUrl = "";
/**
 * Lien unique qui redirige vers le bon magasin selon l'appareil. Sert aussi au QR code.
 *
 * En attendant la publication de l'application, il pointe vers le site de l'agence : le QR
 * fonctionne donc des aujourd'hui, et celui qui le scanne arrive chez Ruwad. Le jour ou la page
 * de telechargement existera, il suffit de changer cette ligne — le QR se regenere tout seul.
 */
export const appDownloadUrl = "https://ruwadomra.com";

/** Ajoute la provenance au lien, pour savoir d'ou vient un telechargement. */
export function withUtm(url: string, medium: string): string {
  if (!url) return "";
  // Une adresse sans chemin recoit sa barre oblique : « site.com?x=1 » est accepte par les
  // navigateurs mais deroute certains serveurs, « site.com/?x=1 » ne deroute personne.
  const base = /^https?:\/\/[^/?#]+$/.test(url) ? `${url}/` : url;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}utm_source=website&utm_medium=${encodeURIComponent(medium)}`;
}

export type StoreLink = { id: "ios" | "android"; label: string; store: string; href: string };

/**
 * Les deux magasins, dans l'ordre d'affichage. `href` est vide tant que l'adresse n'est pas
 * renseignee : la carte garde alors sa place sur la page, mais n'est pas un lien.
 */
export function storeLinks(medium: string): StoreLink[] {
  return [
    { id: "ios" as const, label: "حمّله من", store: "App Store", href: appStoreUrl },
    { id: "android" as const, label: "احصل عليه من", store: "Google Play", href: playStoreUrl }
  ].map((item) => ({ ...item, href: withUtm(item.href, medium) }));
}

/** Le lien du bouton « telecharger » : le lien unique, sinon le seul magasin renseigne. */
export function downloadHref(medium: string): string {
  if (appDownloadUrl) return withUtm(appDownloadUrl, medium);
  const configured = storeLinks(medium).filter((item) => item.href !== "");
  return configured.length === 1 ? configured[0].href : "";
}
