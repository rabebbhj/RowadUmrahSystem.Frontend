import type { ReactNode } from "react";

type AdminWelcomeBannerProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function AdminWelcomeBanner({ eyebrow, title, description, action }: AdminWelcomeBannerProps) {
  return (
    <section className="admin-welcome-banner">
      <div className="admin-welcome-banner__action">{action}</div>
      <div className="admin-welcome-banner__copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}
