import type { AuthUser } from "../../api/auth";
import { SignedInSidebar } from "./SignedInSidebar";

type AdminPlaceholderPanelProps = {
  user: AuthUser;
  activePath: string;
  title: string;
  eyebrow: string;
  description: string;
  primaryActionLabel?: string;
  primaryActionPath?: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function AdminPlaceholderPanel({
  user,
  activePath,
  title,
  eyebrow,
  description,
  primaryActionLabel,
  primaryActionPath,
  onNavigate,
  onLogout
}: AdminPlaceholderPanelProps) {
  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <header className="hero">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          {primaryActionLabel && primaryActionPath ? (
            <button type="button" className="btn btn-gold" onClick={() => onNavigate(primaryActionPath)}>
              {primaryActionLabel}
            </button>
          ) : null}
        </header>
      </main>
    </div>
  );
}
