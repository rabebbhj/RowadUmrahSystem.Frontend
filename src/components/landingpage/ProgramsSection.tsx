import { ArrowRightIcon, LANDING_PROGRAMS, SectionHeading } from "./landingShared";

function ProgramCard({
  badge,
  title,
  details,
  price,
  priceSuffix,
  image,
  onChoose
}: {
  badge: string;
  title: string;
  details: string[];
  price: string;
  priceSuffix?: string;
  image: string;
  onChoose?: () => void;
}) {
  return (
    <article className="program-card">
      <div className="program-card__content">
        <span className="program-card__badge">{badge}</span>
        <div className="program-card__details">
          {details.map((item) => (
            <div key={item} className="program-card__detail">
              {item}
            </div>
          ))}
        </div>
        <div className="program-card__bottom">
          <div>
            <strong className="program-card__price">{price}</strong>
            <span className="program-card__suffix">{priceSuffix || "للشخص د.ك"}</span>
          </div>
          <button className="btn btn-gold program-card__cta" type="button" onClick={onChoose}>
            <ArrowRightIcon className="icon icon-sm" />
            <span>{title}</span>
          </button>
        </div>
      </div>

      <div className="program-card__media" style={{ backgroundImage: `url('${image}')` }} />
    </article>
  );
}

export function ProgramsSection({ onChooseProgram }: { onChooseProgram: (programIndex: number) => void }) {
  return (
    <section className="programs-shell" id="programs">
      <div className="container">
        <SectionHeading title="اختر البرنامج المناسب لك" />
        <div className="programs-grid">
          {LANDING_PROGRAMS.map((program, index) => (
            <ProgramCard
              key={program.id}
              badge={program.badge}
              title={program.title}
              details={program.details}
              price={program.price}
              image={program.image}
              onChoose={() => onChooseProgram(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
