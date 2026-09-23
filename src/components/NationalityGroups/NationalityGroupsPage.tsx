import { useMemo, useRef, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type Nationality = {
  code: string;
  nameAr: string;
};

type NationalityGroup = {
  id: string;
  name: string;
  description: string;
  nationalities: Nationality[];
  relatedRules: string[];
};

type NationalityGroupsPageProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

type NationalityGroupCardProps = {
  group: NationalityGroup;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

type NationalityGroupEditorProps = {
  group: NationalityGroup;
  nationalities: Nationality[];
  allowMultipleMembership: boolean;
  onChange: (group: NationalityGroup) => void;
  onCancel: () => void;
  onSave: () => void;
};

type NationalitySelectorProps = {
  nationalities: Nationality[];
  selected: Nationality[];
  onAdd: (nationality: Nationality) => void;
};

type RelatedRulesListProps = {
  rules: string[];
};

type ImportNationalitiesDialogProps = {
  open: boolean;
  onClose: () => void;
  onImport: (rows: ImportRow[]) => void;
};

type ImportRow = {
  groupName: string;
  nationality: string;
};

const allNationalities: Nationality[] = [
  { code: "EG", nameAr: "مصري" },
  { code: "IN", nameAr: "هندي" },
  { code: "BD", nameAr: "بنغلاديشي" },
  { code: "SY", nameAr: "سوري" },
  { code: "SD", nameAr: "سوداني" },
  { code: "NG", nameAr: "نيجيري" },
  { code: "AF", nameAr: "أفغاني" },
  { code: "MA", nameAr: "مغربي" },
  { code: "DZ", nameAr: "جزائري" },
  { code: "TN", nameAr: "تونسي" },
  { code: "LY", nameAr: "ليبي" },
  { code: "ID", nameAr: "إندونيسي" },
  { code: "MY", nameAr: "ماليزي" },
  { code: "PK", nameAr: "باكستاني" },
  { code: "PH", nameAr: "فلبيني" },
  { code: "JO", nameAr: "أردني" },
  { code: "LB", nameAr: "لبناني" },
  { code: "IQ", nameAr: "عراقي" },
  { code: "YE", nameAr: "يمني" },
  { code: "KW", nameAr: "كويتي" },
  { code: "SA", nameAr: "سعودي" },
  { code: "TR", nameAr: "تركي" },
  { code: "IR", nameAr: "إيراني" },
  { code: "LK", nameAr: "سريلانكي" },
  { code: "NP", nameAr: "نيبالي" },
  { code: "ET", nameAr: "إثيوبي" },
  { code: "SN", nameAr: "سنغالي" }
];

const starterGroups: NationalityGroup[] = [
  {
    id: "group-a",
    name: "المجموعة A",
    description: "تشمل الدول ذات الأسعار الموحدة في الفئة الاقتصادية",
    nationalities: allNationalities.filter((item) => ["EG", "IN", "BD"].includes(item.code)),
    relatedRules: ["باقة 6 أيام - المجموعة A", "باقة 9 أيام - اقتصادي", "باقة 11 يوم - مكة فقط", "موسم رمضان - المجموعة A"]
  },
  {
    id: "group-b",
    name: "المجموعة B",
    description: "تشمل دول جنوب آسيا وأفريقيا المختارة.",
    nationalities: allNationalities.filter((item) => ["SY", "SD", "NG", "AF"].includes(item.code)),
    relatedRules: ["باقة 7 أيام - المجموعة B", "باقة 11 يوما بدون طيران", "عرض العائلات", "موسم شعبان", "سعر اقتصادي B", "تأشيرة خاصة"]
  },
  {
    id: "group-c",
    name: "المجموعة C",
    description: "تشمل دول المغرب العربي.",
    nationalities: allNationalities.filter((item) => ["MA", "DZ", "TN", "LY"].includes(item.code)),
    relatedRules: ["باقة 10 أيام - المجموعة C", "رحلة المدينة أولا", "عرض الغرفة الثنائية", "موسم الربيع", "باقة مكة والمدينة", "خصم المجموعات", "سعر ثابت C", "تسعير الخدمات"]
  },
  {
    id: "group-d",
    name: "المجموعة D",
    description: "تشمل دول جنوب شرق آسيا.",
    nationalities: allNationalities.filter((item) => ["ID", "MY", "PK", "PH"].includes(item.code)),
    relatedRules: ["باقة 14 يوم - آسيا", "برنامج العائلات", "رحلة الباص", "عرض الفنادق", "خدمة التأشيرة"]
  },
  {
    id: "group-e",
    name: "المجموعة E",
    description: "مجموعة الدول العربية الأخرى.",
    nationalities: allNationalities.filter((item) => ["JO", "LB", "IQ", "YE"].includes(item.code)),
    relatedRules: ["باقة 5 أيام - المجموعة E", "عرض نهاية الأسبوع", "سعر رمضان"]
  }
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function findNationality(value: string) {
  const normalized = value.trim().toLowerCase();
  return allNationalities.find(
    (item) => item.nameAr.toLowerCase() === normalized || item.code.toLowerCase() === normalized
  );
}

function parseCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const groupIndex = headers.indexOf("group_name");
  const nationalityIndex = headers.indexOf("nationality");

  if (groupIndex < 0 || nationalityIndex < 0) return [];

  return lines.slice(1).map((line) => {
    const columns = line.split(",").map((item) => item.trim());
    return {
      groupName: columns[groupIndex] ?? "",
      nationality: columns[nationalityIndex] ?? ""
    };
  }).filter((row) => row.groupName && row.nationality);
}

function StatIcon({ children }: { children: string }) {
  return <span className="ng-stat-icon" aria-hidden="true">{children}</span>;
}

export function NationalityGroupCard({ group, selected, onSelect, onDuplicate, onDelete }: NationalityGroupCardProps) {
  return (
    <article className={selected ? "ng-group-card is-selected" : "ng-group-card"} onClick={onSelect}>
      <div className="ng-card-main">
        <div className="ng-card-heading">
          <span className="ng-card-icon">👥</span>
          <div>
            <h3>{group.name}</h3>
            <p>{group.description}</p>
          </div>
        </div>

        <div className="ng-chip-list">
          {group.nationalities.map((nationality) => (
            <span className="ng-chip" key={nationality.code}>{nationality.nameAr}</span>
          ))}
        </div>
      </div>

      <div className="ng-card-rules">
        <strong>{group.relatedRules.length}</strong>
        <span>قواعد مرتبطة</span>
      </div>

      <div className="ng-card-actions" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onSelect}>تعديل</button>
        <button type="button" onClick={onDuplicate}>نسخ</button>
        <button type="button" className="danger" onClick={onDelete}>حذف</button>
      </div>
    </article>
  );
}

export function NationalitySelector({ nationalities, selected, onAdd }: NationalitySelectorProps) {
  const [query, setQuery] = useState("");
  const selectedCodes = new Set(selected.map((item) => item.code));
  const matches = nationalities
    .filter((item) => !selectedCodes.has(item.code))
    .filter((item) => item.nameAr.includes(query.trim()) || item.code.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 5);

  return (
    <div className="ng-selector">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ابحث عن جنسية لإضافتها..."
        aria-label="ابحث عن جنسية لإضافتها"
      />

      {query.trim() ? (
        <div className="ng-selector-menu">
          {matches.length ? matches.map((nationality) => (
            <button
              key={nationality.code}
              type="button"
              onClick={() => {
                onAdd(nationality);
                setQuery("");
              }}
            >
              {nationality.nameAr}
              <span>{nationality.code}</span>
            </button>
          )) : <span className="ng-selector-empty">لا توجد نتائج مطابقة</span>}
        </div>
      ) : null}
    </div>
  );
}

export function RelatedRulesList({ rules }: RelatedRulesListProps) {
  return (
    <section className="ng-editor-section">
      <div className="ng-section-head">
        <h3>القواعد المتأثرة ({rules.length})</h3>
        <button type="button">عرض الكل</button>
      </div>

      <div className="ng-rules-list">
        {rules.map((rule) => (
          <div key={rule}>
            <span>▧</span>
            <strong>{rule}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function NationalityGroupEditor({
  group,
  nationalities,
  allowMultipleMembership,
  onChange,
  onCancel,
  onSave
}: NationalityGroupEditorProps) {
  const removeNationality = (code: string) => {
    onChange({ ...group, nationalities: group.nationalities.filter((item) => item.code !== code) });
  };

  const addNationality = (nationality: Nationality) => {
    if (group.nationalities.some((item) => item.code === nationality.code)) return;
    onChange({ ...group, nationalities: [...group.nationalities, nationality] });
  };

  return (
    <aside className="ng-editor">
      <div className="ng-editor-title">
        <div>
          <h2>تفاصيل المجموعة</h2>
          <p>محدد حالياً</p>
        </div>
        <span className="ng-live-badge">محدد حالياً</span>
      </div>

      <label className="ng-field">
        <span>اسم المجموعة *</span>
        <input value={group.name} onChange={(event) => onChange({ ...group, name: event.target.value })} />
      </label>

      <label className="ng-field">
        <span>الوصف</span>
        <textarea value={group.description} onChange={(event) => onChange({ ...group, description: event.target.value })} maxLength={200} />
        <small>{group.description.length}/200</small>
      </label>

      <section className="ng-editor-section">
        <h3>أضف جنسية</h3>
        <NationalitySelector nationalities={nationalities} selected={group.nationalities} onAdd={addNationality} />
        <p className="ng-policy-note">
          {allowMultipleMembership
            ? "السياسة الحالية تسمح بوجود الجنسية في أكثر من مجموعة عند الحاجة."
            : "السياسة الحالية تمنع إضافة الجنسية نفسها داخل المجموعة أكثر من مرة."}
        </p>
      </section>

      <section className="ng-editor-section">
        <h3>الجنسيات في المجموعة ({group.nationalities.length})</h3>
        <div className="ng-chip-list">
          {group.nationalities.map((nationality) => (
            <button className="ng-chip removable" type="button" key={nationality.code} onClick={() => removeNationality(nationality.code)}>
              {nationality.nameAr}
              <span>×</span>
            </button>
          ))}
        </div>
      </section>

      <RelatedRulesList rules={group.relatedRules} />

      <footer className="ng-editor-actions">
        <button type="button" className="ng-secondary" onClick={onCancel}>إلغاء</button>
        <button type="button" className="ng-primary" onClick={onSave}>حفظ التغييرات</button>
      </footer>
    </aside>
  );
}

export function ImportNationalitiesDialog({ open, onClose, onImport }: ImportNationalitiesDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const readFile = async (file: File) => {
    setFileName(file.name);
    setRows([]);
    setError(null);

    if (file.name.toLowerCase().endsWith(".xlsx")) {
      setError("تم اختيار ملف Excel. لا يمكن معاينة XLSX بدون مكتبة قراءة Excel، لذلك لن يتم الاستيراد قبل التحويل إلى CSV بالأعمدة group_name و nationality.");
      return;
    }

    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.length) {
      setError("تعذر قراءة الملف. تأكد من وجود الأعمدة group_name و nationality.");
      return;
    }

    setRows(parsed);
  };

  return (
    <div className="ng-modal-backdrop" role="dialog" aria-modal="true" aria-label="استيراد من Excel">
      <div className="ng-modal">
        <header>
          <div>
            <span className="eyebrow">Import</span>
            <h2>استيراد من Excel</h2>
            <p>لا يتم استبدال البيانات الحالية بصمت. راجع المعاينة ثم أكد الاستيراد.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق">×</button>
        </header>

        <button className="ng-upload" type="button" onClick={() => inputRef.current?.click()}>
          اختيار ملف XLSX/CSV
          <span>{fileName || "group_name, nationality"}</span>
        </button>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".xlsx,.csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void readFile(file);
          }}
        />

        {error ? <div className="ng-import-error">{error}</div> : null}

        {rows.length ? (
          <div className="ng-import-preview">
            <h3>معاينة الاستيراد ({rows.length})</h3>
            <table>
              <thead>
                <tr>
                  <th>group_name</th>
                  <th>nationality</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((row, index) => (
                  <tr key={`${row.groupName}-${row.nationality}-${index}`}>
                    <td>{row.groupName}</td>
                    <td>{row.nationality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <footer>
          <button type="button" className="ng-secondary" onClick={onClose}>إلغاء</button>
          <button type="button" className="ng-primary" disabled={!rows.length} onClick={() => onImport(rows)}>
            تأكيد الاستيراد
          </button>
        </footer>
      </div>
    </div>
  );
}

export function NationalityGroupsPage({ user, activePath, onNavigate, onLogout }: NationalityGroupsPageProps) {
  const [groups, setGroups] = useState<NationalityGroup[]>(starterGroups);
  const [selectedId, setSelectedId] = useState(starterGroups[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [allowMultipleMembership, setAllowMultipleMembership] = useState(false);

  const selectedGroup = groups.find((group) => group.id === selectedId) ?? groups[0];
  const totalNationalities = new Set(groups.flatMap((group) => group.nationalities.map((item) => item.code))).size;
  const relatedRulesCount = groups.reduce((sum, group) => sum + group.relatedRules.length, 0);
  const availableNationalities = useMemo(() => {
    if (allowMultipleMembership || !selectedGroup) return allNationalities;

    const usedInOtherGroups = new Set(
      groups
        .filter((group) => group.id !== selectedGroup.id)
        .flatMap((group) => group.nationalities.map((nationality) => nationality.code))
    );

    return allNationalities.filter((nationality) => !usedInOtherGroups.has(nationality.code));
  }, [allowMultipleMembership, groups, selectedGroup]);

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) return groups;

    return groups.filter((group) =>
      [group.name, group.description, ...group.nationalities.map((item) => item.nameAr)].some((value) => value.includes(term))
    );
  }, [groups, searchTerm]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const updateSelectedGroup = (nextGroup: NationalityGroup) => {
    setGroups((current) => current.map((group) => (group.id === nextGroup.id ? nextGroup : group)));
  };

  const createGroup = () => {
    const newGroup: NationalityGroup = {
      id: makeId("group"),
      name: "مجموعة جديدة",
      description: "وصف المجموعة الجديدة",
      nationalities: [],
      relatedRules: []
    };

    setGroups((current) => [newGroup, ...current]);
    setSelectedId(newGroup.id);
    showToast("تم إنشاء مجموعة جديدة.");
  };

  const duplicateGroup = (group: NationalityGroup) => {
    const copy = {
      ...group,
      id: makeId("group-copy"),
      name: `${group.name} - نسخة`,
      relatedRules: []
    };

    setGroups((current) => [copy, ...current]);
    setSelectedId(copy.id);
    showToast("تم نسخ المجموعة.");
  };

  const deleteGroup = (group: NationalityGroup) => {
    if (!window.confirm(`هل تريد حذف ${group.name}؟ ستتأثر ${group.relatedRules.length} قواعد مرتبطة.`)) return;

    setGroups((current) => {
      const nextGroups = current.filter((item) => item.id !== group.id);
      setSelectedId(nextGroups[0]?.id ?? "");
      return nextGroups;
    });
    showToast("تم حذف المجموعة.");
  };

  const importRows = (rows: ImportRow[]) => {
    setGroups((current) => {
      const nextGroups = [...current];

      rows.forEach((row) => {
        const nationality = findNationality(row.nationality) ?? { code: row.nationality.slice(0, 3).toUpperCase(), nameAr: row.nationality };
        const groupIndex = nextGroups.findIndex((group) => group.name === row.groupName);
        const existingGroupIndex = nextGroups.findIndex((group) =>
          group.nationalities.some((item) => item.code === nationality.code)
        );

        if (!allowMultipleMembership && existingGroupIndex >= 0 && existingGroupIndex !== groupIndex) {
          return;
        }

        if (groupIndex >= 0) {
          const group = nextGroups[groupIndex];
          if (!group.nationalities.some((item) => item.code === nationality.code)) {
            nextGroups[groupIndex] = { ...group, nationalities: [...group.nationalities, nationality] };
          }
        } else {
          nextGroups.push({
            id: makeId("imported-group"),
            name: row.groupName,
            description: "تم إنشاؤها من ملف الاستيراد.",
            nationalities: [nationality],
            relatedRules: []
          });
        }
      });

      return nextGroups;
    });
    setImportOpen(false);
    showToast("تم استيراد البيانات بعد المعاينة.");
  };

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel nationality-groups-page" dir="rtl">
        {toast ? <div className="ng-toast">{toast}</div> : null}

        <section className="ng-hero">
          <div>
            <span className="eyebrow">Nationality Groups</span>
            <h1>إدارة مجموعات الجنسيات</h1>
            <p>تنظيم الجنسيات في مجموعات لتسعير أسرع وأكثر مرونة</p>
          </div>
        </section>

        <section className="ng-stats">
          <article>
            <StatIcon>▰</StatIcon>
            <span>عدد المجموعات</span>
            <strong>12</strong>
          </article>
          <article>
            <StatIcon>●</StatIcon>
            <span>إجمالي الجنسيات</span>
            <strong>{totalNationalities}</strong>
          </article>
          <article>
            <StatIcon>▧</StatIcon>
            <span>القواعد المرتبطة</span>
            <strong>{relatedRulesCount}</strong>
          </article>
        </section>

        <section className="ng-workspace">
          {selectedGroup ? (
            <NationalityGroupEditor
              group={selectedGroup}
              nationalities={availableNationalities}
              allowMultipleMembership={allowMultipleMembership}
              onChange={updateSelectedGroup}
              onCancel={() => showToast("تم إلغاء التعديل.")}
              onSave={() => showToast("تم حفظ التغييرات بنجاح.")}
            />
          ) : null}

          <div className="ng-list-panel">
            <div className="ng-actions-bar">
              <label className="ng-search">
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="بحث في المجموعات..." />
                <span>⌕</span>
              </label>

              <button type="button" className="ng-secondary" onClick={() => setImportOpen(true)}>استيراد من Excel</button>
              <button type="button" className="ng-primary" onClick={createGroup}>+ إنشاء مجموعة جديدة</button>
            </div>

            <label className="ng-toggle">
              <input
                type="checkbox"
                checked={allowMultipleMembership}
                onChange={(event) => setAllowMultipleMembership(event.target.checked)}
              />
              السماح للجنسية بالانتماء إلى أكثر من مجموعة
            </label>

            <div className="ng-groups-list">
              {filteredGroups.map((group) => (
                <NationalityGroupCard
                  key={group.id}
                  group={group}
                  selected={group.id === selectedId}
                  onSelect={() => setSelectedId(group.id)}
                  onDuplicate={() => duplicateGroup(group)}
                  onDelete={() => deleteGroup(group)}
                />
              ))}
            </div>
          </div>
        </section>

        <ImportNationalitiesDialog open={importOpen} onClose={() => setImportOpen(false)} onImport={importRows} />
      </main>
    </div>
  );
}
