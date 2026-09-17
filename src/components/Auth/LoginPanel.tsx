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
          <div className="brand-badge">ر</div>
          <div>
            <div className="brand-title">رواد العمرة</div>
            <div className="brand-subtitle">نظام الإدارة الذكي</div>
          </div>
        </div>

        <h1>تسجيل الدخول</h1>
        <p>
          أدخل بيانات حسابك للوصول إلى لوحة إدارة رواد العمرة.
        </p>

        <div className="auth-points">
          <div>
            <span>واجهة النظام</span>
            <strong>/api/auth</strong>
          </div>
          <div>
            <span>مسار البيانات</span>
            <strong>/api/travelers</strong>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <span className="eyebrow">المصادقة</span>
        <h2>دخول المستخدم</h2>

        {authError && <div className="state-box error">{authError}</div>}
        {error && <div className="state-box error">{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            البريد الإلكتروني
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="admin@rowad.local"
            />
          </label>

          <label>
            كلمة المرور
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
            تذكرني
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="auth-footer">
          <p>حساب التجربة: admin@rowad.local / Admin@12345</p>
        </div>
      </section>
    </div>
  );
}
