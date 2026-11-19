import { useEffect, useMemo, useState } from "react";
import { formatLegalDate, getLegalDocument, type LegalDocumentId } from "../../legal";

// La fenetre qui affiche les documents juridiques sur le site.
//
// Pourquoi une fenetre et non une page : le client clique sur « الشروط والأحكام » au moment ou
// il est en train de payer. L'envoyer sur une autre page lui ferait perdre sa reservation en
// cours ; la fenetre se ferme et il reprend ou il en etait.
//
// Les chapitres sont replies par defaut : le document fait 116 articles, et une liste de 18
// titres se parcourt alors qu'un mur de texte se referme.

type Props = { documentId: LegalDocumentId | null; onClose: () => void };

export function LegalDialog({ documentId, onClose }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const document = useMemo(() => (documentId ? getLegalDocument(documentId) : null), [documentId]);

  // Echap ferme, comme toute fenetre modale ; sans cela on piege l'utilisateur au clavier.
  useEffect(() => {
    if (!documentId) return undefined;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [documentId, onClose]);

  // Chaque ouverture repart du sommaire replie.
  useEffect(() => { setOpenKey(null); }, [documentId]);

  if (!document) return null;
  const meta = document.meta;

  return (
    <div className="gv-legal-overlay" role="dialog" aria-modal="true" aria-label={document.title} onClick={onClose}>
      <div className="gv-legal-dialog" dir="rtl" onClick={(event) => event.stopPropagation()}>
        <header className="gv-legal-head">
          <button type="button" className="gv-legal-close" onClick={onClose} aria-label="إغلاق">×</button>
          <div>
            <h2>{document.title}</h2>
            <p>{document.subtitle}</p>
            <span className="gv-legal-version">
              {meta.company} · {meta.country} · الإصدار {meta.version} · آخر تحديث {formatLegalDate(meta.updatedAt)}
            </span>
          </div>
        </header>

        <div className="gv-legal-body">
          {document.intro ? <p className="gv-legal-intro">{document.intro}</p> : null}

          {document.sections.map((section) => {
            const open = openKey === section.key;
            return (
              <section key={section.key} className="gv-legal-section">
                <button
                  type="button"
                  className="gv-legal-section-head"
                  aria-expanded={open}
                  onClick={() => setOpenKey(open ? null : section.key)}
                >
                  <span className="gv-legal-chevron">{open ? "−" : "+"}</span>
                  <span>
                    <em>{section.kicker}</em>
                    <strong>{section.heading}</strong>
                  </span>
                </button>
                {open ? (
                  <div className="gv-legal-section-body">
                    {section.items.map((item) => (
                      <article key={item.key} className="gv-legal-article">
                        {item.label ? <em>{item.label}</em> : null}
                        {item.title ? <h3>{item.title}</h3> : null}
                        <p>{item.body}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
