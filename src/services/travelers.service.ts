import {
  calculatePackagePrice,
  getPublishedPackages,
  resolvePackageImageUrl,
  type TravelPackage
} from "../api/travelPackages";
import { getTravelers, type TravelerListItem } from "../api/travelers";
import { getTrips, type TripListItem, type TripStatus } from "../api/trips";
import type { DateTravelPackage, PackageTraveler, TravelDate, TravelerStatus, TravelerWorkflowData } from "../types/travelers";

function normalizeText(value: string | null | undefined) {
  if (!value) return "";
  if (!/[ØÙÃÂ]/.test(value)) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return value;
  }
}

function toDateKey(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function formatWeekday(dateKey: string) {
  return new Intl.DateTimeFormat("ar", { weekday: "long" }).format(new Date(`${dateKey}T00:00:00`));
}

function normalizeId(value: string | null | undefined) {
  return normalizeText(value).trim().toLowerCase();
}

function parseReservationNotes(notes: string | null | undefined) {
  const normalized = normalizeText(notes);
  const parts = normalized
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  const read = (...labels: string[]) => {
    const normalizedLabels = labels.map((label) => normalizeId(label));
    const part = parts.find((item) => normalizedLabels.some((label) => normalizeId(item).startsWith(`${label}:`)));
    return part ? part.slice(part.indexOf(":") + 1).trim() : "";
  };

  const totalText = read("المبلغ المحسوب", "ReservationTotal");
  const totalMatch = totalText.match(/\d+(?:[.,]\d+)?/);

  return {
    packageId: read("PackageId"),
    packageName: read("الباقة", "PackageName"),
    bookingDate: read("تاريخ الحجز", "BookingDate"),
    roomType: read("نوع الغرفة", "RoomType"),
    transportType: read("وسيلة النقل", "TransportType"),
    visaType: read("التأشيرة", "Visa"),
    reservationTotal: totalMatch ? Number(totalMatch[0].replace(",", ".")) : undefined
  };
}

function getPackageMetaForTrip(trip: TripListItem) {
  return parseReservationNotes(trip.notes);
}

function packageMatchesTrip(packageItem: TravelPackage, trip: TripListItem) {
  const meta = getPackageMetaForTrip(trip);
  const packageId = normalizeId(meta.packageId);
  const packageName = normalizeId(meta.packageName);

  return packageId === normalizeId(packageItem.id) ||
    Boolean(packageName && (packageName === normalizeId(packageItem.name) || packageName === normalizeId(packageItem.shortTitle)));
}

function findPackageForTrip(packages: TravelPackage[], trip: TripListItem) {
  return packages.find((packageItem) => packageMatchesTrip(packageItem, trip));
}

function getStatus(traveler: TravelerListItem, trip: TripListItem): TravelerStatus {
  const tripStatus = normalizeText((trip.status ?? "") as TripStatus);
  if (tripStatus === "confirmed" || tripStatus === "completed" || tripStatus === "cancelled") return tripStatus;
  if (traveler.isBlocked || traveler.isDeleted) return "cancelled";
  return "pending";
}

function getFirstActiveLabel(options: { active: boolean; label: string }[]) {
  return normalizeText(options.find((option) => option.active)?.label ?? options[0]?.label ?? "");
}

function getPackageImage(packageItem: TravelPackage) {
  const imageUrl = packageItem.imageUrl?.trim();
  return imageUrl ? resolvePackageImageUrl(imageUrl) : undefined;
}

async function loadWorkflowData(includeTravelers = true): Promise<TravelerWorkflowData> {
  const [packages, trips, travelers] = await Promise.all([
    getPublishedPackages(),
    getTrips("", false),
    includeTravelers ? getTravelers("", false, false) : Promise.resolve([] as TravelerListItem[])
  ]);

  return { packages, trips, travelers };
}

export async function getTravelDates(): Promise<TravelDate[]> {
  const { packages, trips } = await loadWorkflowData(false);
  const dates = new Set<string>();

  trips.forEach((trip) => dates.add(toDateKey(trip.tripDate)));

  const todayKey = toDateKey(new Date());

  return Array.from(dates)
    .filter(Boolean)
    .sort()
    .map((dateKey) => {
      const tripsForDate = trips.filter((trip) => toDateKey(trip.tripDate) === dateKey);
      const packagesForDate = packages.filter((packageItem) =>
        tripsForDate.some((trip) => packageMatchesTrip(packageItem, trip))
      );
      const firstPackageWithImage =
        packagesForDate.find((packageItem) => packageItem.imageUrl?.trim()) ??
        tripsForDate
          .map((trip) => findPackageForTrip(packages, trip))
          .find((packageItem) => packageItem?.imageUrl?.trim());

      return {
        id: dateKey,
        departureDate: dateKey,
        image: firstPackageWithImage ? getPackageImage(firstPackageWithImage) : undefined,
        weekday: formatWeekday(dateKey),
        packagesCount: packagesForDate.length,
        travelersCount: new Set(tripsForDate.map((trip) => trip.travelerId)).size,
        status: dateKey < todayKey ? "past" : dateKey === todayKey ? "active" : "upcoming"
      };
    });
}

export async function getPackagesByDate(dateId: string): Promise<DateTravelPackage[]> {
  const dateKey = decodeURIComponent(dateId);
  const { packages, trips, travelers } = await loadWorkflowData();
  const travelerById = new Map(travelers.map((traveler) => [traveler.id, traveler]));
  const tripsForDate = trips.filter((trip) => toDateKey(trip.tripDate) === dateKey);

  const packagesForDate = packages
    .filter((packageItem) => tripsForDate.some((trip) => packageMatchesTrip(packageItem, trip)))
    .sort((first, second) => first.displayOrder - second.displayOrder);

  return packagesForDate.map((packageItem) => {
    const matchingTrips = tripsForDate.filter((trip) => packageMatchesTrip(packageItem, trip));
    const matchingTravelers = matchingTrips
      .map((trip) => travelerById.get(trip.travelerId))
      .filter((traveler): traveler is TravelerListItem => Boolean(traveler));
    const firstMeta = matchingTrips[0] ? getPackageMetaForTrip(matchingTrips[0]) : null;
    const firstTraveler = matchingTravelers[0];
    const travelersCount = new Set(matchingTrips.map((trip) => trip.travelerId)).size;
    const calculatedPrice = calculatePackagePrice(packageItem, {
      nationality: firstTraveler?.nationality,
      roomType: firstMeta?.roomType || getFirstActiveLabel(packageItem.roomTypes),
      transport: firstMeta?.transportType || getFirstActiveLabel(packageItem.transportOptions),
      travelers: Math.max(1, travelersCount),
      departureDate: dateKey,
      previousVisa: firstMeta?.visaType?.includes("لديه") ? "yes" : "no",
      durationDays: packageItem.durationDays
    });

    return {
      id: packageItem.id,
      travelDateId: dateKey,
      name: normalizeText(packageItem.name),
      durationDays: packageItem.durationDays,
      durationLabel: normalizeText(packageItem.durationLabel),
      nationality: normalizeText(firstTraveler?.nationality) || undefined,
      visaType: firstMeta?.visaType || undefined,
      roomType: firstMeta?.roomType || getFirstActiveLabel(packageItem.roomTypes),
      transportType: firstMeta?.transportType || getFirstActiveLabel(packageItem.transportOptions),
      price: Math.round(calculatedPrice),
      currency: normalizeText(packageItem.currency) || "د.ك",
      travelersCount,
      image: getPackageImage(packageItem),
      sourcePackage: packageItem
    };
  });
}

export async function getTravelersByPackage(dateId: string, packageId: string): Promise<PackageTraveler[]> {
  const dateKey = decodeURIComponent(dateId);
  const decodedPackageId = decodeURIComponent(packageId);
  const { packages, trips, travelers } = await loadWorkflowData();
  const selectedPackage = packages.find((packageItem) => packageItem.id === decodedPackageId);
  const travelerById = new Map(travelers.map((traveler) => [traveler.id, traveler]));

  const mappedTravelers: PackageTraveler[] = trips
    .filter((trip) => toDateKey(trip.tripDate) === dateKey)
    .filter((trip) => selectedPackage ? packageMatchesTrip(selectedPackage, trip) : getPackageMetaForTrip(trip).packageId === decodedPackageId)
    .reduce<PackageTraveler[]>((result, trip) => {
      const traveler = travelerById.get(trip.travelerId);
      const meta = getPackageMetaForTrip(trip);
      if (!traveler) return result;

      result.push({
        id: `${trip.id}-${traveler.id}`,
        travelerId: traveler.id,
        tripId: trip.id,
        passportNumber: traveler.passportNumber,
        fullName: normalizeText(traveler.fullName),
        nationality: normalizeText(traveler.nationality),
        phone: traveler.phoneNumber,
        status: getStatus(traveler, trip),
        bookedAt: trip.createdAt || traveler.createdAt,
        tripDate: trip.tripDate,
        packageId: decodedPackageId,
        packageName: meta.packageName || selectedPackage?.name,
        roomType: meta.roomType,
        transportType: meta.transportType,
        visaType: meta.visaType,
        reservationTotal: meta.reservationTotal,
        traveler,
        trip
      });

      return result;
    }, []);

  return mappedTravelers.sort((first, second) => new Date(first.bookedAt).getTime() - new Date(second.bookedAt).getTime());
}

export async function getTravelerWorkflowContext(dateId?: string, packageId?: string) {
  const [dates, packages, packageTravelers] = await Promise.all([
    getTravelDates(),
    dateId ? getPackagesByDate(dateId) : Promise.resolve([]),
    dateId && packageId ? getTravelersByPackage(dateId, packageId) : Promise.resolve([])
  ]);

  return { dates, packages, packageTravelers };
}

export const travelerWorkflowUtils = {
  normalizeText,
  toDateKey,
  formatWeekday
};
