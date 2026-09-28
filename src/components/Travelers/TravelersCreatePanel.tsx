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

type NoticeState = {
  type: "danger" | "success" | "info";
  title: string;
  message: string;
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
  const [firstNameArabic, setFirstNameArabic] = useState("");
  const [fatherNameArabic, setFatherNameArabic] = useState("");
  const [grandFatherNameArabic, setGrandFatherNameArabic] = useState("");
  const [familyNameArabic, setFamilyNameArabic] = useState("");
  const [firstNameEnglish, setFirstNameEnglish] = useState("");
  const [fatherNameEnglish, setFatherNameEnglish] = useState("");
  const [grandFatherNameEnglish, setGrandFatherNameEnglish] = useState("");
  const [familyNameEnglish, setFamilyNameEnglish] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState("");
  const [profession, setProfession] = useState("");
  const [birthCountry, setBirthCountry] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [passportExpiryDate, setPassportExpiryDate] = useState("");
  const [residenceNumber, setResidenceNumber] = useState("");
  const [residenceExpiryDate, setResidenceExpiryDate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [passportImage, setPassportImage] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");

  const preview = useMemo(() => passportPreview, [passportPreview]);

  function showNotice(type: NoticeState["type"], title: string, message: string) {
    setNotice({ type, title, message });
    setError(type === "danger" ? message : null);
  }

  async function handleReadPassport() {
    if (!passportImage) {
      showNotice("danger", "تنبيه", "الرجاء اختيار صورة الجواز أو ملف PDF أولا.");
      return;
    }

    setSaving(true);
    setBusyMessage("جاري استخراج بيانات الجواز...");
    setError(null);
    setNotice(null);

    try {
      const result = await readPassportOcr(passportImage);

      setPassportNumber(result.passportNumber ?? "");
      setFullName(result.fullName ?? "");
      setFirstNameArabic(result.firstNameArabic ?? "");
      setFatherNameArabic(result.fatherNameArabic ?? "");
      setGrandFatherNameArabic(result.grandFatherNameArabic ?? "");
      setFamilyNameArabic(result.familyNameArabic ?? "");
      setFirstNameEnglish(result.firstNameEnglish ?? "");
      setFatherNameEnglish(result.fatherNameEnglish ?? "");
      setGrandFatherNameEnglish(result.grandFatherNameEnglish ?? "");
      setFamilyNameEnglish(result.familyNameEnglish ?? "");
      setNationality(result.nationality ?? "");
      setGender(toGenderInputValue(result.gender ?? ""));
      setProfession(result.profession ?? "");
      setBirthCountry(result.birthCountry ?? "");
      setBirthCity(result.birthCity ?? "");
      setMaritalStatus(result.maritalStatus ?? "");
      setDateOfBirth(toDateInputValue(result.dateOfBirth));
      setResidenceNumber(result.residenceNumber ?? "");
      setResidenceExpiryDate(toDateInputValue(result.residenceExpiryDate));
      setPassportExpiryDate(toDateInputValue(result.passportExpiryDate));

      if (result.message) {
        if (result.mode === "demo") {
          showNotice("danger", "تعذر استخراج البيانات", result.message);
        } else {
          showNotice("success", "تم الاستخراج", result.message);
        }
      } else {
        showNotice("success", "تم الاستخراج", "تم استخراج بيانات الجواز بنجاح.");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      showNotice("danger", "تعذر قراءة الجواز", error instanceof Error ? error.message : "تعذر قراءة بيانات الجواز.");
    } finally {
      setSaving(false);
      setBusyMessage("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setBusyMessage("جاري حفظ بيانات المسافر...");
    setError(null);
    setNotice(null);

    try {
      if (!phoneNumber.trim()) {
        showNotice("danger", "بيانات ناقصة", "رقم الهاتف مطلوب.");
        return;
      }

      const formData = new FormData();
      formData.append("PassportNumber", passportNumber);
      formData.append("FullName", fullName);
      formData.append("FirstNameArabic", firstNameArabic);
      formData.append("FatherNameArabic", fatherNameArabic);
      formData.append("GrandFatherNameArabic", grandFatherNameArabic);
      formData.append("FamilyNameArabic", familyNameArabic);
      formData.append("FirstNameEnglish", firstNameEnglish);
      formData.append("FatherNameEnglish", fatherNameEnglish);
      formData.append("GrandFatherNameEnglish", grandFatherNameEnglish);
      formData.append("FamilyNameEnglish", familyNameEnglish);
      formData.append("Nationality", nationality);
      formData.append("Gender", gender);
      formData.append("Profession", profession);
      formData.append("BirthCountry", birthCountry);
      formData.append("BirthCity", birthCity);
      formData.append("MaritalStatus", maritalStatus);
      formData.append("DateOfBirth", dateOfBirth);
      formData.append("PassportExpiryDate", passportExpiryDate);
      formData.append("ResidenceNumber", residenceNumber);
      formData.append("ResidenceExpiryDate", residenceExpiryDate);
      formData.append("PhoneNumber", phoneNumber);
      formData.append("Email", email);
      formData.append("Notes", notes);
      formData.append("PassportImagePath", "");
      formData.append("IsBlocked", "false");

      if (passportImage) {
        formData.append("passportImage", passportImage);
      }

      await createTraveler(formData);
      showNotice("success", "تم الحفظ", "تم حفظ المسافر بنجاح.");
      onNavigate("/travelers");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      showNotice("danger", "تعذر الحفظ", error instanceof Error ? error.message : "تعذر حفظ المسافر.");
    } finally {
      setSaving(false);
      setBusyMessage("");
    }
  }

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        {notice && (
          <div className="rowad-popup-backdrop" role="presentation">
            <div className={`rowad-status-popup ${notice.type}`} role="alert" aria-live="assertive">
              <div className="rowad-status-popup__icon">{notice.type === "success" ? "✓" : "!"}</div>
              <div className="rowad-status-popup__body">
                <strong>{notice.title}</strong>
                <p>{notice.message}</p>
              </div>
              <button type="button" className="rowad-status-popup__close" onClick={() => setNotice(null)} aria-label="إغلاق">
                ×
              </button>
            </div>
          </div>
        )}

        {busyMessage && (
          <div className="rowad-loading-overlay" role="status" aria-live="polite">
            <span className="rowad-loading-spinner" />
            <strong>{busyMessage}</strong>
          </div>
        )}

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

          {error && <div className="rowad-inline-error">{error}</div>}

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
                        accept=".jpg,.jpeg,.png,.pdf"
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

                  <button type="button" className="btn btn-outline-gold w-100 mb-3" onClick={() => void handleReadPassport()} disabled={saving}>
                    {saving && busyMessage.includes("استخراج") ? "جاري الاستخراج..." : "قراءة بيانات الجواز"}
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

                  <div className="traveler-profile-grid">
                    <div className="traveler-form-field">
                      <label className="form-label">الاسم الأول (عربي) *</label>
                      <input className="form-control" value={firstNameArabic} onChange={(event) => setFirstNameArabic(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">اسم الأب (عربي)</label>
                      <input className="form-control" value={fatherNameArabic} onChange={(event) => setFatherNameArabic(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">اسم الجد (عربي)</label>
                      <input className="form-control" value={grandFatherNameArabic} onChange={(event) => setGrandFatherNameArabic(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">اسم العائلة (عربي) *</label>
                      <input className="form-control" value={familyNameArabic} onChange={(event) => setFamilyNameArabic(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">الاسم الأول *</label>
                      <input className="form-control" value={firstNameEnglish} onChange={(event) => setFirstNameEnglish(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">اسم الأب</label>
                      <input className="form-control" value={fatherNameEnglish} onChange={(event) => setFatherNameEnglish(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">اسم الجد</label>
                      <input className="form-control" value={grandFatherNameEnglish} onChange={(event) => setGrandFatherNameEnglish(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">اسم العائلة *</label>
                      <input className="form-control" value={familyNameEnglish} onChange={(event) => setFamilyNameEnglish(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">رقم الجواز</label>
                      <input className="form-control" value={passportNumber} onChange={(event) => setPassportNumber(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">الاسم الكامل</label>
                      <input className="form-control" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">الجنسية</label>
                      <input className="form-control" value={nationality} onChange={(event) => setNationality(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">الجنس</label>
                      <select className="form-select" value={gender} onChange={(event) => setGender(event.target.value)}>
                        <option value="">اختر الجنس</option>
                        <option value="M">ذكر</option>
                        <option value="F">أنثى</option>
                      </select>
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">المهنة *</label>
                      <input className="form-control" value={profession} onChange={(event) => setProfession(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">دولة الميلاد *</label>
                      <input className="form-control" value={birthCountry} onChange={(event) => setBirthCountry(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">مدينة الميلاد *</label>
                      <input className="form-control" value={birthCity} onChange={(event) => setBirthCity(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">الحالة الاجتماعية *</label>
                      <select className="form-select" value={maritalStatus} onChange={(event) => setMaritalStatus(event.target.value)}>
                        <option value="">اختر الحالة</option>
                        <option value="متزوج">متزوج</option>
                        <option value="أعزب">أعزب</option>
                        <option value="مطلق">مطلق</option>
                        <option value="أرمل">أرمل</option>
                      </select>
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">تاريخ الميلاد</label>
                      <input type="date" className="form-control" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">تاريخ انتهاء الجواز</label>
                      <input
                        type="date"
                        className="form-control"
                        value={passportExpiryDate}
                        onChange={(event) => setPassportExpiryDate(event.target.value)}
                      />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">رقم الإقامة *</label>
                      <input className="form-control" value={residenceNumber} onChange={(event) => setResidenceNumber(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">تاريخ انتهاء الإقامة *</label>
                      <input type="date" className="form-control" value={residenceExpiryDate} onChange={(event) => setResidenceExpiryDate(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">رقم الهاتف</label>
                      <input className="form-control" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
                    </div>

                    <div className="traveler-form-field">
                      <label className="form-label">الإيميل</label>
                      <input className="form-control" value={email} onChange={(event) => setEmail(event.target.value)} />
                    </div>

                    <div className="traveler-form-field traveler-form-field-wide">
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
                    {saving && busyMessage.includes("حفظ") ? "جاري الحفظ..." : "حفظ المسافر"}
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
