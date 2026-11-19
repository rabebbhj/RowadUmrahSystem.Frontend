import termsSource from "./terms-ar-v01.json";
import { publishedIdentity } from "./companyIdentity";

// Les documents juridiques de روّاد للعمرة, cote site web.
//
// POURQUOI CE MODULE EXISTE
// Sur le site, les deux cases « j'accepte » etaient du texte simple, sans lien, et aucune page
// juridique n'existait : le client acceptait un texte qu'il ne pouvait pas lire. L'article 9 des
// Conditions generales exige l'inverse — les conditions doivent etre mises a disposition AVANT
// la reservation, et le client doit pouvoir les consulter ou les sauvegarder.
//
// terms-ar-v01.json est la COPIE EXACTE du fichier de l'application mobile. Les deux produits
// doivent montrer le meme texte, mot pour mot : un controle automatique (tests/legal-document-
// checks.cjs) echoue si les deux copies divergent. Pour mettre a jour le texte, remplacer les
// DEUX fichiers.

type Article = { number: number; title: string; body: string };
type Chapter = { number: number; arabicNumber: string; title: string; articles: Article[] };
type Appendix = { letter: string; title: string; body: string };

export type LegalMeta = {
  id: string; title: string; subtitle: string; company: string; country: string;
  version: string; updatedAt: string; updatedAtHijri: string; language: string;
  source: string; articleCount: number; contentHash: string;
};

export type LegalItem = { key: string; label: string; title: string; body: string };
export type LegalSection = { key: string; kicker: string; heading: string; items: LegalItem[] };
export type LegalDocument = {
  id: LegalDocumentId; title: string; subtitle: string; intro: string;
  meta: LegalMeta; sections: LegalSection[];
};

export type LegalDocumentId = "terms" | "cancellation" | "privacy" | "company";

const terms = termsSource as unknown as {
  meta: LegalMeta; preamble: string; chapters: Chapter[]; appendices: Appendix[];
};

const chaptersBetween = (first: number, last: number) =>
  terms.chapters.filter((chapter) =>
    chapter.articles.some((article) => article.number >= first && article.number <= last)
  );

const appendicesByLetter = (letters: string[]) =>
  letters
    .map((letter) => terms.appendices.find((appendix) => appendix.letter === letter))
    .filter((appendix): appendix is Appendix => Boolean(appendix));

const chapterSection = (chapter: Chapter): LegalSection => ({
  key: `bab-${chapter.number}`,
  kicker: `الباب ${chapter.arabicNumber}`,
  heading: chapter.title,
  items: chapter.articles.map((article) => ({
    key: `art-${article.number}`,
    label: `المادة (${article.number})`,
    title: article.title,
    body: article.body
  }))
});

const appendixSection = (appendix: Appendix): LegalSection => ({
  key: `mulhaq-${appendix.letter}`,
  kicker: `الملحق (${appendix.letter})`,
  heading: appendix.title,
  items: [{ key: `mulhaq-${appendix.letter}-body`, label: "", title: "", body: appendix.body }]
});

const views: Record<LegalDocumentId, { title: string; subtitle: string; intro?: string; build: () => LegalSection[] }> = {
  terms: {
    title: "الشروط والأحكام",
    subtitle: terms.meta.subtitle,
    intro: terms.preamble,
    build: () => [...terms.chapters.map(chapterSection), ...terms.appendices.map(appendixSection)]
  },
  cancellation: {
    title: "شروط التعديل والإلغاء والاسترداد",
    subtitle: "ما يُطبَّق على حجزك عند التعديل أو الإلغاء",
    // Chapitre 11 (articles 69 a 79) + annexe (ب), le calcul par composant, + annexe (ج),
    // l'avertissement a lire juste avant le paiement.
    build: () => [...chaptersBetween(69, 79).map(chapterSection), ...appendicesByLetter(["ب", "ج"]).map(appendixSection)]
  },
  privacy: {
    title: "الخصوصية وحماية البيانات",
    subtitle: "كيف تُعالَج بياناتك الشخصية",
    build: () => chaptersBetween(90, 96).map(chapterSection)
  },
  // Article 114 : les donnees legales et de licence font partie des informations que le client
  // doit pouvoir consulter. Un champ que l'agence n'a pas encore fourni ne s'affiche pas.
  company: {
    title: "بيانات الشركة",
    subtitle: "البيانات القانونية والترخيصية",
    build: () => [
      ...chaptersBetween(114, 114).map(chapterSection),
      {
        key: "identity",
        kicker: "المادة (114)",
        heading: "بيانات روّاد للعمرة",
        items: publishedIdentity().map((row) => ({
          key: row.key, label: row.label, title: "", body: row.value
        }))
      }
    ]
  }
};

/** Le document demande, pret a afficher. */
export function getLegalDocument(id: LegalDocumentId): LegalDocument {
  const view = views[id] ?? views.terms;
  return {
    id,
    title: view.title,
    subtitle: view.subtitle,
    intro: view.intro ?? "",
    meta: terms.meta,
    sections: view.build()
  };
}

/**
 * La declaration imposee par l'article 116, mot pour mot. Identique a celle de l'application
 * mobile (RowadUmrahSystem.Mobile/src/legal/index.js) : un client doit accepter la meme chose
 * quel que soit l'endroit ou il reserve.
 */
export const acceptanceDeclaration =
  "أقرّ بأنني قرأت ووافقت على الشروط والأحكام وسياسة الخصوصية وشروط التعديل والإلغاء والاسترداد " +
  "المطبّقة على حجزي، وأنني راجعت تفاصيل الحجز وبيانات المسافرين والخدمات والأسعار المبيّنة قبل " +
  "إتمام عملية الدفع.";

/** Ce que le client doit transmettre au serveur en cochant : quelle version il avait sous les yeux. */
export function consentRecord() {
  return {
    documentId: terms.meta.id,
    version: terms.meta.version,
    updatedAt: terms.meta.updatedAt,
    language: terms.meta.language,
    contentHash: terms.meta.contentHash,
    declaration: acceptanceDeclaration
  };
}

/** 2026-10-05 devient 05/10/2026. */
export function formatLegalDate(iso: string) {
  const parts = String(iso ?? "").split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(iso ?? "");
}
