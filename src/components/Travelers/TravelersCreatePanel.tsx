import { useMemo, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import { createTraveler, readPassportOcr } from "../../api/travelers";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type TravelersCreatePanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function toGenderInputValue(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "m" || normalized === "male" || normalized === "ذكر") {
    return "M";
  }

  if (normalized === "f" || normalized === "female" || normalized === "أنثى") {
    return "F";
  }

  return value;
}

export function TravelersCreatePanel({ user, activePath, onNavigate, onLogout }: TravelersCreatePanelProps) {
  const [passportNumber, setPassportNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [passportExpiryDate, setPassportExpiryDate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [passportImage, setPassportImage] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => passportPreview, [passportPreview]);

  async function handleReadPassport() {
    if (!passportImage) {
      setError("الرجاء اختيار صورة الجواز أولا.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await readPassportOcr(passportImage);

      setPassportNumber(result.passportNumber ?? "");
      setFullName(result.fullName ?? "");
      setNationality(result.nationality ?? "");
      setGender(toGenderInputValue(result.gender ?? ""));
      setDateOfBirth(toDateInputValue(result.dateOfBirth));
      setPassportExpiryDate(toDateInputValue(result.passportExpiryDate));

      if (result.message) {
        setError(result.mode === "demo" ? result.message : null);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "تعذر قراءة بيانات الجواز.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!phoneNumber.trim()) {
        setError("رقم الهاتف مطلوب.");
        return;
      }

      const formData = new FormData();
      formData.append("PassportNumber", passportNumber);
      formData.append("FullName", fullName);
      formData.append("Nationality", nationality);
      formData.append("Gender", gender);
      formData.append("DateOfBirth", dateOfBirth);
      formData.append("PassportExpiryDate", passportExpiryDate);
      formData.append("PhoneNumber", phoneNumber);
      formData.append("Email", email);
      formData.append("Notes", notes);
      formData.append("PassportImagePath", "");
      formData.append("IsBlocked", "false");

      if (passportImage) {
        formData.append("passportImage", passportImage);
      }

      const created = await createTraveler(formData);
      onNavigate(`/travelers/${created.id}`);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "Failed to create traveler");
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
              <h1 className="page-title mb-1">تسجيل مسافر جديد</h1>
              <p className="text-muted mb-0">ارفع صورة الجواز، اقرأ البيانات تلقائياً، ثم راجع وعدّل قبل الحفظ.</p>
            </div>

            <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/")}>
              رجوع
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="row">
              <div className="col-lg-4 mb-4">
                <div className="page-card h-100">
                  <h4 className="section-title">صورة الجواز</h4>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="passportImageInput">
                      رفع صورة الجواز
                    </label>
                    <div className="rowad-file-picker">
                      <input
                        id="passportImageInput"
                        type="file"
                        name="passportImage"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setPassportImage(file);
                          if (passportPreview) {
                            URL.revokeObjectURL(passportPreview);
                          }
                          setPassportPreview(file ? URL.createObjectURL(file) : null);
                        }}
                      />
                      <label htmlFor="passportImageInput" className="btn btn-outline-gold">
                        اختيار صورة
                      </label>
                      <span>{passportImage ? passportImage.name : "لم يتم اختيار ملف"}</span>
                    </div>
                  </div>

                  <button type="button" className="btn btn-outline-gold w-100 mb-3" onClick={() => void handleReadPassport()}>
                    قراءة بيانات الجواز
                  </button>

                  {preview ? (
                    <img src={preview} className="img-fluid rounded border" alt="صورة الجواز" />
                  ) : (
                    <div className="alert alert-info mb-0">ارفع صورة الجواز ليتم عرضها هنا بعد القراءة.</div>
                  )}
                </div>
              </div>

              <div className="col-lg-8 mb-4">
                <div className="page-card h-100">
                  <h4 className="section-title">بيانات المسافر</h4>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم الجواز</label>
                      <input className="form-control" value={passportNumber} onChange={(event) => setPassportNumber(event.target.value)} />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">الاسم الكامل</label>
                      <input className="form-control" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">الجنسية</label>
                      <input className="form-control" value={nationality} onChange={(event) => setNationality(event.target.value)} />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">الجنس</label>
                      <select className="form-select" value={gender} onChange={(event) => setGender(event.target.value)}>
                        <option value="">اختر الجنس</option>
                        <option value="M">ذكر</option>
                        <option value="F">أنثى</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">تاريخ الميلاد</label>
                      <input type="date" className="form-control" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">تاريخ انتهاء الجواز</label>
                      <input
                        type="date"
                        className="form-control"
                        value={passportExpiryDate}
                        onChange={(event) => setPassportExpiryDate(event.target.value)}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم الهاتف</label>
                      <input className="form-control" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">الإيميل</label>
                      <input className="form-control" value={email} onChange={(event) => setEmail(event.target.value)} />
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">ملاحظات</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        placeholder="أي ملاحظات إضافية عن المسافر..."
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-card">
              <div className="d-flex flex-wrap justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">تأكيد الحفظ</h5>
                  <small className="text-muted">تأكد من مراجعة بيانات OCR قبل حفظ المسافر في قاعدة البيانات.</small>
                </div>

                <div className="action-bar mb-0">
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    حفظ المسافر
                  </button>

                  <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/")}>
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
