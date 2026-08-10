import { BadgeIcon, BuildingIcon, BusIcon, HeadsetIcon, ShieldIcon, TagIcon, UsersIcon } from "./landingShared";

export function BenefitsStrip() {
  const benefits = [
    { icon: <ShieldIcon className="icon icon-md" />, title: "خبرة موثوقة", subtitle: "سنوات من النجاح" },
    { icon: <HeadsetIcon className="icon icon-md" />, title: "دعم على مدار الساعة", subtitle: "خدمة عملاء 24/7" },
    { icon: <TagIcon className="icon icon-md" />, title: "أسعار تنافسية", subtitle: "أفضل قيمة مقابل سعر" },
    { icon: <BadgeIcon className="icon icon-md" />, title: "مشرفون محترفون", subtitle: "إصدار خلال 24 ساعة" },
    { icon: <BuildingIcon className="icon icon-md" />, title: "فنادق مختارة", subtitle: "قريبة من الحرم" },
    { icon: <BusIcon className="icon icon-md" />, title: "تنقل ومواصلات", subtitle: "حديثة ومريحة" },
    { icon: <UsersIcon className="icon icon-md" />, title: "مرافقة كاملة", subtitle: "طوال الرحلة" },
    { icon: <HeadsetIcon className="icon icon-md" />, title: "دعم على مدار الساعة", subtitle: "خدمة عملاء 24/7" }
  ];

  return (
    <section className="benefits-shell">
      <div className="container benefits-strip">
        {benefits.map((benefit) => (
          <article key={benefit.title + benefit.subtitle} className="benefit-item">
            <span className="benefit-item__icon">{benefit.icon}</span>
            <strong>{benefit.title}</strong>
            <span>{benefit.subtitle}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
