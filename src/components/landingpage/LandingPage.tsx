import { useEffect, useMemo, useState } from "react";
import {
  forgotPassword,
  getCurrentUser,
  login as loginUser,
  logout as logoutUser,
  registerTraveler,
  resendEmailCode,
  resetPassword,
  verifyEmail,
  type AuthUser
} from "../../api/auth";
import type { CSSProperties, FormEvent } from "react";
import { findPackagePrice, getPackagePricing, type PackagePricing } from "../../api/packagePricing";
import { createTraveler, readCivilIdOcr, readPassportOcr } from "../../api/travelers";
import {
  calculatePackagePrice,
  getPackageFromPrice,
  getPublishedPackages,
  resolvePackageImageUrl,
  type PackageOption,
  type TravelPackage
} from "../../api/travelPackages";
import {
  ArrowRightIcon,
  BedIcon,
  BusIcon,
  CalendarIcon,
  ChatIcon,
  CoinsIcon,
  DocumentIcon,
  GlobeIcon,
  HeadsetIcon,
  LocationIcon,
  MailIcon,
  MosqueIcon,
  PhoneIcon,
  PlaneIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  UsersIcon
} from "./landingShared";

const landingAsset = (fileName: string) => `${import.meta.env.BASE_URL}landingpage/${fileName}`;

const packages = [
  {
    badge: "الرحلات",
    type: "travel",
    image: landingAsset("avion.png"),
    price: "45",
    imageText: ["من كل مكان إلى أطهر بقاع", "الأرض"],
    features: ["حجوزات طيران", "حجوزات فنادق", "تنظيم الجولات", "دعم مباشر"],
    people: "1-2",
    city: "مكة",
    duration: "7"
  },
  {
    badge: "التأشيرات",
    type: "visa",
    image: landingAsset("mains.png"),
    price: "55",
    imageText: ["خطوة أسهل", "لرحلة أيسر"],
    features: ["تأشيرات سياحية", "حجز المواعيد", "متابعة الطلب", "استشارات السفر"],
    people: "3-4",
    city: "مكة والمدينة",
    duration: "10"
  },
  {
    badge: "برامج الشركات",
    type: "corporate",
    image: landingAsset("reunion.png"),
    price: "60",
    imageText: ["شراكات تسهل رحلتكم", "الإيمانية"],
    features: ["رحلات عمل", "حجوزات جماعية", "تنظيم الفعاليات", "خدمة مخصصة"],
    people: "5+",
    city: "المدينة",
    duration: "14"
  }
];

const packageFeatureIcons = [
  <LocationIcon className="icon icon-sm" />,
  <BusIcon className="icon icon-sm" />,
  <MosqueIcon className="icon icon-sm" />,
  <HeadsetIcon className="icon icon-sm" />
];

const services = [
  { icon: <ShieldIcon className="icon icon-md" />, title: "تأمين شامل", text: "لحماية رحلتك وراحة بالك" },
  { icon: <HeadsetIcon className="icon icon-md" />, title: "دعم على مدار الساعة", text: "نحن معك في كل خطوة" },
  { icon: <BusIcon className="icon icon-md" />, title: "تنقلات مريحة", text: "سيارات حديثة ومكيفة" },
  { icon: <CalendarIcon className="icon icon-md" />, title: "استخراج تأشيرات", text: "بإجراء واضح وسريع" },
  { icon: <MosqueIcon className="icon icon-md" />, title: "إرشادات دينية", text: "مع مرشدين مختصين" },
  { icon: <UsersIcon className="icon icon-md" />, title: "مجموعات صغيرة", text: "خدمة أفضل واهتمام أكبر" }
];

const hotelOptions = [
  {
    name: "فندق ساعة مكة فيرمونت",
    city: "مكة المكرمة",
    distance: "250 متر من الحرم",
    price: 1250,
    image: landingAsset("hero-kaaba-premium.png"),
    perks: ["إطلالة على الحرم", "مواصلات مجانية", "خدمة 24 ساعة"]
  },
  {
    name: "فندق جبل عمر حياة ريجنسي",
    city: "مكة المكرمة",
    distance: "350 متر من الحرم",
    price: 980,
    image: landingAsset("paysage.png"),
    perks: ["مطاعم متعددة", "مواصلات مجانية", "خدمة 24 ساعة"]
  },
  {
    name: "فندق موفنبيك برج هاجر",
    city: "مكة المكرمة",
    distance: "450 متر من الحرم",
    price: 750,
    image: landingAsset("avion.png"),
    perks: ["موقع مميز", "إفطار شامل", "خدمة 24 ساعة"]
  }
];

const paymentPlans = [
  { months: 3, label: "3 أشهر" },
  { months: 6, label: "6 أشهر" },
  { months: 12, label: "12 شهر" }
];

const reservationSteps = [1, 2, 3, 4, 5];

const emptyFilters = {
  people: "",
  city: "",
  duration: "",
  startDate: ""
};

const emptyReservationForm = {
  fullName: "",
  phoneNumber: "",
  email: "",
  passportNumber: "",
  nationality: "",
  gender: "",
  dateOfBirth: "",
  passportExpiryDate: "",
  civilId: ""
};

const nationalityOptions = [
  "سوري",
  "مالي",
  "سوداني",
  "باكستاني",
  "مغربي",
  "أردني",
  "مصري",
  "هندي",
  "بنغلاديشي",
  "اندونيسي",
  "تونسي",
  "جزائري",
  "فلسطيني"
];
const acceptedDocumentTypes = ["image/jpeg", "image/png", "application/pdf"];
const maxDocumentSize = 5 * 1024 * 1024;

type Filters = typeof emptyFilters;
type FilterName = keyof Filters;
type ReservationForm = typeof emptyReservationForm;
type ReservationField = keyof ReservationForm;
type UploadKind = "passport" | "id";
type ReservationUploadKind = UploadKind | "visa";
type AuthPopupView = "login" | "register" | "forgot" | "reset" | "verify" | "twoFactor";
type TravelPackageOptionState = {
  bookingDate: string;
  returnDate: string;
  travelers: string;
  roomType: string;
  transportType: string;
  nationality: string;
  hasVisa: string;
  dateError: string;
};
type TravelPackageOptions = Record<string, TravelPackageOptionState>;
const defaultTravelPackageOptions: TravelPackageOptionState = {
  bookingDate: "",
  returnDate: "",
  travelers: "1",
  roomType: "",
  transportType: "",
  nationality: nationalityOptions[0],
  hasVisa: "no",
  dateError: ""
};
const rowadPackagePrefix = "rowad-company-";
const rowadFixedTransport = "باص";
const regularFixedTransport = "سيارة خاصة";
const minLibreTravelDays = 6;
const longLibreTravelDays = 10;

function isRowadTravelPackage(packageItem: TravelPackage | null | undefined) {
  return Boolean(packageItem?.id.startsWith(rowadPackagePrefix));
}

function getDefaultTransportLabel(packageItem: TravelPackage | null | undefined) {
  if (!packageItem) return "";
  if (isRowadTravelPackage(packageItem)) return rowadFixedTransport;
  return regularFixedTransport;
}
const travelerCountOptions = ["1", "2", "3", "4"];
const customTravelerOption = "custom";
const maxGeneratedRoomCombinations = 8;
type LandingPageProps = {
  initialAuthView?: AuthPopupView | null;
};

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function getTodayDateInputValue() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60 * 1000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function parseDateInputValue(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getInclusiveDateRangeDays(startDate: string | null | undefined, endDate: string | null | undefined) {
  const start = parseDateInputValue(startDate);
  const end = parseDateInputValue(endDate);
  if (!start || !end || end < start) return 0;
  const dayMilliseconds = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / dayMilliseconds) + 1;
}

function getLibrePricingDurationDays(startDate: string | null | undefined, endDate: string | null | undefined, fallbackDays: number) {
  const travelDays = getInclusiveDateRangeDays(startDate, endDate);
  if (travelDays >= longLibreTravelDays) return longLibreTravelDays;
  if (travelDays >= minLibreTravelDays) return minLibreTravelDays;
  return fallbackDays;
}

function getLibreDateRangeError(startDate: string | null | undefined, endDate: string | null | undefined) {
  const travelDays = getInclusiveDateRangeDays(startDate, endDate);
  return startDate && endDate && travelDays < minLibreTravelDays
    ? "يجب ألا تقل مدة الرحلة عن 6 أيام."
    : "";
}

function addMonthsToDate(value: string, amount: number) {
  const [year, month] = value.split("-").map(Number);
  const nextDate = new Date(year, (month || 1) - 1 + amount, 1);
  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}-01`;
}

function getMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("ar", { month: "long", year: "numeric" }).format(new Date(year, (month || 1) - 1, 1));
}

function getMonthGrid(value: string) {
  const [year, month] = value.split("-").map(Number);
  const monthIndex = (month || 1) - 1;
  const firstDate = new Date(year, monthIndex, 1);
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const offset = firstDate.getDay();
  const days: Array<string | null> = Array.from({ length: offset }, () => null);

  for (let day = 1; day <= dayCount; day += 1) {
    days.push(toDateInputValue(new Date(year, monthIndex, day).toISOString()));
  }

  return days;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function normalizeNationality(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) return "";

  const aliases: Record<string, string> = {
    indian: "هندي",
    india: "هندي",
    "هندية": "هندي",
    bangladeshi: "بنغلاديشي",
    bangladesh: "بنغلاديشي",
    "بنجلاديشي": "بنغلاديشي",
    "بنغلادش": "بنغلاديشي",
    "بنغلادشي": "بنغلاديشي",
    "بنغلاديش": "بنغلاديشي",
    egyptian: "مصري",
    egypt: "مصري",
    "مصرية": "مصري",
    syrian: "سوري",
    syria: "سوري",
    "سورية": "سوري",
    malian: "مالي",
    mali: "مالي",
    sudanese: "سوداني",
    sudan: "سوداني",
    pakistani: "باكستاني",
    pakistan: "باكستاني",
    moroccan: "مغربي",
    morocco: "مغربي",
    jordanian: "أردني",
    jordan: "أردني",
    "اردني": "أردني",
    indonesian: "اندونيسي",
    indonesia: "اندونيسي",
    "إندونيسي": "اندونيسي",
    tunisian: "تونسي",
    tunisia: "تونسي",
    algerian: "جزائري",
    algeria: "جزائري",
    palestinian: "فلسطيني",
    palestine: "فلسطيني"
  };

  return aliases[normalized] ?? nationalityOptions.find((option) => option === value?.trim()) ?? "";
}

const touristVisaNationalities = new Set(["سوري", "مالي", "سوداني", "باكستاني", "مغربي", "أردني", "اردني"]);
const umrahVisaNationalities = new Set(["مصري", "هندي", "بنغلاديشي", "بنغلادشي", "بنغلادش", "اندونيسي", "تونسي", "جزائري", "فلسطيني"]);

function getVisaTypeForNationality(nationality: string | null | undefined) {
  const normalizedNationality = normalizeNationality(nationality) || nationality?.trim() || "";

  if (touristVisaNationalities.has(normalizedNationality)) return "tourist";
  if (umrahVisaNationalities.has(normalizedNationality)) return "umrah";

  return "umrah";
}

function getVisaTypeLabel(value: string | null | undefined, nationality?: string | null) {
  if (value === "yes-tourist") return "لدي تأشيرة سياحية";
  if (value === "yes-umrah" || value === "yes") return "لدي تأشيرة عمرة";

  const visaType = getVisaTypeForNationality(nationality);
  return visaType === "tourist" ? "بدون تأشيرة سياحية" : "بدون تأشيرة عمرة";
}

function hasExistingVisa(value: string | null | undefined) {
  return value === "yes" || value === "yes-umrah" || value === "yes-tourist";
}

function getExistingVisaChoiceForNationality(nationality?: string | null) {
  return getVisaTypeForNationality(nationality) === "tourist" ? "yes-tourist" : "yes-umrah";
}

function getVisaChoiceValue(value: string | null | undefined, nationality?: string | null) {
  if (hasExistingVisa(value)) return getExistingVisaChoiceForNationality(nationality);
  return "no";
}

function getRoomCapacity(roomType: PackageOption | string | null | undefined) {
  const id = typeof roomType === "string" ? "" : roomType?.id.toLowerCase() ?? "";
  const label = typeof roomType === "string" ? roomType : roomType?.label ?? "";

  if (id.includes("quad") || label.includes("رباع")) return 4;
  if (id.includes("triple") || label.includes("ثلاث")) return 3;
  if (id.includes("double") || label.includes("ثنائ") || label.includes("مزدوج")) return 2;
  if (id.includes("single") || label.includes("فرد")) return 1;

  return 0;
}

function buildRoomCombinationLabel(rooms: PackageOption[]) {
  return rooms.map((room) => room.label).join(" + ");
}

function getRoomCombinationCapacity(packageItem: TravelPackage | null | undefined, roomLabel: string) {
  const activeRoomTypes = packageItem?.roomTypes.filter((item) => item.active) ?? [];

  return roomLabel
    .split(" + ")
    .map((label) => activeRoomTypes.find((roomType) => roomType.label === label.trim()))
    .reduce((total, roomType) => total + getRoomCapacity(roomType), 0);
}

function getRoomCombinationOptions(packageItem: TravelPackage | null | undefined, travelers: string) {
  const activeRoomTypes = packageItem?.roomTypes.filter((item) => item.active) ?? [];
  const travelerCount = Number(travelers) || 1;
  const validRoomTypes = activeRoomTypes
    .map((roomType) => ({ ...roomType, capacity: getRoomCapacity(roomType) }))
    .filter((roomType) => roomType.capacity > 0)
    .sort((first, second) => second.capacity - first.capacity);

  if (travelerCount === 1) {
    return validRoomTypes.map((roomType) => roomType.label);
  }

  const combinations: PackageOption[][] = [];

  function collect(startIndex: number, remainingCapacity: number, selectedRooms: PackageOption[]) {
    if (combinations.length >= maxGeneratedRoomCombinations) return;

    if (remainingCapacity === 0) {
      combinations.push(selectedRooms);
      return;
    }

    for (let index = startIndex; index < validRoomTypes.length; index += 1) {
      const roomType = validRoomTypes[index];
      if (roomType.capacity > remainingCapacity) continue;

      collect(index, remainingCapacity - roomType.capacity, [...selectedRooms, roomType]);
    }
  }

  collect(0, travelerCount, []);

  const exactRoomOptions = validRoomTypes
    .filter((roomType) => roomType.capacity === travelerCount)
    .map((roomType) => roomType.label);
  const combinationOptions = combinations.map(buildRoomCombinationLabel);
  const options = Array.from(new Set([...exactRoomOptions, ...combinationOptions]));

  return options;
}

function getCompatibleRoomLabel(packageItem: TravelPackage | null | undefined, travelers: string, fallback = "") {
  const roomOptions = getRoomCombinationOptions(packageItem, travelers);
  const defaultRoomLabel = packageItem?.roomTypes.find((item) => item.active)?.label || "";

  if (fallback && roomOptions.includes(fallback)) {
    return fallback;
  }

  return roomOptions[0] || defaultRoomLabel;
}

export default function LandingPage({ initialAuthView = null }: LandingPageProps) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [submittedFilters, setSubmittedFilters] = useState<Filters>(emptyFilters);
  const [activePackageView, setActivePackageView] = useState<"travel" | null>(null);
  const [publishedTravelPackages, setPublishedTravelPackages] = useState<TravelPackage[]>([]);
  const [travelOptions, setTravelOptions] = useState<TravelPackageOptions>({});
  const [openDateRangePicker, setOpenDateRangePicker] = useState<string | null>(null);
  const [dateRangeMonths, setDateRangeMonths] = useState<Record<string, string>>({});
  const [bookingSectionOpen, setBookingSectionOpen] = useState(false);
  const [selectedBookingTitle, setSelectedBookingTitle] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [visaPreview, setVisaPreview] = useState<string | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [visaFile, setVisaFile] = useState<File | null>(null);
  const [ocrStatus, setOcrStatus] = useState("");
  const [reservationForm, setReservationForm] = useState<ReservationForm>(emptyReservationForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<ReservationField | "passportFile" | "idFile" | "visaFile", string>>>({});
  const [uploadErrors, setUploadErrors] = useState<Partial<Record<ReservationUploadKind, string>>>({});
  const [reservationStatus, setReservationStatus] = useState("");
  const [reservationSuccessOpen, setReservationSuccessOpen] = useState(false);
  const [reservationSubmitting, setReservationSubmitting] = useState(false);
  const [reservationStep, setReservationStep] = useState(3);
  const [selectedHotel, setSelectedHotel] = useState(hotelOptions[0].name);
  const [paymentMethod, setPaymentMethod] = useState<"myfatoorah" | "card">("myfatoorah");
  const [paymentMode, setPaymentMode] = useState<"full" | "installments">("full");
  const [paymentTermsAccepted, setPaymentTermsAccepted] = useState(false);
  const [authPopupOpen, setAuthPopupOpen] = useState(Boolean(initialAuthView));
  const [authView, setAuthView] = useState<AuthPopupView>(initialAuthView ?? "login");
  const [authContextTitle, setAuthContextTitle] = useState("");
  const [authContextPackageId, setAuthContextPackageId] = useState("");
  const [authEmail, setAuthEmail] = useState("traveler@rowad.local");
  const [authPassword, setAuthPassword] = useState("Traveler@12345");
  const [authRemember, setAuthRemember] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authErrors, setAuthErrors] = useState<{ email?: string; password?: string }>({});
  const [travelerUser, setTravelerUser] = useState<AuthUser | null>(null);
  const [packagePricing, setPackagePricing] = useState<PackagePricing | null>(null);
  const [selectedChoiceDetailPackageId, setSelectedChoiceDetailPackageId] = useState<string | null>(null);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"app" | "sms">("app");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const openReservationSection = (title: string, packageId = "") => {
    setSelectedBookingTitle(title);
    setSelectedPackageId(packageId);
    setReservationStatus("");
    setOcrStatus("");
    setFormErrors({});
    setUploadErrors({});
    setReservationSuccessOpen(false);
    setReservationStep(3);
    setSelectedHotel(hotelOptions[0].name);
    setPaymentMethod("myfatoorah");
    setPaymentMode("full");
    setPaymentTermsAccepted(false);
    setBookingSectionOpen(true);
  };

  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.body.classList.add("umrah-body");

    return () => {
      document.body.classList.remove("umrah-body");
    };
  }, []);

  useEffect(() => {
    return () => {
      if (passportPreview) URL.revokeObjectURL(passportPreview);
      if (idPreview) URL.revokeObjectURL(idPreview);
      if (visaPreview) URL.revokeObjectURL(visaPreview);
    };
  }, [passportPreview, idPreview, visaPreview]);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((currentUser) => {
        if (!active) return;
        setTravelerUser(currentUser.isAuthenticated ? currentUser : null);
      })
      .catch(() => {
        if (!active) return;
        setTravelerUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getPackagePricing()
      .then((pricing) => {
        if (active) {
          setPackagePricing(pricing);
        }
      })
      .catch(() => {
        if (active) {
          setPackagePricing(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getPublishedPackages()
      .then((items) => {
        if (!active) return;

        setPublishedTravelPackages(items);
        setTravelOptions((current) => {
          const next = { ...current };

          items.forEach((packageItem) => {
            const compatibleRoomType = getCompatibleRoomLabel(packageItem, defaultTravelPackageOptions.travelers);
            const firstTransport = getDefaultTransportLabel(packageItem);
            const defaultNationality = nationalityOptions[0];

            next[packageItem.id] = next[packageItem.id] ?? {
              ...defaultTravelPackageOptions,
              roomType: compatibleRoomType,
              transportType: firstTransport,
              nationality: defaultNationality,
              hasVisa: "no"
            };
          });

          return next;
        });
      })
      .catch(() => {
        if (active) {
          setPublishedTravelPackages([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!initialAuthView) return;

    const params = new URLSearchParams(window.location.search);
    const bookingTitle = params.get("booking") || "حجز جديد";

    setAuthContextTitle(bookingTitle);

    if (travelerUser?.isAuthenticated) {
      setAuthPopupOpen(false);
      openReservationSection(bookingTitle, authContextPackageId);
      return;
    }

    setAuthView(initialAuthView);
    setAuthMessage("يرجى تسجيل الدخول لإتمام الحجز.");
    setAuthPopupOpen(true);
  }, [authContextPackageId, initialAuthView, travelerUser?.isAuthenticated]);

  const filteredPackages = useMemo(() => {
    return packages.filter((program) => {
      return (
        (!submittedFilters.people || program.people === submittedFilters.people) &&
        (!submittedFilters.city || program.city === submittedFilters.city) &&
        (!submittedFilters.duration || program.duration === submittedFilters.duration)
      );
    });
  }, [submittedFilters]);

  const hasActiveFilters = Boolean(
    submittedFilters.people || submittedFilters.city || submittedFilters.duration || submittedFilters.startDate
  );

  const selectedHotelInfo = hotelOptions.find((hotel) => hotel.name === selectedHotel) ?? hotelOptions[0];
  const availableNationalities = nationalityOptions;
  const selectedPackage = publishedTravelPackages.find((packageItem) => packageItem.id === selectedPackageId) ?? null;
  const fallbackSelectedNationality = availableNationalities[0] ?? nationalityOptions[0];
  const selectedTravelOptions = travelOptions[selectedPackageId] ?? {
    ...defaultTravelPackageOptions,
    roomType: getCompatibleRoomLabel(selectedPackage, defaultTravelPackageOptions.travelers),
    transportType: getDefaultTransportLabel(selectedPackage),
    nationality: fallbackSelectedNationality,
    hasVisa: "no"
  };
  const selectedTransportType = isRowadTravelPackage(selectedPackage) ? rowadFixedTransport : regularFixedTransport;
  const selectedNationality = reservationForm.nationality || selectedTravelOptions.nationality;
  const selectedTravelerCount = Math.max(1, Number(selectedTravelOptions.travelers) || 1);
  const selectedHasVisa = hasExistingVisa(selectedTravelOptions.hasVisa);
  const selectedVisaChoice = getVisaChoiceValue(selectedTravelOptions.hasVisa, selectedNationality);
  const selectedVisaLabel = getVisaTypeLabel(selectedVisaChoice, selectedNationality);
  const selectedEffectiveDurationDays = selectedPackage && !isRowadTravelPackage(selectedPackage)
    ? getLibrePricingDurationDays(selectedTravelOptions.bookingDate, selectedTravelOptions.returnDate, selectedPackage.durationDays)
    : selectedPackage?.durationDays;
  const bookingDays = selectedPackage
    ? `${selectedEffectiveDurationDays ?? selectedPackage.durationDays} أيام`
    : selectedBookingTitle.includes("6") ? "6 أيام" : "10 أيام";
  const bookingNights = selectedEffectiveDurationDays ?? selectedPackage?.durationDays ?? (bookingDays === "6 أيام" ? 6 : 10);
  const todayDateInputValue = getTodayDateInputValue();
  const getHotelNightPrice = (hotelName: string, fallbackPrice: number) =>
    findPackagePrice(packagePricing, bookingDays, hotelName, selectedNationality, fallbackPrice);
  const selectedHotelNightPrice = getHotelNightPrice(selectedHotelInfo.name, selectedHotelInfo.price);
  const getReservationPackagePrice = (hotelName: string, fallbackPrice: number) =>
    selectedPackage
      ? calculatePackagePrice(selectedPackage, {
          packageId: selectedPackage.id,
          nationality: selectedNationality,
          roomType: selectedTravelOptions.roomType,
          transport: selectedTransportType,
          travelers: selectedTravelerCount,
          previousVisa: selectedHasVisa ? "yes" : "no",
          departureDate: selectedTravelOptions.bookingDate,
          durationDays: selectedEffectiveDurationDays ?? selectedPackage.durationDays,
          hotel: hotelName
        })
      : getHotelNightPrice(hotelName, fallbackPrice);
  const selectedPackagePrice = getReservationPackagePrice(selectedHotelInfo.name, selectedHotelInfo.price);
  const hotelTotal = selectedPackage ? selectedPackagePrice : selectedHotelNightPrice * bookingNights;
  const servicesTotal = 0;
  const reservationTotal = hotelTotal + servicesTotal;
  const reservationBaseLabel = selectedPackage ? "سعر الباقة" : "سعر الفندق";

  const validateReservationData = () => {
    const nextErrors: Partial<Record<ReservationField | "passportFile" | "idFile" | "visaFile", string>> = {};

    if (!reservationForm.fullName.trim()) {
      nextErrors.fullName = "يرجى إدخال الاسم الكامل";
    }

    if (!reservationForm.phoneNumber.trim()) {
      nextErrors.phoneNumber = "يرجى إدخال رقم الهاتف";
    }

    if (reservationForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reservationForm.email.trim())) {
      nextErrors.email = "يرجى إدخال بريد إلكتروني صحيح";
    }

    if (!reservationForm.passportNumber.trim()) {
      nextErrors.passportNumber = "يرجى إدخال رقم الجواز";
    }

    if (!passportFile) {
      nextErrors.passportFile = "يرجى رفع صورة جواز السفر";
    }

    if (!idFile) {
      nextErrors.idFile = "يرجى رفع صورة بطاقة الهوية";
    }

    if (selectedHasVisa && !visaFile) {
      nextErrors.visaFile = "يرجى رفع صورة التأشيرة";
    }

    setFormErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  };

  const goToReservationStep = (step: number) => {
    if (step > 3 && !validateReservationData()) {
      setReservationStatus("يرجى إكمال بيانات المسافر والوثائق قبل اختيار الفندق.");
      setReservationStep(1);
      return;
    }

    setReservationStatus("");
    setReservationStep(Math.min(5, Math.max(1, step)));
  };

  const updateFilter = (name: FilterName, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const submitFilters = () => {
    setSubmittedFilters(filters);
    document.getElementById("gv-packages")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setSubmittedFilters(emptyFilters);
  };

  const openPackageView = (type: string) => {
    if (type !== "travel") {
      return;
    }

    setActivePackageView("travel");
    window.setTimeout(() => {
      document.getElementById("gv-travel-packages")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const openAuthPopup = (view: AuthPopupView, title = "", packageId = "") => {
    setAuthContextTitle(title);
    setAuthContextPackageId(packageId);
    setAuthView(view);
    setAuthMessage("");
    if (view === "verify" || view === "reset" || view === "forgot" || view === "register") {
      setVerificationCode(["", "", "", "", "", ""]);
    }
    setAuthPopupOpen(true);
  };

  const openBookingSection = (title: string, packageId = "") => {
    const bookingTitle = title || "حجز جديد";
    const packageItem = publishedTravelPackages.find((item) => item.id === packageId);
    const options = packageId ? travelOptions[packageId] : null;

    if (packageItem && !isRowadTravelPackage(packageItem) && (!options?.bookingDate || !options?.returnDate)) {
      const defaultNationality = availableNationalities[0] ?? nationalityOptions[0];
      setTravelOptions((current) => ({
        ...current,
        [packageId]: {
          ...(current[packageId] ?? {
            ...defaultTravelPackageOptions,
            roomType: getCompatibleRoomLabel(packageItem, defaultTravelPackageOptions.travelers),
            transportType: getDefaultTransportLabel(packageItem),
            nationality: defaultNationality,
            hasVisa: "no"
          }),
          dateError: "اختر تاريخ بداية ونهاية الرحلة قبل المتابعة."
        }
      }));
      setOpenDateRangePicker(packageId);
      return;
    }

    if (packageItem && !isRowadTravelPackage(packageItem)) {
      const dateRangeError = getLibreDateRangeError(options?.bookingDate, options?.returnDate);
      if (dateRangeError) {
        setTravelOptions((current) => ({
          ...current,
          [packageId]: {
            ...(current[packageId] ?? defaultTravelPackageOptions),
            dateError: dateRangeError
          }
        }));
        setOpenDateRangePicker(packageId);
        return;
      }
    }

    if (packageItem && packageItem.departureDates.length > 0 && !options?.bookingDate) {
      const defaultNationality = availableNationalities[0] ?? nationalityOptions[0];
      setTravelOptions((current) => ({
        ...current,
        [packageId]: {
          ...(current[packageId] ?? {
            ...defaultTravelPackageOptions,
            roomType: getCompatibleRoomLabel(packageItem, defaultTravelPackageOptions.travelers),
            transportType: getDefaultTransportLabel(packageItem),
            nationality: defaultNationality,
            hasVisa: "no"
          }),
          dateError: "اختر تاريخ الحجز قبل المتابعة."
        }
      }));
      return;
    }

    /*
    if (!travelerUser?.isAuthenticated) {
      openAuthPopup("login", bookingTitle, packageId);
      setAuthMessage("يرجى تسجيل الدخول لإتمام الحجز.");
      return;
    }
    */

    openReservationSection(bookingTitle, packageId);
  };

  const updateTravelOption = (
    packageId: string,
    name: "bookingDate" | "returnDate" | "travelers" | "roomType" | "transportType" | "nationality" | "hasVisa",
    value: string
  ) => {
    if (name === "hasVisa" && !hasExistingVisa(value)) {
      removeDocumentFile("visa");
      setFormErrors((current) => ({ ...current, visaFile: "" }));
      setUploadErrors((current) => ({ ...current, visa: "" }));
    }

    setTravelOptions((current) => {
      const packageItem = publishedTravelPackages.find((item) => item.id === packageId);
      const defaultNationality = availableNationalities[0] ?? nationalityOptions[0];
      const currentOptions = current[packageId] ?? {
        ...defaultTravelPackageOptions,
        roomType: getCompatibleRoomLabel(packageItem, defaultTravelPackageOptions.travelers),
        transportType: getDefaultTransportLabel(packageItem),
        nationality: defaultNationality,
        hasVisa: "no"
      };
      const nextOptions = {
        ...currentOptions,
        [name]: value,
        dateError: name === "bookingDate" || name === "returnDate" ? "" : currentOptions.dateError
      };

      if (name === "travelers") {
        nextOptions.roomType = getCompatibleRoomLabel(packageItem, value, currentOptions.roomType);
      }

      nextOptions.transportType = isRowadTravelPackage(packageItem) ? rowadFixedTransport : regularFixedTransport;

      return {
        ...current,
        [packageId]: nextOptions
      };
    });
  };

  const updateTravelBookingDate = (packageId: string, departureDates: string[], value: string) => {
    const isPastDate = Boolean(value && value < todayDateInputValue);
    const validDate = !value || (!isPastDate && (departureDates.length === 0 || departureDates.includes(value)));

    setTravelOptions((current) => ({
      ...current,
      [packageId]: {
        ...(current[packageId] ?? defaultTravelPackageOptions),
        bookingDate: validDate ? value : "",
        dateError: isPastDate ? "لا يمكن اختيار تاريخ سابق." : value && !validDate ? "هذا التاريخ غير متاح لهذه الباقة." : ""
      }
    }));
  };

  const updateTravelDateRange = (packageId: string, selectedDate: string) => {
    if (!selectedDate || selectedDate < todayDateInputValue) return;

    setTravelOptions((current) => {
      const currentOptions = current[packageId] ?? defaultTravelPackageOptions;
      const hasCompleteRange = Boolean(currentOptions.bookingDate && currentOptions.returnDate);
      const shouldStartNewRange = !currentOptions.bookingDate || hasCompleteRange || selectedDate < currentOptions.bookingDate;
      const nextOptions = shouldStartNewRange
        ? { ...currentOptions, bookingDate: selectedDate, returnDate: "", dateError: "" }
        : {
          ...currentOptions,
          returnDate: selectedDate,
          dateError: getLibreDateRangeError(currentOptions.bookingDate, selectedDate)
        };

      return {
        ...current,
        [packageId]: nextOptions
      };
    });
  };

  const changeDateRangeMonth = (packageId: string, currentMonth: string, amount: number) => {
    setDateRangeMonths((current) => ({
      ...current,
      [packageId]: addMonthsToDate(currentMonth, amount)
    }));
  };

  const handleAuthLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: { email?: string; password?: string } = {};
    const trimmedEmail = authEmail.trim();

    if (!trimmedEmail) {
      nextErrors.email = "يرجى إدخال البريد الإلكتروني";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "يرجى إدخال بريد إلكتروني صحيح";
    }

    if (!authPassword) {
      nextErrors.password = "يرجى إدخال كلمة المرور";
    }

    setAuthErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setAuthMessage("");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    try {
      const result = await loginUser({
        email: trimmedEmail,
        password: authPassword,
        rememberMe: authRemember
      });

      if (!result.succeeded || !result.user) {
        if (result.message === "EMAIL_NOT_CONFIRMED") {
          setVerificationCode(["", "", "", "", "", ""]);
          setAuthView("verify");
          setAuthMessage("تم إرسال رمز التحقق إلى بريدك الإلكتروني. أدخل الرمز لتفعيل الحساب.");
          return;
        }

        setAuthMessage(result.message || "تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.");
        return;
      }

      const isAdminAccount = result.user.roles.some((role) => ["admin", "employee"].includes(role.toLowerCase()));

      if (isAdminAccount) {
        await logoutUser();
        setTravelerUser(null);
        setAuthMessage("هذا الحساب مخصص للإدارة. يرجى استخدام رابط الإدارة لتسجيل الدخول.");
        return;
      }

      setTravelerUser(result.user);
      setAuthPopupOpen(false);

      if (authContextTitle) {
        openReservationSection(authContextTitle, authContextPackageId);
      }

      if (window.location.pathname === "/booking/login") {
        window.history.replaceState({}, "", "/");
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "تعذر تسجيل الدخول حالياً.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTravelerLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // The traveler may already be logged out server-side.
    }

    setTravelerUser(null);
    setBookingSectionOpen(false);
    setAuthPopupOpen(false);
    setAuthMessage("");
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMessage("");

    if (!registerForm.acceptTerms) {
      setAuthMessage("يجب الموافقة على الشروط والأحكام قبل إنشاء الحساب.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setAuthLoading(true);

    try {
      const result = await registerTraveler({
        fullName: registerForm.fullName.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim(),
        password: registerForm.password
      });

      if (result.message === "EMAIL_NOT_CONFIRMED" || result.message === "VERIFICATION_CODE_SENT") {
        setAuthEmail(registerForm.email.trim());
        setVerificationCode(["", "", "", "", "", ""]);
        setAuthMessage("تم إرسال رمز التحقق إلى بريدك الإلكتروني.");
        setAuthView("verify");
        return;
      }

      if (!result.succeeded) {
        setAuthMessage(result.message || "تعذر إنشاء الحساب.");
        return;
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "تعذر إنشاء الحساب حالياً.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    setVerificationCode(["", "", "", "", "", ""]);

    try {
      const result = await forgotPassword({ email: authEmail.trim() });
      setAuthMessage(result.message || "تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني.");
      setAuthView("reset");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "تعذر إرسال رمز إعادة التعيين حالياً.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMessage("");

    if (resetForm.password !== resetForm.confirmPassword) {
      setAuthMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    const code = verificationCode.join("");
    if (code.length !== 6) {
      setAuthMessage("يرجى إدخال رمز التحقق المكون من 6 أرقام.");
      return;
    }

    setAuthLoading(true);

    try {
      const result = await resetPassword({
        email: authEmail.trim(),
        code,
        password: resetForm.password
      });

      if (!result.succeeded) {
        setAuthMessage(result.message || "تعذر تغيير كلمة المرور.");
        return;
      }

      setAuthPassword("");
      setVerificationCode(["", "", "", "", "", ""]);
      setAuthMessage("تم حفظ كلمة المرور الجديدة. يمكنك تسجيل الدخول الآن.");
      setAuthView("login");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "تعذر تغيير كلمة المرور حالياً.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = verificationCode.join("");

    if (code.length !== 6) {
      setAuthMessage("يرجى إدخال رمز التحقق المكون من 6 أرقام.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    try {
      const result = await verifyEmail({
        email: authEmail.trim(),
        code,
        rememberMe: authRemember
      });

      if (!result.succeeded || !result.user) {
        setAuthMessage(result.message || "رمز التحقق غير صحيح.");
        return;
      }

      setTravelerUser(result.user);
      setAuthPopupOpen(false);
      setVerificationCode(["", "", "", "", "", ""]);

      if (authContextTitle) {
        openReservationSection(authContextTitle, authContextPackageId);
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "تعذر التحقق من الرمز حالياً.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendVerificationCode = async () => {
    if (!authEmail.trim()) {
      setAuthMessage("يرجى إدخال البريد الإلكتروني أولاً.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    try {
      const result = await resendEmailCode({ email: authEmail.trim() });
      setAuthMessage(result.message || "تم إرسال رمز جديد.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "تعذر إرسال رمز جديد حالياً.");
    } finally {
      setAuthLoading(false);
    }
  };

  const updateVerificationCode = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    setVerificationCode((current) => current.map((item, itemIndex) => (itemIndex === index ? nextValue : item)));
  };

  const authCopy = {
    login: {
      heroTitle: "رحلة إيمانية تبدأ من هنا ..",
      heroText: "نعمل لأجل أن تكون رحلتك إلى بيت الله أسهل وأجمل",
      title: "مرحباً بعودتك",
      subtitle: "سجل الدخول إلى حسابك لمتابعة رحلتك الإيمانية"
    },
    register: {
      heroTitle: "رحلة إيمانية تبدأ من هنا ..",
      heroText: "ابدأ رحلتك المباركة إلى بيت الله الحرام بخطوات سهلة وآمنة",
      title: "إنشاء حساب جديد",
      subtitle: "سجل بياناتك وابدأ رحلتك الإيمانية معنا"
    },
    forgot: {
      heroTitle: "استعد الوصول إلى حسابك ..",
      heroText: "رحلتك الإيمانية دائماً قريبة، نساعدك على العودة بكل سهولة وأمان",
      title: "نسيت كلمة المرور؟",
      subtitle: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين"
    },
    reset: {
      heroTitle: "رحلتك الإيمانية تكتمل بأمان ..",
      heroText: "مع كل خطوة، أنت أقرب إلى بيت الله",
      title: "إعادة تعيين كلمة المرور",
      subtitle: "أدخل كلمة مرور جديدة لتأمين حسابك"
    },
    verify: {
      heroTitle: "تحقق بأمان .. واستكمل رحلتك المباركة",
      heroText: "خطوة واحدة تفصلك عن مواصلة رحلتك إلى بيت الله الحرام",
      title: "التحقق من الرمز",
      subtitle: "أدخل رمز التحقق المرسل إلى هاتفك أو بريدك الإلكتروني"
    },
    twoFactor: {
      heroTitle: "أمان أكبر لرحلتك الإيمانية ..",
      heroText: "نحمي حسابك اليوم لتبقى رحلتك إلى بيت الله آمنة دائماً",
      title: "التحقق بخطوتين",
      subtitle: "أضف طبقة حماية إضافية إلى حسابك"
    }
  }[authView];

  const updateReservationField = (name: ReservationField, value: string) => {
    setReservationForm((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));

    if (name === "nationality" && selectedPackageId) {
      setTravelOptions((current) => {
        const packageItem = publishedTravelPackages.find((item) => item.id === selectedPackageId);
        const currentOptions = current[selectedPackageId] ?? {
          ...defaultTravelPackageOptions,
          roomType: getCompatibleRoomLabel(packageItem, defaultTravelPackageOptions.travelers),
          transportType: getDefaultTransportLabel(packageItem)
        };

        return {
          ...current,
          [selectedPackageId]: {
            ...currentOptions,
            nationality: value
          }
        };
      });
    }
  };

  const validateDocumentFile = (file: File) => {
    if (!acceptedDocumentTypes.includes(file.type)) {
      return "صيغة الملف غير مدعومة";
    }

    if (file.size > maxDocumentSize) {
      return "حجم الملف يتجاوز الحد المسموح به 5MB";
    }

    return "";
  };

  const updateDocumentFile = (kind: ReservationUploadKind, file?: File) => {
    if (!file) return;

    const error = validateDocumentFile(file);
    if (error) {
      setUploadErrors((current) => ({ ...current, [kind]: error }));
      return;
    }

    setUploadErrors((current) => ({ ...current, [kind]: "" }));
    const formErrorKey = kind === "passport" ? "passportFile" : kind === "id" ? "idFile" : "visaFile";
    setFormErrors((current) => ({ ...current, [formErrorKey]: "" }));

    if (kind === "passport") {
      if (passportPreview) URL.revokeObjectURL(passportPreview);
      setPassportFile(file);
      setPassportPreview(isImageFile(file) ? URL.createObjectURL(file) : null);
      return;
    }

    if (kind === "visa") {
      if (visaPreview) URL.revokeObjectURL(visaPreview);
      setVisaFile(file);
      setVisaPreview(isImageFile(file) ? URL.createObjectURL(file) : null);
      return;
    }

    if (idPreview) URL.revokeObjectURL(idPreview);
    setIdFile(file);
    setIdPreview(isImageFile(file) ? URL.createObjectURL(file) : null);
  };

  const updatePassportFile = (file?: File) => {
    updateDocumentFile("passport", file);
  };

  const updateIdFile = (file?: File) => {
    updateDocumentFile("id", file);
  };

  const updateVisaFile = (file?: File) => {
    updateDocumentFile("visa", file);
  };

  const removeDocumentFile = (kind: ReservationUploadKind) => {
    if (kind === "passport") {
      if (passportPreview) URL.revokeObjectURL(passportPreview);
      setPassportFile(null);
      setPassportPreview(null);
      return;
    }

    if (kind === "visa") {
      if (visaPreview) URL.revokeObjectURL(visaPreview);
      setVisaFile(null);
      setVisaPreview(null);
      return;
    }

    if (idPreview) URL.revokeObjectURL(idPreview);
    setIdFile(null);
    setIdPreview(null);
  };

  const handleDocumentDrop = (kind: ReservationUploadKind, fileList: FileList | null) => {
    updateDocumentFile(kind, fileList?.[0]);
  };

  const extractAllDocuments = async () => {
    if (!passportFile && !idFile) {
      setOcrStatus("الرجاء إضافة جواز السفر أو بطاقة الهوية أولاً.");
      return;
    }

    setOcrStatus("جارٍ استخراج البيانات الذكية...");
    const messages: string[] = [];

    if (passportFile) {
      try {
        const result = await readPassportOcr(passportFile);
        setReservationForm((current) => ({
          ...current,
          passportNumber: result.passportNumber || current.passportNumber,
          fullName: result.fullName || current.fullName,
          nationality: normalizeNationality(result.nationality) || current.nationality,
          gender: result.gender || current.gender,
          dateOfBirth: toDateInputValue(result.dateOfBirth) || current.dateOfBirth,
          passportExpiryDate: toDateInputValue(result.passportExpiryDate) || current.passportExpiryDate
        }));
        messages.push(result.mode === "demo" ? result.message : "تم استخراج بيانات جواز السفر.");
      } catch (error) {
        messages.push(error instanceof Error ? error.message : "تعذر استخراج بيانات جواز السفر.");
      }
    }

    if (idFile) {
      try {
        const result = await readCivilIdOcr(idFile);
        setReservationForm((current) => ({
          ...current,
          civilId: result.civilId || current.civilId,
          passportNumber: result.passportNumber || current.passportNumber,
          fullName: result.fullName || current.fullName,
          nationality: normalizeNationality(result.nationality) || current.nationality,
          gender: result.gender || current.gender,
          dateOfBirth: toDateInputValue(result.dateOfBirth) || current.dateOfBirth,
          passportExpiryDate: toDateInputValue(result.passportExpiryDate) || current.passportExpiryDate
        }));
        messages.push(result.mode === "demo" ? result.message : "تم استخراج بيانات بطاقة الهوية.");
      } catch (error) {
        messages.push(error instanceof Error ? error.message : "تعذر استخراج بيانات بطاقة الهوية.");
      }
    }

    setOcrStatus(messages.join(" "));
  };

  const submitReservation = async () => {
    /*
    if (!travelerUser?.isAuthenticated) {
      setBookingSectionOpen(false);
      openAuthPopup("login", selectedBookingTitle || "حجز جديد", selectedPackageId);
      setAuthMessage("يرجى تسجيل الدخول قبل تأكيد طلب الحجز.");
      return;
    }
    */

    if (!validateReservationData()) {
      setReservationStatus("يرجى مراجعة البيانات المطلوبة.");
      setReservationStep(1);
      return;
    }

    if (!paymentTermsAccepted) {
      setReservationStatus("يرجى الموافقة على الشروط والأحكام وسياسة الإلغاء.");
      setReservationStep(5);
      return;
    }

    setReservationSubmitting(true);
    setReservationStatus("");

    try {
      const formData = new FormData();
      formData.append("PassportNumber", reservationForm.passportNumber.trim());
      formData.append("FullName", reservationForm.fullName.trim());
      formData.append("Nationality", selectedNationality.trim() || "غير محدد");
      formData.append("Gender", reservationForm.gender.trim() || "غير محدد");
      formData.append("DateOfBirth", reservationForm.dateOfBirth || "1990-01-01");
      formData.append("PassportExpiryDate", reservationForm.passportExpiryDate || "");
      formData.append("PhoneNumber", reservationForm.phoneNumber.trim());
      formData.append("Email", reservationForm.email.trim());
      formData.append("ResidenceNumber", reservationForm.civilId.trim());
      formData.append(
        "Notes",
        [
          `حجز عمرة مكتمل من الصفحة العامة: ${selectedBookingTitle || "حجز جديد"}`,
          selectedPackage ? `الباقة: ${selectedPackage.name}` : "",
          selectedTravelOptions.bookingDate ? `بداية الرحلة: ${selectedTravelOptions.bookingDate}` : "",
          selectedTravelOptions.returnDate ? `نهاية الرحلة: ${selectedTravelOptions.returnDate}` : "",
          selectedPackage && !isRowadTravelPackage(selectedPackage)
            ? `مدة الرحلة: ${getInclusiveDateRangeDays(selectedTravelOptions.bookingDate, selectedTravelOptions.returnDate)} أيام`
            : "",
          selectedPackage && !isRowadTravelPackage(selectedPackage)
            ? `تعرفة الحساب: ${selectedEffectiveDurationDays} أيام`
            : "",
          selectedTravelOptions.travelers ? `عدد الأشخاص: ${selectedTravelOptions.travelers}` : "",
          selectedTravelOptions.roomType ? `نوع الغرفة: ${selectedTravelOptions.roomType}` : "",
          selectedTransportType ? `وسيلة النقل: ${selectedTransportType}` : "",
          `التأشيرة: ${selectedVisaLabel}`,
          `المبلغ المحسوب: ${reservationTotal.toLocaleString("en-US")} د.ك`
        ].filter(Boolean).join(" | ")
      );
      formData.append("PassportImagePath", "");
      formData.append("IsBlocked", "false");
      formData.append("PackageId", selectedPackage?.id ?? "");
      formData.append("PackageName", selectedPackage?.name ?? selectedBookingTitle ?? "");
      formData.append("BookingDate", selectedTravelOptions.bookingDate || "");
      formData.append("ReturnDate", selectedTravelOptions.returnDate || "");
      formData.append("TravelersCount", String(selectedTravelerCount));
      formData.append("RoomType", selectedTravelOptions.roomType || "");
      formData.append("TransportType", selectedTransportType || "");
      formData.append("HasVisa", String(selectedHasVisa));
      formData.append("ReservationTotal", String(reservationTotal));
      if (passportFile) {
        formData.append("passportImage", passportFile);
      }
      if (idFile) {
        formData.append("civilIdImage", idFile);
      }
      if (visaFile) {
        formData.append("visaImage", visaFile);
      }

      await createTraveler(formData);
      setReservationStatus("");
      setReservationSuccessOpen(true);
    } catch (error) {
      setReservationStatus(error instanceof Error ? error.message : "تعذر إرسال طلب الحجز.");
    } finally {
      setReservationSubmitting(false);
    }
  };

  const renderReservationDocumentCard = ({
    kind,
    number,
    title,
    subtitle,
    inputId,
    file,
    preview,
    error,
    onFileChange
  }: {
    kind: ReservationUploadKind;
    number: string;
    title: string;
    subtitle: string;
    inputId: string;
    file: File | null;
    preview: string | null;
    error?: string;
    onFileChange: (file?: File) => void;
  }) => (
    <article className="gv-doc-card">
      <div className="gv-doc-card__head">
        <span>{number}</span>
        <div>
          <strong>{title}</strong>
          <p>{subtitle}</p>
        </div>
        <DocumentIcon className="icon icon-sm" />
      </div>
      <label
        className="gv-doc-dropzone"
        htmlFor={inputId}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleDocumentDrop(kind, event.dataTransfer.files);
        }}
      >
        <input id={inputId} type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => onFileChange(event.target.files?.[0])} />
        <span className="gv-doc-dropzone__icon"><DocumentIcon className="icon icon-sm" /></span>
        <b>{preview ? "تم اختيار الملف" : "اسحب وأفلت الملف هنا"}</b>
        <small>أو اضغط للاختيار من جهازك</small>
      </label>
      {file ? (
        <div className="gv-doc-file">
          {preview ? <img src={preview} alt={title} /> : <DocumentIcon className="icon icon-sm" />}
          <span>{file.name}</span>
          <button type="button" onClick={() => removeDocumentFile(kind)} aria-label="حذف الملف">×</button>
        </div>
      ) : null}
      {file ? <em className="gv-doc-ready">تم الرفع وجاهز للاستخراج</em> : null}
      {error ? <em className="gv-upload-error">{error}</em> : null}
    </article>
  );

  const rowadTravelPackages = publishedTravelPackages.filter((program) => isRowadTravelPackage(program));
  const regularTravelPackages = publishedTravelPackages.filter((program) => !isRowadTravelPackage(program));
  const libreTravelPackage = regularTravelPackages[0] ?? null;
  const rowadTravelBackground = resolvePackageImageUrl(rowadTravelPackages[1]?.imageUrl ?? rowadTravelPackages[0]?.imageUrl ?? landingAsset("hero-kaaba-premium.png"));
  const rowadTravelStyle = { "--rowad-travel-bg": `url(${rowadTravelBackground})` } as CSSProperties;
  const activeDateRangePackage = openDateRangePicker
    ? publishedTravelPackages.find((program) => program.id === openDateRangePicker) ?? null
    : null;
  const activeDateRangeOptions = activeDateRangePackage
    ? travelOptions[activeDateRangePackage.id] ?? {
      ...defaultTravelPackageOptions,
      roomType: getCompatibleRoomLabel(activeDateRangePackage, defaultTravelPackageOptions.travelers),
      transportType: getDefaultTransportLabel(activeDateRangePackage),
      nationality: availableNationalities[0] ?? nationalityOptions[0],
      hasVisa: "no"
    }
    : null;
  const activeDateRangeMonth = activeDateRangePackage
    ? dateRangeMonths[activeDateRangePackage.id] ?? `${(activeDateRangeOptions?.bookingDate || todayDateInputValue).slice(0, 7)}-01`
    : todayDateInputValue;

  const renderTravelPackageCard = (program: TravelPackage, variant: "rowad" | "regular" = "regular") => {
    const defaultNationality = availableNationalities[0] ?? nationalityOptions[0];
    const options = travelOptions[program.id] ?? {
      ...defaultTravelPackageOptions,
      roomType: getCompatibleRoomLabel(program, "1"),
      transportType: getDefaultTransportLabel(program),
      nationality: defaultNationality,
      hasVisa: "no",
      dateError: ""
    };
    const activeRoomTypes = program.roomTypes.filter((item) => item.active);
    const roomOptions = getRoomCombinationOptions(program, options.travelers);
    const isRowadPackage = isRowadTravelPackage(program);
    const selectedTransport = isRowadPackage ? rowadFixedTransport : regularFixedTransport;
    const selectedVisaChoice = getVisaChoiceValue(options.hasVisa, options.nationality);
    const selectedVisaLabel = getVisaTypeLabel(selectedVisaChoice, options.nationality);
    const travelerCount = Math.max(1, Number(options.travelers) || 1);
    const pricingDurationDays = !isRowadPackage
      ? getLibrePricingDurationDays(options.bookingDate, options.returnDate, program.durationDays)
      : program.durationDays;
    const dateRangeLabel = options.bookingDate && options.returnDate
      ? `${options.bookingDate} - ${options.returnDate}`
      : options.bookingDate
        ? `${options.bookingDate} - العودة`
        : "اختر الأيام";
    const dynamicPrice = calculatePackagePrice(program, {
      packageId: program.id,
      travelers: travelerCount,
      roomType: options.roomType,
      transport: selectedTransport,
      nationality: options.nationality,
      previousVisa: hasExistingVisa(options.hasVisa) ? "yes" : "no",
      departureDate: options.bookingDate,
      durationDays: pricingDurationDays
    });
    const displayPrice = dynamicPrice || getPackageFromPrice(program);

    return (
      <article className={`gv-travel-card ${variant === "rowad" ? "gv-travel-card--rowad" : "gv-travel-card--standard"}`} key={program.id}>
        <div className="gv-travel-card__media" style={{ backgroundImage: `url(${resolvePackageImageUrl(program.imageUrl)})` }}>
          {variant === "rowad" ? <span><CalendarIcon className="icon icon-sm" /> {program.durationLabel}</span> : null}
          {/* {variant === "rowad" ? <em className="gv-travel-card__brand">رواد</em> : null} */}
        </div>
        <div className="gv-travel-card__body">
          <div className="gv-travel-card__features gv-travel-card__features--controls">
            <label>
              <span className="gv-travel-field-title"><CalendarIcon className="icon icon-sm" /><strong>تاريخ الحجز</strong></span>
              {variant !== "rowad" ? (
                <div className="gv-date-range">
                  <button
                    type="button"
                    className="gv-date-range__trigger"
                    onClick={() => setOpenDateRangePicker((current) => current === program.id ? null : program.id)}
                  >
                    <span>{dateRangeLabel}</span>
                    <CalendarIcon className="icon icon-sm" />
                  </button>
                </div>
              ) : program.departureDates.length > 0 ? (
                <select
                  value={options.bookingDate}
                  onChange={(event) => updateTravelOption(program.id, "bookingDate", event.target.value)}
                >
                  <option value="">اختر التاريخ</option>
                  {program.departureDates.map((date) => (
                    <option key={date} value={date} disabled={date < todayDateInputValue}>{date}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  min={todayDateInputValue}
                  value={options.bookingDate}
                  onChange={(event) => updateTravelBookingDate(program.id, program.departureDates, event.target.value)}
                />
              )}
            </label>
            <label>
              <span className="gv-travel-field-title"><GlobeIcon className="icon icon-sm" /><strong>الجنسية</strong></span>
              <select
                value={options.nationality}
                onChange={(event) => updateTravelOption(program.id, "nationality", event.target.value)}
              >
                {availableNationalities.map((nationality) => (
                  <option key={nationality} value={nationality}>{nationality}</option>
                ))}
              </select>
            </label>
            <label className="gv-travel-field--visa">
              <span className="gv-travel-field-title"><DocumentIcon className="icon icon-sm" /><strong>التأشيرة</strong></span>
              <select
                value={selectedVisaChoice}
                onChange={(event) => updateTravelOption(program.id, "hasVisa", event.target.value)}
                aria-label={`التأشيرة: ${selectedVisaLabel}`}
              >
                <option value="no">{getVisaTypeLabel("no", options.nationality)}</option>
                <option value={getExistingVisaChoiceForNationality(options.nationality)}>
                  {getVisaTypeLabel(getExistingVisaChoiceForNationality(options.nationality), options.nationality)}
                </option>
              </select>
            </label>
            {!isRowadPackage ? (
              <label>
                <span className="gv-travel-field-title"><BusIcon className="icon icon-sm" /><strong>وسيلة النقل</strong></span>
                <input type="text" value={regularFixedTransport} readOnly aria-readonly="true" />
              </label>
            ) : null}
            <label>
              <span className="gv-travel-field-title"><UsersIcon className="icon icon-sm" /><strong>عدد الأشخاص</strong></span>
              {travelerCountOptions.includes(options.travelers) ? (
                <select
                  value={options.travelers}
                  onChange={(event) => {
                    const nextValue = event.target.value === customTravelerOption ? "5" : event.target.value;
                    updateTravelOption(program.id, "travelers", nextValue);
                  }}
                >
                  {travelerCountOptions.map((count) => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                  <option value={customTravelerOption}>عدد مخصص</option>
                </select>
              ) : (
                <input
                  className="gv-custom-travelers-input"
                  type="number"
                  min="1"
                  max="99"
                  value={options.travelers}
                  onChange={(event) => updateTravelOption(program.id, "travelers", event.target.value)}
                  aria-label="عدد الأشخاص المخصص"
                />
              )}
            </label>
            <label>
              <span className="gv-travel-field-title"><BedIcon className="icon icon-sm" /><strong>نوع الغرفة</strong></span>
              <select
                value={options.roomType}
                onChange={(event) => updateTravelOption(program.id, "roomType", event.target.value)}
              >
                {(roomOptions.length ? roomOptions : activeRoomTypes.map((roomType) => roomType.label)).map((roomTypeLabel) => (
                  <option key={roomTypeLabel} value={roomTypeLabel}>{roomTypeLabel}</option>
                ))}
              </select>
            </label>
          </div>
          {options.dateError ? (
            <p className="gv-travel-card__date-error">{options.dateError}</p>
          ) : null}
          {variant === "rowad" ? (
            <div className="gv-travel-card__divider" />
          ) : (
            <div className="gv-travel-card__divider"><span><PlaneIcon className="icon icon-sm" /></span></div>
          )}
          <div className="gv-travel-card__footer">
            {variant === "rowad" ? (
              <>
                <p>الإجمالي <b>{displayPrice.toLocaleString("en-US")}</b> {program.currency}</p>
                <button type="button" onClick={() => openBookingSection(program.durationLabel, program.id)}>
                  حجز
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => openBookingSection(program.durationLabel, program.id)}>
                  حجز الآن
                  <PlaneIcon className="icon icon-sm" />
                </button>
                <div className="gv-travel-card__footer-separator" />
                <p className="gv-travel-card__price">
                  <span>الإجمالي</span>
                  <b>{displayPrice.toLocaleString("en-US")}</b>
                  <small>{program.currency}</small>
                  <CoinsIcon className="icon icon-md" />
                </p>
              </>
            )}
          </div>
        </div>
      </article>
    );
  };

  const packageChoiceItems = [
    ...rowadTravelPackages,
    ...(libreTravelPackage ? [libreTravelPackage] : [])
  ];
  const showPackageChoiceWizard: boolean = false;
  const defaultChoicePackage = rowadTravelPackages.find((program) => program.durationDays <= 6) ?? packageChoiceItems[0] ?? null;
  const highlightedChoicePackage = selectedChoiceDetailPackageId
    ? packageChoiceItems.find((program) => program.id === selectedChoiceDetailPackageId) ?? null
    : null;
  const footerChoicePackage = highlightedChoicePackage ?? defaultChoicePackage;
  const highlightedChoicePrice = footerChoicePackage ? getPackageFromPrice(footerChoicePackage) : 0;

  const packageChoiceSteps = [
    { number: 1, label: "اختيار الرحلة", text: "حدد الباقة المناسبة", icon: <ShieldIcon className="icon icon-sm" /> },
    { number: 2, label: "تحديد التاريخ", text: "اختر تاريخ رحلتك", icon: <CalendarIcon className="icon icon-sm" /> },
    { number: 3, label: "بيانات المسافرين", text: "أضف بيانات المسافرين", icon: <UsersIcon className="icon icon-sm" /> },
    { number: 4, label: "اختيار الفندق", text: "اختر الفندق المناسب", icon: <BedIcon className="icon icon-sm" /> },
    { number: 5, label: "معلومات إضافية", text: "راجع التفاصيل", icon: <BusIcon className="icon icon-sm" /> },
    { number: 6, label: "الدفع", text: "إتمام الحجز", icon: <DocumentIcon className="icon icon-sm" /> }
  ];

  const renderPackageChoiceCard = (program: TravelPackage) => {
    const isFlexible = program.id === "umrah-flexible" || !isRowadTravelPackage(program);
    const isSixDays = program.durationDays <= 6;
    const title = isFlexible ? "باقة مخصصة" : isSixDays ? "باقة 6 أيام" : "باقة 10 أيام";
    const description = isFlexible
      ? "صمم رحلتك حسب احتياجاتك وميزانيتك"
      : isSixDays
        ? "رحلة مميزة ومختصرة لأداء مناسك العمرة براحة تامة"
        : "رحلة متكاملة مع مدة أطول لراحة أكبر وتجربة أعمق";
    const actionLabel = isFlexible ? "تخصيص الباقة" : "عرض التفاصيل";
    const ribbonLabel = isFlexible ? "مخصصة لك" : isSixDays ? "الأكثر طلباً" : "أفضل للعائلات";
    const badgeLabel = isFlexible ? "باقة مخصصة" : `${program.durationDays}`;
    const price = getPackageFromPrice(program);
    const features = isFlexible
      ? [
        { label: "اختر المدة", icon: <CalendarIcon className="icon icon-sm" /> },
        { label: "وسيلة التنقل", icon: <BusIcon className="icon icon-sm" /> },
        { label: "وسيلة النقل", icon: <BedIcon className="icon icon-sm" /> },
        { label: "خدمات إضافية", icon: <SearchIcon className="icon icon-sm" /> }
      ]
      : isSixDays
        ? [
          { label: "دعم 24/7", icon: <UsersIcon className="icon icon-sm" /> },
          { label: "مواصلات", icon: <BusIcon className="icon icon-sm" /> },
          { label: "فندق مميز", icon: <BedIcon className="icon icon-sm" /> },
          { label: "تذاكر طيران", icon: <PlaneIcon className="icon icon-sm" /> }
        ]
        : [
          { label: "وجبات إضافية", icon: <UsersIcon className="icon icon-sm" /> },
          { label: "فندق فاخر", icon: <BedIcon className="icon icon-sm" /> },
          { label: "مواصلات", icon: <BusIcon className="icon icon-sm" /> },
          { label: "تذاكر طيران", icon: <PlaneIcon className="icon icon-sm" /> }
        ];

    return (
      <article
        className={[
          isSixDays && !isFlexible ? "gv-choice-card is-selected" : "gv-choice-card",
          selectedChoiceDetailPackageId === program.id ? "is-detail-open" : "",
          isFlexible ? "is-flexible" : ""
        ].filter(Boolean).join(" ")}
        key={program.id}
      >
        <div className="gv-choice-card__media" style={{ backgroundImage: `url(${resolvePackageImageUrl(program.imageUrl)})` }}>
          <span className="gv-choice-card__ribbon">{ribbonLabel}</span>
          {isSixDays && !isFlexible ? <span className="gv-choice-card__selected">✓</span> : null}
          <span className="gv-choice-card__duration">
            {badgeLabel}
            {!isFlexible ? <small>أيام</small> : null}
            <CalendarIcon className="icon icon-sm" />
          </span>
        </div>
        <div className="gv-choice-card__body">
          <h3>{title}</h3>
          <p>{description}</p>
          <div className="gv-choice-card__features">
            {features.map((feature) => (
              <span key={feature.label}>
                {feature.icon}
                {feature.label}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (isFlexible) {
                openBookingSection(program.durationLabel, program.id);
                return;
              }
              setSelectedChoiceDetailPackageId(program.id);
            }}
          >
            {actionLabel}
          </button>
          <strong className="gv-choice-card__price">
            <small>ابتداءً من</small>
            <b>{price.toLocaleString("en-US")}</b>
            <span>ر.س</span>
          </strong>
          <button
            className="gv-choice-card__arrow"
            type="button"
            aria-label={actionLabel}
            onClick={() => {
              if (isFlexible) {
                openBookingSection(program.durationLabel, program.id);
                return;
              }
              setSelectedChoiceDetailPackageId(program.id);
            }}
          >
            <ArrowRightIcon className="icon icon-sm" />
          </button>
        </div>
      </article>
    );
  };

  return (
    <main className="globalview-page" dir="rtl" lang="ar">
      <section className="gv-hero" id="globalview">
        <div className="gv-hero__shade" />
        <header className="gv-header">
          <div className="gv-topbar">
            <div className="gv-brand gv-brand--company">
              <img src={landingAsset("company-logo.png")} alt="شركة رواد لخدمات العمرة والحج" />
            </div>
            <div className="gv-contact">
              <span><MailIcon className="icon icon-sm" /> info@ruwadomra.com</span>
              <span><PhoneIcon className="icon icon-sm" /> +965 55583203 - +965 22283558</span>
              <span><PhoneIcon className="icon icon-sm" /> +965 65002927 - +965 22283589</span>
              <span><LocationIcon className="icon icon-sm" /> العربية</span>
              {/*
              {travelerUser?.isAuthenticated ? (
                <button className="gv-auth-nav gv-auth-nav--logout" type="button" onClick={() => void handleTravelerLogout()}>
                  تسجيل الخروج
                </button>
              ) : (
                <button className="gv-auth-nav" type="button" onClick={() => openAuthPopup("login")}>
                  تسجيل الدخول
                </button>
              )}
              */}
              {/*
              <button className="gv-book" type="button" onClick={() => openBookingSection("حجز جديد")}>
                احجز الآن
                <ArrowRightIcon className="icon icon-sm" />
              </button>
              */}
            </div>
          </div>
        </header>

        <div className="gv-hero__content">
          <p>رحلة إيمانية ..</p>
          <h1>تجربة روحانية لا تُنسى</h1>
          <span>نقدم لكم أفضل خدمات العمرة المتكاملة، برعاية واهتمام لنجعل رحلتكم إلى بيت الله الحرام سهلة وآمنة ومميزة.</span>
          <div className="gv-actions">
            <button type="button" onClick={() => document.getElementById("gv-packages")?.scrollIntoView({ behavior: "smooth" })}>
              استعرض باقات العمرة
              <ArrowRightIcon className="icon icon-sm" />
            </button>
            {/*
            <button type="button" className="ghost">
              <ChatIcon className="icon icon-sm" />
              شاهد فيديو تعريفي
            </button>
            */}
          </div>
        </div>

        <aside className="gv-support">
          <MosqueIcon className="icon gv-support__mark" />
          <strong>خدمة عملاء</strong>
          <b>24/7</b>
          <span className="gv-support__line">لخدمتكم في كل خطوة <HeadsetIcon className="icon icon-sm" /></span>
          <em>ثقتكم .. مسؤوليتنا</em>
        </aside>
      </section>
      {/*
      <section className="gv-search" aria-label="فلترة باقات العمرة">
        <button type="button" onClick={submitFilters}>
          <SearchIcon className="icon icon-sm" />
          بحث
        </button>
        <label>
          <span>عدد المعتمرين</span>
          <select value={filters.people} onChange={(event) => updateFilter("people", event.target.value)}>
            <option value="">اختر العدد</option>
            <option value="1-2">1 - 2</option>
            <option value="3-4">3 - 4</option>
            <option value="5+">5 وأكثر</option>
          </select>
        </label>
        <label>
          <span>المدينة</span>
          <select value={filters.city} onChange={(event) => updateFilter("city", event.target.value)}>
            <option value="">اختر المدينة</option>
            <option value="مكة">مكة</option>
            <option value="المدينة">المدينة</option>
            <option value="مكة والمدينة">مكة والمدينة</option>
          </select>
        </label>
        <label>
          <span>المدة</span>
          <select value={filters.duration} onChange={(event) => updateFilter("duration", event.target.value)}>
            <option value="">اختر المدة</option>
            <option value="7">7 ليالي</option>
            <option value="10">10 ليالي</option>
            <option value="14">14 ليلة</option>
          </select>
        </label>
        <label>
          <span>تاريخ الانطلاق</span>
          <input
            type="date"
            value={filters.startDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(event) => updateFilter("startDate", event.target.value)}
          />
        </label>
      </section>
      */}

      <section className="gv-packages" id="gv-packages">
        <div className="gv-packages__header">
          <span className="gv-section-kicker"><MosqueIcon className="icon icon-sm" /></span>
          <h2>أفضل الباقات</h2>
          <p>رحلات مصممة بعناية لرحلتك الإيمانية</p>
          {hasActiveFilters && (
            <button type="button" onClick={resetFilters}>
              إلغاء الفلتر
            </button>
          )}
        </div>
        <div className="gv-package-grid">
          {filteredPackages.map((program) => (
            <article
              className={`gv-card ${program.type === "travel" ? "is-clickable" : ""}`}
              key={program.badge}
              onClick={() => openPackageView(program.type)}
            >
              <div className="gv-card__media" style={{ backgroundImage: `url(${program.image})` }}>
                <span className="gv-card__badge">
                  {program.type === "travel" ? <ArrowRightIcon className="icon icon-sm" /> : null}
                  {program.type === "visa" ? <DocumentIcon className="icon icon-sm" /> : null}
                  {program.type === "corporate" ? <UsersIcon className="icon icon-sm" /> : null}
                  {program.badge}
                </span>
                <p className={`gv-card__image-text gv-card__image-text--${program.type}`}>
                  {program.imageText.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
              </div>
              <div className="gv-card__body">
                <div className="gv-card__features">
                  {program.features.map((feature, index) => (
                    <span key={feature}>
                      {index === 0 && program.type === "travel" ? <ArrowRightIcon className="icon icon-sm" /> : null}
                      {index === 0 && program.type === "visa" ? <DocumentIcon className="icon icon-sm" /> : null}
                      {index === 0 && program.type === "corporate" ? <CalendarIcon className="icon icon-sm" /> : null}
                      {index > 0 ? packageFeatureIcons[index] : null}
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="gv-card__divider" />
                <div className="gv-card__footer">
                  <p>تبدأ من <b>{program.price}</b> د.ك</p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openPackageView(program.type);
                    }}
                  >
                    <ArrowRightIcon className="icon icon-sm" />
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {filteredPackages.length === 0 && (
          <div className="gv-empty">لا توجد باقات مطابقة لهذا البحث. جرّب تعديل المدينة أو المدة.</div>
        )}
      </section>

      {activePackageView === "travel" && (
        <section className="gv-travel-packages" id="gv-travel-packages">
          {rowadTravelPackages.length > 0 ? (
            <div className="gv-rowad-travel" style={rowadTravelStyle}>
              <span className="gv-rowad-travel__origin-badge">باقات رواد الأصلية</span>
              <div className="gv-rowad-travel__content">
                <header className="gv-rowad-travel__header">
                  <h2>رحلاتنا</h2>
                  <p>رحلات مختارة من دليل شركة رواد، بأسعار واضحة وقواعد حجز قابلة للإدارة.</p>
                </header>
                <div className="gv-travel-grid gv-travel-grid--rowad">
                  {rowadTravelPackages.map((program) => renderTravelPackageCard(program, "rowad"))}
                </div>
              </div>
            </div>
          ) : null}
          {/* Package choice wizard temporarily hidden. */}
          {showPackageChoiceWizard && packageChoiceItems.length > 0 ? (
            <div className="gv-package-choice">
              <nav className="gv-package-choice__steps" aria-label="مراحل اختيار الرحلة">
                {packageChoiceSteps.map((item) => (
                  <span className={item.number === 1 ? "is-active" : ""} key={item.number}>
                    <b>{item.number === 1 ? "✓" : item.icon}</b>
                    <strong>{item.label}</strong>
                    <small>{item.text}</small>
                  </span>
                ))}
              </nav>
              <div className="gv-choice-grid">
                {packageChoiceItems.map(renderPackageChoiceCard)}
              </div>
              {highlightedChoicePackage ? (
                <section className="gv-choice-detail">
                  <div className="gv-choice-detail__media" style={{ backgroundImage: `url(${resolvePackageImageUrl(highlightedChoicePackage.imageUrl)})` }}>
                    <span><StarIcon className="icon icon-sm" /> باقة {highlightedChoicePackage.durationDays} أيام</span>
                    <button type="button" aria-label="تشغيل العرض">▶</button>
                  </div>
                  <div className="gv-choice-detail__copy">
                    <span className="gv-choice-detail__tag">الأكثر طلباً</span>
                    <h3>تفاصيل باقة {highlightedChoicePackage.durationDays} أيام</h3>
                    <p>رحلة مختصرة ومميزة تشمل جميع الخدمات الأساسية لأداء مناسك العمرة براحة وطمأنينة.</p>
                    <div>
                      <span><HeadsetIcon className="icon icon-sm" /><b>دعم وخدمة</b><small>عملاء 24/7</small></span>
                      <span><BedIcon className="icon icon-sm" /><b>فندق مميز</b><small>قريب الحرم</small></span>
                      <span><BusIcon className="icon icon-sm" /><b>مواصلات</b><small>داخلية وخارجية</small></span>
                      <span><PlaneIcon className="icon icon-sm" /><b>تذاكر طيران</b><small>ذهاب وعودة</small></span>
                    </div>
                  </div>
                  <aside className="gv-choice-detail__meta">
                    <span><CalendarIcon className="icon icon-sm" /><b>المدة</b><small>{highlightedChoicePackage.durationDays} أيام</small></span>
                    <span><LocationIcon className="icon icon-sm" /><b>الوجهة</b><small>مكة المكرمة - المدينة المنورة</small></span>
                    <span><DocumentIcon className="icon icon-sm" /><b>نوع الباقة</b><small>اقتصادية / مريحة / فاخرة</small></span>
                  </aside>
                </section>
              ) : null}
              <footer className="gv-choice-actions">
                <button type="button" className="gv-choice-actions__prev">
                  <ArrowRightIcon className="icon icon-sm" />
                  السابق
                </button>
                <span><ShieldIcon className="icon icon-md" /> جميع حجوزاتك مؤمنة وآمنة مع شركة رواد</span>
                <button type="button" onClick={() => footerChoicePackage ? openBookingSection(footerChoicePackage.durationLabel, footerChoicePackage.id) : undefined}>
                  التالي: تحديد التاريخ
                  <ArrowRightIcon className="icon icon-sm" />
                  <b>{highlightedChoicePrice.toLocaleString("en-US")} ر.س</b>
                </button>
              </footer>
            </div>
          ) : null}
          {publishedTravelPackages.length === 0 ? (
            <div className="gv-empty">لا توجد باقات منشورة حالياً.</div>
          ) : null}
        </section>
      )}

      {activeDateRangePackage && activeDateRangeOptions ? (
        <>
          <div className="gv-date-range__overlay" onClick={() => setOpenDateRangePicker(null)} />
          <div className="gv-date-range__panel" role="dialog" aria-modal="true" aria-label="اختيار أيام الرحلة">
            <div className="gv-date-range__head">
              <button type="button" onClick={() => changeDateRangeMonth(activeDateRangePackage.id, activeDateRangeMonth, -1)}>‹</button>
              <strong>{getMonthLabel(activeDateRangeMonth)}</strong>
              <button type="button" onClick={() => changeDateRangeMonth(activeDateRangePackage.id, activeDateRangeMonth, 1)}>›</button>
            </div>
            <div className="gv-date-range__weekdays">
              {["أحد", "إث", "ثلا", "أرب", "خم", "جم", "سب"].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="gv-date-range__days">
              {getMonthGrid(activeDateRangeMonth).map((date, index) => {
                const isEmpty = !date;
                const isDisabled = Boolean(date && date < todayDateInputValue);
                const isStart = Boolean(date && date === activeDateRangeOptions.bookingDate);
                const isEnd = Boolean(date && date === activeDateRangeOptions.returnDate);
                const isBetween = Boolean(
                  date &&
                  activeDateRangeOptions.bookingDate &&
                  activeDateRangeOptions.returnDate &&
                  date > activeDateRangeOptions.bookingDate &&
                  date < activeDateRangeOptions.returnDate
                );

                return (
                  <button
                    key={date ?? `empty-${index}`}
                    type="button"
                    className={[
                      isEmpty ? "is-empty" : "",
                      isDisabled ? "is-disabled" : "",
                      isStart ? "is-start" : "",
                      isEnd ? "is-end" : "",
                      isBetween ? "is-between" : ""
                    ].filter(Boolean).join(" ")}
                    disabled={isEmpty || isDisabled}
                    onClick={() => {
                      if (!date) return;
                      updateTravelDateRange(activeDateRangePackage.id, date);
                    }}
                  >
                    {date ? Number(date.slice(8, 10)) : ""}
                  </button>
                );
              })}
            </div>
            <div className="gv-date-range__actions">
              <button
                type="button"
                onClick={() => {
                  updateTravelOption(activeDateRangePackage.id, "bookingDate", "");
                  updateTravelOption(activeDateRangePackage.id, "returnDate", "");
                }}
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => setOpenDateRangePicker(null)}
                disabled={!activeDateRangeOptions.bookingDate || !activeDateRangeOptions.returnDate}
              >
                تم
              </button>
            </div>
          </div>
        </>
      ) : null}

      {authPopupOpen && (
        <div className="gv-auth-modal" role="dialog" aria-modal="true" aria-labelledby="gv-auth-title" onClick={() => setAuthPopupOpen(false)}>
          <section className={`gv-auth-popup gv-auth-popup--${authView}`} onClick={(event) => event.stopPropagation()}>
            <button className="gv-auth-popup__close" type="button" onClick={() => setAuthPopupOpen(false)} aria-label="إغلاق">
              ×
            </button>
            <div className="gv-auth-popup__visual">
            </div>

            <div className="gv-auth-popup__side">
              <header className="gv-auth-popup__top">
                <button className="gv-auth-language" type="button">
                  <span aria-hidden="true">⌄</span>
                  العربية
                  <span aria-hidden="true">◎</span>
                </button>
              </header>
              {/*
              <div className="gv-auth-company">
                <div className="gv-auth-company__text">
                  <strong><span>شركة</span> رواد</strong>
                  <small>للسفر والسياحة وخدمات العمرة</small>
                </div>
                <span className="gv-auth-company__divider" />
                <img src={landingAsset("company-logo.png")} alt="رواد العمرة" />
              </div>
              */}

              <div className="gv-auth-card">
                <div className="gv-auth-card__head">
                  <div className="gv-auth-card__title-row">
                    <h2 id="gv-auth-title">{authCopy.title}</h2>
                  </div>
                  <p>{authCopy.subtitle}</p>
                </div>

                {authMessage ? <div className="gv-auth-message" aria-live="polite">{authMessage}</div> : null}

                {authView === "login" && (
                  <form className="gv-auth-form" onSubmit={handleAuthLogin}>
                    <label htmlFor="gv-auth-email">
                      البريد الإلكتروني
                      <span className="gv-auth-field">
                        <input
                          id="gv-auth-email"
                          type="email"
                          value={authEmail}
                          onChange={(event) => {
                            setAuthEmail(event.target.value);
                            setAuthErrors((current) => ({ ...current, email: "" }));
                          }}
                          placeholder="أدخل بريدك الإلكتروني"
                          autoComplete="email"
                          aria-invalid={Boolean(authErrors.email)}
                        />
                        <MailIcon className="icon icon-sm" />
                      </span>
                      {authErrors.email ? <em className="gv-auth-error">{authErrors.email}</em> : null}
                    </label>
                    <label htmlFor="gv-auth-password">
                      كلمة المرور
                      <span className="gv-auth-field">
                        <input
                          id="gv-auth-password"
                          type={showAuthPassword ? "text" : "password"}
                          value={authPassword}
                          onChange={(event) => {
                            setAuthPassword(event.target.value);
                            setAuthErrors((current) => ({ ...current, password: "" }));
                          }}
                          placeholder="أدخل كلمة المرور"
                          autoComplete="current-password"
                          aria-invalid={Boolean(authErrors.password)}
                        />
                        <button className="gv-auth-eye" type="button" onClick={() => setShowAuthPassword((current) => !current)} aria-label={showAuthPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                          {showAuthPassword ? "◉" : "◎"}
                        </button>
                      </span>
                      {authErrors.password ? <em className="gv-auth-error">{authErrors.password}</em> : null}
                    </label>
                    <div className="gv-auth-row">
                      <label className="gv-auth-check">
                        <input type="checkbox" checked={authRemember} onChange={(event) => setAuthRemember(event.target.checked)} />
                        تذكرني
                      </label>
                      <button type="button" onClick={() => openAuthPopup("forgot", authContextTitle)}>نسيت كلمة المرور؟</button>
                    </div>
                    <button className="gv-auth-primary" type="submit" disabled={authLoading}>
                      <ArrowRightIcon className="icon icon-sm" />
                      {authLoading ? <span className="gv-auth-spinner" aria-hidden="true" /> : null}
                      {authLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                    </button>
                    <p className="gv-auth-switch">ليس لديك حساب؟ <button type="button" onClick={() => openAuthPopup("register", authContextTitle)}>إنشاء حساب جديد</button></p>
                  </form>
                )}

                {authView === "register" && (
                  <form className="gv-auth-form gv-auth-form--compact" onSubmit={handleRegisterSubmit}>
                    <label>
                      <span className="gv-auth-field"><input type="text" value={registerForm.fullName} onChange={(event) => setRegisterForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="الاسم الكامل" required /><UsersIcon className="icon icon-sm" /></span>
                    </label>
                    <label>
                      <span className="gv-auth-field"><input type="email" value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} placeholder="البريد الإلكتروني" required /><MailIcon className="icon icon-sm" /></span>
                    </label>
                    <label>
                      <span className="gv-auth-field gv-auth-field--phone"><input type="tel" value={registerForm.phone} onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))} placeholder="أدخل رقم هاتفك" required /><PhoneIcon className="icon icon-sm" /><em>966</em></span>
                    </label>
                    <label>
                      <span className="gv-auth-field"><input type="password" value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} placeholder="أدخل كلمة المرور" required /><ShieldIcon className="icon icon-sm" /></span>
                    </label>
                    <label>
                      <span className="gv-auth-field"><input type="password" value={registerForm.confirmPassword} onChange={(event) => setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="أعد إدخال كلمة المرور" required /><ShieldIcon className="icon icon-sm" /></span>
                    </label>
                    <label className="gv-auth-check gv-auth-check--end">
                      <input type="checkbox" checked={registerForm.acceptTerms} onChange={(event) => setRegisterForm((current) => ({ ...current, acceptTerms: event.target.checked }))} />
                      أوافق على الشروط والأحكام
                    </label>
                    <button className="gv-auth-primary" type="submit" disabled={authLoading}>
                      <ArrowRightIcon className="icon icon-sm" />
                      {authLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
                    </button>
                    <p className="gv-auth-switch">لديك حساب بالفعل؟ <button type="button" onClick={() => openAuthPopup("login", authContextTitle)}>تسجيل الدخول</button></p>
                  </form>
                )}

                {authView === "forgot" && (
                  <form className="gv-auth-form" onSubmit={handleForgotSubmit}>
                    <label>
                      البريد الإلكتروني
                      <span className="gv-auth-field"><input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="أدخل بريدك الإلكتروني" required /><MailIcon className="icon icon-sm" /></span>
                    </label>
                    <button className="gv-auth-primary" type="submit" disabled={authLoading}>
                      <ArrowRightIcon className="icon icon-sm" />
                      {authLoading ? "جاري الإرسال..." : "إرسال رمز الاستعادة"}
                    </button>
                    <button className="gv-auth-outline" type="button" onClick={() => openAuthPopup("login", authContextTitle)}>العودة إلى تسجيل الدخول</button>
                    <p className="gv-auth-secure"><ShieldIcon className="icon icon-sm" /> حماية وأمان لبياناتك</p>
                  </form>
                )}

                {authView === "reset" && (
                  <form className="gv-auth-form" onSubmit={handleResetSubmit}>
                    <label>
                      رمز التحقق
                      <div className="gv-auth-code" dir="ltr">
                        {verificationCode.map((digit, index) => (
                          <input key={index} inputMode="numeric" maxLength={1} value={digit} onChange={(event) => updateVerificationCode(index, event.target.value)} aria-label={`رمز إعادة التعيين ${index + 1}`} />
                        ))}
                      </div>
                    </label>
                    <label>
                      كلمة المرور الجديدة
                      <span className="gv-auth-field"><input type="password" value={resetForm.password} onChange={(event) => setResetForm((current) => ({ ...current, password: event.target.value }))} placeholder="أدخل كلمة المرور الجديدة" required /><ShieldIcon className="icon icon-sm" /></span>
                    </label>
                    <label>
                      تأكيد كلمة المرور الجديدة
                      <span className="gv-auth-field"><input type="password" value={resetForm.confirmPassword} onChange={(event) => setResetForm((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="أعد إدخال كلمة المرور الجديدة" required /><ShieldIcon className="icon icon-sm" /></span>
                    </label>
                    <p className="gv-auth-hint">يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل ويفضل استخدام مزيج من الحروف والأرقام.</p>
                    <button className="gv-auth-primary" type="submit" disabled={authLoading}>
                      <ArrowRightIcon className="icon icon-sm" />
                      {authLoading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
                    </button>
                    <button className="gv-auth-linkline" type="button" onClick={() => openAuthPopup("login", authContextTitle)}>العودة إلى تسجيل الدخول</button>
                    <p className="gv-auth-secure"><ShieldIcon className="icon icon-sm" /> معلوماتك محمية وآمنة دائماً</p>
                  </form>
                )}

                {authView === "verify" && (
                  <form className="gv-auth-form" onSubmit={handleVerifyEmailSubmit}>
                    <div className="gv-auth-code" dir="ltr">
                      {verificationCode.map((digit, index) => (
                        <input key={index} inputMode="numeric" maxLength={1} value={digit} onChange={(event) => updateVerificationCode(index, event.target.value)} aria-label={`رمز التحقق ${index + 1}`} />
                      ))}
                    </div>
                    <p className="gv-auth-muted">تم إرسال الرمز إلى {authEmail}</p>
                    <button className="gv-auth-primary" type="submit" disabled={authLoading}>
                      <ArrowRightIcon className="icon icon-sm" />
                      {authLoading ? "جاري التحقق..." : "تأكيد الرمز"}
                    </button>
                    <div className="gv-auth-resend"><span>لم يصلك الرمز؟</span><button type="button" onClick={() => void handleResendVerificationCode()} disabled={authLoading}>إرسال الرمز مرة أخرى</button></div>
                    <p className="gv-auth-safety"><ShieldIcon className="icon icon-sm" /> بياناتك في أمان</p>
                  </form>
                )}

                {authView === "twoFactor" && (
                  <form className="gv-auth-form" onSubmit={(event) => { event.preventDefault(); setAuthMessage("تم تفعيل التحقق بخطوتين. سجل الدخول لإتمام الحجز."); setAuthView("login"); }}>
                    <div className="gv-auth-methods">
                      <button className={twoFactorMethod === "app" ? "is-active" : ""} type="button" onClick={() => setTwoFactorMethod("app")}>تطبيق المصادقة<br /><span>Google Authenticator</span></button>
                      <button className={twoFactorMethod === "sms" ? "is-active" : ""} type="button" onClick={() => setTwoFactorMethod("sms")}>رسالة نصية<br /><span>تلقي رمز التحقق عبر الجوال</span></button>
                    </div>
                    <div className="gv-auth-qr">
                      <div className="gv-auth-qr__box" aria-hidden="true">
                        {Array.from({ length: 64 }).map((_, index) => <span key={index} className={index % 3 === 0 || index % 7 === 0 ? "is-dark" : ""} />)}
                      </div>
                      <div>
                        <strong>امسح الرمز عبر تطبيق المصادقة</strong>
                        <p>استخدم تطبيق Google Authenticator أو أي تطبيق مصادقة آخر لمسح رمز الاستجابة السريعة.</p>
                        <code>JBSW Y3DP KX7H M2Q9</code>
                      </div>
                    </div>
                    <label>
                      رمز التحقق
                      <span className="gv-auth-field"><input type="text" value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} placeholder="أدخل الرمز المكون من 6 أرقام" required /><ShieldIcon className="icon icon-sm" /></span>
                    </label>
                    <button className="gv-auth-primary" type="submit"><ArrowRightIcon className="icon icon-sm" /> تأكيد التفعيل</button>
                    <p className="gv-auth-safety"><ShieldIcon className="icon icon-sm" /> حسابك أكثر أماناً</p>
                  </form>
                )}
              </div>

              <footer className="gv-auth-popup__footer">لبيك اللهم لبيك، عمرة مباركة</footer>
            </div>
            <footer className="gv-auth-page-footer">
              <span>« لبيك اللهم لبيك .. عمرة مباركة »</span>
            </footer>
          </section>
        </div>
      )}

      {bookingSectionOpen && (
        <div className="gv-reservation-modal" role="dialog" aria-modal="true" aria-labelledby="gv-reservation-title" onClick={() => setBookingSectionOpen(false)}>
          <section className="gv-reservation" id="gv-reservation" onClick={(event) => event.stopPropagation()}>
            <button className="gv-reservation__close" type="button" onClick={() => setBookingSectionOpen(false)} aria-label="إغلاق">
              ×
            </button>
            <div className="gv-reservation__header">
              <MosqueIcon className="icon icon-md" />
              <h2 id="gv-reservation-title">{bookingDays}</h2>
            </div>
            <nav className="gv-reservation-steps gv-reservation-steps--icons" aria-label="مراحل الحجز">
              {reservationSteps.map((step) => (
                <button
                  key={step}
                  type="button"
                  className={[
                    step === reservationStep ? "is-active" : "",
                    step < reservationStep ? "is-done" : ""
                  ].filter(Boolean).join(" ")}
                  onClick={() => goToReservationStep(step)}
                  aria-label={`الخطوة ${step}`}
                  title={`الخطوة ${step}`}
                >
                  <span>{step <= reservationStep ? "✓" : step}</span>
                </button>
              ))}
            </nav>

            {reservationStep <= 3 ? (
              <div className="gv-reservation-ui">
                <section className="gv-reservation-form-panel">
                  <header className="gv-reservation-section-head">
                    <span><UsersIcon className="icon icon-sm" /></span>
                    <div>
                      <strong>البيانات الأساسية</strong>
                      <p>راجع البيانات المستخرجة وأكمل الحقول المطلوبة</p>
                    </div>
                  </header>

                  <div className="gv-reservation-card">
                    <div className="gv-reservation-grid">
                      <label>
                        الاسم الكامل *
                        <span className="gv-field">
                          <input id="gv-full-name" type="text" placeholder="اكتب الاسم الكامل" value={reservationForm.fullName} onChange={(event) => updateReservationField("fullName", event.target.value)} aria-invalid={Boolean(formErrors.fullName)} />
                          <UsersIcon className="icon icon-sm" />
                        </span>
                        {formErrors.fullName ? <em>{formErrors.fullName}</em> : null}
                      </label>
                      <label>
                        رقم الجواز *
                        <span className="gv-field">
                          <input id="gv-passport-number" type="text" placeholder="اكتب رقم الجواز" value={reservationForm.passportNumber} onChange={(event) => updateReservationField("passportNumber", event.target.value)} aria-invalid={Boolean(formErrors.passportNumber)} />
                          <DocumentIcon className="icon icon-sm" />
                        </span>
                        {formErrors.passportNumber ? <em>{formErrors.passportNumber}</em> : null}
                      </label>
                      <label>
                        الجنسية
                        <span className="gv-field">
                          <select id="gv-nationality" value={reservationForm.nationality} onChange={(event) => updateReservationField("nationality", event.target.value)}>
                            <option value="">اختر الجنسية</option>
                            {availableNationalities.map((nationality) => (
                              <option key={nationality} value={nationality}>{nationality}</option>
                            ))}
                          </select>
                          <LocationIcon className="icon icon-sm" />
                        </span>
                      </label>
                      <label>
                        الجنس
                        <span className="gv-field">
                          <select value={reservationForm.gender} onChange={(event) => updateReservationField("gender", event.target.value)}>
                            <option value="">اختر الجنس</option>
                            <option value="ذكر">ذكر</option>
                            <option value="أنثى">أنثى</option>
                          </select>
                          <UsersIcon className="icon icon-sm" />
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="gv-reservation-card">
                    <header className="gv-reservation-section-head gv-reservation-section-head--inner">
                      <span><CalendarIcon className="icon icon-sm" /></span>
                      <div>
                        <strong>بيانات الميلاد والوثائق</strong>
                        <p>تستخدم نفس حقول الحجز الحالية دون تغيير API</p>
                      </div>
                    </header>
                    <div className="gv-reservation-grid">
                      <label>
                        تاريخ الميلاد
                        <span className="gv-field">
                          <input type="date" value={reservationForm.dateOfBirth} onChange={(event) => updateReservationField("dateOfBirth", event.target.value)} />
                          <CalendarIcon className="icon icon-sm" />
                        </span>
                      </label>
                      <label>
                        انتهاء الجواز
                        <span className="gv-field">
                          <input type="date" value={reservationForm.passportExpiryDate} onChange={(event) => updateReservationField("passportExpiryDate", event.target.value)} />
                          <CalendarIcon className="icon icon-sm" />
                        </span>
                      </label>
                      <label>
                        رقم الإقامة
                        <span className="gv-field">
                          <input type="text" placeholder="رقم الإقامة" value={reservationForm.civilId} onChange={(event) => updateReservationField("civilId", event.target.value)} />
                          <DocumentIcon className="icon icon-sm" />
                        </span>
                      </label>
                      {selectedPackage ? (
                        <label>
                          حالة التأشيرة
                          <span className="gv-field">
                            <select value={selectedVisaChoice} onChange={(event) => updateTravelOption(selectedPackage.id, "hasVisa", event.target.value)}>
                              <option value="no">{getVisaTypeLabel("no", selectedNationality)}</option>
                              <option value={getExistingVisaChoiceForNationality(selectedNationality)}>
                                {getVisaTypeLabel(getExistingVisaChoiceForNationality(selectedNationality), selectedNationality)}
                              </option>
                            </select>
                            <DocumentIcon className="icon icon-sm" />
                          </span>
                        </label>
                      ) : null}
                    </div>
                  </div>

                  <div className="gv-reservation-card">
                    <header className="gv-reservation-section-head gv-reservation-section-head--inner">
                      <span><PhoneIcon className="icon icon-sm" /></span>
                      <div>
                        <strong>بيانات التواصل</strong>
                        <p>نفس بيانات الاتصال المطلوبة للتأكيد</p>
                      </div>
                    </header>
                    <div className="gv-reservation-grid">
                      <label>
                        رقم الهاتف *
                        <span className="gv-field">
                          <input id="gv-phone" type="tel" placeholder="+965" value={reservationForm.phoneNumber} onChange={(event) => updateReservationField("phoneNumber", event.target.value)} aria-invalid={Boolean(formErrors.phoneNumber)} />
                          <PhoneIcon className="icon icon-sm" />
                        </span>
                        {formErrors.phoneNumber ? <em>{formErrors.phoneNumber}</em> : null}
                      </label>
                      <label>
                        البريد الإلكتروني
                        <span className="gv-field">
                          <input id="gv-email" type="email" placeholder="name@example.com" value={reservationForm.email} onChange={(event) => updateReservationField("email", event.target.value)} aria-invalid={Boolean(formErrors.email)} />
                          <MailIcon className="icon icon-sm" />
                        </span>
                        {formErrors.email ? <em>{formErrors.email}</em> : null}
                      </label>
                    </div>
                  </div>
                </section>

                <aside className="gv-doc-panel">
                  <header className="gv-doc-panel__head">
                    <span><DocumentIcon className="icon icon-sm" /></span>
                    <div>
                      <strong>المستندات المطلوبة</strong>
                      <p>ارفع الصور أو التقطها لاستخراج البيانات تلقائياً</p>
                    </div>
                  </header>

                  {renderReservationDocumentCard({
                    kind: "id",
                    number: "01",
                    title: "إضافة بطاقة الهوية",
                    subtitle: "ارفع صورة بطاقة الهوية الوطنية",
                    inputId: "gv-id-upload",
                    file: idFile,
                    preview: idPreview,
                    error: uploadErrors.id || formErrors.idFile,
                    onFileChange: updateIdFile
                  })}

                  {renderReservationDocumentCard({
                    kind: "passport",
                    number: "02",
                    title: "إضافة جواز السفر",
                    subtitle: "ارفع صورة جواز السفر بوضوح",
                    inputId: "gv-passport-upload",
                    file: passportFile,
                    preview: passportPreview,
                    error: uploadErrors.passport || formErrors.passportFile,
                    onFileChange: updatePassportFile
                  })}

                  {selectedHasVisa ? renderReservationDocumentCard({
                    kind: "visa",
                    number: "03",
                    title: "إضافة التأشيرة",
                    subtitle: "ارفع صورة التأشيرة الموجودة لديك",
                    inputId: "gv-visa-upload",
                    file: visaFile,
                    preview: visaPreview,
                    error: uploadErrors.visa || formErrors.visaFile,
                    onFileChange: updateVisaFile
                  }) : null}

                  <button type="button" className="gv-smart-extract gv-smart-extract--panel" onClick={() => void extractAllDocuments()} disabled={!passportFile && !idFile}>
                    <SearchIcon className="icon icon-sm" />
                    استخراج ذكي
                  </button>
                </aside>
              </div>
            ) : null}

            {reservationStep === 4 ? (
              <div className="gv-booking-stage gv-booking-stage--hotels">
                <aside className="gv-booking-summary">
                  <strong>ملخص رحلتك</strong>
                  <span><CalendarIcon className="icon icon-sm" /> {bookingDays}</span>
                  <span><UsersIcon className="icon icon-sm" /> {selectedTravelerCount} {selectedTravelerCount === 1 ? "مسافر" : "مسافرين"}</span>
                  <span><DocumentIcon className="icon icon-sm" /> الوثائق مكتملة</span>
                  <span><DocumentIcon className="icon icon-sm" /> {selectedVisaLabel}</span>
                  <span><SearchIcon className="icon icon-sm" /> تم الاستخراج بنجاح</span>
                  <button type="button" onClick={() => goToReservationStep(3)}>تعديل البيانات</button>
                  <p>لأن رحلتك تستحق الأفضل، اختر الفندق الأنسب قبل الدفع.</p>
                </aside>
                <section className="gv-hotel-stage">
                  <p>اختر فندقك في مكة والمدينة</p>
                  <div className="gv-hotel-tabs">
                    <button className="is-active" type="button">مكة المكرمة</button>
                  </div>
                  <div className="gv-hotel-list">
                    {hotelOptions.map((hotel) => {
                      const hotelNightPrice = getHotelNightPrice(hotel.name, hotel.price);
                      const packageHotelPrice = getReservationPackagePrice(hotel.name, hotel.price);

                      return (
                        <article className={selectedHotel === hotel.name ? "is-selected" : ""} key={hotel.name}>
                          <div className="gv-hotel-image" style={{ backgroundImage: `url(${hotel.image})` }} />
                          <div className="gv-hotel-copy">
                            <h4>{hotel.name}</h4>
                            <b>★★★★★</b>
                            <p><LocationIcon className="icon icon-sm" /> {hotel.distance}</p>
                            <div>
                              {hotel.perks.map((perk) => <span key={perk}>{perk}</span>)}
                            </div>
                          </div>
                          <div className="gv-hotel-price">
                            <small>{selectedNationality ? `سعر ${selectedNationality}` : "ابتداءً من"}</small>
                            <strong>{(selectedPackage ? packageHotelPrice : hotelNightPrice).toLocaleString("en-US")} د.ك</strong>
                            <span>{selectedPackage ? "للشخص الواحد" : "لليلة الواحدة"}</span>
                            <button type="button" onClick={() => setSelectedHotel(hotel.name)}>اختيار هذا الفندق</button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <div className="gv-stage-actions">
                    <button type="button" className="gv-stage-back" onClick={() => goToReservationStep(3)}>العودة</button>
                    <button type="button" className="gv-stage-next" onClick={() => goToReservationStep(5)}>التالي إلى الدفع</button>
                  </div>
                </section>
              </div>
            ) : null}

            {reservationStep === 5 ? (
              <div className="gv-booking-stage gv-booking-stage--payment">
                <aside className="gv-booking-summary">
                  <strong>ملخص الحجز</strong>
                  <div className="gv-booking-summary__hotel">
                    <span style={{ backgroundImage: `url(${selectedHotelInfo.image})` }} />
                    <div>
                      <b>{selectedHotelInfo.name}</b>
                      <em>★★★★★</em>
                      <small>{selectedHotelInfo.city}</small>
                    </div>
                  </div>
                  <span><CalendarIcon className="icon icon-sm" /> {bookingDays}</span>
                  <span><UsersIcon className="icon icon-sm" /> {selectedTravelerCount} {selectedTravelerCount === 1 ? "مسافر" : "مسافرين"}</span>
                  <span><MosqueIcon className="icon icon-sm" /> {selectedTravelOptions?.roomType ?? "غرفة مزدوجة"}</span>
                  <span><DocumentIcon className="icon icon-sm" /> {selectedVisaLabel}</span>
                  <hr />
                  <p><small>{reservationBaseLabel}</small><b>{hotelTotal.toLocaleString("en-US")} د.ك</b></p>
                  <strong className="gv-booking-total">{reservationTotal.toLocaleString("en-US")} د.ك</strong>
                </aside>
                <section className="gv-payment-stage">
                  <p>إتمام الدفع وتأكيد الحجز</p>
                  <div className="gv-payment-tabs">
                    <button className={paymentMethod === "myfatoorah" ? "is-active" : ""} type="button" onClick={() => setPaymentMethod("myfatoorah")}>الدفع عبر فاتورة</button>
                    <button className={paymentMethod === "card" ? "is-active" : ""} type="button" onClick={() => setPaymentMethod("card")}>بطاقة ائتمان</button>
                  </div>
                  <div className="gv-payment-options">
                    <button className={paymentMode === "full" ? "is-active" : ""} type="button" onClick={() => setPaymentMode("full")}>
                      <span />
                      <strong>الدفع الكامل</strong>
                      <small>ادفع المبلغ كاملاً الآن</small>
                    </button>
                    <button className={paymentMode === "installments" ? "is-active" : ""} type="button" onClick={() => setPaymentMode("installments")}>
                      <span />
                      <strong>التقسيط</strong>
                      <small>قسط رحلتك بسهولة</small>
                    </button>
                  </div>
                  <div className="gv-payment-plans">
                    {paymentPlans.map((plan) => (
                      <span key={plan.label}>
                        <strong>{plan.label}</strong>
                        <small>{Math.ceil(reservationTotal / plan.months).toLocaleString("en-US")} د.ك شهرياً</small>
                      </span>
                    ))}
                  </div>
                  <div className="gv-payment-secure">
                    <ShieldIcon className="icon icon-sm" />
                    دفع آمن 100% وجميع المعاملات محمية ومشفرة
                  </div>
                  <label className="gv-payment-terms">
                    <input type="checkbox" checked={paymentTermsAccepted} onChange={(event) => setPaymentTermsAccepted(event.target.checked)} />
                    أوافق على الشروط والأحكام وسياسة الإلغاء
                  </label>
                  <div className="gv-stage-actions">
                    <button type="button" className="gv-stage-back" onClick={() => goToReservationStep(4)}>العودة</button>
                    <button type="button" className="gv-stage-next" onClick={() => void submitReservation()} disabled={reservationSubmitting}>
                      {reservationSubmitting ? "جارٍ التأكيد..." : "تأكيد الحجز والدفع الآن"}
                    </button>
                  </div>
                </section>
              </div>
            ) : null}
            {ocrStatus ? <div className="gv-ocr-status">{ocrStatus}</div> : null}
            {reservationStatus ? <div className="gv-ocr-status">{reservationStatus}</div> : null}
            {reservationSuccessOpen ? (
              <div className="gv-success-popup" role="status" aria-live="polite">
                <div>
                  <span><CalendarIcon className="icon icon-sm" /></span>
                  <strong>تم تحويل طلبكم إلى خدمة العملاء</strong>
                  <p>تم تأكيد الحجز وتسجيل بيانات المسافر بنجاح. يمكنكم متابعة تفاصيل الرحلة من لوحة المسافر.</p>
                  <button type="button" onClick={() => setReservationSuccessOpen(false)}>
                    حسناً
                  </button>
                </div>
              </div>
            ) : null}
            <div className="gv-reservation__foot">
              <div>
                <MosqueIcon className="icon icon-sm" />
                <span>جميع بياناتك محمية وآمنة</span>
              </div>
              {reservationStep <= 3 ? (
                <div className="gv-reservation__foot-actions">
                  <button type="button" className="gv-smart-extract" onClick={() => void extractAllDocuments()} disabled={!passportFile && !idFile}>
                    <SearchIcon className="icon icon-sm" />
                    استخراج ذكي
                  </button>
                  <button type="button" className="gv-confirm-booking" onClick={() => goToReservationStep(4)}>
                    التالي: اختيار الفندق
                    <ArrowRightIcon className="icon icon-sm" />
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}

      <section className="gv-services">
        <h2>خدماتنا المتميزة</h2>
        <div className="gv-service-grid">
          {services.map((service) => (
            <article key={service.title}>
              {service.icon}
              <strong>{service.title}</strong>
              <span>{service.text}</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="gv-footer">
        <div className="gv-footer__brand">
          <img src={landingAsset("company-logo.png")} alt="شركة رواد لخدمات العمرة والحج" />
          <div>
            <strong>رواد العمرة</strong>
            <p>نقدم لكم رحلات عمرة مميزة بأعلى معايير الراحة والثقة.</p>
          </div>
        </div>
        <ul>
          <li>الرئيسية</li>
          <li>رحلات العمرة</li>
          <li>العروض</li>
          <li>خدماتنا</li>
        </ul>
        <ul>
          <li>حجز فوري</li>
          <li>خدمة عملاء</li>
          <li>النقل الداخلي</li>
        </ul>
        <div className="gv-footer__contact">
          <span><MailIcon className="icon icon-sm" /> info@ruwadomra.com</span>
          <span><PhoneIcon className="icon icon-sm" /> +965 55583203 - +965 22283558</span>
          <span><PhoneIcon className="icon icon-sm" /> +965 65002927 - +965 22283589</span>
          <span><LocationIcon className="icon icon-sm" /> الكويت - الفروانية - شارع حبيب مناور - مجمع العربيد جاليري - مكتب 5</span>
        </div>
      </footer>
    </main>
  );
}
