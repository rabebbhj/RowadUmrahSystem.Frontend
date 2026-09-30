export interface PackageOption {
  id: string;
  label: string;
  active: boolean;
  supplement: number | null;
  price: number | null;
}

export interface PricingCondition {
  field: string;
  operator: string;
  value: string;
}

export interface PricingRule {
  id: string;
  name: string;
  conditions: PricingCondition[];
  price: number;
  priceType: string;
  priority: number;
  active: boolean;
}

export interface RowadPricingProfile {
  enabled: boolean;
  visaPrice: number;
  busPrices: Record<string, number>;
  makkahRoomPrices: Record<string, Record<string, number>>;
  madinahRoomPrices: Record<string, Record<string, number>>;
}

const defaultVisaSupplement = 45;
const visaFeeWhenAlreadyHasVisa = 5;

export interface TravelPackage {
  id: string;
  name: string;
  shortTitle: string;
  description: string;
  durationDays: number;
  durationLabel: string;
  imageUrl: string;
  basePrice: number;
  visaSupplement?: number;
  currency: string;
  priceMode: "fixed" | "rules" | string;
  status: "draft" | "published" | "paused" | string;
  displayOrder: number;
  transportOptions: PackageOption[];
  roomTypes: PackageOption[];
  departureDates: string[];
  pricingRules: PricingRule[];
  pricingProfile?: RowadPricingProfile | null;
  createdAt: string;
  updatedAt: string;
}

export interface PackagePriceContext {
  packageId?: string;
  nationality?: string;
  roomType?: string;
  transport?: string;
  travelers?: number;
  departureDate?: string;
  previousVisa?: string;
  visaIssuer?: string;
  durationDays?: number;
  hotel?: string;
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = await response.json();
      if (typeof data === "string") return data;
      if (data && typeof data.message === "string") return data.message;
      if (data && typeof data.title === "string") return data.title;
    } catch {
      // Fall back to text.
    }
  }

  return (await response.text()) || `API error: ${response.status}`;
}

async function requestJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

export async function getPublishedPackages(): Promise<TravelPackage[]> {
  const response = await fetch("/api/packages", {
    credentials: "include"
  });

  return requestJson<TravelPackage[]>(response);
}

export async function getAdminPackages(): Promise<TravelPackage[]> {
  const response = await fetch("/api/packages/admin", {
    credentials: "include"
  });

  return requestJson<TravelPackage[]>(response);
}

export async function createPackage(request: TravelPackage): Promise<TravelPackage> {
  const response = await fetch("/api/packages", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });

  return requestJson<TravelPackage>(response);
}

export async function updatePackage(id: string, request: TravelPackage): Promise<TravelPackage> {
  const response = await fetch(`/api/packages/${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });

  return requestJson<TravelPackage>(response);
}

export async function duplicatePackage(id: string): Promise<TravelPackage> {
  const response = await fetch(`/api/packages/${encodeURIComponent(id)}/duplicate`, {
    method: "POST",
    credentials: "include"
  });

  return requestJson<TravelPackage>(response);
}

export async function deletePackage(id: string): Promise<void> {
  const response = await fetch(`/api/packages/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include"
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (!response.ok) throw new Error(await readErrorMessage(response));
}

export function getPackageFromPrice(packageItem: TravelPackage) {
  if (packageItem.priceMode === "rules") {
    const prices = packageItem.pricingRules
      .filter((rule) => rule.active)
      .map((rule) => rule.price)
      .filter((price) => Number.isFinite(price) && price > 0);

    if (prices.length > 0) {
      return Math.min(...prices);
    }
  }

  return packageItem.basePrice;
}

export function resolvePackageImageUrl(imageUrl: string | null | undefined) {
  const fallback = "/landingpage/avion.png";
  const value = imageUrl?.trim() || fallback;

  if (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/app/")) {
    return value;
  }

  if (value.startsWith("/landingpage/") && window.location.port !== "5173") {
    return `/app${value}`;
  }

  return value;
}

function conditionMatches(condition: PricingCondition, context: PackagePriceContext) {
  const source: Record<string, string | number | undefined> = {
    nationality: context.nationality,
    roomType: context.roomType,
    transport: context.transport,
    travelers: context.travelers,
    departureDate: context.departureDate,
    previousVisa: context.previousVisa,
    visaIssuer: context.visaIssuer,
    durationDays: context.durationDays,
    hotel: context.hotel
  };
  const current = source[condition.field];
  const expected = condition.value;

  if (expected === "" || expected == null) return true;
  if (current == null || current === "") return false;

  const currentText = String(current);

  switch (condition.operator) {
    case "notEquals":
      return currentText !== expected;
    case "in":
      return expected.split(",").map((item) => item.trim()).includes(currentText);
    case "notIn":
      return !expected.split(",").map((item) => item.trim()).includes(currentText);
    case "gt":
      return Number(current) > Number(expected);
    case "lt":
      return Number(current) < Number(expected);
    case "range": {
      const [min, max] = expected.split(",").map((item) => Number(item.trim()));
      return Number(current) >= min && Number(current) <= max;
    }
    case "equals":
    default:
      return currentText === expected;
  }
}

function getSelectedOptionSupplement(options: PackageOption[], label?: string) {
  if (!label) return 0;
  const selected = options.find((option) => option.active && option.label === label);
  return selected?.supplement ?? 0;
}

function getRuleTotal(rule: PricingRule, travelers: number) {
  const priceType = rule.priceType.trim().toLowerCase();
  const isPerPerson = priceType === "perperson" || priceType.includes("person") || priceType.includes("شخص");

  return rule.price * (isPerPerson ? travelers : 1);
}

function ruleHasCondition(rule: PricingRule, field: string) {
  return rule.conditions.some((condition) => condition.field === field);
}

function getRoomCapacity(roomType: PackageOption | string | null | undefined) {
  const id = typeof roomType === "string" ? "" : roomType?.id.toLowerCase() ?? "";
  const label = typeof roomType === "string" ? roomType : roomType?.label ?? "";

  if (id.includes("quad") || label.includes("رباع")) return 4;
  if (id.includes("triple") || label.includes("ثلاث")) return 3;
  if (id.includes("double") || label.includes("ثنائ") || label.includes("مزدوج")) return 2;
  if (id.includes("single") || label.includes("فرد")) return 1;

  return 1;
}

function getRoomParts(roomType: string | undefined) {
  return (roomType ?? "")
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getRoomProfilePrice(prices: Record<string, Record<string, number>> | undefined, durationDays: number | undefined, roomLabel: string) {
  const durationKey = String(durationDays ?? "");
  return prices?.[durationKey]?.[roomLabel] ?? 0;
}

function calculateProfilePackagePrice(packageItem: TravelPackage, context: PackagePriceContext) {
  const profile = packageItem.pricingProfile;
  if (!profile?.enabled) return null;

  const durationDays = context.durationDays ?? packageItem.durationDays;
  const travelers = Math.max(1, Number(context.travelers) || 1);
  const roomParts = getRoomParts(context.roomType);
  const selectedRoomParts = roomParts.length > 0 ? roomParts : [packageItem.roomTypes.find((item) => item.active)?.label ?? ""].filter(Boolean);
  let assignedTravelers = 0;
  const roomTotal = selectedRoomParts.reduce((total, roomLabel, index) => {
    const roomType = packageItem.roomTypes.find((item) => item.label === roomLabel);
    const capacity = Math.max(1, getRoomCapacity(roomType ?? roomLabel));
    const remainingTravelers = Math.max(0, travelers - assignedTravelers);
    const roomTravelers = index === selectedRoomParts.length - 1
      ? remainingTravelers || Math.min(capacity, travelers)
      : Math.min(capacity, remainingTravelers || capacity);
    const makkahPrice = getRoomProfilePrice(profile.makkahRoomPrices, durationDays, roomLabel);
    const madinahPrice = getRoomProfilePrice(profile.madinahRoomPrices, durationDays, roomLabel);

    assignedTravelers += roomTravelers;

    return total + (makkahPrice + madinahPrice) * roomTravelers;
  }, 0);
  const roomAverage = roomTotal > 0 ? roomTotal : packageItem.basePrice;
  const transportPrice = context.transport === "باص" ? (profile.busPrices[String(durationDays)] ?? 0) : 0;
  const visaPrice = context.previousVisa === "yes" ? visaFeeWhenAlreadyHasVisa : profile.visaPrice;

  return roomAverage + (transportPrice + visaPrice) * travelers;
}

export function calculatePackagePrice(packageItem: TravelPackage, context: PackagePriceContext) {
  const profilePrice = calculateProfilePackagePrice(packageItem, context);
  if (profilePrice != null) {
    return Math.round(profilePrice);
  }

  const travelers = Math.max(1, Number(context.travelers) || 1);
  const roomSupplement = getSelectedOptionSupplement(packageItem.roomTypes, context.roomType);
  const transportSupplement = getSelectedOptionSupplement(packageItem.transportOptions, context.transport);
  const configuredVisaSupplement = packageItem.visaSupplement && packageItem.visaSupplement > 0
    ? packageItem.visaSupplement
    : defaultVisaSupplement;
  const visaSupplement = context.previousVisa === "yes" ? visaFeeWhenAlreadyHasVisa : configuredVisaSupplement;
  const optionSupplement = roomSupplement + transportSupplement + visaSupplement;

  if (packageItem.priceMode !== "rules") {
    return packageItem.basePrice + optionSupplement;
  }

  const matchingRules = packageItem.pricingRules
    .filter((rule) => rule.active)
    .filter((rule) => rule.conditions.every((condition) => conditionMatches(condition, context)))
    .sort((first, second) => {
      if (second.priority !== first.priority) return second.priority - first.priority;
      return second.conditions.length - first.conditions.length;
    });

  const matchingConditionalRules = matchingRules.filter((rule) => rule.conditions.length > 0);
  if (matchingConditionalRules.length > 0) {
    return matchingConditionalRules.reduce((total, rule) => total + getRuleTotal(rule, travelers), 0);
  }

  const selectedRule = matchingRules[0];
  if (selectedRule) {
    return getRuleTotal(selectedRule, travelers);
  }

  return packageItem.basePrice;
}

export function createEmptyPackage(order = 1): TravelPackage {
  const now = new Date().toISOString();

  return {
    id: "",
    name: "باقة عمرة جديدة",
    shortTitle: "رحلة عمرة",
    description: "",
    durationDays: 6,
    durationLabel: "6 أيام",
    imageUrl: "/landingpage/paysage.png",
    basePrice: 75,
    visaSupplement: defaultVisaSupplement,
    currency: "د.ك",
    priceMode: "rules",
    status: "draft",
    displayOrder: order,
    transportOptions: [
      { id: "bus", label: "باص", active: true, supplement: 0, price: null },
      { id: "private-car", label: "سيارة خاصة", active: true, supplement: 350, price: null }
    ],
    roomTypes: [
      { id: "double", label: "غرفة مزدوجة", active: true, supplement: 0, price: null },
      { id: "quad", label: "غرفة رباعية", active: true, supplement: 0, price: null }
    ],
    departureDates: [],
    pricingProfile: null,
    pricingRules: [
      {
        id: "default-rule",
        name: "السعر الأساسي",
        conditions: [],
        price: 75,
        priceType: "perPerson",
        priority: 10,
        active: true
      }
    ],
    createdAt: now,
    updatedAt: now
  };
}
