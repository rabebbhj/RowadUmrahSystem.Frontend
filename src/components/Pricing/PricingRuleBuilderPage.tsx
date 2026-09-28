import { useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { AdminWelcomeBanner } from "../Layout/AdminWelcomeBanner";
import { SignedInSidebar } from "../Layout/SignedInSidebar";
import { PackageSectionsTabs } from "../Settings/PackageSectionsTabs";

type PricingRuleBuilderPageProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

type Condition = {
  id: string;
  field: string;
  operator: string;
  value: string;
};

const fieldOptions = ["الجنسية أو المجموعة", "مدة الرحلة", "نوع الغرفة", "وسيلة النقل", "أي شرط إضافي"];
const valueOptions = ["المجموعة A", "6 أيام", "ثنائية", "باص", "غير مهم"];

function makeId() {
  return `condition-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function PricingRuleBuilderPage({ user, activePath, onNavigate, onLogout }: PricingRuleBuilderPageProps) {
  const [ruleName, setRuleName] = useState("المجموعة A - 6 أيام - غرفة ثنائية");
  const [serviceType, setServiceType] = useState("رحلة عمرة");
  const [packageName, setPackageName] = useState("باقة 6 أيام");
  const [status, setStatus] = useState("مفعلة");
  const [priority, setPriority] = useState(1);
  const [conditions, setConditions] = useState<Condition[]>([
    { id: "c1", field: "الجنسية أو المجموعة", operator: "يساوي", value: "المجموعة A" },
    { id: "c2", field: "مدة الرحلة", operator: "يساوي", value: "6 أيام" },
    { id: "c3", field: "نوع الغرفة", operator: "يساوي", value: "ثنائية" },
    { id: "c4", field: "وسيلة النقل", operator: "يساوي", value: "باص" },
    { id: "c5", field: "أي شرط إضافي", operator: "يساوي", value: "غير مهم" }
  ]);
  const [price, setPrice] = useState(95);
  const [currency, setCurrency] = useState("د.ك");
  const [priceType, setPriceType] = useState("للشخص");
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [included, setIncluded] = useState(["فندق", "مواصلات", "تأشيرة", "زيارات"]);
  const [toast, setToast] = useState<string | null>(null);

  const preview = useMemo(() => {
    const byField = new Map(conditions.map((condition) => [condition.field, condition.value]));
    return {
      group: byField.get("الجنسية أو المجموعة") ?? "-",
      duration: byField.get("مدة الرحلة") ?? "-",
      room: byField.get("نوع الغرفة") ?? "-",
      transport: byField.get("وسيلة النقل") ?? "-"
    };
  }, [conditions]);

  const updateCondition = (id: string, changes: Partial<Condition>) => {
    setConditions((current) => current.map((condition) => (condition.id === id ? { ...condition, ...changes } : condition)));
  };

  const addCondition = () => {
    setConditions((current) => [...current, { id: makeId(), field: "أي شرط إضافي", operator: "يساوي", value: "غير مهم" }]);
  };

  const removeCondition = (id: string) => {
    setConditions((current) => current.filter((condition) => condition.id !== id));
  };

  const toggleIncluded = (value: string) => {
    setIncluded((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const save = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel pricing-admin-page pricing-rule-page" dir="rtl">
        {toast ? <div className="ng-toast">{toast}</div> : null}

        <AdminWelcomeBanner
          eyebrow="قواعد التسعير"
          title="إنشاء قاعدة تسعير جديدة"
          description="أضف الشروط وحدد السعر والأولوية وآلية التطبيق"
        />

        <PackageSectionsTabs active="rules" onNavigate={onNavigate} />

        <section className="pricing-rule-layout">
          <aside className="pricing-preview-panel">
            <h2><span>◉</span> معاينة القاعدة</h2>
            <img src="/landingpage/kaaba.png" alt="" />
            <div className="pricing-preview-list">
              <p>القاعدة سيتم تطبيقها على</p>
              <div><span>الجنسية / المجموعة</span><strong>{preview.group}</strong></div>
              <div><span>مدة الرحلة</span><strong>{preview.duration}</strong></div>
              <div><span>نوع الغرفة</span><strong>{preview.room}</strong></div>
              <div><span>وسيلة النقل</span><strong>{preview.transport}</strong></div>
            </div>
            <div className="pricing-preview-services">
              <strong>تشمل</strong>
              {included.map((item) => <span key={item}>{item}</span>)}
            </div>
            <div className="pricing-final-price">
              <span>السعر النهائي</span>
              <strong>{price} {currency}</strong>
              <small>للشخص الواحد</small>
            </div>
          </aside>

          <div className="pricing-rule-main">
            <section className="pricing-card">
              <h2>المعلومات الأساسية</h2>
              <div className="pricing-form-grid five">
                <label><span>اسم القاعدة *</span><input value={ruleName} onChange={(event) => setRuleName(event.target.value)} /></label>
                <label><span>نوع الخدمة *</span><select value={serviceType} onChange={(event) => setServiceType(event.target.value)}><option>رحلة عمرة</option><option>خدمة إضافية</option></select></label>
                <label><span>الباقة *</span><select value={packageName} onChange={(event) => setPackageName(event.target.value)}><option>باقة 6 أيام</option><option>باقة 9 أيام</option><option>باقة 11 يوم</option></select></label>
                <label><span>الحالة *</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>مفعلة</option><option>مسودة</option><option>معطلة</option></select></label>
                <label><span>الأولوية *</span><input type="number" min="1" value={priority} onChange={(event) => setPriority(Number(event.target.value) || 1)} /></label>
              </div>
            </section>

            <section className="pricing-card">
              <div className="pricing-section-title">
                <div>
                  <h2>الشروط</h2>
                  <p>حدد الشروط التي يجب توفرها لتطبيق هذه القاعدة</p>
                </div>
                <span>▽</span>
              </div>

              <div className="condition-builder-list">
                {conditions.map((condition) => (
                  <div className="condition-builder-row" key={condition.id}>
                    <button type="button" className="pricing-delete" onClick={() => removeCondition(condition.id)}>حذف</button>
                    <select value={condition.value} onChange={(event) => updateCondition(condition.id, { value: event.target.value })}>
                      {valueOptions.map((value) => <option key={value}>{value}</option>)}
                    </select>
                    <select value={condition.operator} onChange={(event) => updateCondition(condition.id, { operator: event.target.value })}>
                      <option>يساوي</option>
                      <option>لا يساوي</option>
                      <option>ضمن</option>
                    </select>
                    <select value={condition.field} onChange={(event) => updateCondition(condition.id, { field: event.target.value })}>
                      {fieldOptions.map((field) => <option key={field}>{field}</option>)}
                    </select>
                    <span className="drag-dot">⋮⋮</span>
                  </div>
                ))}
              </div>
              <button className="ng-primary pricing-add-condition" type="button" onClick={addCondition}>+ إضافة شرط</button>
            </section>

            <section className="pricing-bottom-grid">
              <div className="pricing-card">
                <h2>السعر</h2>
                <div className="pricing-form-grid four">
                  <label><span>السعر *</span><input type="number" value={price} onChange={(event) => setPrice(Number(event.target.value) || 0)} /></label>
                  <label><span>نوع السعر *</span><select value={priceType} onChange={(event) => setPriceType(event.target.value)}><option>للشخص</option><option>للمجموعة</option></select></label>
                  <label><span>العملة *</span><select value={currency} onChange={(event) => setCurrency(event.target.value)}><option>د.ك</option><option>ر.س</option><option>$</option></select></label>
                  <label className="pricing-switch"><span>يشمل الضريبة</span><input type="checkbox" checked={taxIncluded} onChange={(event) => setTaxIncluded(event.target.checked)} /></label>
                </div>
              </div>

              <div className="pricing-card">
                <h2>ماذا تشمل هذه القاعدة؟</h2>
                <p>اختر الخدمات المشمولة في هذه القاعدة</p>
                <div className="pricing-include-list">
                  {["فندق", "مواصلات", "تأشيرة", "زيارات"].map((item) => (
                    <button className={included.includes(item) ? "is-active" : ""} key={item} type="button" onClick={() => toggleIncluded(item)}>
                      {item} <span>✓</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <footer className="pricing-save-bar">
              <button type="button" className="ng-secondary" onClick={() => onNavigate("/settings")}>إلغاء</button>
              <button type="button" className="ng-secondary" onClick={() => save("تم حفظ القاعدة كمسودة.")}>حفظ كمسودة</button>
              <button type="button" className="ng-primary" onClick={() => save("تم حفظ القاعدة بنجاح.")}>حفظ القاعدة</button>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
