import type { FormEvent } from "react";

type LoginPanelProps = {
  email: string;
  password: string;
  rememberMe: boolean;
  loading: boolean;
  error: string | null;
  authError: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginPanel({
  email,
  password,
  rememberMe,
  loading,
  error,
  authError,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onSubmit
}: LoginPanelProps) {
  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="brand">
          <div className="brand-badge">R</div>
          <div>
            <div className="brand-title">Rowad Umrah</div>
            <div className="brand-subtitle">ASP.NET Core + React</div>
          </div>
        </div>

        <h1>Login to the new React front</h1>
        <p>
          The backend remains ASP.NET Core. React only handles the UI and calls
          the API routes.
        </p>

        <div className="auth-points">
          <div>
            <span>Backend API</span>
            <strong>/api/auth</strong>
          </div>
          <div>
            <span>Data API</span>
            <strong>/api/travelers</strong>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <span className="eyebrow">Authentication</span>
        <h2>Sign in</h2>

        {authError && <div className="state-box error">{authError}</div>}
        {error && <div className="state-box error">{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="admin@rowad.local"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Admin@12345"
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => onRememberMeChange(event.target.checked)}
            />
            Remember me
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Test account: admin@rowad.local / Admin@12345</p>
        </div>
      </section>
    </div>
  );
}
