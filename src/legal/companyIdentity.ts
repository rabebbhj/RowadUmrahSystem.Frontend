// Identite legale de روّاد للعمرة, cote site web — article 114 des Conditions generales.
//
// COPIE EXACTE des valeurs de RowadUmrahSystem.Mobile/src/data/companyIdentity.js. Les deux
// produits doivent publier les memes donnees : un controle automatique (tests/legal-document-
// checks.cjs) echoue si elles divergent. Pour corriger une valeur, corriger LES DEUX fichiers.
//
// REGLE ABSOLUE : ne jamais inventer ces valeurs. Un faux numero de registre ou de licence est
// une infraction, pas une approximation. Un champ vide reste vide, et l'ecran masque la ligne
// au lieu d'afficher « a completer » au pelerin.

export type IdentityKey =
  | "tradeName" | "legalName" | "commercialRegister" | "licenceNumber" | "licenceAuthority"
  | "licensedActivities" | "registeredAddress"
  | "email" | "phone" | "whatsapp" | "website" | "app"
  | "country" | "governingLaw" | "jurisdiction";

export const companyIdentity: Record<IdentityKey, string> = {
  tradeName: "روّاد للعمرة",
  legalName: "",
  commercialRegister: "",
  licenceNumber: "",
  licenceAuthority: "",
  licensedActivities: "",
  registeredAddress: "الكويت - الفروانية - شارع حبيب مناور - مجمع العربيد جاليري - مكتب 5",
  email: "info@ruwadomra.com",
  phone: "+965 22283558 / +965 22283589",
  whatsapp: "+965 55583203 / +965 65002927",
  website: "https://ruwadomra.com",
  app: "Rowad Umrah",
  country: "دولة الكويت",
  governingLaw: "قوانين دولة الكويت",
  jurisdiction: "المحاكم الكويتية المختصة"
};

export const identityLabels: Record<IdentityKey, string> = {
  tradeName: "الاسم التجاري",
  legalName: "الاسم القانوني",
  commercialRegister: "السجل التجاري",
  licenceNumber: "رقم الترخيص",
  licenceAuthority: "الجهة المانحة للترخيص",
  licensedActivities: "الأنشطة المرخّصة",
  registeredAddress: "العنوان المسجّل",
  email: "البريد الإلكتروني",
  phone: "الهاتف",
  whatsapp: "واتساب خدمة العملاء",
  website: "الموقع الإلكتروني",
  app: "التطبيق",
  country: "الدولة",
  governingLaw: "القانون الواجب التطبيق",
  jurisdiction: "جهة الاختصاص القضائي"
};

/** L'ordre d'affichage : l'identite, puis les canaux, puis le cadre juridique. */
export const identityOrder: IdentityKey[] = [
  "tradeName", "legalName", "commercialRegister", "licenceNumber", "licenceAuthority",
  "licensedActivities", "registeredAddress",
  "email", "phone", "whatsapp", "website", "app",
  "country", "governingLaw", "jurisdiction"
];

/** Les lignes REELLEMENT publiables : un champ vide disparait au lieu d'afficher un trou. */
export function publishedIdentity(source = companyIdentity) {
  return identityOrder
    .filter((key) => (source[key] ?? "").trim().length > 0)
    .map((key) => ({ key, label: identityLabels[key], value: source[key].trim() }));
}
