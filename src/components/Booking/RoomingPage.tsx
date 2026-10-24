import { useCallback, useEffect, useState } from "react";
import type { AuthUser } from "../../api/auth";
import {
  cancelBooking, cityLabels, getDepartures, getRooming, lockRoom, lockTraveler, moveTraveler, placeBooking, rebalance, roomingExportUrl,
  type DepartureSummary, type RoomingList, type RoomingOccupant, type RoomingPool, type RoomingRoom
} from "../../api/bookingAdmin";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type Props = { user: AuthUser; activePath: string; onNavigate: (path: string) => void; onLogout: () => void };

const statusLabels: Record<string, string> = { confirmed: "مؤكد", pending_payment: "بانتظار الدفع", cancelled: "ملغى", expired: "منتهي" };

/**
 * Rooming list per departure (spec § 5.5): rooms by hotel and type, sex, occupants, nationalities,
 * free beds, mixed rooms highlighted; lock a traveler or a room, move by hand, rebalance,
 * export for the hotel and the supervisor, cancel a booking.
 */
export function RoomingPage({ user, activePath, onNavigate, onLogout }: Props) {
  const [departures, setDepartures] = useState<DepartureSummary[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [list, setList] = useState<RoomingList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [packageId, departureDate] = selected ? selected.split("|") : ["", ""];

  const fail = useCallback((problem: unknown) => {
    if (problem instanceof Error && problem.message === "UNAUTHORIZED") onLogout();
    else setError(problem instanceof Error ? problem.message : "تعذر إكمال الطلب.");
  }, [onLogout]);

  useEffect(() => {
    getDepartures().then(items => {
      setDepartures(items);
      if (items.length) setSelected(current => current || `${items[0].packageId}|${items[0].departureDate}`);
    }).catch(fail);
  }, [fail]);

  const load = useCallback(() => {
    if (!packageId) return;
    getRooming(packageId, departureDate).then(setList).catch(fail);
  }, [packageId, departureDate, fail]);
  useEffect(load, [load]);

  const act = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(done);
      load();
    } catch (problem) {
      fail(problem);
    } finally {
      setBusy(false);
    }
  };

  const move = (occupant: RoomingOccupant, pool: RoomingPool) => {
    const value = window.prompt(`نقل ${occupant.name} إلى غرفة رقم (1 - ${pool.capacity}):`);
    const roomNumber = Number(value);
    if (!value || !Number.isInteger(roomNumber)) return;
    const reason = window.prompt("سبب النقل (يُسجَّل):", "طلب المسافر") ?? "manual";
    void act(() => moveTraveler(occupant.assignmentId, roomNumber, reason), `نُقل ${occupant.name} إلى الغرفة ${roomNumber} وأُقفل مكانه.`);
  };
  const toggleRoom = (pool: RoomingPool, room: RoomingRoom) =>
    act(() => lockRoom({ packageId, departureDate, city: pool.city, hotelId: pool.hotelId, roomType: pool.roomType, roomNumber: room.number, locked: !room.locked }), room.locked ? "فُتحت الغرفة." : "أُقفلت الغرفة.");

  const mixedCount = list?.pools.reduce((sum, pool) => sum + pool.rooms.filter(room => room.mixed).length, 0) ?? 0;
  return (
    <div className="app-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-panel" dir="rtl">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <div>
            <h1 className="page-title mb-1">توزيع الغرف</h1>
            <p className="text-muted mb-0">العائلات في غرف خاصة، وغيرهم في غرف مشتركة لجنس واحد مجمّعة حسب الجنسية.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <select className="form-select w-auto" value={selected} onChange={event => setSelected(event.target.value)}>
              {departures.length === 0 ? <option value="">لا توجد حجوزات</option> : null}
              {departures.map(item => <option key={`${item.packageId}|${item.departureDate}`} value={`${item.packageId}|${item.departureDate}`}>
                {item.departureDate} · {item.packageName} · {item.confirmed} مؤكد{item.pending ? ` · ${item.pending} بانتظار الدفع` : ""}
              </option>)}
            </select>
            <button type="button" className="btn btn-outline-gold" disabled={!selected || busy || list?.frozen} onClick={() => act(() => rebalance(packageId, departureDate), "أُعيد التوزيع حسب الجنسية.")}>إعادة التوزيع</button>
            <a className={`btn btn-gold${selected ? "" : " disabled"}`} href={selected ? roomingExportUrl(packageId, departureDate) : undefined}>تصدير Excel</a>
            <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate("/booking-settings")}>إعدادات الحجز</button>
          </div>
        </div>
        {error ? <div className="alert alert-danger">{error}</div> : null}
        {message ? <div className="alert alert-success">{message}</div> : null}
        {list ? <>
          <div className="row mb-4">
            <Stat title="الحالة" value={list.frozen ? "مجمّدة" : "مفتوحة"} caption={list.freezeDate ? `التجميد ${list.freezeDate}` : undefined} />
            <Stat title="الحجوزات" value={String(list.bookings.length)} />
            <Stat title="غرف مختلطة الجنسيات" value={String(mixedCount)} />
            <Stat title="بحاجة لتسكين يدوي" value={String(list.bookings.filter(item => item.needsRoomReview || (item.status === "confirmed" && !item.placed)).length)} />
          </div>

          {list.pools.map(pool => (
            <section key={`${pool.city}-${pool.hotelId}-${pool.roomType}`} className="page-card mb-4">
              <h2 className="h5 mb-3">{cityLabels[pool.city] ?? pool.city} · {pool.hotelName} · {pool.label} <span className="text-muted small">({pool.rooms.length} من {pool.capacity} غرفة · {pool.beds} أسرّة)</span></h2>
              <div className="row g-3">
                {pool.rooms.map(room => (
                  <div key={room.number} className="col-md-6 col-xl-4">
                    <div className={`border rounded-3 p-3 h-100 ${room.mixed ? "border-warning bg-warning-subtle" : ""}`}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>غرفة {room.number}</strong>
                        <span className="small">{room.family ? "عائلة" : room.gender === "female" ? "نساء" : "رجال"} · {room.family ? "خاصة" : `${room.free} سرير فارغ`}</span>
                      </div>
                      {room.mixed ? <div className="small text-warning-emphasis mb-2">مختلطة: {room.nationalities.join("، ")}</div> : null}
                      <ul className="list-unstyled mb-2">
                        {room.occupants.map(occupant => (
                          <li key={occupant.assignmentId} className="d-flex justify-content-between align-items-center gap-2 py-1 border-bottom">
                            <span>
                              {occupant.locked ? "🔒 " : ""}{occupant.name} <span className="text-muted small">· {occupant.nationality} · {occupant.reference}{occupant.pending ? " · بانتظار الدفع" : ""}</span>
                            </span>
                            {room.family ? null : <span className="d-flex gap-1">
                              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={() => move(occupant, pool)}>نقل</button>
                              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={() => act(() => lockTraveler(occupant.assignmentId, !occupant.locked), occupant.locked ? "فُتح مكان المسافر." : "أُقفل مكان المسافر.")}>{occupant.locked ? "فتح" : "قفل"}</button>
                            </span>}
                          </li>
                        ))}
                      </ul>
                      <button type="button" className="btn btn-sm btn-outline-gold" disabled={busy} onClick={() => toggleRoom(pool, room)}>{room.locked ? "فتح الغرفة" : "قفل الغرفة"}</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {list.pools.length === 0 ? <div className="state-box mb-4">لا توجد أسرّة محجوزة لهذا الموعد بعد.</div> : null}

          <section className="page-card mb-4">
            <h2 className="h5 mb-3">الحجوزات</h2>
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle">
                <thead><tr><th>الحجز</th><th>الحالة</th><th>السكن</th><th>المسافرون</th><th>الإجمالي</th><th>إجراءات</th></tr></thead>
                <tbody>
                  {list.bookings.map(booking => (
                    <tr key={booking.reference}>
                      <td>{booking.reference}</td>
                      <td>{statusLabels[booking.status] ?? booking.status}{booking.needsRoomReview ? <span className="badge bg-danger ms-1">بلا أسرّة</span> : null}</td>
                      <td>{booking.familyMode ? "عائلة" : "مشترك"}</td>
                      <td>{booking.travelers.map(traveler => `${traveler.fullName} (${traveler.nationality ?? "—"})`).join("، ")}</td>
                      <td>{booking.totalAmount} {booking.currency}</td>
                      <td className="d-flex flex-wrap gap-1">
                        {booking.needsRoomReview || (booking.status === "confirmed" && !booking.placed) ? <button type="button" className="btn btn-sm btn-outline-gold" disabled={busy} onClick={() => act(() => placeBooking(booking.reference), "تمّ تسكين الحجز.")}>تسكين</button> : null}
                        <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy}
                          onClick={() => window.confirm(`إلغاء الحجز ${booking.reference}؟ تُحرَّر المقاعد والأسرّة. الاسترداد يتم من بوابة MyFatoorah حسب شروط الإلغاء.`) && act(() => cancelBooking(booking.reference), "أُلغي الحجز وحُرّرت أسرّته.")}>إلغاء</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {list.moves.length ? <section className="page-card mb-5">
            <h2 className="h5 mb-3">سجل النقل</h2>
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead><tr><th>المسافر</th><th>الفندق / النوع</th><th>من</th><th>إلى</th><th>السبب</th><th>بواسطة</th><th>التاريخ</th></tr></thead>
                <tbody>
                  {list.moves.map((move, index) => (
                    <tr key={index}><td>{move.name ?? move.travelerId}</td><td>{move.hotelId} · {move.roomType}</td><td>{move.fromRoom}</td><td>{move.toRoom}</td><td>{move.reason}</td><td>{move.movedBy}</td><td>{new Date(move.movedAt).toLocaleString("ar-KW")}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section> : null}
        </> : selected ? <div className="state-box">جارٍ التحميل…</div> : null}
      </main>
    </div>
  );
}

function Stat({ title, value, caption }: { title: string; value: string; caption?: string }) {
  return (
    <div className="col-6 col-lg-3 mb-3">
      <div className="stat-card">
        <div className="stat-title">{title}</div>
        <div className="stat-number">{value}</div>
        {caption ? <div className="small text-muted">{caption}</div> : null}
      </div>
    </div>
  );
}
