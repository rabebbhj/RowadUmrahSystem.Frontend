import type { TravelPackage } from "../api/travelPackages";
import type { TravelerListItem } from "../api/travelers";
import type { TripListItem } from "../api/trips";

export type TravelerStatus = "confirmed" | "pending" | "completed" | "cancelled";

export type TravelDate = {
  id: string;
  departureDate: string;
  image?: string;
  weekday?: string;
  packagesCount: number;
  travelersCount: number;
  status: "upcoming" | "past" | "active";
};

export type DateTravelPackage = {
  id: string;
  travelDateId: string;
  name: string;
  durationDays: number;
  durationLabel: string;
  nationality?: string;
  visaType?: string;
  roomType?: string;
  transportType?: string;
  price: number;
  currency: string;
  travelersCount: number;
  capacity?: number;
  image?: string;
  sourcePackage: TravelPackage;
};

export type PackageTraveler = {
  id: string;
  travelerId: number;
  tripId: number;
  passportNumber: string;
  fullName: string;
  nationality: string;
  phone?: string;
  status: TravelerStatus;
  bookedAt: string;
  tripDate: string;
  packageId: string;
  packageName?: string;
  roomType?: string;
  transportType?: string;
  visaType?: string;
  reservationTotal?: number;
  traveler: TravelerListItem;
  trip: TripListItem;
};

export type TravelerWorkflowData = {
  packages: TravelPackage[];
  trips: TripListItem[];
  travelers: TravelerListItem[];
};
