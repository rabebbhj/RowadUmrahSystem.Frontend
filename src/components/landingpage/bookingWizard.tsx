import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { readCivilIdOcr, readPassportOcr } from "../../api/travelers";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BOOKING_SERVICES,
  CalendarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DEFAULT_BOOKING_STATE,
  DocumentIcon,
  LANDING_PROGRAMS,
  HeadsetIcon,
  LocationIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  TagIcon,
  UsersIcon,
  WhatsAppIcon,
  type BookingProgram,
  type BookingState,
  type BookingService
} from "./landingShared";

type BookingStep = 1 | 2 | 3 | 4;
type OcrState = "idle" | "reading" | "ready" | "demo" | "error";

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

const BOOKING_WIZARD_SERVICES: BookingService[] = [
  ...BOOKING_SERVICES,
  {
    id: "meal",
    title: "وجبات إضافية",
    subtitle: "وجبة ساخنة وخدمة مرافقة",
    price: "12 د.ك",
    image: "/landingpage/reunion.png"
  }
];

const STEP_TITLES: Record<BookingStep, string> = {
  1: "اختر البرنامج",
  2: "بيانات المسافر",
  3: "الخدمات الإضافية",
  4: "مراجعة الحجز"
};

const STEP_SUBTITLES: Record<BookingStep, string> = {
  1: "ابدأ باختيار الباقة المناسبة ثم انتقل إلى إدخال البيانات.",
  2: "ارفع الوثائق أو املأ الحقول وسيتم اقتراح البيانات تلقائياً.",
  3: "أضف الخدمات التي تناسب رحلتك مع احتساب السعر فوراً.",
  4: "راجع كل التفاصيل قبل تأكيد الحجز النهائي."
};

function parsePriceValue(value: string) {
  if (value.includes("مجاني")) return 0;
  const match = value.replace(/,/g, "").match(/[\d.]+/);
  return match ? Number.parseFloat(match[0]) || 0 : 0;
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("en-US").format(Math.round(value))} د.ك`;
}

function getCurrentStep(step: number): BookingStep {
  return Math.min(4, Math.max(1, step)) as BookingStep;
}

function WizardStepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="wizard-step-header">
      <div className="wizard-step-header__badge">{step}</div>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function BookingProgramCard({
  program,
  selected,
  onSelect
}: {
  program: BookingProgram;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`booking-program-card ${selected ? "is-selected" : ""}`}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="booking-program-card__media" style={{ backgroundImage: `url('${program.image}')` }}>
        <span className="booking-program-card__badge">{program.badge}</span>
        <span className="booking-program-card__favorite" aria-hidden="true">
          ♡
        </span>
      </div>

      <div className="booking-program-card__body">
        <h4>{program.title}</h4>
        <div className="booking-program-card__facts">
          <span>{program.nights}</span>
          <span>{program.transport}</span>
          <span>{program.transfer}</span>
          <span>{program.city}</span>
        </div>

        <div className="booking-program-card__meta">
          <div>
            <strong>{program.price}</strong>
            <span>للشخص د.ك</span>
          </div>
          <span className="btn btn-gold booking-program-card__cta">
            <span>عرض التفاصيل</span>
            <ArrowLeftIcon className="icon icon-sm" />
          </span>
        </div>
      </div>
    </button>
  );
}

function BookingServiceCard({
  service,
  selected,
  onToggle
}: {
  service: BookingService;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`booking-service-card ${selected ? "is-selected" : ""}`}
      onClick={onToggle}
      aria-pressed={selected}
    >
      <span className="booking-service-card__check">{selected ? <CheckCircleIcon className="icon icon-sm" /> : null}</span>
      <img src={service.image} alt={service.title} />
      <div className="booking-service-card__content">
        <strong>{service.title}</strong>
        <span>{service.subtitle}</span>
        <div className="booking-service-card__price">
          <b>{service.price}</b>
          <small>للشخص</small>
        </div>
      </div>
    </button>
  );
}

function SummaryRow({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="booking-summary__row">
      <span>{label}</span>
      <strong>{value}</strong>
      <div className="booking-summary__icon">{icon}</div>
    </div>
  );
}

export function BookingWizard({
  selectedProgramIndex,
  onSelectProgram,
  onBackHome,
  onOpenStep,
  activeStep
}: {
  selectedProgramIndex: number;
  onSelectProgram: (index: number) => void;
  onBackHome: () => void;
  onOpenStep: (step: number) => void;
  activeStep: number;
}) {
  const [step, setStep] = useState<BookingStep>(getCurrentStep(activeStep));
  const [form, setForm] = useState<BookingState>(DEFAULT_BOOKING_STATE);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<OcrState>("idle");
  const [idOcrState, setIdOcrState] = useState<OcrState>("idle");
  const [serviceIds, setServiceIds] = useState<string[]>(["insurance", "support"]);
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "done">("idle");

  useEffect(() => {
    setStep(getCurrentStep(activeStep));
  }, [activeStep]);

  useEffect(() => {
    onOpenStep(step);
  }, [step, onOpenStep]);

  useEffect(() => {
    return () => {
      if (passportPreview) URL.revokeObjectURL(passportPreview);
      if (idPreview) URL.revokeObjectURL(idPreview);
    };
  }, [passportPreview, idPreview]);

  const selectedProgram = LANDING_PROGRAMS[selectedProgramIndex] ?? LANDING_PROGRAMS[0];
  const selectedServices = useMemo(
    () => BOOKING_WIZARD_SERVICES.filter((service) => serviceIds.includes(service.id)),
    [serviceIds]
  );

  const selectedProgramPrice = useMemo(() => parsePriceValue(selectedProgram.price), [selectedProgram.price]);
  const servicesTotal = useMemo(
    () => selectedServices.reduce((total, service) => total + parsePriceValue(service.price), 0),
    [selectedServices]
  );
  const basePrice = 2490;
  const extraTotal = selectedProgramPrice > 0 ? selectedProgramPrice - basePrice : 0;
  const grandTotal = basePrice + servicesTotal + Math.max(0, extraTotal);

  async function handlePassportUpload(file?: File) {
    if (!file) return;
    if (passportPreview) URL.revokeObjectURL(passportPreview);
    setPassportPreview(URL.createObjectURL(file));
    setOcrState("reading");

    try {
      const result = await readPassportOcr(file);
      setForm((current) => ({
        ...current,
        passportNumber: result.passportNumber || current.passportNumber,
        fullName: result.fullName || current.fullName,
        nationality: result.nationality || current.nationality,
        gender: result.gender || current.gender,
        dateOfBirth: toDateInputValue(result.dateOfBirth) || current.dateOfBirth,
        passportExpiryDate: toDateInputValue(result.passportExpiryDate) || current.passportExpiryDate
      }));
      setOcrState(result.mode === "demo" ? "demo" : "ready");
    } catch {
      setOcrState("error");
    }
  }

  async function handleIdUpload(file?: File) {
    if (!file) return;
    if (idPreview) URL.revokeObjectURL(idPreview);
    setIdPreview(URL.createObjectURL(file));
    setIdOcrState("reading");

    try {
      const result = await readCivilIdOcr(file);
      setForm((current) => ({
        ...current,
        residenceNumber: result.civilId || current.residenceNumber,
        passportNumber: result.passportNumber || current.passportNumber,
        fullName: result.fullName || current.fullName,
        nationality: result.nationality || current.nationality,
        gender: result.gender || current.gender,
        dateOfBirth: toDateInputValue(result.dateOfBirth) || current.dateOfBirth,
        passportExpiryDate: toDateInputValue(result.passportExpiryDate) || current.passportExpiryDate
      }));
      setIdOcrState(result.mode === "demo" ? "demo" : "ready");
    } catch {
      setIdOcrState("error");
    }
  }

  function goNext() {
    setStep((current) => getCurrentStep(current + 1));
  }

  function goBack() {
    setStep((current) => getCurrentStep(current - 1));
  }

  async function handleConfirmBooking() {
    if (submitState === "sending") return;
    setSubmitState("sending");
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setSubmitState("done");
  }

  const reviewName = form.fullName || "سيتم استكماله من الجواز";
  const reviewPassport = form.passportNumber || "رقم الجواز";

  return (
    <section className="booking-page">
      <div className="container">
        <div className="booking-hero">
          <div className="booking-hero__copy">
            <div className="booking-breadcrumbs">
              <button type="button" onClick={onBackHome}>
                الرئيسية
              </button>
              <span>›</span>
              <button type="button" onClick={() => setStep(1)}>
                رحلات العمرة
              </button>
              <span>›</span>
              <strong>{STEP_TITLES[step]}</strong>
            </div>
            <h1>{STEP_TITLES[step]}</h1>
            <p>{STEP_SUBTITLES[step]}</p>
          </div>
          <div className="booking-hero__visual">
            <img src="/landingpage/kaaba.png" alt="الكعبة المشرفة" />
          </div>
        </div>

        <div className="booking-stepper" aria-label="خطوات الحجز">
          {(Object.keys(STEP_TITLES) as unknown as BookingStep[]).map((item) => {
            const current = item === step;
            const done = item < step;
            return (
              <button
                key={item}
                type="button"
                className={`booking-stepper__item ${current ? "is-active" : ""} ${done ? "is-done" : ""}`}
                onClick={() => setStep(item)}
              >
                <span>{done ? <CheckCircleIcon className="icon icon-sm" /> : item}</span>
                <strong>{STEP_TITLES[item]}</strong>
              </button>
            );
          })}
        </div>

        <div className="booking-layout">
          <main className="booking-main">
            {step === 1 ? (
              <>
                <div className="booking-controls">
                  <button className="booking-controls__search btn btn-gold" type="button">
                    <SearchIcon className="icon icon-sm" />
                    <span>بحث</span>
                  </button>

                  <div className="booking-controls__field">
                    <span>المدينة</span>
                    <button type="button">
                      <LocationIcon className="icon icon-sm" />
                      <strong>مكة المكرمة</strong>
                    </button>
                  </div>

                  <div className="booking-controls__field">
                    <span>المدة</span>
                    <button type="button">
                      <CalendarIcon className="icon icon-sm" />
                      <strong>اختر المدة</strong>
                    </button>
                  </div>

                  <div className="booking-controls__field">
                    <span>المستوى</span>
                    <button type="button">
                      <StarIcon className="icon icon-sm" />
                      <strong>كل المستويات</strong>
                    </button>
                  </div>

                  <div className="booking-controls__field">
                    <span>تاريخ الانطلاق</span>
                    <button type="button">
                      <ChevronDownIcon className="icon icon-sm" />
                      <strong>اختر التاريخ</strong>
                    </button>
                  </div>
                </div>

                <div className="booking-toolbar">
                  <div className="booking-toolbar__sort">
                    <span>ترتيب حسب</span>
                    <button type="button">الأكثر شعبية</button>
                  </div>
                  <strong>تم العثور على 12 برنامج</strong>
                </div>

                <div className="booking-program-grid">
                  {LANDING_PROGRAMS.map((program, index) => (
                    <BookingProgramCard
                      key={program.id}
                      program={program}
                      selected={selectedProgramIndex === index}
                      onSelect={() => onSelectProgram(index)}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <WizardStepHeader
                  step={2}
                  title="بيانات المسافر"
                  subtitle="ارفع صورة الجواز أو البطاقة المدنية وسيتم إكمال الحقول الأساسية تلقائياً."
                />
                <div className="booking-documents">
                  <label className="document-dropzone">
                    <input type="file" accept="image/*" onChange={(event) => handlePassportUpload(event.target.files?.[0])} />
                    <DocumentIcon className="icon icon-lg" />
                    <strong>رفع صورة الجواز</strong>
                    <span>الملف الأول لتفعيل القراءة الذكية</span>
                    {passportPreview ? <img src={passportPreview} alt="معاينة الجواز" /> : null}
                  </label>
                  <label className="document-dropzone">
                    <input type="file" accept="image/*" onChange={(event) => handleIdUpload(event.target.files?.[0])} />
                    <DocumentIcon className="icon icon-lg" />
                    <strong>رفع البطاقة المدنية</strong>
                    <span>لتأكيد بيانات المسافر ومطابقتها</span>
                    {idPreview ? <img src={idPreview} alt="معاينة البطاقة المدنية" /> : null}
                  </label>
                </div>

                <div className="booking-ocr-status">
                  <span className={`booking-ocr-status__pill ${ocrState}`}>
                    {ocrState === "reading"
                      ? "جارٍ استخراج البيانات..."
                      : ocrState === "ready"
                        ? "تمت القراءة الذكية"
                        : ocrState === "demo"
                          ? "وضع المعاينة الذكي"
                          : ocrState === "error"
                            ? "تعذر التعرف على الوثيقة"
                            : "بانتظار الرفع"}
                  </span>
                  <p>بعد الرفع، نقوم بتحليل الجواز أو البطاقة ثم نملأ الحقول الأساسية تلقائياً لتسريع الحجز.</p>
                </div>

                <div className="booking-form-grid">
                  <label>
                    الاسم الكامل
                    <input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
                  </label>
                  <label>
                    رقم الجواز
                    <input value={form.passportNumber} onChange={(event) => setForm((current) => ({ ...current, passportNumber: event.target.value }))} />
                  </label>
                  <label>
                    الجنسية
                    <input value={form.nationality} onChange={(event) => setForm((current) => ({ ...current, nationality: event.target.value }))} />
                  </label>
                  <label>
                    الجنس
                    <input value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} />
                  </label>
                  <label>
                    تاريخ الميلاد
                    <input type="date" value={form.dateOfBirth} onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))} />
                  </label>
                  <label>
                    انتهاء الجواز
                    <input
                      type="date"
                      value={form.passportExpiryDate}
                      onChange={(event) => setForm((current) => ({ ...current, passportExpiryDate: event.target.value }))}
                    />
                  </label>
                  <label>
                    رقم الهاتف
                    <input value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
                  </label>
                  <label>
                    البريد الإلكتروني
                    <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                  </label>
                  <label>
                    رقم الإقامة
                    <input value={form.residenceNumber} onChange={(event) => setForm((current) => ({ ...current, residenceNumber: event.target.value }))} />
                  </label>
                  <label className="booking-form-grid__wide">
                    ملاحظات
                    <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
                  </label>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <WizardStepHeader
                  step={3}
                  title="اختر الخدمات الإضافية"
                  subtitle="كل خدمة تظهر مباشرة ضمن الملخص النهائي مع تحديث السعر عند التحديد أو الإلغاء."
                />

                <div className="booking-services">
                  {BOOKING_WIZARD_SERVICES.map((service) => {
                    const checked = serviceIds.includes(service.id);
                    return (
                      <BookingServiceCard
                        key={service.id}
                        service={service}
                        selected={checked}
                        onToggle={() =>
                          setServiceIds((current) =>
                            current.includes(service.id) ? current.filter((id) => id !== service.id) : [...current, service.id]
                          )
                        }
                      />
                    );
                  })}
                </div>

                <div className="booking-services-note">
                  <div>
                    <strong>ملاحظات إضافية (اختياري)</strong>
                    <p>أدخل أي طلبات خاصة تتعلق بالخدمات الإضافية، مثل ترتيب مقاعد أو استقبال خاص.</p>
                  </div>
                  <button className="btn btn-ghost" type="button" onClick={() => setStep(2)}>
                    <ArrowLeftIcon className="icon icon-sm" />
                    <span>السابق: بيانات المسافر</span>
                  </button>
                </div>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <WizardStepHeader
                  step={4}
                  title="مراجعة الحجز"
                  subtitle="تأكد من كل البيانات قبل الضغط على تأكيد الحجز والدفع."
                />

                <div className="booking-review">
                  <section className="booking-review__hero">
                    <div className="booking-review__program">
                      <div className="booking-review__program-copy">
                        <span className="booking-review__eyebrow">{selectedProgram.badge}</span>
                        <h4>{selectedProgram.title}</h4>
                        <ul>
                          <li>{selectedProgram.nights}</li>
                          <li>{selectedProgram.transport}</li>
                          <li>{selectedProgram.transfer}</li>
                          <li>{selectedProgram.city}</li>
                        </ul>
                      </div>
                      <div className="booking-review__program-image" style={{ backgroundImage: `url('${selectedProgram.image}')` }} />
                    </div>

                    <div className="booking-review__totals">
                      <div>
                        <span>السعر الأساسي</span>
                        <strong>{formatCurrency(basePrice)}</strong>
                      </div>
                      <div>
                        <span>الخدمات الإضافية</span>
                        <strong>{formatCurrency(servicesTotal)}</strong>
                      </div>
                      <div>
                        <span>الإجمالي</span>
                        <strong className="booking-review__total">{formatCurrency(grandTotal)}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="booking-review__grid">
                    <div className="booking-review__card">
                      <h4>بيانات المسافر</h4>
                      <div className="booking-review__identity">
                        <div>
                          <span>الاسم الكامل</span>
                          <strong>{reviewName}</strong>
                        </div>
                        <div>
                          <span>رقم الجواز</span>
                          <strong>{reviewPassport}</strong>
                        </div>
                        <div>
                          <span>الجنسية</span>
                          <strong>{form.nationality || "كويتي"}</strong>
                        </div>
                        <div>
                          <span>تاريخ الميلاد</span>
                          <strong>{form.dateOfBirth || "1990-05-12"}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="booking-review__card">
                      <h4>الخدمات الإضافية المختارة</h4>
                      <div className="booking-review__services">
                        {selectedServices.length ? (
                          selectedServices.map((service) => (
                            <div key={service.id} className="booking-review__service">
                              <img src={service.image} alt={service.title} />
                              <div>
                                <strong>{service.title}</strong>
                                <span>{service.price}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p>لم يتم اختيار أي خدمة إضافية بعد.</p>
                        )}
                      </div>
                    </div>

                    <div className="booking-review__card booking-review__card--wide">
                      <h4>ملاحظات الحجز</h4>
                      <p>{form.notes || "لا توجد ملاحظات إضافية، ويمكنك الرجوع لتعديل أي تفاصيل قبل التأكيد."}</p>
                    </div>
                  </section>

                  <div className="booking-review__actions">
                    <button className="btn btn-ghost" type="button" onClick={() => setStep(3)}>
                      <ArrowLeftIcon className="icon icon-sm" />
                      <span>السابق: الخدمات الإضافية</span>
                    </button>
                    <button className="btn btn-gold" type="button" onClick={handleConfirmBooking} disabled={submitState === "sending"}>
                      {submitState === "sending" ? "جارٍ التأكيد..." : submitState === "done" ? "تم إرسال الطلب" : "تأكيد الحجز والدفع"}
                    </button>
                  </div>
                </div>
              </>
            ) : null}

            <div className="booking-pagination">
              <button className="btn btn-ghost" type="button" onClick={goBack} disabled={step === 1}>
                <ArrowLeftIcon className="icon icon-sm" />
                <span>السابق</span>
              </button>
              <button className="btn btn-gold" type="button" onClick={goNext} disabled={step === 4}>
                <span>{step === 4 ? "تم الوصول للنهاية" : "التالي"}</span>
                <ArrowRightIcon className="icon icon-sm" />
              </button>
            </div>
          </main>

          <aside className="booking-summary">
            <h3>ملخص الحجز</h3>
            <div className="booking-summary__banner" style={{ backgroundImage: `url('${selectedProgram.image}')` }}>
              <span className="booking-summary__banner-tag">{selectedProgram.badge}</span>
              <strong>{selectedProgram.title}</strong>
              <p>{selectedProgram.nights} · {selectedProgram.transport}</p>
            </div>

            <div className="booking-summary__panel">
              <SummaryRow label="المدينة" value="مكة المكرمة" icon={<LocationIcon className="icon icon-sm" />} />
              <SummaryRow label="تاريخ الانطلاق" value="15 ديسمبر 2024" icon={<CalendarIcon className="icon icon-sm" />} />
              <SummaryRow label="المدة" value={selectedProgram.nights} icon={<CalendarIcon className="icon icon-sm" />} />
              <SummaryRow label="المستوى" value="اقتصادي" icon={<StarIcon className="icon icon-sm" />} />
              <SummaryRow label="الخدمات" value={`${selectedServices.length} مختارة`} icon={<TagIcon className="icon icon-sm" />} />
            </div>

            <div className="booking-summary__price">
              <div>
                <span>السعر الأساسي</span>
                <strong>{formatCurrency(basePrice)}</strong>
              </div>
              <div>
                <span>الخدمات الإضافية</span>
                <strong>{formatCurrency(servicesTotal)}</strong>
              </div>
              <div className="booking-summary__price-total">
                <span>الإجمالي</span>
                <strong>{formatCurrency(grandTotal)}</strong>
              </div>
            </div>

            <div className="booking-help">
              <div className="booking-help__head">
                <strong>تحتاج مساعدة؟</strong>
                <HeadsetIcon className="icon icon-md" />
              </div>
              <p>فريقنا متاح لمساعدتك على مدار الساعة، ويمكنه متابعة الحجز أو تعديل تفاصيله.</p>
              <a className="booking-help__phone" href="tel:+965551234567">
                +965 55 123 4567
              </a>
              <a className="btn btn-ghost booking-help__whatsapp" href="https://wa.me/965551234567" target="_blank" rel="noreferrer">
                <WhatsAppIcon className="icon icon-sm" />
                <span>تواصل عبر واتساب</span>
              </a>
              <small>أو اتصل بنا مباشرة للحصول على دعم فوري</small>
            </div>
          </aside>
        </div>

        <div className="booking-features">
          <article className="booking-feature">
            <ShieldIcon className="icon icon-md" />
            <strong>حجز آمن ومضمون</strong>
            <span>نضمن لك أفضل الأسعار</span>
          </article>
          <article className="booking-feature">
            <HeadsetIcon className="icon icon-md" />
            <strong>دعم على مدار الساعة</strong>
            <span>فريقنا جاهز لمساعدتك</span>
          </article>
          <article className="booking-feature">
            <TagIcon className="icon icon-md" />
            <strong>مرونة في التعديل</strong>
            <span>تعديل مجاني قبل السفر</span>
          </article>
          <article className="booking-feature">
            <UsersIcon className="icon icon-md" />
            <strong>أفضل الأسعار</strong>
            <span>نضمن لك أقل الأسعار</span>
          </article>
        </div>
      </div>
    </section>
  );
}
