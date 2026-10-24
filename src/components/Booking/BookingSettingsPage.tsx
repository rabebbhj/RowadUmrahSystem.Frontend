import { useEffect, useState } from "react";
import type { AuthUser } from "../../api/auth";
import { getAdminPackages, type TravelPackage } from "../../api/travelPackages";
import {
  cityLabels, getBookingConfig, roomTypeLabels, saveBookingConfig, uploadHotelPhoto,
  type BookingConfig, type HotelConfig, type PackBookingConfig, type RoomTypeConfig
} from "../../api/bookingAdmin";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type Props = { user: AuthUser; activePath: string; onNavigate: (path: string) => void; onLogout: () => void };

const numberOrNull = (value: string) => (value.trim() === "" ? null : Number(value));
const newRoom = (type: string, beds: number): RoomTypeConfig => ({ type, beds, roomsPerDeparture: 20, familySupplementPerRoomPerNight: 0, sharedSupplementPerBedPerNight: 0 });

/**
 * Settings of the app's booking flow (spec § 8.3): visa fees, thresholds, pack prices and nights,
 * hotels (photos, distance, amenities, supplements, room stock) and nationalities. The total
 * shown to travelers is always computed by the server from these values.
 */
export function BookingSettingsPage({ user, activePath, onNavigate, onLogout }: Props) {
  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getBookingConfig(), getAdminPackages().catch(() => [])]).then(([value, items]) => {
      setConfig(value);
      setPackages(items);
    }).catch((problem: Error) => (problem.message === "UNAUTHORIZED" ? onLogout() : setError(problem.message)));
  }, [onLogout]);

  if (!config) {
    return <div className="app-shell"><SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-panel" dir="rtl">{error ? <div className="alert alert-danger">{error}</div> : <div className="state-box">جارٍ التحميل…</div>}</main></div>;
  }

  const set = (patch: Partial<BookingConfig>) => setConfig({ ...config, ...patch });
  const setPack = (index: number, patch: Partial<PackBookingConfig>) => set({ packs: config.packs.map((pack, position) => (position === index ? { ...pack, ...patch } : pack)) });
  const setHotel = (index: number, patch: Partial<HotelConfig>) => set({ hotels: config.hotels.map((hotel, position) => (position === index ? { ...hotel, ...patch } : hotel)) });
  const setRoom = (hotelIndex: number, roomIndex: number, patch: Partial<RoomTypeConfig>) =>
    setHotel(hotelIndex, { rooms: config.hotels[hotelIndex].rooms.map((room, position) => (position === roomIndex ? { ...room, ...patch } : room)) });

  const addHotel = () => set({
    hotels: [...config.hotels, {
      id: `hotel-${Date.now().toString(36)}`, name: "فندق جديد", city: "makkah", stars: null, district: "", walkMinutes: null, description: "", amenities: [], photos: [],
      latitude: null, longitude: null, placeholder: false, supplementPerPersonPerNight: 0, rooms: [newRoom("double", 2), newRoom("triple", 3), newRoom("quad", 4)]
    }]
  });
  const removeHotel = (index: number) => {
    const id = config.hotels[index].id;
    set({
      hotels: config.hotels.filter((_, position) => position !== index),
      packs: config.packs.map(pack => ({ ...pack, hotels: Object.fromEntries(Object.entries(pack.hotels).map(([city, ids]) => [city, ids.filter(item => item !== id)])) }))
    });
  };
  const toggleHotelInPack = (packIndex: number, city: string, id: string) => {
    const pack = config.packs[packIndex];
    const ids = pack.hotels[city] ?? [];
    setPack(packIndex, { hotels: { ...pack.hotels, [city]: ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id] } });
  };
  const addPhoto = async (index: number, file: File | undefined) => {
    if (!file) return;
    try {
      const { url } = await uploadHotelPhoto(file);
      setHotel(index, { photos: [...config.hotels[index].photos, url] });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "تعذر رفع الصورة.");
    }
  };
  const addPack = (packageId: string) => {
    if (!packageId || config.packs.some(pack => pack.packageId === packageId)) return;
    set({ packs: [...config.packs, { packageId, nights: { makkah: 3, madinah: 0 }, adultPrice: null, childPrice: null, priceByNationality: {}, busPrice: 20, seatsPerDeparture: 45, hotels: { makkah: [], madinah: [] } }] });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      setConfig(await saveBookingConfig(config));
      setMessage("تمّ حفظ إعدادات الحجز. تُطبَّق فوراً على التطبيق.");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "تعذر الحفظ.");
    } finally {
      setSaving(false);
    }
  };

  const packageName = (id: string) => packages.find(item => item.id === id)?.name ?? id;
  const basePrice = (id: string) => packages.find(item => item.id === id)?.basePrice;

  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-panel" dir="rtl">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <div>
            <h1 className="page-title mb-1">إعدادات الحجز في التطبيق</h1>
            <p className="text-muted mb-0">الأسعار والتأشيرة والفنادق والغرف. الإجمالي يحسبه الخادم دائماً من هذه القيم.</p>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/rooming")}>توزيع الغرف</button>
            <button type="button" className="btn btn-gold" disabled={saving} onClick={save}>{saving ? "جارٍ الحفظ…" : "حفظ"}</button>
          </div>
        </div>
        {error ? <div className="alert alert-danger">{error}</div> : null}
        {message ? <div className="alert alert-success">{message}</div> : null}

        <section className="page-card mb-4">
          <h2 className="h5 mb-3">التأشيرة والمهل</h2>
          <div className="row g-3">
            <Field label="رسوم التأشيرة عبر روّاد (د.ك)" value={config.visaFees.rowad} onChange={value => set({ visaFees: { ...config.visaFees, rowad: Number(value) } })} />
            <Field label="رسوم مراجعة تأشيرة سارية (د.ك)" value={config.visaFees.existing} onChange={value => set({ visaFees: { ...config.visaFees, existing: Number(value) } })} />
            <Field label="حدّ «أماكن قليلة» (مقاعد)" value={config.fewSeatsThreshold} onChange={value => set({ fewSeatsThreshold: Number(value) })} />
            <Field label="حجز المقاعد أثناء الدفع (دقائق)" value={config.paymentHoldMinutes} onChange={value => set({ paymentHoldMinutes: Number(value) })} />
            <Field label="انتهاء المسودة (أيام)" value={config.draftExpiryDays} onChange={value => set({ draftExpiryDays: Number(value) })} />
            <Field label="صلاحية الجواز بعد العودة (أشهر)" value={config.minPassportValidityMonths} onChange={value => set({ minPassportValidityMonths: Number(value) })} />
            <Field label="تجميد قائمة الغرف قبل السفر (أيام)" value={config.roomingFreezeDaysBeforeDeparture} onChange={value => set({ roomingFreezeDaysBeforeDeparture: Number(value) })} />
            <div className="col-md-3">
              <label className="form-label">البطاقة المدنية</label>
              <select className="form-select" value={config.documents.civilIdRequired ? "yes" : "no"} onChange={event => set({ documents: { ...config.documents, civilIdRequired: event.target.value === "yes" } })}>
                <option value="yes">مطلوبة</option><option value="no">غير مطلوبة</option>
              </select>
            </div>
            <Field label="البطاقة المدنية من عمر (سنة)" value={config.documents.civilIdMinAge} onChange={value => set({ documents: { ...config.documents, civilIdMinAge: Number(value) } })} />
          </div>
        </section>

        <section className="page-card mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">الباقات</h2>
            <select className="form-select w-auto" value="" onChange={event => addPack(event.target.value)}>
              <option value="">إضافة باقة للحجز…</option>
              {packages.filter(item => !config.packs.some(pack => pack.packageId === item.id)).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          {config.packs.map((pack, index) => (
            <div key={pack.packageId} className="border rounded-3 p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>{packageName(pack.packageId)}</strong>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => set({ packs: config.packs.filter((_, position) => position !== index) })}>إزالة من الحجز</button>
              </div>
              <div className="row g-3">
                <Field label="ليالي مكة" value={pack.nights.makkah} onChange={value => setPack(index, { nights: { ...pack.nights, makkah: Number(value) } })} />
                <Field label="ليالي المدينة" value={pack.nights.madinah} onChange={value => setPack(index, { nights: { ...pack.nights, madinah: Number(value) } })} />
                <Field label={`سعر البالغ (فارغ = ${basePrice(pack.packageId) ?? "السعر الأساسي"})`} value={pack.adultPrice ?? ""} onChange={value => setPack(index, { adultPrice: numberOrNull(value) })} />
                <Field label="سعر الطفل (فارغ = سعر البالغ)" value={pack.childPrice ?? ""} onChange={value => setPack(index, { childPrice: numberOrNull(value) })} />
                <Field label="الباص لكل مسافر (د.ك)" value={pack.busPrice} onChange={value => setPack(index, { busPrice: Number(value) })} />
                <Field label="المقاعد لكل موعد" value={pack.seatsPerDeparture} onChange={value => setPack(index, { seatsPerDeparture: Number(value) })} />
              </div>
              {(["makkah", "madinah"] as const).filter(city => city === "makkah" || pack.nights.madinah > 0).map(city => (
                <div key={city} className="mt-3">
                  <div className="small text-muted mb-1">فنادق {cityLabels[city]}</div>
                  <div className="d-flex flex-wrap gap-3">
                    {config.hotels.filter(hotel => hotel.city === city).map(hotel => (
                      <label key={hotel.id} className="form-check">
                        <input className="form-check-input" type="checkbox" checked={(pack.hotels[city] ?? []).includes(hotel.id)} onChange={() => toggleHotelInPack(index, city, hotel.id)} />
                        <span className="form-check-label">{hotel.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <NationalityPrices pack={pack} nationalities={config.nationalities.map(item => item.name)} onChange={priceByNationality => setPack(index, { priceByNationality })} />
            </div>
          ))}
        </section>

        <section className="page-card mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">الفنادق والغرف</h2>
            <button type="button" className="btn btn-outline-gold" onClick={addHotel}>إضافة فندق</button>
          </div>
          {config.hotels.map((hotel, index) => (
            <div key={hotel.id} className="border rounded-3 p-3 mb-3">
              <div className="row g-3">
                <div className="col-md-4"><label className="form-label">الاسم</label><input className="form-control" value={hotel.name} onChange={event => setHotel(index, { name: event.target.value })} /></div>
                <div className="col-md-2">
                  <label className="form-label">المدينة</label>
                  <select className="form-select" value={hotel.city} onChange={event => setHotel(index, { city: event.target.value as HotelConfig["city"] })}>
                    <option value="makkah">مكة المكرمة</option><option value="madinah">المدينة المنورة</option>
                  </select>
                </div>
                <Field label="النجوم" value={hotel.stars ?? ""} onChange={value => setHotel(index, { stars: numberOrNull(value) })} cols={2} />
                <Field label="دقائق مشياً إلى الحرم" value={hotel.walkMinutes ?? ""} onChange={value => setHotel(index, { walkMinutes: numberOrNull(value) })} cols={2} />
                <Field label="فرق السعر للفرد/ليلة" value={hotel.supplementPerPersonPerNight} onChange={value => setHotel(index, { supplementPerPersonPerNight: Number(value) })} cols={2} />
                <div className="col-md-4"><label className="form-label">الحي</label><input className="form-control" value={hotel.district ?? ""} onChange={event => setHotel(index, { district: event.target.value })} /></div>
                <div className="col-md-4"><label className="form-label">المرافق (مفصولة بفاصلة)</label><input className="form-control" value={hotel.amenities.join("، ")} onChange={event => setHotel(index, { amenities: event.target.value.split(/[,،]/).map(item => item.trim()).filter(Boolean) })} /></div>
                <Field label="خط العرض" value={hotel.latitude ?? ""} onChange={value => setHotel(index, { latitude: numberOrNull(value) })} cols={2} />
                <Field label="خط الطول" value={hotel.longitude ?? ""} onChange={value => setHotel(index, { longitude: numberOrNull(value) })} cols={2} />
                <div className="col-12"><label className="form-label">الوصف</label><textarea className="form-control" rows={2} value={hotel.description ?? ""} onChange={event => setHotel(index, { description: event.target.value })} /></div>
                <div className="col-12">
                  <label className="form-check">
                    <input className="form-check-input" type="checkbox" checked={hotel.placeholder} onChange={event => setHotel(index, { placeholder: event.target.checked })} />
                    <span className="form-check-label">الاسم يحدّده روّاد لاحقاً (يُعرض «يحدّده روّاد قبل السفر»)</span>
                  </label>
                </div>
              </div>
              <div className="mt-3">
                <div className="small text-muted mb-2">الصور</div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  {hotel.photos.map(photo => (
                    <div key={photo} className="position-relative">
                      <img src={photo} alt="" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 10 }} />
                      <button type="button" className="btn btn-sm btn-danger position-absolute top-0 start-0" onClick={() => setHotel(index, { photos: hotel.photos.filter(item => item !== photo) })}>×</button>
                    </div>
                  ))}
                  <label className="btn btn-outline-secondary btn-sm mb-0">إضافة صورة<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => addPhoto(index, event.target.files?.[0])} /></label>
                </div>
              </div>
              <div className="table-responsive mt-3">
                <table className="table table-bordered align-middle mb-2">
                  <thead><tr><th>نوع الغرفة</th><th>الأسرّة</th><th>الغرف لكل موعد</th><th>فرق غرفة العائلة/ليلة</th><th>فرق السرير المشترك/ليلة</th><th /></tr></thead>
                  <tbody>
                    {hotel.rooms.map((room, roomIndex) => (
                      <tr key={roomIndex}>
                        <td>
                          <select className="form-select form-select-sm" value={room.type} onChange={event => setRoom(index, roomIndex, { type: event.target.value })}>
                            {Object.entries(roomTypeLabels).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
                          </select>
                        </td>
                        <td><input type="number" className="form-control form-control-sm" value={room.beds} onChange={event => setRoom(index, roomIndex, { beds: Number(event.target.value) })} /></td>
                        <td><input type="number" className="form-control form-control-sm" value={room.roomsPerDeparture} onChange={event => setRoom(index, roomIndex, { roomsPerDeparture: Number(event.target.value) })} /></td>
                        <td><input type="number" className="form-control form-control-sm" value={room.familySupplementPerRoomPerNight} onChange={event => setRoom(index, roomIndex, { familySupplementPerRoomPerNight: Number(event.target.value) })} /></td>
                        <td><input type="number" className="form-control form-control-sm" value={room.sharedSupplementPerBedPerNight} onChange={event => setRoom(index, roomIndex, { sharedSupplementPerBedPerNight: Number(event.target.value) })} /></td>
                        <td><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setHotel(index, { rooms: hotel.rooms.filter((_, position) => position !== roomIndex) })}>حذف</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="d-flex justify-content-between">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setHotel(index, { rooms: [...hotel.rooms, newRoom("quad", 4)] })}>إضافة نوع غرفة</button>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeHotel(index)}>حذف الفندق</button>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="page-card mb-4">
          <h2 className="h5 mb-3">الجنسيات ونوع التأشيرة</h2>
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead><tr><th>الجنسية</th><th>نوع التأشيرة</th><th>شائعة (تظهر أولاً)</th><th /></tr></thead>
              <tbody>
                {config.nationalities.map((item, index) => (
                  <tr key={index}>
                    <td><input className="form-control form-control-sm" value={item.name} onChange={event => set({ nationalities: config.nationalities.map((entry, position) => (position === index ? { ...entry, name: event.target.value } : entry)) })} /></td>
                    <td>
                      <select className="form-select form-select-sm" value={item.visaType} onChange={event => set({ nationalities: config.nationalities.map((entry, position) => (position === index ? { ...entry, visaType: event.target.value } : entry)) })}>
                        <option value="umrah">عمرة</option><option value="tourist">سياحية</option>
                      </select>
                    </td>
                    <td className="text-center">
                      <input type="checkbox" className="form-check-input" checked={config.frequentNationalities.includes(item.name)}
                        onChange={event => set({ frequentNationalities: event.target.checked ? [...config.frequentNationalities, item.name] : config.frequentNationalities.filter(name => name !== item.name) })} />
                    </td>
                    <td><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => set({ nationalities: config.nationalities.filter((_, position) => position !== index) })}>حذف</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => set({ nationalities: [...config.nationalities, { name: "", visaType: "tourist" }] })}>إضافة جنسية</button>
        </section>

        <div className="d-flex justify-content-end mb-5">
          <button type="button" className="btn btn-gold" disabled={saving} onClick={save}>{saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}</button>
        </div>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, cols = 3 }: { label: string; value: number | string; onChange: (value: string) => void; cols?: number }) {
  return (
    <div className={`col-md-${cols}`}>
      <label className="form-label">{label}</label>
      <input type="number" step="any" className="form-control" value={value} onChange={event => onChange(event.target.value)} />
    </div>
  );
}

/** Optional prices by nationality (empty = pack price). */
function NationalityPrices({ pack, nationalities, onChange }: { pack: PackBookingConfig; nationalities: string[]; onChange: (value: PackBookingConfig["priceByNationality"]) => void }) {
  const prices = pack.priceByNationality ?? {};
  const [adding, setAdding] = useState("");
  const entries = Object.entries(prices);
  return (
    <div className="mt-3">
      <div className="small text-muted mb-1">أسعار خاصة حسب الجنسية (اختياري)</div>
      {entries.map(([name, price]) => (
        <div key={name} className="d-flex gap-2 align-items-center mb-2">
          <span style={{ minWidth: 90 }}>{name}</span>
          <input type="number" className="form-control form-control-sm w-auto" placeholder="بالغ" value={price.adult ?? ""} onChange={event => onChange({ ...prices, [name]: { ...price, adult: numberOrNull(event.target.value) } })} />
          <input type="number" className="form-control form-control-sm w-auto" placeholder="طفل" value={price.child ?? ""} onChange={event => onChange({ ...prices, [name]: { ...price, child: numberOrNull(event.target.value) } })} />
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onChange(Object.fromEntries(entries.filter(([key]) => key !== name)))}>×</button>
        </div>
      ))}
      <div className="d-flex gap-2">
        <select className="form-select form-select-sm w-auto" value={adding} onChange={event => setAdding(event.target.value)}>
          <option value="">جنسية…</option>
          {nationalities.filter(name => name && !prices[name]).map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!adding} onClick={() => { onChange({ ...prices, [adding]: { adult: null, child: null } }); setAdding(""); }}>إضافة</button>
      </div>
    </div>
  );
}
