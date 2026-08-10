import { BadgeIcon, MedalIcon, StarIcon, UsersIcon } from "./landingShared";

export function StatisticsStrip() {
  const stats = [
    { icon: <BadgeIcon className="icon icon-md" />, value: "10+", title: "سنوات خبرة", subtitle: "في تنظيم رحلات العمرة" },
    { icon: <UsersIcon className="icon icon-md" />, value: "25K+", title: "معتمر سنوياً", subtitle: "" },
    { icon: <MedalIcon className="icon icon-md" />, value: "500+", title: "شريك نجاح", subtitle: "حول العالم" },
    { icon: <StarIcon className="icon icon-md" />, value: "98%", title: "رضا العملاء", subtitle: "بفضل ثقة عملائنا" }
  ];

  return (
    <section className="stats-shell">
      <div className="container stats-strip">
        <div className="stats-strip__image">
          <img src="/landingpage/paysage.png" alt="" />
        </div>

        {stats.map((stat) => (
          <article key={stat.value} className="stats-item">
            <span className="stats-item__icon">{stat.icon}</span>
            <div className="stats-item__content">
              <strong>{stat.value}</strong>
              <span>{stat.title}</span>
              {stat.subtitle ? <small>{stat.subtitle}</small> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
