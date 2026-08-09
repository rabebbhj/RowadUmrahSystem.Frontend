import { useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { createUser } from "../../api/users";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type UsersCreatePanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function UsersCreatePanel({ user, activePath, onNavigate, onLogout }: UsersCreatePanelProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await createUser({
        fullName,
        email,
        phoneNumber,
        password
      });

      onNavigate("/users");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">إضافة موظف جديد</h1>
              <p className="text-muted mb-0">إنشاء حساب جديد للموظف ومنحه الصلاحيات المناسبة لاحقاً.</p>
            </div>

            <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/users")}>
              رجوع
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4 mb-4">
                <div className="page-card h-100">
                  <h4 className="section-title">معلومات الحساب</h4>
                  <div className="alert alert-info mb-0">
                    بعد إنشاء الموظف يمكنك الدخول إلى صفحة الصلاحيات وتحديد ما يمكنه الوصول إليه داخل النظام.
                  </div>
                </div>
              </div>

              <div className="col-lg-8 mb-4">
                <div className="page-card h-100">
                  <h4 className="section-title">بيانات الموظف</h4>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">اسم الموظف</label>
                      <input
                        name="fullName"
                        className="form-control"
                        placeholder="الاسم الكامل"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">البريد الإلكتروني / اسم المستخدم</label>
                      <input
                        name="email"
                        type="email"
                        className="form-control"
                        placeholder="employee@rowad.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم الهاتف</label>
                      <input
                        name="phoneNumber"
                        className="form-control"
                        placeholder="+965 XXXXXXXX"
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">كلمة المرور</label>
                      <input
                        name="password"
                        type="password"
                        className="form-control"
                        placeholder="********"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-card">
              <div className="d-flex flex-wrap justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">إنشاء الحساب</h5>
                  <small className="text-muted">سيتم إنشاء المستخدم وتفعيله مباشرة.</small>
                </div>

                <div className="action-bar mb-0">
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    إنشاء الموظف
                  </button>

                  <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/users")}>
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
