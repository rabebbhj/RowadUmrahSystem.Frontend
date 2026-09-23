import { useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type PricingExceptionsPageProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

type ExceptionRule = {
  id: string;
  title: string;
  description: string;
  icon: string;
  conditions: string[];
  alternativePrice: number;
  priority: number;
  active: boolean;
};

const exceptionRules: ExceptionRule[] = [
  {
    id: "ex-1",
    title: "عميل لديه تأشيرة سابقة من شركة رواد",
    description: "يطبق على العملاء الذين لديهم تأشيرة سابقة صادرة من شركة رواد خلال آخر 3 سنوات.",
    icon: "👥",
    conditions: ["جميع الجنسيات", "لديه تأشيرة سابقة من شركة رواد"],
    alternativePrice: 95,
    priority: 1,
    active: true
  },
  {
    id: "ex-2",
    title: "رحلة بالطيران لثلاثة أشخاص",
    description: "خصم خاص للمجموعات المكونة من ثلاثة أشخاص عند السفر بالطيران.",
    icon: "✈",
    conditions: ["عدد الأشخاص = 3", "السفر بالطيران", "جميع الباقات"],
    alternativePrice: 280,
    priority: 2,
    active: true
  },
  {
    id: "ex-3",
    title: "رحلة 11 يوما بدون طيران - مجموعة B",
    description: "سعر خاص لرحلة 11 يوما بدون طيران للمجموعة B.",
    icon: "👥",
    conditions: ["عدد الأيام = 11", "بدون طيران", "المجموعة B"],
    alternativePrice: 110,
    priority: 3,
    active: true
  }
];

export function PricingExceptionsPage({ user, activePath, onNavigate, onLogout }: PricingExceptionsPageProps) {
  const [rules, setRules] = useState(exceptionRules);
  const [nationality, setNationality] = useState("الكويت");
  const [packageName, setPackageName] = useState("6 أيام - المجموعة A");
  const [travelersCount, setTravelersCount] = useState("1 شخص");
  const [transport, setTransport] = useState("بالطيران");
  const [visaSource, setVisaSource] = useState("من شركة رواد");
  const [roomType, setRoomType] = useState("رباعية");
  const [hotel, setHotel] = useState("جميع الفنادق");

  const simulation = useMemo(() => {
    const base = 120;
    const exception = visaSource === "من شركة رواد" ? -15 : 0;
    const addons = roomType === "رباعية" ? 25 : 45;
    return { base, exception, addons, total: base + exception + addons };
  }, [roomType, visaSource]);

  const toggleRule = (id: string) => {
    setRules((current) => current.map((rule) => (rule.id === id ? { ...rule, active: !rule.active } : rule)));
  };

  const deleteRule = (id: string) => {
    if (!window.confirm("هل تريد حذف هذا الاستثناء؟")) return;
    setRules((current) => current.filter((rule) => rule.id !== id));
  };

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel pricing-admin-page exceptions-page" dir="rtl">
        <section className="pricing-hero">
          <div>
            <span className="eyebrow">محاكي الأسعار</span>
            <h1>الاستثناءات ومحاكي التسعير</h1>
            <p>إدارة الحالات الخاصة واختبار النتيجة قبل اعتمادها</p>
          </div>
          <button type="button" className="ng-primary">+ إضافة استثناء جديد</button>
        </section>

        <section className="exceptions-list-card">
          <header>
            <div>
              <span className="count-badge">3</span>
              <h2>قائمة الاستثناءات</h2>
              <p>إدارة الحالات الخاصة التي تطبق أسعارا أو قواعد مختلفة عن التسعير الافتراضي</p>
            </div>
          </header>

          <div className="exceptions-list">
            {rules.map((rule) => (
              <article className="exception-row" key={rule.id}>
                <div className="exception-actions">
                  <button type="button">⋮</button>
                  <button type="button" onClick={() => onNavigate("/pricing-rules")}>تعديل</button>
                  <button type="button" className="danger" onClick={() => toggleRule(rule.id)}>
                    {rule.active ? "إلغاء التفعيل" : "تفعيل"}
                  </button>
                  <button type="button" className="danger" onClick={() => deleteRule(rule.id)}>حذف</button>
                </div>
                <div className="exception-priority">
                  <span>الأولوية</span>
                  <strong>{rule.priority}</strong>
                </div>
                <div className="exception-price">
                  <span>السعر البديل</span>
                  <strong>{rule.alternativePrice} د.ك</strong>
                </div>
                <div className="exception-conditions">
                  <span>الشروط</span>
                  <div>{rule.conditions.map((condition) => <b key={condition}>{condition}</b>)}</div>
                </div>
                <div className="exception-copy">
                  <h3>{rule.title}</h3>
                  <p>{rule.description}</p>
                  <span className={rule.active ? "active-pill" : "active-pill muted"}>{rule.active ? "مفعلة" : "معطلة"}</span>
                </div>
                <div className="exception-icon">{rule.icon}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="exceptions-bottom">
          <div className="simulation-result pricing-card">
            <header>
              <span>✓</span>
              <h2>نتيجة المحاكاة</h2>
            </header>
            <div className="simulation-total"><strong>{simulation.total} د.ك</strong><span>🪙</span></div>
            <h3>تفاصيل التسعير المطبقة</h3>
            <div className="simulation-lines">
              <div><b>{simulation.base} د.ك</b><span>القاعدة الأساسية</span><em>1</em></div>
              <div className="green"><b>{simulation.exception} د.ك</b><span>الاستثناء المطبق</span><em>2</em></div>
              <div><b>+ {simulation.addons} د.ك</b><span>الإضافات</span><em>3</em></div>
            </div>
          </div>

          <div className="pricing-card scenario-card">
            <header>
              <h2>اختر سيناريو الحجز</h2>
              <p>اختر تفاصيل الرحلة لمعرفة السعر والقاعدة المطبقة</p>
            </header>
            <div className="scenario-grid">
              <label><span>الجنسية</span><select value={nationality} onChange={(event) => setNationality(event.target.value)}><option>الكويت</option><option>مصري</option><option>سوري</option></select></label>
              <label><span>الباقة</span><select value={packageName} onChange={(event) => setPackageName(event.target.value)}><option>6 أيام - المجموعة A</option><option>11 يوم - المجموعة B</option></select></label>
              <label><span>عدد الأشخاص</span><select value={travelersCount} onChange={(event) => setTravelersCount(event.target.value)}><option>1 شخص</option><option>3 أشخاص</option></select></label>
              <label><span>نوع الغرفة</span><select value={roomType} onChange={(event) => setRoomType(event.target.value)}><option>رباعية</option><option>ثنائية</option></select></label>
              <label><span>طريقة السفر</span><select value={transport} onChange={(event) => setTransport(event.target.value)}><option>بالطيران</option><option>بدون طيران</option></select></label>
              <label><span>مصدر التأشيرة السابقة</span><select value={visaSource} onChange={(event) => setVisaSource(event.target.value)}><option>من شركة رواد</option><option>شركة أخرى</option><option>لا توجد</option></select></label>
              <label><span>الفندق</span><select value={hotel} onChange={(event) => setHotel(event.target.value)}><option>جميع الفنادق</option><option>قريب من الحرم</option></select></label>
            </div>
            <button className="ng-primary full" type="button">احسب السعر</button>
            <div className="scenario-note">
              <strong>ملاحظات مهمة</strong>
              <p>في حال انطباق أكثر من استثناء على الحجز، يتم تطبيق الاستثناء ذو الأولوية الأعلى.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
