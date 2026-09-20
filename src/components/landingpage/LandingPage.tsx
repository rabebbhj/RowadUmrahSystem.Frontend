import { useEffect, useMemo, useState } from "react";
import { createTraveler, readCivilIdOcr, readPassportOcr } from "../../api/travelers";
import {
  ArrowRightIcon,
  BusIcon,
  CalendarIcon,
  ChatIcon,
  DocumentIcon,
  HeadsetIcon,
  LocationIcon,
  MailIcon,
  MosqueIcon,
  PhoneIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  UsersIcon
} from "./landingShared";

const packages = [
  {
    badge: "الرحلات",
    type: "travel",
    image: "/landingpage/avion.png",
    price: "45",
    imageText: ["من كل مكان", "إلى أطهر بقاع", "الأرض"],
    features: ["حجوزات طيران", "حجوزات فنادق", "تنظيم الجولات", "دعم مباشر"],
    people: "1-2",
    city: "مكة",
    duration: "7"
  },
  {
    badge: "التأشيرات",
    type: "visa",
    image: "/landingpage/mains.png",
    price: "55",
    imageText: ["خطوة أسهل", "لرحلة أيسر"],
    features: ["تأشيرات سياحية", "حجز المواعيد", "متابعة الطلب", "استشارات السفر"],
    people: "3-4",
    city: "مكة والمدينة",
    duration: "10"
  },
  {
    badge: "برامج الشركات",
    type: "corporate",
    image: "/landingpage/reunion.png",
    price: "60",
    imageText: ["شراكات", "تسهل رحلتكم", "الإيمانية"],
    features: ["رحلات عمل", "حجوزات جماعية", "تنظيم الفعاليات", "خدمة مخصصة"],
    people: "5+",
    city: "المدينة",
    duration: "14"
  }
];

const packageFeatureIcons = [
  <LocationIcon className="icon icon-sm" />,
  <BusIcon className="icon icon-sm" />,
  <MosqueIcon className="icon icon-sm" />,
  <HeadsetIcon className="icon icon-sm" />
];

const travelPackages = [
  {
    days: "10 أيام",
    image: "/landingpage/avion.png",
    price: "95",
    features: ["حجز طيران", "حجز فنادق", "تنظيم الجولات", "دعم مباشر"]
  },
  {
    days: "6 أيام",
    image: "/landingpage/paysage.png",
    price: "75",
    features: ["حجز طيران", "حجز فنادق", "تنظيم الجولات", "دعم مباشر"]
  }
];

const services = [
  { icon: <ShieldIcon className="icon icon-md" />, title: "تأمين شامل", text: "لحماية رحلتك وراحة بالك" },
  { icon: <HeadsetIcon className="icon icon-md" />, title: "دعم على مدار الساعة", text: "نحن معك في كل خطوة" },
  { icon: <BusIcon className="icon icon-md" />, title: "تنقلات مريحة", text: "سيارات حديثة ومكيفة" },
  { icon: <CalendarIcon className="icon icon-md" />, title: "استخراج تأشيرات", text: "بإجراء واضح وسريع" },
  { icon: <MosqueIcon className="icon icon-md" />, title: "إرشادات دينية", text: "مع مرشدين مختصين" },
  { icon: <UsersIcon className="icon icon-md" />, title: "مجموعات صغيرة", text: "خدمة أفضل واهتمام أكبر" }
];

const emptyFilters = {
  people: "",
  city: "",
  duration: "",
  startDate: ""
};

const emptyReservationForm = {
  fullName: "",
  phoneNumber: "",
  email: "",
  passportNumber: "",
  nationality: "",
  gender: "",
  dateOfBirth: "",
  passportExpiryDate: "",
  civilId: ""
};

const acceptedDocumentTypes = ["image/jpeg", "image/png", "application/pdf"];
const maxDocumentSize = 5 * 1024 * 1024;

type Filters = typeof emptyFilters;
type FilterName = keyof Filters;
type ReservationForm = typeof emptyReservationForm;
type ReservationField = keyof ReservationForm;
type UploadKind = "passport" | "id";

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export default function LandingPage() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [submittedFilters, setSubmittedFilters] = useState<Filters>(emptyFilters);
  const [activePackageView, setActivePackageView] = useState<"travel" | null>(null);
  const [bookingSectionOpen, setBookingSectionOpen] = useState(false);
  const [selectedBookingTitle, setSelectedBookingTitle] = useState("");
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [ocrStatus, setOcrStatus] = useState("");
  const [reservationForm, setReservationForm] = useState<ReservationForm>(emptyReservationForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<ReservationField | "passportFile" | "idFile", string>>>({});
  const [uploadErrors, setUploadErrors] = useState<Partial<Record<UploadKind, string>>>({});
  const [reservationStatus, setReservationStatus] = useState("");
  const [reservationSuccessOpen, setReservationSuccessOpen] = useState(false);
  const [reservationSubmitting, setReservationSubmitting] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.body.classList.add("umrah-body");

    return () => {
      document.body.classList.remove("umrah-body");
    };
  }, []);

  useEffect(() => {
    return () => {
      if (passportPreview) URL.revokeObjectURL(passportPreview);
      if (idPreview) URL.revokeObjectURL(idPreview);
    };
  }, [passportPreview, idPreview]);

  const filteredPackages = useMemo(() => {
    return packages.filter((program) => {
      return (
        (!submittedFilters.people || program.people === submittedFilters.people) &&
        (!submittedFilters.city || program.city === submittedFilters.city) &&
        (!submittedFilters.duration || program.duration === submittedFilters.duration)
      );
    });
  }, [submittedFilters]);

  const hasActiveFilters = Boolean(
    submittedFilters.people || submittedFilters.city || submittedFilters.duration || submittedFilters.startDate
  );

  const updateFilter = (name: FilterName, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const submitFilters = () => {
    setSubmittedFilters(filters);
    document.getElementById("gv-packages")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setSubmittedFilters(emptyFilters);
  };

  const openPackageView = (type: string) => {
    if (type !== "travel") {
      return;
    }

    setActivePackageView("travel");
    window.setTimeout(() => {
      document.getElementById("gv-travel-packages")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const openBookingSection = (title: string) => {
    setSelectedBookingTitle(title);
    setReservationStatus("");
    setOcrStatus("");
    setFormErrors({});
    setUploadErrors({});
    setReservationSuccessOpen(false);
    setBookingSectionOpen(true);
  };

  const updateReservationField = (name: ReservationField, value: string) => {
    setReservationForm((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  };

  const validateDocumentFile = (file: File) => {
    if (!acceptedDocumentTypes.includes(file.type)) {
      return "صيغة الملف غير مدعومة";
    }

    if (file.size > maxDocumentSize) {
      return "حجم الملف يتجاوز الحد المسموح به 5MB";
    }

    return "";
  };

  const updateDocumentFile = (kind: UploadKind, file?: File) => {
    if (!file) return;

    const error = validateDocumentFile(file);
    if (error) {
      setUploadErrors((current) => ({ ...current, [kind]: error }));
      return;
    }

    setUploadErrors((current) => ({ ...current, [kind]: "" }));
    setFormErrors((current) => ({ ...current, [kind === "passport" ? "passportFile" : "idFile"]: "" }));

    if (kind === "passport") {
      if (passportPreview) URL.revokeObjectURL(passportPreview);
      setPassportFile(file);
      setPassportPreview(isImageFile(file) ? URL.createObjectURL(file) : null);
      return;
    }

    if (idPreview) URL.revokeObjectURL(idPreview);
    setIdFile(file);
    setIdPreview(isImageFile(file) ? URL.createObjectURL(file) : null);
  };

  const updatePassportFile = (file?: File) => {
    updateDocumentFile("passport", file);
  };

  const updateIdFile = (file?: File) => {
    updateDocumentFile("id", file);
  };

  const removeDocumentFile = (kind: UploadKind) => {
    if (kind === "passport") {
      if (passportPreview) URL.revokeObjectURL(passportPreview);
      setPassportFile(null);
      setPassportPreview(null);
      return;
    }

    if (idPreview) URL.revokeObjectURL(idPreview);
    setIdFile(null);
    setIdPreview(null);
  };

  const handleDocumentDrop = (kind: UploadKind, fileList: FileList | null) => {
    updateDocumentFile(kind, fileList?.[0]);
  };

  const extractAllDocuments = async () => {
    if (!passportFile && !idFile) {
      setOcrStatus("الرجاء إضافة جواز السفر أو بطاقة الهوية أولاً.");
      return;
    }

    setOcrStatus("جارٍ استخراج البيانات الذكية...");
    const messages: string[] = [];

    if (passportFile) {
      try {
        const result = await readPassportOcr(passportFile);
        setReservationForm((current) => ({
          ...current,
          passportNumber: result.passportNumber || current.passportNumber,
          fullName: result.fullName || current.fullName,
          nationality: result.nationality || current.nationality,
          gender: result.gender || current.gender,
          dateOfBirth: toDateInputValue(result.dateOfBirth) || current.dateOfBirth,
          passportExpiryDate: toDateInputValue(result.passportExpiryDate) || current.passportExpiryDate
        }));
        messages.push(result.mode === "demo" ? result.message : "تم استخراج بيانات جواز السفر.");
      } catch (error) {
        messages.push(error instanceof Error ? error.message : "تعذر استخراج بيانات جواز السفر.");
      }
    }

    if (idFile) {
      try {
        const result = await readCivilIdOcr(idFile);
        setReservationForm((current) => ({
          ...current,
          civilId: result.civilId || current.civilId,
          passportNumber: result.passportNumber || current.passportNumber,
          fullName: result.fullName || current.fullName,
          nationality: result.nationality || current.nationality,
          gender: result.gender || current.gender,
          dateOfBirth: toDateInputValue(result.dateOfBirth) || current.dateOfBirth,
          passportExpiryDate: toDateInputValue(result.passportExpiryDate) || current.passportExpiryDate
        }));
        messages.push(result.mode === "demo" ? result.message : "تم استخراج بيانات بطاقة الهوية.");
      } catch (error) {
        messages.push(error instanceof Error ? error.message : "تعذر استخراج بيانات بطاقة الهوية.");
      }
    }

    setOcrStatus(messages.join(" "));
  };

  const submitReservation = async () => {
    const nextErrors: Partial<Record<ReservationField | "passportFile" | "idFile", string>> = {};

    if (!reservationForm.fullName.trim()) {
      nextErrors.fullName = "يرجى إدخال الاسم الكامل";
    }

    if (!reservationForm.phoneNumber.trim()) {
      nextErrors.phoneNumber = "يرجى إدخال رقم الهاتف";
    }

    if (reservationForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reservationForm.email.trim())) {
      nextErrors.email = "يرجى إدخال بريد إلكتروني صحيح";
    }

    if (!reservationForm.passportNumber.trim()) {
      nextErrors.passportNumber = "يرجى إدخال رقم الجواز";
    }

    if (!passportFile) {
      nextErrors.passportFile = "يرجى رفع صورة جواز السفر";
    }

    if (!idFile) {
      nextErrors.idFile = "يرجى رفع صورة بطاقة الهوية";
    }

    setFormErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setReservationStatus("يرجى مراجعة البيانات المطلوبة.");
      return;
    }

    setReservationSubmitting(true);
    setReservationStatus("");

    try {
      const formData = new FormData();
      formData.append("PassportNumber", reservationForm.passportNumber.trim());
      formData.append("FullName", reservationForm.fullName.trim());
      formData.append("Nationality", reservationForm.nationality.trim() || "غير محدد");
      formData.append("Gender", reservationForm.gender.trim() || "غير محدد");
      formData.append("DateOfBirth", reservationForm.dateOfBirth || "1990-01-01");
      formData.append("PassportExpiryDate", reservationForm.passportExpiryDate || "");
      formData.append("PhoneNumber", reservationForm.phoneNumber.trim());
      formData.append("Email", reservationForm.email.trim());
      formData.append("ResidenceNumber", reservationForm.civilId.trim());
      formData.append("Notes", `طلب حجز عمرة من الصفحة العامة - محال إلى خدمة العملاء - قيد التأكيد: ${selectedBookingTitle || "حجز جديد"}`);
      formData.append("PassportImagePath", "");
      formData.append("IsBlocked", "false");
      if (passportFile) {
        formData.append("passportImage", passportFile);
      }
      if (idFile) {
        formData.append("civilIdImage", idFile);
      }

      await createTraveler(formData);
      setReservationStatus("");
      setReservationSuccessOpen(true);
    } catch (error) {
      setReservationStatus(error instanceof Error ? error.message : "تعذر إرسال طلب الحجز.");
    } finally {
      setReservationSubmitting(false);
    }
  };

  return (
    <main className="globalview-page" dir="rtl" lang="ar">
      <section className="gv-hero" id="globalview">
        <div className="gv-hero__shade" />
        <header className="gv-header">
          <div className="gv-topbar">
            <div className="gv-brand">
              <MosqueIcon className="icon" />
              <div>
                <strong>رحلات العمرة</strong>
                <span>طريقك إلى بيت الله</span>
              </div>
            </div>
            <nav className="gv-nav" aria-label="التنقل الرئيسي">
              <a className="active" href="#globalview">الرئيسية</a>
              <a href="#gv-packages">العمرة</a>
              <a href="#gv-packages">برامجنا</a>
              <a href="#gv-services">عنّا</a>
              <a href="#gv-reservation">تواصل معنا</a>
            </nav>
            <div className="gv-contact">
              <span><MailIcon className="icon icon-sm" /> info@umrah.com</span>
              <span><PhoneIcon className="icon icon-sm" /> +965 55 123 4567</span>
              <span><LocationIcon className="icon icon-sm" /> العربية</span>
              <button className="gv-book" type="button" onClick={() => openBookingSection("حجز جديد")}>
                احجز الآن
                <ArrowRightIcon className="icon icon-sm" />
              </button>
            </div>
          </div>
        </header>

        <div className="gv-hero__content">
          <p>رحلة إيمانية ..</p>
          <h1>تجربة روحانية لا تُنسى</h1>
          <span>نقدم لكم أفضل خدمات العمرة المتكاملة، برعاية واهتمام لنجعل رحلتكم إلى بيت الله الحرام سهلة وآمنة ومميزة.</span>
          <div className="gv-hero-features">
            <article>
              <UsersIcon className="icon icon-md" />
              <strong>مرافقة دينية<br />متخصصة</strong>
            </article>
            <article>
              <MosqueIcon className="icon icon-md" />
              <strong>فنادق قريبة<br />من الحرم</strong>
            </article>
            <article>
              <BusIcon className="icon icon-md" />
              <strong>مواصلات مريحة<br />وحديثة</strong>
            </article>
            <article>
              <ShieldIcon className="icon icon-md" />
              <strong>دعم على مدار<br />الساعة</strong>
            </article>
          </div>
          <div className="gv-actions">
            <button type="button" onClick={() => document.getElementById("gv-packages")?.scrollIntoView({ behavior: "smooth" })}>
              استعرض باقات العمرة
              <ArrowRightIcon className="icon icon-sm" />
            </button>
            <button type="button" className="ghost">
              <ChatIcon className="icon icon-sm" />
              شاهد فيديو تعريفي
            </button>
          </div>
        </div>

        <div className="gv-spiritual">
          <strong>لبيك<br />اللهم لبيك</strong>
          <span />
          <p>رحلة تبدأ من قلبك<br />وتنتهي بالقرب من الله</p>
        </div>

        <aside className="gv-support">
          <MosqueIcon className="icon gv-support__mark" />
          <strong>خدمة عملاء</strong>
          <b>24/7</b>
          <span className="gv-support__line">لخدمتكم في كل خطوة <HeadsetIcon className="icon icon-sm" /></span>
          <em>ثقتكم .. مسؤوليتنا</em>
        </aside>
      </section>
      <section className="gv-search" aria-label="فلترة باقات العمرة">
        <button type="button" onClick={submitFilters}>
          <SearchIcon className="icon icon-sm" />
          بحث
        </button>
        <label>
          <span>عدد المعتمرين</span>
          <select value={filters.people} onChange={(event) => updateFilter("people", event.target.value)}>
            <option value="">اختر العدد</option>
            <option value="1-2">1 - 2</option>
            <option value="3-4">3 - 4</option>
            <option value="5+">5 وأكثر</option>
          </select>
        </label>
        <label>
          <span>المدينة</span>
          <select value={filters.city} onChange={(event) => updateFilter("city", event.target.value)}>
            <option value="">اختر المدينة</option>
            <option value="مكة">مكة</option>
            <option value="المدينة">المدينة</option>
            <option value="مكة والمدينة">مكة والمدينة</option>
          </select>
        </label>
        <label>
          <span>المدة</span>
          <select value={filters.duration} onChange={(event) => updateFilter("duration", event.target.value)}>
            <option value="">اختر المدة</option>
            <option value="7">7 ليالي</option>
            <option value="10">10 ليالي</option>
            <option value="14">14 ليلة</option>
          </select>
        </label>
        <label>
          <span>تاريخ الانطلاق</span>
          <input
            type="date"
            value={filters.startDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(event) => updateFilter("startDate", event.target.value)}
          />
        </label>
      </section>

      <section className="gv-packages" id="gv-packages">
        <div className="gv-packages__header">
          <span className="gv-section-kicker"><MosqueIcon className="icon icon-sm" /></span>
          <h2>أفضل الباقات</h2>
          <p>رحلات مصممة بعناية لرحلتك الإيمانية</p>
          {hasActiveFilters && (
            <button type="button" onClick={resetFilters}>
              إلغاء الفلتر
            </button>
          )}
        </div>
        <div className="gv-package-grid">
          {filteredPackages.map((program) => (
            <article
              className={`gv-card ${program.type === "travel" ? "is-clickable" : ""}`}
              key={program.badge}
              onClick={() => openPackageView(program.type)}
            >
              <div className="gv-card__media" style={{ backgroundImage: `url(${program.image})` }}>
                <span className="gv-card__badge">
                  {program.type === "travel" ? <ArrowRightIcon className="icon icon-sm" /> : null}
                  {program.type === "visa" ? <DocumentIcon className="icon icon-sm" /> : null}
                  {program.type === "corporate" ? <UsersIcon className="icon icon-sm" /> : null}
                  {program.badge}
                </span>
                <p className="gv-card__image-text">
                  {program.imageText.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
              </div>
              <div className="gv-card__body">
                <div className="gv-card__features">
                  {program.features.map((feature, index) => (
                    <span key={feature}>
                      {index === 0 && program.type === "travel" ? <ArrowRightIcon className="icon icon-sm" /> : null}
                      {index === 0 && program.type === "visa" ? <DocumentIcon className="icon icon-sm" /> : null}
                      {index === 0 && program.type === "corporate" ? <CalendarIcon className="icon icon-sm" /> : null}
                      {index > 0 ? packageFeatureIcons[index] : null}
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="gv-card__divider" />
                <div className="gv-card__footer">
                  <p>تبدأ من <b>{program.price}</b> د.ك</p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openPackageView(program.type);
                    }}
                  >
                    <ArrowRightIcon className="icon icon-sm" />
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {filteredPackages.length === 0 && (
          <div className="gv-empty">لا توجد باقات مطابقة لهذا البحث. جرّب تعديل المدينة أو المدة.</div>
        )}
      </section>

      {activePackageView === "travel" && (
        <section className="gv-travel-packages" id="gv-travel-packages">
          <h2>باقات الرحلات</h2>
          <div className="gv-travel-grid">
            {travelPackages.map((program) => (
              <article className="gv-travel-card" key={program.days}>
                <div className="gv-travel-card__media" style={{ backgroundImage: `url(${program.image})` }}>
                  <span>{program.days}</span>
                </div>
                <div className="gv-travel-card__body">
                  <div className="gv-travel-card__features">
                    {program.features.map((feature, index) => (
                      <span key={feature}>
                        {index === 0 ? <StarIcon className="icon icon-sm" /> : null}
                        {index === 1 ? <MosqueIcon className="icon icon-sm" /> : null}
                        {index === 2 ? <LocationIcon className="icon icon-sm" /> : null}
                        {index === 3 ? <HeadsetIcon className="icon icon-sm" /> : null}
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="gv-travel-card__divider" />
                  <div className="gv-travel-card__footer">
                    <p>تبدأ من <b>{program.price}</b> د.ك</p>
                    <button type="button" onClick={() => openBookingSection(program.days)}>
                      حجز
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {bookingSectionOpen && (
        <div className="gv-reservation-modal" role="dialog" aria-modal="true" aria-labelledby="gv-reservation-title" onClick={() => setBookingSectionOpen(false)}>
          <section className="gv-reservation" id="gv-reservation" onClick={(event) => event.stopPropagation()}>
            <button className="gv-reservation__close" type="button" onClick={() => setBookingSectionOpen(false)} aria-label="إغلاق">
              ×
            </button>
            <div className="gv-reservation__header">
              <MosqueIcon className="icon icon-md" />
              <h2 id="gv-reservation-title">{selectedBookingTitle || "حجز جديد"}</h2>
              <p>أكمل بياناتك لرحلة مريحة وآمنة</p>
            </div>

            <div className="gv-reservation__layout">
              <div className="gv-reservation__form">
                <div className="gv-reservation__form-head">
                  <span><UsersIcon className="icon icon-md" /></span>
                  <div>
                    <strong>بيانات المسافر</strong>
                    <p>أدخل بياناتك لإتمام الحجز</p>
                  </div>
                </div>
                <label>
                  الاسم الكامل
                  <span className="gv-field">
                    <input id="gv-full-name" type="text" placeholder="اكتب الاسم الكامل" value={reservationForm.fullName} onChange={(event) => updateReservationField("fullName", event.target.value)} aria-invalid={Boolean(formErrors.fullName)} />
                    <UsersIcon className="icon icon-sm" />
                  </span>
                  {formErrors.fullName ? <em>{formErrors.fullName}</em> : null}
                </label>
                <label>
                  رقم الهاتف
                  <span className="gv-field">
                    <input id="gv-phone" type="tel" placeholder="+965" value={reservationForm.phoneNumber} onChange={(event) => updateReservationField("phoneNumber", event.target.value)} aria-invalid={Boolean(formErrors.phoneNumber)} />
                    <PhoneIcon className="icon icon-sm" />
                  </span>
                  {formErrors.phoneNumber ? <em>{formErrors.phoneNumber}</em> : null}
                </label>
                <label>
                  البريد الإلكتروني
                  <span className="gv-field">
                    <input id="gv-email" type="email" placeholder="name@example.com" value={reservationForm.email} onChange={(event) => updateReservationField("email", event.target.value)} aria-invalid={Boolean(formErrors.email)} />
                    <MailIcon className="icon icon-sm" />
                  </span>
                  {formErrors.email ? <em>{formErrors.email}</em> : null}
                </label>
                <label>
                  رقم الجواز
                  <span className="gv-field">
                    <input id="gv-passport-number" type="text" placeholder="اكتب رقم الجواز" value={reservationForm.passportNumber} onChange={(event) => updateReservationField("passportNumber", event.target.value)} aria-invalid={Boolean(formErrors.passportNumber)} />
                    <DocumentIcon className="icon icon-sm" />
                  </span>
                  {formErrors.passportNumber ? <em>{formErrors.passportNumber}</em> : null}
                </label>
                <button type="button" className="gv-smart-extract" onClick={() => void extractAllDocuments()} disabled={!passportFile && !idFile}>
                  <SearchIcon className="icon icon-sm" />
                  استخراج ذكي
                </button>
                <button type="button" className="gv-confirm-booking" onClick={() => void submitReservation()} disabled={reservationSubmitting}>
                  <CalendarIcon className="icon icon-sm" />
                  {reservationSubmitting ? "جارٍ الإرسال..." : "تأكيد طلب الحجز"}
                </button>
                <small><ShieldIcon className="icon icon-sm" /> جميع بياناتك محمية وآمنة</small>
              </div>

              <article className="gv-upload-card">
                <div className="gv-upload-card__head">
                  <span>02</span>
                  <div>
                    <strong>إضافة جواز السفر</strong>
                    <p>ارفع صورة جواز السفر بوضوح</p>
                  </div>
                </div>
                <label
                  className="gv-dropzone"
                  htmlFor="gv-passport-upload"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDocumentDrop("passport", event.dataTransfer.files);
                  }}
                >
                  <input id="gv-passport-upload" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => updatePassportFile(event.target.files?.[0])} />
                  <div className="gv-document-preview gv-document-preview--passport">
                    {passportPreview ? <img src={passportPreview} alt="معاينة جواز السفر" /> : <DocumentIcon className="icon" />}
                  </div>
                  <span className="gv-upload-cloud"><DocumentIcon className="icon icon-sm" /></span>
                  <b>اسحب وأفلت صورة جواز السفر هنا</b>
                  <p>أو اضغط لاختيار الملف</p>
                  <small>JPG, PNG, PDF الحد الأقصى (5MB)</small>
                </label>
                {passportFile ? (
                  <div className="gv-file-row">
                    <span>{passportFile.name}</span>
                    <button type="button" onClick={() => removeDocumentFile("passport")}>حذف</button>
                  </div>
                ) : null}
                {(uploadErrors.passport || formErrors.passportFile) ? <em className="gv-upload-error">{uploadErrors.passport || formErrors.passportFile}</em> : null}
                <p className="gv-upload-note">تأكد من أن جميع البيانات واضحة في الصورة</p>
              </article>

              <article className="gv-upload-card">
                <div className="gv-upload-card__head">
                  <span>01</span>
                  <div>
                    <strong>إضافة بطاقة الهوية</strong>
                    <p>ارفع صورة بطاقة الهوية الوطنية</p>
                  </div>
                </div>
                <label
                  className="gv-dropzone"
                  htmlFor="gv-id-upload"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDocumentDrop("id", event.dataTransfer.files);
                  }}
                >
                  <input id="gv-id-upload" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => updateIdFile(event.target.files?.[0])} />
                  <div className="gv-document-preview gv-document-preview--id">
                    {idPreview ? <img src={idPreview} alt="معاينة بطاقة الهوية" /> : <DocumentIcon className="icon" />}
                  </div>
                  <span className="gv-upload-cloud"><DocumentIcon className="icon icon-sm" /></span>
                  <b>اسحب وأفلت صورة بطاقة الهوية هنا</b>
                  <p>أو اضغط لاختيار الملف</p>
                  <small>JPG, PNG, PDF الحد الأقصى (5MB)</small>
                </label>
                {idFile ? (
                  <div className="gv-file-row">
                    <span>{idFile.name}</span>
                    <button type="button" onClick={() => removeDocumentFile("id")}>حذف</button>
                  </div>
                ) : null}
                {(uploadErrors.id || formErrors.idFile) ? <em className="gv-upload-error">{uploadErrors.id || formErrors.idFile}</em> : null}
                <p className="gv-upload-note">تأكد من أن جميع البيانات واضحة في الصورة</p>
              </article>
            </div>
            {ocrStatus ? <div className="gv-ocr-status">{ocrStatus}</div> : null}
            {reservationStatus ? <div className="gv-ocr-status">{reservationStatus}</div> : null}
            {reservationSuccessOpen ? (
              <div className="gv-success-popup" role="status" aria-live="polite">
                <div>
                  <span><CalendarIcon className="icon icon-sm" /></span>
                  <strong>تم تحويل طلبكم إلى خدمة العملاء</strong>
                  <p>طلب الحجز الآن قيد التأكيد. سيتواصل معكم أحد ممثلي خدمة العملاء لمراجعة البيانات وتأكيد تفاصيل رحلة العمرة قبل اعتماد الحجز نهائياً.</p>
                  <button type="button" onClick={() => setReservationSuccessOpen(false)}>
                    حسناً
                  </button>
                </div>
              </div>
            ) : null}
            <div className="gv-reservation__foot">
              <MosqueIcon className="icon icon-sm" />
              <span>في خدمتكم لرحلة إيمانية مميزة</span>
            </div>
          </section>
        </div>
      )}

      <section className="gv-services">
        <h2>خدماتنا المتميزة</h2>
        <div className="gv-service-grid">
          {services.map((service) => (
            <article key={service.title}>
              {service.icon}
              <strong>{service.title}</strong>
              <span>{service.text}</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="gv-footer">
        <div className="gv-footer__brand">
          <MosqueIcon className="icon" />
          <div>
            <strong>رواد العمرة</strong>
            <p>نقدم لكم رحلات عمرة مميزة بأعلى معايير الراحة والثقة.</p>
          </div>
        </div>
        <ul>
          <li>الرئيسية</li>
          <li>رحلات العمرة</li>
          <li>العروض</li>
          <li>خدماتنا</li>
        </ul>
        <ul>
          <li>حجز فوري</li>
          <li>خدمة عملاء</li>
          <li>النقل الداخلي</li>
        </ul>
        <div className="gv-footer__contact">
          <span><PhoneIcon className="icon icon-sm" /> +965 55 123 4567</span>
          <span><MailIcon className="icon icon-sm" /> info@rawad-omrah.com</span>
          <span><LocationIcon className="icon icon-sm" /> الكويت - حولي</span>
        </div>
      </footer>
    </main>
  );
}
