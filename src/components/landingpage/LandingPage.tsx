import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, login as loginUser, logout as logoutUser, type AuthUser } from "../../api/auth";
import type { CSSProperties, FormEvent } from "react";
import { findPackagePrice, getPackagePricing, type PackagePricing } from "../../api/packagePricing";
import { createTraveler, readCivilIdOcr, readPassportOcr } from "../../api/travelers";
import {
  calculatePackagePrice,
  getPackageFromPrice,
  getPublishedPackages,
  resolvePackageImageUrl,
  type TravelPackage
} from "../../api/travelPackages";
import {
  ArrowRightIcon,
  BusIcon,
  CalendarIcon,
  ChatIcon,
  DocumentIcon,
  HeadsetIcon,
  LocationIcon,
  MailIcon,
  MosqueIcon,
  PhoneIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon
} from "./landingShared";

const packages = [
  {
    badge: "الرحلات",
    type: "travel",
    image: "/landingpage/avion.png",
    price: "45",
    imageText: ["من كل مكان", "إلى أطهر بقاع", "الأرض"],
    features: ["حجوزات طيران", "حجوزات فنادق", "تنظيم الجولات", "دعم مباشر"],
    people: "1-2",
    city: "مكة",
    duration: "7"
  },
  {
    badge: "التأشيرات",
    type: "visa",
    image: "/landingpage/mains.png",
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
    image: "/landingpage/reunion.png",
    price: "60",
    imageText: ["شراكات", "تسهل رحلتكم", "الإيمانية"],
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

const reservationSteps = [
  { id: 1, label: "بيانات المسافر" },
  { id: 2, label: "الوثائق" },
  { id: 3, label: "الاستخراج الذكي" },
  { id: 4, label: "اختيار الفندق" },
  { id: 5, label: "الدفع والتأكيد" }
];

const hotelOptions = [
  {
    name: "فندق ساعة مكة فيرمونت",
    city: "مكة المكرمة",
    distance: "250 متر من الحرم",
    price: 1250,
    image: "/landingpage/hero-kaaba-premium.png",
    perks: ["إطلالة على الحرم", "مواصلات مجانية", "خدمة 24 ساعة"]
  },
  {
    name: "فندق جبل عمر حياة ريجنسي",
    city: "مكة المكرمة",
    distance: "350 متر من الحرم",
    price: 980,
    image: "/landingpage/paysage.png",
    perks: ["مطاعم متعددة", "مواصلات مجانية", "خدمة 24 ساعة"]
  },
  {
    name: "فندق موفنبيك برج هاجر",
    city: "مكة المكرمة",
    distance: "450 متر من الحرم",
    price: 750,
    image: "/landingpage/avion.png",
    perks: ["موقع مميز", "إفطار شامل", "خدمة 24 ساعة"]
  }
];

const paymentPlans = [
  { months: 3, label: "3 أشهر" },
  { months: 6, label: "6 أشهر" },
  { months: 12, label: "12 شهر" }
];

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

const nationalityOptions = ["هندي", "بنغلاديشي", "مصري", "سوري", "سوداني", "نيجيري", "افغاني", "فلسطيني", "كويتي", "سعودي"];
const acceptedDocumentTypes = ["image/jpeg", "image/png", "application/pdf"];
const maxDocumentSize = 5 * 1024 * 1024;

type Filters = typeof emptyFilters;
type FilterName = keyof Filters;
type ReservationForm = typeof emptyReservationForm;
type ReservationField = keyof ReservationForm;
type UploadKind = "passport" | "id";
type AuthPopupView = "login" | "register" | "forgot" | "reset" | "verify" | "twoFactor";
type TravelPackageOptionState = {
  bookingDate: string;
  travelers: string;
  roomType: string;
  transportType: string;
  dateError: string;
};
type TravelPackageOptions = Record<string, TravelPackageOptionState>;
const defaultTravelPackageOptions: TravelPackageOptionState = {
  bookingDate: "",
  travelers: "1",
  roomType: "",
  transportType: "",
  dateError: ""
};
const travelerCountOptions = ["1", "2", "3", "4"];
type LandingPageProps = {
  initialAuthView?: AuthPopupView | null;
};

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
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
    egyptian: "مصري",
    egypt: "مصري",
    "مصرية": "مصري",
    syrian: "سوري",
    syria: "سوري",
    "سورية": "سوري",
    sudanese: "سوداني",
    sudan: "سوداني",
    nigerian: "نيجيري",
    nigeria: "نيجيري",
    afghan: "افغاني",
    afghanistan: "افغاني",
    palestinian: "فلسطيني",
    palestine: "فلسطيني",
    kuwaiti: "كويتي",
    kuwait: "كويتي",
    saudi: "سعودي",
    "saudi arabian": "سعودي",
    "saudi arabia": "سعودي"
  };

  return aliases[normalized] ?? nationalityOptions.find((option) => option === value?.trim()) ?? "";
}

export default function LandingPage({ initialAuthView = null }: LandingPageProps) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [submittedFilters, setSubmittedFilters] = useState<Filters>(emptyFilters);
  const [activePackageView, setActivePackageView] = useState<"travel" | null>(null);
  const [publishedTravelPackages, setPublishedTravelPackages] = useState<TravelPackage[]>([]);
  const [travelOptions, setTravelOptions] = useState<TravelPackageOptions>({});
  const [bookingSectionOpen, setBookingSectionOpen] = useState(false);
  const [selectedBookingTitle, setSelectedBookingTitle] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [ocrStatus, setOcrStatus] = useState("");
  const [reservationForm, setReservationForm] = useState<ReservationForm>(emptyReservationForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<ReservationField | "passportFile" | "idFile", string>>>({});
  const [uploadErrors, setUploadErrors] = useState<Partial<Record<UploadKind, string>>>({});
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
    };
  }, [passportPreview, idPreview]);

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
            const firstRoomType = packageItem.roomTypes.find((item) => item.active)?.label ?? "";
            const firstTransport = packageItem.transportOptions.find((item) => item.active)?.label ?? "";

            next[packageItem.id] = next[packageItem.id] ?? {
              ...defaultTravelPackageOptions,
              roomType: firstRoomType,
              transportType: firstTransport
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
  const selectedPackage = publishedTravelPackages.find((packageItem) => packageItem.id === selectedPackageId) ?? null;
  const selectedTravelOptions = travelOptions[selectedPackageId] ?? {
    ...defaultTravelPackageOptions,
    roomType: selectedPackage?.roomTypes.find((item) => item.active)?.label ?? "",
    transportType: selectedPackage?.transportOptions.find((item) => item.active)?.label ?? ""
  };
  const selectedTravelerCount = Math.max(1, Number(selectedTravelOptions.travelers) || 1);
  const bookingDays = selectedPackage?.durationLabel ?? (selectedBookingTitle.includes("6") ? "6 أيام" : "10 أيام");
  const bookingNights = selectedPackage?.durationDays ?? (bookingDays === "6 أيام" ? 6 : 10);
  const availableNationalities = packagePricing?.nationalities?.length ? packagePricing.nationalities : nationalityOptions;
  const getHotelNightPrice = (hotelName: string, fallbackPrice: number) =>
    findPackagePrice(packagePricing, bookingDays, hotelName, reservationForm.nationality, fallbackPrice);
  const selectedHotelNightPrice = getHotelNightPrice(selectedHotelInfo.name, selectedHotelInfo.price);
  const getReservationPackagePrice = (hotelName: string, fallbackPrice: number) =>
    selectedPackage
      ? calculatePackagePrice(selectedPackage, {
          packageId: selectedPackage.id,
          nationality: reservationForm.nationality,
          roomType: selectedTravelOptions.roomType,
          transport: selectedTravelOptions.transportType,
          travelers: selectedTravelerCount,
          departureDate: selectedTravelOptions.bookingDate,
          durationDays: selectedPackage.durationDays,
          hotel: hotelName
        })
      : getHotelNightPrice(hotelName, fallbackPrice);
  const selectedPackagePrice = getReservationPackagePrice(selectedHotelInfo.name, selectedHotelInfo.price);
  const selectedTransportSupplement =
    selectedPackage?.transportOptions.find((item) => item.label === selectedTravelOptions.transportType)?.supplement ?? 0;
  const hotelTotal = selectedPackage ? selectedPackagePrice * selectedTravelerCount : selectedHotelNightPrice * bookingNights;
  const servicesTotal = selectedTransportSupplement;
  const reservationTotal = hotelTotal + servicesTotal;
  const reservationBaseLabel = selectedPackage ? "سعر الباقة" : "سعر الفندق";

  const validateReservationData = () => {
    const nextErrors: Partial<Record<ReservationField | "passportFile" | "idFile", string>> = {};

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
    setAuthPopupOpen(true);
  };

  const openBookingSection = (title: string, packageId = "") => {
    const bookingTitle = title || "حجز جديد";
    const packageItem = publishedTravelPackages.find((item) => item.id === packageId);
    const options = packageId ? travelOptions[packageId] : null;

    if (packageItem && packageItem.departureDates.length > 0 && !options?.bookingDate) {
      setTravelOptions((current) => ({
        ...current,
        [packageId]: {
          ...(current[packageId] ?? defaultTravelPackageOptions),
          dateError: "اختر تاريخ الحجز قبل المتابعة."
        }
      }));
      return;
    }

    if (!travelerUser?.isAuthenticated) {
      openAuthPopup("login", bookingTitle, packageId);
      setAuthMessage("يرجى تسجيل الدخول لإتمام الحجز.");
      return;
    }

    openReservationSection(bookingTitle, packageId);
  };

  const updateTravelOption = (
    packageId: string,
    name: "bookingDate" | "travelers" | "roomType" | "transportType",
    value: string
  ) => {
    setTravelOptions((current) => ({
      ...current,
      [packageId]: {
        ...(current[packageId] ?? defaultTravelPackageOptions),
        [name]: value,
        dateError: name === "bookingDate" ? "" : (current[packageId]?.dateError ?? "")
      }
    }));
  };

  const updateTravelBookingDate = (packageId: string, departureDates: string[], value: string) => {
    const validDate = !value || departureDates.length === 0 || departureDates.includes(value);

    setTravelOptions((current) => ({
      ...current,
      [packageId]: {
        ...(current[packageId] ?? defaultTravelPackageOptions),
        bookingDate: validDate ? value : "",
        dateError: value && !validDate ? "هذا التاريخ غير متاح لهذه الباقة." : ""
      }
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

  const handleRegisterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!registerForm.acceptTerms) {
      setAuthMessage("يجب الموافقة على الشروط والأحكام قبل إنشاء الحساب.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setAuthEmail(registerForm.email);
    setAuthMessage("تم تجهيز الحساب. أكمل التحقق من الرمز.");
    setAuthView("verify");
  };

  const handleForgotSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMessage("تم إرسال رابط الاستعادة إلى بريدك الإلكتروني.");
    setAuthView("reset");
  };

  const handleResetSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (resetForm.password !== resetForm.confirmPassword) {
      setAuthMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setAuthMessage("تم حفظ كلمة المرور الجديدة. يمكنك تسجيل الدخول الآن.");
    setAuthView("login");
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

  const updateDocumentFile = (kind: UploadKind, file?: File) => {
    if (!file) return;

    const error = validateDocumentFile(file);
    if (error) {
      setUploadErrors((current) => ({ ...current, [kind]: error }));
      return;
    }

    setUploadErrors((current) => ({ ...current, [kind]: "" }));
    setFormErrors((current) => ({ ...current, [kind === "passport" ? "passportFile" : "idFile"]: "" }));

    if (kind === "passport") {
      if (passportPreview) URL.revokeObjectURL(passportPreview);
      setPassportFile(file);
      setPassportPreview(isImageFile(file) ? URL.createObjectURL(file) : null);
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

  const removeDocumentFile = (kind: UploadKind) => {
    if (kind === "passport") {
      if (passportPreview) URL.revokeObjectURL(passportPreview);
      setPassportFile(null);
      setPassportPreview(null);
      return;
    }

    if (idPreview) URL.revokeObjectURL(idPreview);
    setIdFile(null);
    setIdPreview(null);
  };

  const handleDocumentDrop = (kind: UploadKind, fileList: FileList | null) => {
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
    if (!travelerUser?.isAuthenticated) {
      setBookingSectionOpen(false);
      openAuthPopup("login", selectedBookingTitle || "حجز جديد", selectedPackageId);
      setAuthMessage("يرجى تسجيل الدخول قبل تأكيد طلب الحجز.");
      return;
    }

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
      formData.append("Nationality", reservationForm.nationality.trim() || "غير محدد");
      formData.append("Gender", reservationForm.gender.trim() || "غير محدد");
      formData.append("DateOfBirth", reservationForm.dateOfBirth || "1990-01-01");
      formData.append("PassportExpiryDate", reservationForm.passportExpiryDate || "");
      formData.append("PhoneNumber", reservationForm.phoneNumber.trim());
      formData.append("Email", reservationForm.email.trim());
      formData.append("ResidenceNumber", reservationForm.civilId.trim());
      formData.append(
        "Notes",
        [
          `طلب حجز عمرة من الصفحة العامة - محال إلى خدمة العملاء - قيد التأكيد: ${selectedBookingTitle || "حجز جديد"}`,
          selectedPackage ? `الباقة: ${selectedPackage.name}` : "",
          selectedTravelOptions.bookingDate ? `تاريخ الحجز: ${selectedTravelOptions.bookingDate}` : "",
          selectedTravelOptions.travelers ? `عدد الأشخاص: ${selectedTravelOptions.travelers}` : "",
          selectedTravelOptions.roomType ? `نوع الغرفة: ${selectedTravelOptions.roomType}` : "",
          selectedTravelOptions.transportType ? `وسيلة النقل: ${selectedTravelOptions.transportType}` : "",
          `المبلغ المحسوب: ${reservationTotal.toLocaleString("en-US")} د.ك`
        ].filter(Boolean).join(" | ")
      );
      formData.append("PassportImagePath", "");
      formData.append("IsBlocked", "false");
      formData.append("PackageId", selectedPackage?.id ?? "");
      formData.append("PackageName", selectedPackage?.name ?? selectedBookingTitle ?? "");
      formData.append("BookingDate", selectedTravelOptions.bookingDate || "");
      formData.append("TravelersCount", String(selectedTravelerCount));
      formData.append("RoomType", selectedTravelOptions.roomType || "");
      formData.append("TransportType", selectedTravelOptions.transportType || "");
      formData.append("ReservationTotal", String(reservationTotal));
      if (passportFile) {
        formData.append("passportImage", passportFile);
      }
      if (idFile) {
        formData.append("civilIdImage", idFile);
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

  const rowadTravelPackages = publishedTravelPackages.filter((program) => program.id.startsWith("rowad-company-"));
  const regularTravelPackages = publishedTravelPackages.filter((program) => !program.id.startsWith("rowad-company-"));
  const rowadTravelBackground = resolvePackageImageUrl(rowadTravelPackages[1]?.imageUrl ?? rowadTravelPackages[0]?.imageUrl ?? "/landingpage/hero-kaaba-premium.png");
  const rowadTravelStyle = { "--rowad-travel-bg": `url(${rowadTravelBackground})` } as CSSProperties;

  const renderTravelPackageCard = (program: TravelPackage, variant: "rowad" | "regular" = "regular") => {
    const options = travelOptions[program.id] ?? {
      bookingDate: "",
      travelers: "1",
      roomType: program.roomTypes.find((item) => item.active)?.label ?? "",
      transportType: program.transportOptions.find((item) => item.active)?.label ?? "",
      dateError: ""
    };
    const activeRoomTypes = program.roomTypes.filter((item) => item.active);
    const activeTransportOptions = program.transportOptions.filter((item) => item.active);
    const dynamicPrice = calculatePackagePrice(program, {
      packageId: program.id,
      travelers: Number(options.travelers) || 1,
      roomType: options.roomType,
      transport: options.transportType,
      departureDate: options.bookingDate,
      durationDays: program.durationDays
    });
    const displayPrice = dynamicPrice || getPackageFromPrice(program);

    return (
      <article className={`gv-travel-card ${variant === "rowad" ? "gv-travel-card--rowad" : ""}`} key={program.id}>
        <div className="gv-travel-card__media" style={{ backgroundImage: `url(${resolvePackageImageUrl(program.imageUrl)})` }}>
          <span>{program.durationLabel}</span>
          {variant === "rowad" ? <em className="gv-travel-card__brand">رواد</em> : null}
        </div>
        <div className="gv-travel-card__body">
          <div className="gv-travel-card__features gv-travel-card__features--controls">
            <label>
              <CalendarIcon className="icon icon-sm" />
              <strong>تاريخ الحجز</strong>
              {program.departureDates.length > 0 ? (
                <select
                  value={options.bookingDate}
                  onChange={(event) => updateTravelOption(program.id, "bookingDate", event.target.value)}
                >
                  <option value="">اختر التاريخ</option>
                  {program.departureDates.map((date) => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  value={options.bookingDate}
                  onChange={(event) => updateTravelBookingDate(program.id, program.departureDates, event.target.value)}
                />
              )}
            </label>
            <label>
              <UsersIcon className="icon icon-sm" />
              <strong>عدد الأشخاص</strong>
              <select
                value={options.travelers}
                onChange={(event) => updateTravelOption(program.id, "travelers", event.target.value)}
              >
                {travelerCountOptions.map((count) => (
                  <option key={count} value={count}>{count}</option>
                ))}
              </select>
            </label>
            <label>
              <MosqueIcon className="icon icon-sm" />
              <strong>نوع الغرفة</strong>
              <select
                value={options.roomType}
                onChange={(event) => updateTravelOption(program.id, "roomType", event.target.value)}
              >
                {activeRoomTypes.map((roomType) => (
                  <option key={roomType.id} value={roomType.label}>{roomType.label}</option>
                ))}
              </select>
            </label>
            <label>
              <BusIcon className="icon icon-sm" />
              <strong>وسيلة النقل</strong>
              <select
                value={options.transportType}
                onChange={(event) => updateTravelOption(program.id, "transportType", event.target.value)}
              >
                {activeTransportOptions.map((transport) => (
                  <option key={transport.id} value={transport.label}>{transport.label}</option>
                ))}
              </select>
            </label>
          </div>
          {options.dateError ? (
            <p className="gv-travel-card__date-error">{options.dateError}</p>
          ) : null}
          <div className="gv-travel-card__divider" />
          <div className="gv-travel-card__footer">
            <p>تبدأ من <b>{displayPrice.toLocaleString("en-US")}</b> {program.currency}</p>
            <button type="button" onClick={() => openBookingSection(program.durationLabel, program.id)}>
              حجز
            </button>
          </div>
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
            <div className="gv-brand">
              <MosqueIcon className="icon" />
              <div>
                <strong>رحلات العمرة</strong>
                <span>طريقك إلى بيت الله</span>
              </div>
            </div>
            <nav className="gv-nav" aria-label="التنقل الرئيسي">
              <a className="active" href="#globalview">الرئيسية</a>
              <a href="#gv-packages">العمرة</a>
              <a href="#gv-packages">برامجنا</a>
              <a href="#gv-services">عنّا</a>
              <a href="#gv-reservation">تواصل معنا</a>
            </nav>
            <div className="gv-contact">
              <span><MailIcon className="icon icon-sm" /> info@umrah.com</span>
              <span><PhoneIcon className="icon icon-sm" /> +965 55 123 4567</span>
              <span><LocationIcon className="icon icon-sm" /> العربية</span>
              {travelerUser?.isAuthenticated ? (
                <button className="gv-auth-nav gv-auth-nav--logout" type="button" onClick={() => void handleTravelerLogout()}>
                  تسجيل الخروج
                </button>
              ) : (
                <button className="gv-auth-nav" type="button" onClick={() => openAuthPopup("login")}>
                  تسجيل الدخول
                </button>
              )}
              <button className="gv-book" type="button" onClick={() => openBookingSection("حجز جديد")}>
                احجز الآن
                <ArrowRightIcon className="icon icon-sm" />
              </button>
            </div>
          </div>
        </header>

        <div className="gv-hero__content">
          <p>رحلة إيمانية ..</p>
          <h1>تجربة روحانية لا تُنسى</h1>
          <span>نقدم لكم أفضل خدمات العمرة المتكاملة، برعاية واهتمام لنجعل رحلتكم إلى بيت الله الحرام سهلة وآمنة ومميزة.</span>
          <div className="gv-hero-features">
            <article>
              <UsersIcon className="icon icon-md" />
              <strong>مرافقة دينية<br />متخصصة</strong>
            </article>
            <article>
              <MosqueIcon className="icon icon-md" />
              <strong>فنادق قريبة<br />من الحرم</strong>
            </article>
            <article>
              <BusIcon className="icon icon-md" />
              <strong>مواصلات مريحة<br />وحديثة</strong>
            </article>
            <article>
              <ShieldIcon className="icon icon-md" />
              <strong>دعم على مدار<br />الساعة</strong>
            </article>
          </div>
          <div className="gv-actions">
            <button type="button" onClick={() => document.getElementById("gv-packages")?.scrollIntoView({ behavior: "smooth" })}>
              استعرض باقات العمرة
              <ArrowRightIcon className="icon icon-sm" />
            </button>
            <button type="button" className="ghost">
              <ChatIcon className="icon icon-sm" />
              شاهد فيديو تعريفي
            </button>
          </div>
        </div>

        <div className="gv-spiritual">
          <strong>لبيك<br />اللهم لبيك</strong>
          <span />
          <p>رحلة تبدأ من قلبك<br />وتنتهي بالقرب من الله</p>
        </div>

        <aside className="gv-support">
          <MosqueIcon className="icon gv-support__mark" />
          <strong>خدمة عملاء</strong>
          <b>24/7</b>
          <span className="gv-support__line">لخدمتكم في كل خطوة <HeadsetIcon className="icon icon-sm" /></span>
          <em>ثقتكم .. مسؤوليتنا</em>
        </aside>
      </section>
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
                <p className="gv-card__image-text">
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
              <div className="gv-rowad-travel__content">
                <header className="gv-rowad-travel__header">
                  <span>باقات رواد الأصلية</span>
                  <h2>رحلاتنا</h2>
                  <p>رحلات مختارة من دليل شركة رواد، بأسعار واضحة وقواعد حجز قابلة للإدارة.</p>
                </header>
                <div className="gv-travel-grid gv-travel-grid--rowad">
                  {rowadTravelPackages.map((program) => renderTravelPackageCard(program, "rowad"))}
                </div>
              </div>
            </div>
          ) : null}
          {regularTravelPackages.length > 0 ? (
            <div className="gv-travel-packages__standard">
              <h2 className="gv-travel-packages__title">باقات الرحلات</h2>
              <div className="gv-travel-grid">
                {regularTravelPackages.map((program) => renderTravelPackageCard(program))}
              </div>
            </div>
          ) : null}
          {publishedTravelPackages.length === 0 ? (
            <div className="gv-empty">لا توجد باقات منشورة حالياً.</div>
          ) : null}
        </section>
      )}

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
              <div className="gv-auth-company">
                <div className="gv-auth-company__text">
                  <strong><span>شركة</span> رواد</strong>
                  <small>للسفر والسياحة وخدمات العمرة</small>
                </div>
                <span className="gv-auth-company__divider" />
                <img src="/landingpage/company-logo.png" alt="رواد العمرة" />
              </div>

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
                    <div className="gv-auth-divider"><span>أو</span></div>
                    <button className="gv-auth-google" type="button">
                      <b>G</b>
                      متابعة باستخدام جوجل
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
                    <button className="gv-auth-primary" type="submit"><ArrowRightIcon className="icon icon-sm" /> إنشاء الحساب</button>
                    <div className="gv-auth-divider"><span>أو</span></div>
                    <button className="gv-auth-google" type="button"><b>G</b> التسجيل باستخدام جوجل</button>
                    <p className="gv-auth-switch">لديك حساب بالفعل؟ <button type="button" onClick={() => openAuthPopup("login", authContextTitle)}>تسجيل الدخول</button></p>
                  </form>
                )}

                {authView === "forgot" && (
                  <form className="gv-auth-form" onSubmit={handleForgotSubmit}>
                    <label>
                      البريد الإلكتروني
                      <span className="gv-auth-field"><input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="أدخل بريدك الإلكتروني" required /><MailIcon className="icon icon-sm" /></span>
                    </label>
                    <button className="gv-auth-primary" type="submit"><ArrowRightIcon className="icon icon-sm" /> إرسال رابط الاستعادة</button>
                    <div className="gv-auth-divider"><span>أو</span></div>
                    <button className="gv-auth-outline" type="button" onClick={() => openAuthPopup("login", authContextTitle)}>العودة إلى تسجيل الدخول</button>
                    <p className="gv-auth-secure"><ShieldIcon className="icon icon-sm" /> حماية وأمان لبياناتك</p>
                  </form>
                )}

                {authView === "reset" && (
                  <form className="gv-auth-form" onSubmit={handleResetSubmit}>
                    <label>
                      كلمة المرور الجديدة
                      <span className="gv-auth-field"><input type="password" value={resetForm.password} onChange={(event) => setResetForm((current) => ({ ...current, password: event.target.value }))} placeholder="أدخل كلمة المرور الجديدة" required /><ShieldIcon className="icon icon-sm" /></span>
                    </label>
                    <label>
                      تأكيد كلمة المرور الجديدة
                      <span className="gv-auth-field"><input type="password" value={resetForm.confirmPassword} onChange={(event) => setResetForm((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="أعد إدخال كلمة المرور الجديدة" required /><ShieldIcon className="icon icon-sm" /></span>
                    </label>
                    <p className="gv-auth-hint">يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل ويفضل استخدام مزيج من الحروف والأرقام.</p>
                    <button className="gv-auth-primary" type="submit"><ArrowRightIcon className="icon icon-sm" /> حفظ كلمة المرور</button>
                    <button className="gv-auth-linkline" type="button" onClick={() => openAuthPopup("login", authContextTitle)}>العودة إلى تسجيل الدخول</button>
                    <p className="gv-auth-secure"><ShieldIcon className="icon icon-sm" /> معلوماتك محمية وآمنة دائماً</p>
                  </form>
                )}

                {authView === "verify" && (
                  <form className="gv-auth-form" onSubmit={(event) => { event.preventDefault(); setAuthView("twoFactor"); setAuthMessage(""); }}>
                    <div className="gv-auth-code" dir="ltr">
                      {verificationCode.map((digit, index) => (
                        <input key={index} inputMode="numeric" maxLength={1} value={digit} onChange={(event) => updateVerificationCode(index, event.target.value)} aria-label={`رمز التحقق ${index + 1}`} />
                      ))}
                    </div>
                    <p className="gv-auth-muted">تم إرسال الرمز إلى 55*******</p>
                    <button className="gv-auth-primary" type="submit"><ArrowRightIcon className="icon icon-sm" /> تأكيد الرمز</button>
                    <div className="gv-auth-resend"><span>إعادة الإرسال خلال 00:45</span><button type="button">إرسال الرمز مرة أخرى</button></div>
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

            <div className="gv-reservation-steps" aria-label="خطوات الحجز">
              {reservationSteps.map((step) => {
                const isDone = step.id < reservationStep;
                const isActive = step.id === reservationStep;
                return (
                  <button
                    key={step.id}
                    type="button"
                    className={`${isActive ? "is-active" : ""} ${isDone ? "is-done" : ""}`}
                    onClick={() => goToReservationStep(step.id)}
                  >
                    <span>{isDone ? "✓" : step.id}</span>
                    <small>الخطوة {step.id}</small>
                    <strong>{step.label}</strong>
                  </button>
                );
              })}
            </div>

            {reservationStep <= 3 ? (
            <div className="gv-reservation__layout">
              <div className="gv-reservation__form">
                <div className="gv-reservation__form-head">
                  <span><UsersIcon className="icon icon-md" /></span>
                  <div>
                    <strong>بيانات المسافر</strong>
                    <p>أدخل بياناتك لإتمام الحجز</p>
                  </div>
                </div>
                <label>
                  الاسم الكامل
                  <span className="gv-field">
                    <input id="gv-full-name" type="text" placeholder="اكتب الاسم الكامل" value={reservationForm.fullName} onChange={(event) => updateReservationField("fullName", event.target.value)} aria-invalid={Boolean(formErrors.fullName)} />
                    <UsersIcon className="icon icon-sm" />
                  </span>
                  {formErrors.fullName ? <em>{formErrors.fullName}</em> : null}
                </label>
                <label>
                  رقم الهاتف
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
                <label>
                  رقم الجواز
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
                <button type="button" className="gv-smart-extract" onClick={() => void extractAllDocuments()} disabled={!passportFile && !idFile}>
                  <SearchIcon className="icon icon-sm" />
                  استخراج ذكي
                </button>
                <button type="button" className="gv-confirm-booking" onClick={() => goToReservationStep(4)}>
                  <ArrowRightIcon className="icon icon-sm" />
                  التالي: اختيار الفندق
                </button>
                <small><ShieldIcon className="icon icon-sm" /> جميع بياناتك محمية وآمنة</small>
              </div>

              <div className="gv-upload-stack">
                <article className="gv-upload-card">
                  <div className="gv-upload-card__head">
                    <span>02</span>
                    <div>
                      <strong>إضافة جواز السفر</strong>
                      <p>ارفع صورة جواز السفر بوضوح</p>
                    </div>
                  </div>
                  <label
                    className="gv-dropzone"
                    htmlFor="gv-passport-upload"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDocumentDrop("passport", event.dataTransfer.files);
                    }}
                  >
                    <input id="gv-passport-upload" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => updatePassportFile(event.target.files?.[0])} />
                    <div className="gv-document-preview gv-document-preview--passport">
                      {passportPreview ? <img src={passportPreview} alt="معاينة جواز السفر" /> : <DocumentIcon className="icon" />}
                    </div>
                    <span className="gv-upload-cloud"><DocumentIcon className="icon icon-sm" /></span>
                    <b>اسحب وأفلت صورة جواز السفر هنا</b>
                  </label>
                  {passportFile ? (
                    <div className="gv-file-row">
                      <span>{passportFile.name}</span>
                      <button type="button" onClick={() => removeDocumentFile("passport")}>حذف</button>
                    </div>
                  ) : null}
                  {(uploadErrors.passport || formErrors.passportFile) ? <em className="gv-upload-error">{uploadErrors.passport || formErrors.passportFile}</em> : null}
                </article>

                <article className="gv-upload-card">
                  <div className="gv-upload-card__head">
                    <span>01</span>
                    <div>
                      <strong>إضافة بطاقة الهوية</strong>
                      <p>ارفع صورة بطاقة الهوية الوطنية</p>
                    </div>
                  </div>
                  <label
                    className="gv-dropzone"
                    htmlFor="gv-id-upload"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDocumentDrop("id", event.dataTransfer.files);
                    }}
                  >
                    <input id="gv-id-upload" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => updateIdFile(event.target.files?.[0])} />
                    <div className="gv-document-preview gv-document-preview--id">
                      {idPreview ? <img src={idPreview} alt="معاينة بطاقة الهوية" /> : <DocumentIcon className="icon" />}
                    </div>
                    <span className="gv-upload-cloud"><DocumentIcon className="icon icon-sm" /></span>
                    <b>اسحب وأفلت صورة بطاقة الهوية هنا</b>
                  </label>
                  {idFile ? (
                    <div className="gv-file-row">
                      <span>{idFile.name}</span>
                      <button type="button" onClick={() => removeDocumentFile("id")}>حذف</button>
                    </div>
                  ) : null}
                  {(uploadErrors.id || formErrors.idFile) ? <em className="gv-upload-error">{uploadErrors.id || formErrors.idFile}</em> : null}
                </article>
              </div>
            </div>
            ) : null}

            {reservationStep === 4 ? (
              <div className="gv-booking-stage gv-booking-stage--hotels">
                <aside className="gv-booking-summary">
                  <strong>ملخص رحلتك</strong>
                  <span><CalendarIcon className="icon icon-sm" /> {bookingDays}</span>
                  <span><UsersIcon className="icon icon-sm" /> {selectedTravelerCount} {selectedTravelerCount === 1 ? "مسافر" : "مسافرين"}</span>
                  <span><DocumentIcon className="icon icon-sm" /> الوثائق مكتملة</span>
                  <span><SearchIcon className="icon icon-sm" /> تم الاستخراج بنجاح</span>
                  <button type="button" onClick={() => goToReservationStep(3)}>تعديل البيانات</button>
                  <p>لأن رحلتك تستحق الأفضل، اختر الفندق الأنسب قبل الدفع.</p>
                </aside>
                <section className="gv-hotel-stage">
                  <p>اختر فندقك في مكة والمدينة</p>
                  <div className="gv-hotel-tabs">
                    <button className="is-active" type="button">مكة المكرمة</button>
                    <button type="button">المدينة المنورة</button>
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
                            <small>{reservationForm.nationality ? `سعر ${reservationForm.nationality}` : "ابتداءً من"}</small>
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
                  <hr />
                  <p><small>{reservationBaseLabel}</small><b>{hotelTotal.toLocaleString("en-US")} د.ك</b></p>
                  <p><small>الخدمات الإضافية</small><b>{servicesTotal.toLocaleString("en-US")} د.ك</b></p>
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
                  <p>طلب الحجز الآن قيد التأكيد. سيتواصل معكم أحد ممثلي خدمة العملاء لمراجعة البيانات وتأكيد تفاصيل رحلة العمرة قبل اعتماد الحجز نهائياً.</p>
                  <button type="button" onClick={() => setReservationSuccessOpen(false)}>
                    حسناً
                  </button>
                </div>
              </div>
            ) : null}
            <div className="gv-reservation__foot">
              <MosqueIcon className="icon icon-sm" />
              <span>في خدمتكم لرحلة إيمانية مميزة</span>
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
          <MosqueIcon className="icon" />
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
          <span><PhoneIcon className="icon icon-sm" /> +965 55 123 4567</span>
          <span><MailIcon className="icon icon-sm" /> info@rawad-omrah.com</span>
          <span><LocationIcon className="icon icon-sm" /> الكويت - حولي</span>
        </div>
      </footer>
    </main>
  );
}
