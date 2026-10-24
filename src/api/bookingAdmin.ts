// Back-office of the app's booking flow: settings (prices, visa fees, hotels, rooms) and rooming list.

export interface RoomTypeConfig {
  type: string;
  beds: number;
  roomsPerDeparture: number;
  familySupplementPerRoomPerNight: number;
  sharedSupplementPerBedPerNight: number;
}

export interface HotelConfig {
  id: string;
  name: string;
  city: "makkah" | "madinah";
  stars: number | null;
  district: string | null;
  walkMinutes: number | null;
  description: string | null;
  amenities: string[];
  photos: string[];
  latitude: number | null;
  longitude: number | null;
  placeholder: boolean;
  supplementPerPersonPerNight: number;
  rooms: RoomTypeConfig[];
}

export interface PackBookingConfig {
  packageId: string;
  nights: { makkah: number; madinah: number };
  adultPrice: number | null;
  childPrice: number | null;
  priceByNationality: Record<string, { adult: number | null; child: number | null }> | null;
  busPrice: number;
  seatsPerDeparture: number;
  hotels: Record<string, string[]>;
}

export interface BookingConfig {
  currency: string;
  currencyIso: string;
  visaFees: { rowad: number; existing: number };
  fewSeatsThreshold: number;
  paymentHoldMinutes: number;
  draftExpiryDays: number;
  minPassportValidityMonths: number;
  extractionConfidenceThreshold: number;
  roomingFreezeDaysBeforeDeparture: number;
  frequentNationalities: string[];
  nationalities: { name: string; visaType: string }[];
  documents: { civilIdRequired: boolean; civilIdMinAge: number; personalPhotoRequired: boolean };
  packs: PackBookingConfig[];
  hotels: HotelConfig[];
}

export interface RoomingOccupant {
  assignmentId: number;
  bookingId: number;
  reference: string;
  travelerId: number;
  name: string;
  nationality: string;
  gender: string;
  locked: boolean;
  pending: boolean;
}

export interface RoomingRoom {
  number: number;
  family: boolean;
  gender: string | null;
  locked: boolean;
  free: number;
  mixed: boolean;
  nationalities: string[];
  occupants: RoomingOccupant[];
}

export interface RoomingPool {
  city: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  label: string;
  beds: number;
  capacity: number;
  rooms: RoomingRoom[];
}

export interface RoomingBooking {
  reference: string;
  status: string;
  paymentStatus: string;
  familyMode: boolean;
  men: number;
  women: number;
  children: number;
  infants: number;
  totalAmount: number;
  currency: string;
  needsRoomReview: boolean;
  placed: boolean;
  travelers: { travelerId: number; fullName: string; kind: string; gender: string | null; nationality: string | null; visaOption: string | null }[];
}

export interface RoomingList {
  frozen: boolean;
  freezeDate: string | null;
  pools: RoomingPool[];
  bookings: RoomingBooking[];
  moves: { travelerId: number; name: string | null; city: string; hotelId: string; roomType: string; fromRoom: number; toRoom: number; reason: string; movedBy: string; movedAt: string }[];
}

export interface DepartureSummary {
  packageId: string;
  packageName: string;
  departureDate: string;
  confirmed: number;
  pending: number;
  seats: number;
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init, headers: { Accept: "application/json", ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...(init.headers ?? {}) } });
  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (!response.ok) {
    let message = `تعذر إكمال الطلب (${response.status}).`;
    try {
      const body = await response.json();
      message = body?.detail || body?.title || message;
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const getBookingConfig = () => request<BookingConfig>("/api/admin/booking/config");
export const saveBookingConfig = (config: BookingConfig) => request<BookingConfig>("/api/admin/booking/config", json("PUT", config));
export function uploadHotelPhoto(file: File) {
  const form = new FormData();
  form.append("photo", file);
  return request<{ url: string }>("/api/admin/booking/hotel-photos", { method: "POST", body: form });
}
export const getDepartures = () => request<DepartureSummary[]>("/api/admin/booking/departures");
export const getRooming = (packageId: string, departureDate: string) =>
  request<RoomingList>(`/api/admin/booking/rooming?packageId=${encodeURIComponent(packageId)}&departureDate=${encodeURIComponent(departureDate)}`);
export const lockTraveler = (assignmentId: number, locked: boolean) => request<void>(`/api/admin/booking/assignments/${assignmentId}/lock`, json("POST", { locked }));
export const lockRoom = (body: { packageId: string; departureDate: string; city: string; hotelId: string; roomType: string; roomNumber: number; locked: boolean }) =>
  request<void>("/api/admin/booking/rooms/lock", json("POST", body));
export const moveTraveler = (assignmentId: number, roomNumber: number, reason: string) =>
  request<void>(`/api/admin/booking/assignments/${assignmentId}/move`, json("POST", { roomNumber, reason, lock: true }));
export const rebalance = (packageId: string, departureDate: string) => request<void>("/api/admin/booking/rebalance", json("POST", { packageId, departureDate }));
export const placeBooking = (reference: string) => request<void>(`/api/admin/booking/bookings/${encodeURIComponent(reference)}/place`, { method: "POST" });
export const cancelBooking = (reference: string) => request<void>(`/api/admin/booking/bookings/${encodeURIComponent(reference)}/cancel`, { method: "POST" });
export const roomingExportUrl = (packageId: string, departureDate: string) =>
  `/api/admin/booking/rooming/export?packageId=${encodeURIComponent(packageId)}&departureDate=${encodeURIComponent(departureDate)}`;

export const roomTypeLabels: Record<string, string> = { double: "ثنائية", triple: "ثلاثية", quad: "رباعية", single: "فردية" };
export const cityLabels: Record<string, string> = { makkah: "مكة المكرمة", madinah: "المدينة المنورة" };
