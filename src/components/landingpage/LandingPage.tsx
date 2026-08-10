import { useEffect, useState } from "react";
import { BookingWizard } from "./bookingWizard";
import { BenefitsStrip } from "./BenefitsStrip";
import { Footer } from "./Footer";
import { HeroSection } from "./HeroSection";
import { MainNavbar } from "./MainNavbar";
import { ProgramsSection } from "./ProgramsSection";
import { SearchBar } from "./SearchBar";
import { StatisticsStrip } from "./StatisticsStrip";
import { TopBar } from "./TopBar";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<"home" | "booking">("home");
  const [selectedProgramIndex, setSelectedProgramIndex] = useState(1);
  const [bookingStep, setBookingStep] = useState(1);

  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.body.classList.add("umrah-body");

    return () => {
      document.body.classList.remove("umrah-body");
    };
  }, []);

  const openBooking = (step = 1, programIndex = selectedProgramIndex) => {
    setSelectedProgramIndex(programIndex);
    setBookingStep(step);
    setView("booking");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="umrah-page" dir="rtl" lang="ar">
      <TopBar onBookNow={() => openBooking(1)} />
      <MainNavbar
        menuOpen={menuOpen}
        onToggle={() => setMenuOpen((value) => !value)}
        currentView={view}
        onNavigate={(target) => {
          if (target === "home") {
            setView("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }

          if (target === "booking") {
            openBooking(1);
            return;
          }

          if (target === "services") {
            if (view === "home") {
              document.getElementById("programs")?.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              setBookingStep(3);
            }
            return;
          }

          document.getElementById("footer")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      {view === "home" ? (
        <main>
          <HeroSection onStartBooking={() => openBooking(1)} />
          <SearchBar onSearch={() => openBooking(1)} />
          <BenefitsStrip />
          <ProgramsSection onChooseProgram={(index) => openBooking(1, index)} />
          <StatisticsStrip />
          <Footer />
        </main>
      ) : null}

      {view === "booking" ? (
        <main>
          <BookingWizard
            selectedProgramIndex={selectedProgramIndex}
            onSelectProgram={(index) => setSelectedProgramIndex(index)}
            onBackHome={() => setView("home")}
            onOpenStep={(step) => setBookingStep(step)}
            activeStep={bookingStep}
          />
        </main>
      ) : null}
    </div>
  );
}
