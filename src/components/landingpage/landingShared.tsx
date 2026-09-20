import type { ReactNode } from "react";

export type IconProps = { className?: string };

export function SvgIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

export function LocationIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </SvgIcon>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m4.5 7.5 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M6.5 4.8h2.1c.5 0 .9.3 1.1.8l1.2 3c.2.5.1 1.1-.3 1.5l-1.5 1.4c1.1 2.1 2.8 3.8 4.9 4.9l1.4-1.5c.4-.4 1-.5 1.5-.3l3 1.2c.5.2.8.6.8 1.1v2.1c0 .7-.5 1.3-1.2 1.5-1.2.3-2.6.3-4.1-.1C11 19.1 4.9 13 4.6 7c-.4-1.5-.4-2.9-.1-4.1.2-.7.8-1.2 1.5-1.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 3.5v3M17 3.5v3M3.5 9h17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.8v4.8l3.2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M20 11.7a8.2 8.2 0 0 1-11.9 7L4 20l1.4-3.9A8.2 8.2 0 1 1 20 11.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.4 8.8c.2-.4.4-.4.7-.4h.6c.2 0 .5 0 .7.5l.9 2.1c.1.3.1.6-.1.8l-.7.8c.5 1 1.4 1.8 2.4 2.4l.8-.7c.2-.2.5-.2.8-.1l2.1.9c.4.2.5.4.5.7v.6c0 .3 0 .5-.4.7-.7.3-1.5.3-2.4.1-2.7-.7-5.2-3.2-5.9-5.9-.2-.9-.2-1.7.1-2.4Z" fill="currentColor" />
    </SvgIcon>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M6 18.3V20l2.7-1.5a8.7 8.7 0 0 0 3.3.6c4.2 0 7.5-2.7 7.5-6.2S16.2 6.7 12 6.7 4.5 9.4 4.5 12.9c0 1.8.8 3.4 2.1 4.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.3 12.7h7.4M8.3 10.1h4.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m15 15 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function HeadsetIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M4.8 13.2v-1.1a7.2 7.2 0 0 1 14.4 0v1.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.8 13.2a2.2 2.2 0 0 0 0 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M19.2 13.2a2.2 2.2 0 0 1 0 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 18.8c.9.9 2.2 1.4 4 1.4 1.8 0 3.1-.5 4-1.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M12 3.8 19 6.4v5.1c0 4.6-2.8 7.9-7 9.7-4.2-1.8-7-5.1-7-9.7V6.4L12 3.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m9.2 12.1 1.9 1.9 3.7-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function TagIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M4 12.4V6.6c0-1.4 1.1-2.6 2.6-2.6h5.8l7.6 7.6-8.4 8.4L4 12.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="8.3" cy="8.3" r="1.2" fill="currentColor" />
    </SvgIcon>
  );
}

export function BuildingIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M5 20.2V6.8h14v13.4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 20.2v-4h3.2v4M12.8 20.2v-4H16v4M8 8.6h1.8M8 11.9h1.8M14.2 8.6H16M14.2 11.9H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function BusIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <rect x="4" y="5" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 16v2M17 16v2M6.3 10h11.4M9 5v5M15 5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="8" cy="13.2" r="1" fill="currentColor" />
      <circle cx="16" cy="13.2" r="1" fill="currentColor" />
    </SvgIcon>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M14.2 19v-1.5c0-1.7-1.5-3-3.5-3s-3.5 1.3-3.5 3V19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="10.7" cy="9" r="2.7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19.3 18.7v-1c0-1.4-1-2.5-2.4-3.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16.5 8.8a2.2 2.2 0 0 1 0 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.7 18.7v-1c0-1.4 1-2.5 2.4-3.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7.5 8.8a2.2 2.2 0 0 0 0 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="m12 3 2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function MedalIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <circle cx="12" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m9 14.2-1 5.8 4-2.2 4 2.2-1-5.8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function BadgeIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M7 4.8h10l2 3v9.4l-7 2.8-7-2.8V7.8l2-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m9.2 12 1.7 1.7 4-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function MosqueIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M4.5 18.8h15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 18.8V12l2.4-2.3v9.1M18 18.8V12l-2.4-2.3v9.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.4 18.8V10c0-1.8 1.2-3 2.6-3s2.6 1.2 2.6 3v8.8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 3.8c0 .9-.8 1.5-1.7 1.5.9.1 1.7.7 1.7 1.5 0-.8.8-1.4 1.7-1.5-.9 0-1.7-.6-1.7-1.5Z" fill="currentColor" />
    </SvgIcon>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M14.5 5.5 8 12l6.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="m6.5 9 5.5 5.5L17.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M12 16V5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m8.2 8.7 3.8-3.8 3.8 3.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18.5h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function DocumentIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M7.2 3.8h6.7L18 8v12.2H7.2c-1 0-1.8-.8-1.8-1.8V5.6c0-1 .8-1.8 1.8-1.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M13.8 3.8V8H18" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.9 11.2h5.6M8.9 14.1h5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="m8.9 12.2 2.3 2.3 4.2-4.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export type BookingProgram = {
  id: string;
  badge: string;
  title: string;
  image: string;
  nights: string;
  city: string;
  transport: string;
  transfer: string;
  price: string;
  details: string[];
};

export type BookingService = {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  image: string;
};

export type BookingState = {
  passportNumber: string;
  fullName: string;
  nationality: string;
  gender: string;
  dateOfBirth: string;
  passportExpiryDate: string;
  phoneNumber: string;
  email: string;
  residenceNumber: string;
  notes: string;
};

export const LANDING_PROGRAMS: BookingProgram[] = [
  {
    id: "economy",
    badge: "اقتصادية",
    title: "عمرة اقتصادية 7 ليالي",
    image: "/landingpage/lit.png",
    nights: "7 ليالي",
    city: "مكة - المدينة",
    transport: "طيران اقتصادي",
    transfer: "نقل مشترك",
    price: "45 د.ك",
    details: ["فنادق 3 نجوم", "رحلة مريحة", "أفضل سعر"]
  },
  {
    id: "premium",
    badge: "الأكثر طلباً",
    title: "عمرة مميزة 10 ليالي",
    image: "/landingpage/chambre.png",
    nights: "10 ليالي",
    city: "مكة - المدينة",
    transport: "طيران اقتصادي",
    transfer: "نقل خاص",
    price: "4,590 د.ك",
    details: ["فنادق 4 نجوم", "خدمة مرنة", "أفضل قيمة"]
  },
  {
    id: "vip",
    badge: "VIP",
    title: "عمرة VIP 14 ليلة",
    image: "/landingpage/dormir.png",
    nights: "14 ليلة",
    city: "مكة - المدينة",
    transport: "طيران درجة أعمال",
    transfer: "نقل خاص",
    price: "60 د.ك",
    details: ["فنادق 5 نجوم", "مرافقة خاصة", "تجربة فاخرة"]
  }
];

export const BOOKING_SERVICES: BookingService[] = [
  { id: "insurance", title: "تأمين سفر شامل", subtitle: "تغطية كاملة أثناء الرحلة", price: "5 د.ك", image: "/landingpage/mains.png" },
  { id: "extra-night", title: "سكن إضافي", subtitle: "ليلة إضافية في مكة", price: "15 د.ك", image: "/landingpage/lit.png" },
  { id: "transfer", title: "خدمة نقل VIP", subtitle: "مطار ومدينة", price: "20 د.ك", image: "/landingpage/bus.png" },
  { id: "upgrade", title: "ترقية الطيران", subtitle: "درجة أعلى للراحة", price: "120 د.ك", image: "/landingpage/avion.png" },
  { id: "support", title: "استشارة مرافقة", subtitle: "متابعة من فريقنا", price: "مجاني", image: "/landingpage/reunion.png" }
];

export const DEFAULT_BOOKING_STATE: BookingState = {
  passportNumber: "",
  fullName: "",
  nationality: "",
  gender: "",
  dateOfBirth: "",
  passportExpiryDate: "",
  phoneNumber: "",
  email: "",
  residenceNumber: "",
  notes: ""
};

export function SectionHeading({ title }: { title: string }) {
  return (
    <div className="section-heading">
      <span className="section-heading__line" />
      <span className="section-heading__ornament">◆</span>
      <h2>{title}</h2>
      <span className="section-heading__ornament">◆</span>
      <span className="section-heading__line" />
    </div>
  );
}
