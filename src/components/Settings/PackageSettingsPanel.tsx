import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../api/auth";
import {
  calculatePackagePrice,
  createEmptyPackage,
  createPackage,
  deletePackage,
  duplicatePackage,
  getAdminPackages,
  getPackageFromPrice,
  resolvePackageImageUrl,
  updatePackage,
  type PackageOption,
  type PricingCondition,
  type PricingRule,
  type TravelPackage
} from "../../api/travelPackages";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type PackageSettingsPanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

const statusOptions = [
  { value: "published", label: "منشورة" },
  { value: "draft", label: "مسودة" },
  { value: "paused", label: "موقوفة" }
];

const priceModeOptions = [
  { value: "rules", label: "حسب قواعد التسعير" },
  { value: "fixed", label: "سعر ثابت" }
];

const conditionFields = [
  { value: "nationality", label: "الجنسية" },
  { value: "roomType", label: "نوع الغرفة" },
  { value: "transport", label: "وسيلة النقل" },
  { value: "travelers", label: "عدد المسافرين" },
  { value: "departureDate", label: "تاريخ السفر" },
  { value: "previousVisa", label: "التأشيرة السابقة" },
  { value: "visaIssuer", label: "مصدر التأشيرة" },
  { value: "durationDays", label: "مدة الرحلة" }
];

const conditionOperators = [
  { value: "equals", label: "يساوي" },
  { value: "notEquals", label: "لا يساوي" },
  { value: "in", label: "ضمن" },
  { value: "notIn", label: "ليس ضمن" },
  { value: "gt", label: "أكبر من" },
  { value: "lt", label: "أقل من" },
  { value: "range", label: "من ... إلى" }
];

const statusLabel = (value: string) => statusOptions.find((item) => item.value === value)?.label ?? value;
const activeOptions = (items: PackageOption[]) => items.filter((item) => item.active);

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function option(label = ""): PackageOption {
  return {
    id: makeId("option"),
    label,
    active: true,
    supplement: 0,
    price: null
  };
}

function condition(): PricingCondition {
  return {
    field: "roomType",
    operator: "equals",
    value: ""
  };
}

function rule(): PricingRule {
  return {
    id: makeId("rule"),
    name: "قاعدة تسعير جديدة",
    conditions: [],
    price: 0,
    priceType: "perPerson",
    priority: 10,
    active: true
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function PackageSettingsPanel({ user, activePath, onNavigate, onLogout }: PackageSettingsPanelProps) {
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<TravelPackage | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"packages" | "rules" | "groups" | "services">("packages");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPackages = async () => {
    setLoading(true);
    setError(null);

    try {
      setPackages(await getAdminPackages());
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "تعذر تحميل إعدادات الباقات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPackages();
  }, []);

  const filteredPackages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return packages.filter((packageItem) => {
      const matchesSearch =
        !term ||
        [packageItem.name, packageItem.shortTitle, packageItem.description]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus = statusFilter === "all" || packageItem.status === statusFilter;
      const matchesDuration = durationFilter === "all" || String(packageItem.durationDays) === durationFilter;
      const matchesType = typeFilter === "all" || packageItem.transportOptions.some((item) => item.label === typeFilter);

      return matchesSearch && matchesStatus && matchesDuration && matchesType;
    });
  }, [durationFilter, packages, searchTerm, statusFilter, typeFilter]);

  const durations = useMemo(() => [...new Set(packages.map((item) => item.durationDays))].sort((a, b) => a - b), [packages]);
  const transportLabels = useMemo(
    () => [...new Set(packages.flatMap((item) => item.transportOptions.map((transport) => transport.label)))],
    [packages]
  );

  const openCreateDrawer = () => {
    setEditingPackage(createEmptyPackage(packages.length + 1));
    setDrawerOpen(true);
    setMessage(null);
    setError(null);
  };

  const openEditDrawer = (packageItem: TravelPackage) => {
    setEditingPackage(structuredClone(packageItem));
    setDrawerOpen(true);
    setMessage(null);
    setError(null);
  };

  const updateEditing = (changes: Partial<TravelPackage>) => {
    setEditingPackage((current) => (current ? { ...current, ...changes } : current));
  };

  const saveEditingPackage = async (publish = false) => {
    if (!editingPackage) return;

    const request = {
      ...editingPackage,
      durationLabel: `${editingPackage.durationDays} أيام`,
      status: publish ? "published" : editingPackage.status
    };

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const saved = request.id ? await updatePackage(request.id, request) : await createPackage(request);

      setPackages((current) => {
        const exists = current.some((item) => item.id === saved.id);
        return exists
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved].sort((a, b) => a.displayOrder - b.displayOrder);
      });
      setEditingPackage(saved);
      setDrawerOpen(false);
      setMessage(publish ? "تم نشر الباقة بنجاح." : "تم حفظ الباقة بنجاح.");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setError(error instanceof Error ? error.message : "تعذر حفظ الباقة.");
    } finally {
      setSaving(false);
    }
  };

  const togglePackageStatus = async (packageItem: TravelPackage) => {
    const nextStatus = packageItem.status === "published" ? "paused" : "published";
    const updated = { ...packageItem, status: nextStatus };

    try {
      const saved = await updatePackage(packageItem.id, updated);
      setPackages((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setMessage(nextStatus === "published" ? "تم تفعيل الباقة." : "تم إيقاف الباقة.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "تعذر تحديث حالة الباقة.");
    }
  };

  const duplicateExistingPackage = async (id: string) => {
    try {
      const copy = await duplicatePackage(id);
      setPackages((current) => [...current, copy].sort((a, b) => a.displayOrder - b.displayOrder));
      setMessage("تم نسخ الباقة كمسودة.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "تعذر نسخ الباقة.");
    }
  };

  const removePackage = async (id: string) => {
    if (!window.confirm("هل تريد حذف هذه الباقة؟")) return;

    try {
      await deletePackage(id);
      setPackages((current) => current.filter((item) => item.id !== id));
      setMessage("تم حذف الباقة.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "تعذر حذف الباقة.");
    }
  };

  const movePackage = async (id: string, direction: -1 | 1) => {
    const ordered = [...packages].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = ordered.findIndex((item) => item.id === id);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;

    [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
    const updated = ordered.map((item, itemIndex) => ({ ...item, displayOrder: itemIndex + 1 }));
    setPackages(updated);

    await Promise.all(updated.map((item) => updatePackage(item.id, item)));
  };

  const updateOption = (
    key: "roomTypes" | "transportOptions",
    index: number,
    changes: Partial<PackageOption>
  ) => {
    setEditingPackage((current) => {
      if (!current) return current;
      const items = current[key].map((item, itemIndex) => (itemIndex === index ? { ...item, ...changes } : item));
      return { ...current, [key]: items };
    });
  };

  const removeOption = (key: "roomTypes" | "transportOptions", index: number) => {
    setEditingPackage((current) => {
      if (!current) return current;
      return { ...current, [key]: current[key].filter((_, itemIndex) => itemIndex !== index) };
    });
  };

  const addOption = (key: "roomTypes" | "transportOptions", label: string) => {
    setEditingPackage((current) => {
      if (!current) return current;
      return { ...current, [key]: [...current[key], option(label)] };
    });
  };

  const updateRule = (index: number, changes: Partial<PricingRule>) => {
    setEditingPackage((current) => {
      if (!current) return current;
      return {
        ...current,
        pricingRules: current.pricingRules.map((item, itemIndex) => (itemIndex === index ? { ...item, ...changes } : item))
      };
    });
  };

  const updateCondition = (ruleIndex: number, conditionIndex: number, changes: Partial<PricingCondition>) => {
    setEditingPackage((current) => {
      if (!current) return current;
      return {
        ...current,
        pricingRules: current.pricingRules.map((pricingRule, index) => {
          if (index !== ruleIndex) return pricingRule;
          return {
            ...pricingRule,
            conditions: pricingRule.conditions.map((item, itemIndex) =>
              itemIndex === conditionIndex ? { ...item, ...changes } : item
            )
          };
        })
      };
    });
  };

  const addCondition = (ruleIndex: number) => {
    setEditingPackage((current) => {
      if (!current) return current;
      return {
        ...current,
        pricingRules: current.pricingRules.map((pricingRule, index) =>
          index === ruleIndex ? { ...pricingRule, conditions: [...pricingRule.conditions, condition()] } : pricingRule
        )
      };
    });
  };

  const removeCondition = (ruleIndex: number, conditionIndex: number) => {
    setEditingPackage((current) => {
      if (!current) return current;
      return {
        ...current,
        pricingRules: current.pricingRules.map((pricingRule, index) =>
          index === ruleIndex
            ? { ...pricingRule, conditions: pricingRule.conditions.filter((_, itemIndex) => itemIndex !== conditionIndex) }
            : pricingRule
        )
      };
    });
  };

  const addRule = () => {
    setEditingPackage((current) =>
      current ? { ...current, pricingRules: [...current.pricingRules, rule()] } : current
    );
  };

  const removeRule = (index: number) => {
    setEditingPackage((current) =>
      current ? { ...current, pricingRules: current.pricingRules.filter((_, itemIndex) => itemIndex !== index) } : current
    );
  };

  const addDepartureDate = (value: string) => {
    if (!value) return;
    setEditingPackage((current) =>
      current
        ? { ...current, departureDates: [...new Set([...current.departureDates, value])].sort() }
        : current
    );
  };

  const removeDepartureDate = (date: string) => {
    setEditingPackage((current) =>
      current ? { ...current, departureDates: current.departureDates.filter((item) => item !== date) } : current
    );
  };

  const uploadPreviewImage = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    updateEditing({ imageUrl: dataUrl });
  };

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel package-admin" dir="rtl">
        <section className="package-admin-hero">
          <div>
            <span className="eyebrow">إدارة الأسعار</span>
            <h1>إدارة الباقات والأسعار</h1>
            <p>إنشاء وتعديل الباقات التي تظهر في الموقع مع قواعد تسعير مرنة حسب الشروط.</p>
          </div>
          <button type="button" className="package-primary-action" onClick={openCreateDrawer}>
            + إضافة باقة جديدة
          </button>
        </section>

        <section className="package-admin-tabs" aria-label="أقسام الإعدادات">
          <button className={activeTab === "packages" ? "is-active" : ""} type="button" onClick={() => setActiveTab("packages")}>الباقات</button>
          <button className={activeTab === "rules" ? "is-active" : ""} type="button" onClick={() => onNavigate("/pricing-rules")}>قواعد التسعير</button>
          <button className={activeTab === "groups" ? "is-active" : ""} type="button" onClick={() => onNavigate("/nationality-groups")}>مجموعات الجنسيات</button>
          <button className={activeTab === "services" ? "is-active" : ""} type="button" onClick={() => onNavigate("/services-addons")}>الخدمات والإضافات</button>
        </section>

        <section className="package-filters">
          <label>
            <span>بحث</span>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="ابحث عن باقة..." />
          </label>
          <label>
            <span>الحالة</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">الكل</option>
              {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span>المدة</span>
            <select value={durationFilter} onChange={(event) => setDurationFilter(event.target.value)}>
              <option value="all">جميع الباقات</option>
              {durations.map((duration) => <option key={duration} value={duration}>{duration} أيام</option>)}
            </select>
          </label>
          <label>
            <span>نوع الرحلة</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">جميع الخدمات</option>
              {transportLabels.map((label) => <option key={label} value={label}>{label}</option>)}
            </select>
          </label>
        </section>

        {message ? <div className="state-box">{message}</div> : null}
        {error ? <div className="state-box error">{error}</div> : null}
        {loading ? <div className="state-box">جارٍ تحميل الباقات...</div> : null}

        <section className="package-admin-list">
          {filteredPackages.map((packageItem, index) => {
            const fromPrice = getPackageFromPrice(packageItem);
            const isPublished = packageItem.status === "published";

            return (
              <article className="package-admin-card" key={packageItem.id}>
                <div className="package-admin-card__media" style={{ backgroundImage: `url(${resolvePackageImageUrl(packageItem.imageUrl)})` }}>
                  <span>{packageItem.durationLabel}</span>
                </div>
                <div className="package-admin-card__body">
                  <div className="package-admin-card__title">
                    <small>#{String(index + 1).padStart(3, "0")}</small>
                    <h3>{packageItem.name}</h3>
                    <span className={isPublished ? "package-status is-live" : "package-status"}>{statusLabel(packageItem.status)}</span>
                  </div>
                  <p>{packageItem.description || packageItem.shortTitle}</p>
                  <div className="package-tags">
                    {activeOptions(packageItem.roomTypes).slice(0, 4).map((item) => <span key={item.id}>{item.label}</span>)}
                    {activeOptions(packageItem.transportOptions).slice(0, 2).map((item) => <span key={item.id}>{item.label}</span>)}
                  </div>
                  <div className="package-card-meta">
                    <strong>{fromPrice.toLocaleString("en-US")} {packageItem.currency}</strong>
                    <small>تبدأ من للشخص الواحد</small>
                    <em>آخر تعديل: {packageItem.updatedAt.slice(0, 10)}</em>
                  </div>
                  <div className="package-card-actions">
                    <button type="button" onClick={() => openEditDrawer(packageItem)}>تعديل</button>
                    <button type="button" onClick={() => void duplicateExistingPackage(packageItem.id)}>نسخ</button>
                    <button type="button" onClick={() => void togglePackageStatus(packageItem)}>{isPublished ? "إيقاف" : "نشر"}</button>
                    <button type="button" className="danger" onClick={() => void removePackage(packageItem.id)}>حذف</button>
                    <button type="button" onClick={() => void movePackage(packageItem.id, -1)}>↑</button>
                    <button type="button" onClick={() => void movePackage(packageItem.id, 1)}>↓</button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {!loading && filteredPackages.length === 0 ? (
          <div className="state-box">لا توجد باقات مطابقة للفلاتر الحالية.</div>
        ) : null}

        {drawerOpen && editingPackage ? (
          <div className="package-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
            <aside className="package-drawer" onClick={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <span className="eyebrow">Settings</span>
                  <h2>{editingPackage.id ? "تعديل باقة" : "إضافة باقة جديدة"}</h2>
                </div>
                <button type="button" onClick={() => setDrawerOpen(false)} aria-label="إغلاق">×</button>
              </header>

              <div className="package-form-grid">
                <label>
                  اسم الباقة
                  <input value={editingPackage.name} onChange={(event) => updateEditing({ name: event.target.value })} />
                </label>
                <label>
                  العنوان المختصر
                  <input value={editingPackage.shortTitle} onChange={(event) => updateEditing({ shortTitle: event.target.value })} />
                </label>
                <label className="wide">
                  الوصف
                  <textarea value={editingPackage.description} onChange={(event) => updateEditing({ description: event.target.value })} />
                </label>
                <label>
                  عدد الأيام
                  <input type="number" min="1" value={editingPackage.durationDays} onChange={(event) => updateEditing({ durationDays: Number(event.target.value) || 1 })} />
                </label>
                <label>
                  ترتيب الظهور
                  <input type="number" min="1" value={editingPackage.displayOrder} onChange={(event) => updateEditing({ displayOrder: Number(event.target.value) || 1 })} />
                </label>
                <label>
                  السعر يبدأ من
                  <input type="number" min="0" value={editingPackage.basePrice} onChange={(event) => updateEditing({ basePrice: Number(event.target.value) || 0 })} />
                </label>
                <label>
                  طريقة حساب السعر
                  <select value={editingPackage.priceMode} onChange={(event) => updateEditing({ priceMode: event.target.value })}>
                    {priceModeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label>
                  حالة الباقة
                  <select value={editingPackage.status} onChange={(event) => updateEditing({ status: event.target.value })}>
                    {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label className="wide">
                  صورة الباقة
                  <input value={editingPackage.imageUrl} onChange={(event) => updateEditing({ imageUrl: event.target.value })} />
                  <input type="file" accept="image/*" onChange={(event) => void uploadPreviewImage(event.target.files?.[0])} />
                </label>
              </div>

              <section className="package-editor-section">
                <div className="package-editor-head">
                  <h3>أنواع الغرف</h3>
                  <button type="button" onClick={() => addOption("roomTypes", "غرفة جديدة")}>+ إضافة نوع غرفة</button>
                </div>
                {editingPackage.roomTypes.map((item, index) => (
                  <div className="package-option-row" key={item.id}>
                    <input value={item.label} onChange={(event) => updateOption("roomTypes", index, { label: event.target.value })} />
                    <input type="number" min="0" value={item.supplement ?? 0} onChange={(event) => updateOption("roomTypes", index, { supplement: Number(event.target.value) || 0 })} />
                    <label><input type="checkbox" checked={item.active} onChange={(event) => updateOption("roomTypes", index, { active: event.target.checked })} /> مفعلة</label>
                    <button type="button" onClick={() => removeOption("roomTypes", index)}>حذف</button>
                  </div>
                ))}
              </section>

              <section className="package-editor-section">
                <div className="package-editor-head">
                  <h3>وسائل النقل</h3>
                  <button type="button" onClick={() => addOption("transportOptions", "باص")}>+ إضافة وسيلة نقل</button>
                </div>
                {editingPackage.transportOptions.map((item, index) => (
                  <div className="package-option-row" key={item.id}>
                    <input value={item.label} onChange={(event) => updateOption("transportOptions", index, { label: event.target.value })} />
                    <input type="number" min="0" value={item.supplement ?? 0} onChange={(event) => updateOption("transportOptions", index, { supplement: Number(event.target.value) || 0 })} />
                    <label><input type="checkbox" checked={item.active} onChange={(event) => updateOption("transportOptions", index, { active: event.target.checked })} /> مفعلة</label>
                    <button type="button" onClick={() => removeOption("transportOptions", index)}>حذف</button>
                  </div>
                ))}
              </section>

              <section className="package-editor-section">
                <div className="package-editor-head">
                  <h3>مواعيد الانطلاق</h3>
                  <input type="date" onChange={(event) => addDepartureDate(event.target.value)} />
                </div>
                <div className="package-chip-list">
                  {editingPackage.departureDates.map((date) => (
                    <button key={date} type="button" onClick={() => removeDepartureDate(date)}>{date} ×</button>
                  ))}
                </div>
              </section>

              <section className="package-editor-section">
                <div className="package-editor-head">
                  <h3>قواعد التسعير</h3>
                  <button type="button" onClick={addRule}>+ إضافة قاعدة تسعير</button>
                </div>
                {editingPackage.pricingRules.map((pricingRule, ruleIndex) => (
                  <article className="pricing-rule-editor" key={pricingRule.id}>
                    <div className="pricing-rule-grid">
                      <input value={pricingRule.name} onChange={(event) => updateRule(ruleIndex, { name: event.target.value })} placeholder="اسم القاعدة" />
                      <input type="number" min="0" value={pricingRule.price} onChange={(event) => updateRule(ruleIndex, { price: Number(event.target.value) || 0 })} placeholder="السعر" />
                      <input type="number" min="0" value={pricingRule.priority} onChange={(event) => updateRule(ruleIndex, { priority: Number(event.target.value) || 0 })} placeholder="الأولوية" />
                      <label><input type="checkbox" checked={pricingRule.active} onChange={(event) => updateRule(ruleIndex, { active: event.target.checked })} /> مفعلة</label>
                      <button type="button" onClick={() => removeRule(ruleIndex)}>حذف القاعدة</button>
                    </div>
                    <div className="condition-list">
                      {pricingRule.conditions.map((item, conditionIndex) => (
                        <div className="condition-row" key={`${pricingRule.id}-${conditionIndex}`}>
                          <select value={item.field} onChange={(event) => updateCondition(ruleIndex, conditionIndex, { field: event.target.value })}>
                            {conditionFields.map((field) => <option key={field.value} value={field.value}>{field.label}</option>)}
                          </select>
                          <select value={item.operator} onChange={(event) => updateCondition(ruleIndex, conditionIndex, { operator: event.target.value })}>
                            {conditionOperators.map((operator) => <option key={operator.value} value={operator.value}>{operator.label}</option>)}
                          </select>
                          <input value={item.value} onChange={(event) => updateCondition(ruleIndex, conditionIndex, { value: event.target.value })} placeholder="القيمة" />
                          <button type="button" onClick={() => removeCondition(ruleIndex, conditionIndex)}>×</button>
                        </div>
                      ))}
                      <button type="button" className="package-mini-button" onClick={() => addCondition(ruleIndex)}>+ إضافة شرط</button>
                    </div>
                  </article>
                ))}
              </section>

              <section className="package-preview">
                <h3>معاينة الباقة</h3>
                <div className="gv-travel-card package-preview-card">
                  <div className="gv-travel-card__media" style={{ backgroundImage: `url(${resolvePackageImageUrl(editingPackage.imageUrl)})` }}>
                    <span>{editingPackage.durationDays} أيام</span>
                  </div>
                  <div className="gv-travel-card__body">
                    <div className="gv-travel-card__features gv-travel-card__features--controls">
                      <label><strong>تاريخ الحجز</strong><select><option>{editingPackage.departureDates[0] ?? "اختر التاريخ"}</option></select></label>
                      <label><strong>نوع الغرفة</strong><select><option>{activeOptions(editingPackage.roomTypes)[0]?.label ?? "نوع الغرفة"}</option></select></label>
                      <label><strong>وسيلة النقل</strong><select><option>{activeOptions(editingPackage.transportOptions)[0]?.label ?? "وسيلة النقل"}</option></select></label>
                    </div>
                    <div className="gv-travel-card__divider" />
                    <div className="gv-travel-card__footer">
                      <p>تبدأ من <b>{calculatePackagePrice(editingPackage, {})}</b> {editingPackage.currency}</p>
                      <button type="button">حجز</button>
                    </div>
                  </div>
                </div>
              </section>

              <footer className="package-drawer-actions">
                <button type="button" className="package-outline-action" onClick={() => setDrawerOpen(false)}>إلغاء</button>
                <button type="button" className="package-outline-action" onClick={() => void saveEditingPackage(false)} disabled={saving}>
                  {editingPackage.status === "draft" ? "حفظ كمسودة" : "حفظ التعديلات"}
                </button>
                <button type="button" className="package-primary-action" onClick={() => void saveEditingPackage(true)} disabled={saving}>نشر الباقة</button>
              </footer>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}
