import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import {
  createInvoice,
  getInvoiceLookups,
  type InvoiceItemUpsertRequest,
  type InvoiceLookups,
  type InvoiceUpsertRequest,
  PaymentMethod
} from "../../api/invoices";
import { addDaysToDateInputValue, toDateInputValue } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type InvoicesCreatePanelProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

type InvoiceItemState = {
  description: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxRate: string;
};

type InvoiceFormState = {
  customerName: string;
  passportNumber: string;
  referenceNumber: string;
  invoiceDate: string;
  dueDate: string;
  travelerId: string;
  tripId: string;
  currencyId: string;
  costCenterId: string;
  paymentTermId: string;
  paymentMethod: string;
  receivableAccountId: string;
  revenueAccountId: string;
  notes: string;
  items: InvoiceItemState[];
};

function createEmptyItem(): InvoiceItemState {
  return {
    description: "",
    quantity: "1",
    unitPrice: "0",
    discountAmount: "0",
    taxRate: "0"
  };
}

function createEmptyForm(): InvoiceFormState {
  return {
    customerName: "",
    passportNumber: "",
    referenceNumber: "",
    invoiceDate: toDateInputValue(),
    dueDate: addDaysToDateInputValue(7),
    travelerId: "",
    tripId: "",
    currencyId: "",
    costCenterId: "",
    paymentTermId: "",
    paymentMethod: String(PaymentMethod.Cash),
    receivableAccountId: "",
    revenueAccountId: "",
    notes: "",
    items: [createEmptyItem()]
  };
}

function calculateLineTotals(items: InvoiceItemState[]) {
  let subTotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  let grandTotal = 0;

  const lineTotals = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const discount = Number(item.discountAmount) || 0;
    const taxRate = Number(item.taxRate) || 0;

    const lineSubTotal = qty * price;
    const taxable = Math.max(0, lineSubTotal - discount);
    const tax = taxable * (taxRate / 100);
    const lineTotal = taxable + tax;

    subTotal += lineSubTotal;
    discountTotal += discount;
    taxTotal += tax;
    grandTotal += lineTotal;

    return lineTotal;
  });

  return { subTotal, discountTotal, taxTotal, grandTotal, lineTotals };
}

export function InvoicesCreatePanel({ user, activePath, onNavigate, onLogout }: InvoicesCreatePanelProps) {
  const [lookups, setLookups] = useState<InvoiceLookups | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceFormState>(createEmptyForm());

  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      setLoadingLookups(true);

      try {
        const items = await getInvoiceLookups();
        if (!cancelled) {
          setLookups(items);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onLogout();
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load invoice lookups");
      } finally {
        if (!cancelled) {
          setLoadingLookups(false);
        }
      }
    }

    void loadLookups();

    return () => {
      cancelled = true;
    };
  }, [onLogout]);

  function updateItem(index: number, patch: Partial<InvoiceItemState>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    }));
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      items: [...current.items, createEmptyItem()]
    }));
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      items: current.items.length > 1 ? current.items.filter((_, itemIndex) => itemIndex !== index) : [createEmptyItem()]
    }));
  }

  async function handleReadPassport() {
    setFormError("قراءة بيانات الجواز من الصفحة الأصلية غير مفعلة هنا. يمكنك إدخال البيانات يدوياً أو متابعة الإرسال.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setError(null);

    try {
      const payload: InvoiceUpsertRequest = {
        travelerId: form.travelerId ? Number(form.travelerId) : null,
        tripId: form.tripId ? Number(form.tripId) : null,
        currencyId: form.currencyId ? Number(form.currencyId) : null,
        costCenterId: form.costCenterId ? Number(form.costCenterId) : null,
        paymentTermId: form.paymentTermId ? Number(form.paymentTermId) : null,
        customerName: form.customerName,
        passportNumber: form.passportNumber || null,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || null,
        paymentMethod: Number(form.paymentMethod) as PaymentMethod,
        referenceNumber: form.referenceNumber,
        receivableAccountId: Number(form.receivableAccountId),
        revenueAccountId: Number(form.revenueAccountId),
        notes: form.notes,
        items: form.items.map((item): InvoiceItemUpsertRequest => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discountAmount),
          taxRate: Number(item.taxRate)
        }))
      };

      const saved = await createInvoice(payload);
      onNavigate(`/invoices/${saved.id}`);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setFormError(error instanceof Error ? error.message : "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  }

  const lookupValues: InvoiceLookups = lookups ?? {
    travelers: [],
    trips: [],
    currencies: [],
    costCenters: [],
    paymentTerms: [],
    receivableAccounts: [],
    revenueAccounts: []
  };

  const totalsLine = useMemo(() => calculateLineTotals(form.items), [form.items]);

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="main-panel">
        <div className="page-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h1 className="page-title mb-1">إنشاء فاتورة</h1>
              <p className="text-muted mb-0">إنشاء فاتورة عميل مع توليد قيد محاسبي تلقائي.</p>
            </div>

            <button type="button" className="btn btn-light" onClick={() => onNavigate("/invoices")}>
              رجوع
            </button>
          </div>

          {formError && <div className="alert alert-danger">{formError}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {loadingLookups && <div className="state-box">جاري تحميل بيانات الفاتورة...</div>}

          <form id="invoiceForm" onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4 mb-4">
                <div className="accounting-panel h-100">
                  <h4 className="section-title">بيانات الفاتورة</h4>

                  <div className="mb-3">
                    <label className="form-label">اسم العميل</label>
                    <input
                      name="CustomerName"
                      className="form-control"
                      value={form.customerName}
                      onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">رقم الجواز</label>
                    <input
                      name="PassportNumber"
                      className="form-control"
                      value={form.passportNumber}
                      onChange={(event) => setForm((current) => ({ ...current, passportNumber: event.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">رقم المرجع</label>
                    <input
                      name="ReferenceNumber"
                      className="form-control"
                      value={form.referenceNumber}
                      onChange={(event) => setForm((current) => ({ ...current, referenceNumber: event.target.value }))}
                    />
                  </div>

                  <div className="alert alert-info mb-0">
                    هذه الصفحة تنشئ فاتورة مرتبطة بالمحاسبة تلقائياً، بنفس منطق صفحة Razor الأصلية.
                  </div>
                </div>
              </div>

              <div className="col-lg-8 mb-4">
                <div className="accounting-panel h-100">
                  <h4 className="section-title">بيانات الرحلة والربط المحاسبي</h4>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">تاريخ الفاتورة</label>
                      <input
                        name="InvoiceDate"
                        type="date"
                        className="form-control"
                        value={form.invoiceDate}
                        onChange={(event) => setForm((current) => ({ ...current, invoiceDate: event.target.value }))}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">تاريخ الاستحقاق</label>
                      <input
                        name="DueDate"
                        type="date"
                        className="form-control"
                        value={form.dueDate}
                        onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">المسافر</label>
                      <select
                        name="TravelerId"
                        className="form-select"
                        value={form.travelerId}
                        onChange={(event) => setForm((current) => ({ ...current, travelerId: event.target.value }))}
                      >
                        <option value="">بدون مسافر</option>
                        {lookupValues.travelers.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">الرحلة</label>
                      <select
                        name="TripId"
                        className="form-select"
                        value={form.tripId}
                        onChange={(event) => setForm((current) => ({ ...current, tripId: event.target.value }))}
                      >
                        <option value="">بدون رحلة</option>
                        {lookupValues.trips.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">العملة</label>
                      <select
                        name="CurrencyId"
                        className="form-select"
                        value={form.currencyId}
                        onChange={(event) => setForm((current) => ({ ...current, currencyId: event.target.value }))}
                      >
                        <option value="">بدون عملة</option>
                        {lookupValues.currencies.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">مركز التكلفة</label>
                      <select
                        name="CostCenterId"
                        className="form-select"
                        value={form.costCenterId}
                        onChange={(event) => setForm((current) => ({ ...current, costCenterId: event.target.value }))}
                      >
                        <option value="">بدون مركز تكلفة</option>
                        {lookupValues.costCenters.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">شروط الدفع</label>
                      <select
                        name="PaymentTermId"
                        className="form-select"
                        value={form.paymentTermId}
                        onChange={(event) => setForm((current) => ({ ...current, paymentTermId: event.target.value }))}
                      >
                        <option value="">بدون شروط دفع</option>
                        {lookupValues.paymentTerms.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">طريقة الدفع</label>
                      <select
                        name="PaymentMethod"
                        className="form-select"
                        value={form.paymentMethod}
                        onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                      >
                        <option value={PaymentMethod.Cash}>نقدي</option>
                        <option value={PaymentMethod.BankTransfer}>تحويل بنكي</option>
                        <option value={PaymentMethod.KNet}>KNet</option>
                        <option value={PaymentMethod.Visa}>Visa</option>
                        <option value={PaymentMethod.Cheque}>شيك</option>
                        <option value={PaymentMethod.Other}>أخرى</option>
                      </select>
                    </div>
                  </div>

                  <h4 className="section-title mt-4">الحسابات المحاسبية</h4>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">حساب العملاء / الذمم المدينة</label>
                      <select
                        name="ReceivableAccountId"
                        className="form-select"
                        value={form.receivableAccountId}
                        onChange={(event) => setForm((current) => ({ ...current, receivableAccountId: event.target.value }))}
                      >
                        <option value="">اختر حساب الذمم</option>
                        {lookupValues.receivableAccounts.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">حساب الإيرادات</label>
                      <select
                        name="RevenueAccountId"
                        className="form-select"
                        value={form.revenueAccountId}
                        onChange={(event) => setForm((current) => ({ ...current, revenueAccountId: event.target.value }))}
                      >
                        <option value="">اختر حساب الإيرادات</option>
                        {lookupValues.revenueAccounts.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="accounting-panel mb-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="section-title mb-1">الخدمات</h4>
                  <p className="text-muted mb-0">أدخل الخدمات أو البنود الخاصة بالفاتورة.</p>
                </div>
                <span className="accounting-panel-badge">Items</span>
              </div>

              <div className="table-responsive">
                <table className="table rowad-table align-middle" id="invoiceItemsTable">
                  <thead>
                    <tr>
                      <th style={{ width: "30%" }}>الوصف</th>
                      <th>الكمية</th>
                      <th>السعر</th>
                      <th>الخصم</th>
                      <th>الضريبة %</th>
                      <th>الإجمالي</th>
                      <th style={{ width: 80 }}>حذف</th>
                    </tr>
                  </thead>

                  <tbody>
                    {form.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            name={`Items[${index}].Description`}
                            className="form-control"
                            placeholder="مثال: رسوم رحلة عمرة"
                            value={item.description}
                            onChange={(event) => updateItem(index, { description: event.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            name={`Items[${index}].Quantity`}
                            className="form-control"
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.quantity}
                            onChange={(event) => updateItem(index, { quantity: event.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            name={`Items[${index}].UnitPrice`}
                            className="form-control"
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.unitPrice}
                            onChange={(event) => updateItem(index, { unitPrice: event.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            name={`Items[${index}].DiscountAmount`}
                            className="form-control"
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.discountAmount}
                            onChange={(event) => updateItem(index, { discountAmount: event.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            name={`Items[${index}].TaxRate`}
                            className="form-control"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.taxRate}
                            onChange={(event) => updateItem(index, { taxRate: event.target.value })}
                          />
                        </td>
                        <td>
                          <strong>{totalsLine.lineTotals[index].toFixed(3)}</strong>
                        </td>
                        <td>
                          <button type="button" className="btn btn-sm btn-light" onClick={() => removeItem(index)}>
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button type="button" className="btn btn-outline-gold mt-3" onClick={addItem} disabled={loadingLookups}>
                إضافة بند
              </button>
            </div>

            <div className="row g-4 mb-4">
              <div className="col-lg-7">
                <div className="accounting-panel h-100">
                  <h4 className="section-title">ملاحظات</h4>
                  <textarea
                    name="Notes"
                    className="form-control"
                    rows={6}
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  />
                </div>
              </div>

              <div className="col-lg-5">
                <div className="accounting-panel h-100">
                  <h4 className="section-title">الملخص المالي</h4>

                  <div className="accounting-summary-row">
                    <span>الإجمالي قبل الخصم</span>
                    <strong>{totalsLine.subTotal.toFixed(3)}</strong>
                  </div>

                  <div className="accounting-summary-row">
                    <span>إجمالي الخصم</span>
                    <strong>{totalsLine.discountTotal.toFixed(3)}</strong>
                  </div>

                  <div className="accounting-summary-row">
                    <span>إجمالي الضريبة</span>
                    <strong>{totalsLine.taxTotal.toFixed(3)}</strong>
                  </div>

                  <div className="accounting-summary-row">
                    <span>الإجمالي النهائي</span>
                    <strong>{totalsLine.grandTotal.toFixed(3)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-card">
              <div className="d-flex flex-wrap justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">حفظ الفاتورة</h5>
                  <small className="text-muted">تأكد من مراجعة بيانات الفاتورة قبل الحفظ.</small>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-gold" disabled={saving || loadingLookups}>
                    حفظ الفاتورة
                  </button>

                  <button type="button" className="btn btn-light" onClick={() => onNavigate("/invoices")}>
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
