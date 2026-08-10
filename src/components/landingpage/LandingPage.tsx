import { useEffect, useState } from "react";
import { AboutPage } from "./AboutPage";
import { CorporateOffersPage } from "./CorporateOffersPage";
import { BookingWizard } from "./bookingWizard";
import { BenefitsStrip } from "./BenefitsStrip";
import { ContactPage } from "./ContactPage";
import { Footer } from "./Footer";
import { HeroSection } from "./HeroSection";
import { MainNavbar } from "./MainNavbar";
import { ProgramsSection } from "./ProgramsSection";
import { SearchBar } from "./SearchBar";
import { StatisticsStrip } from "./StatisticsStrip";
import { ServicesPage } from "./ServicesPage";
import { TopBar } from "./TopBar";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<"home" | "booking" | "contact" | "about" | "corporate" | "services">("home");
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

  const openContact = () => {
    setView("contact");
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

          if (target === "corporate") {
            setView("corporate");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }

          if (target === "services") {
            setView("services");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }

          if (target === "contact") {
            openContact();
            return;
          }

          if (target === "about") {
            setView("about");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }

          document.getElementById("footer")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <main className="landing-stage">
        <section className={`landing-view ${view === "home" ? "is-active" : ""}`} aria-hidden={view !== "home"}>
          <HeroSection onStartBooking={() => openBooking(1)} />
          <SearchBar onSearch={() => openBooking(1)} />
          <BenefitsStrip />
          <ProgramsSection onChooseProgram={(index) => openBooking(1, index)} />
          <StatisticsStrip />
          <Footer />
        </section>

        <section className={`landing-view ${view === "booking" ? "is-active" : ""}`} aria-hidden={view !== "booking"}>
          <BookingWizard
            selectedProgramIndex={selectedProgramIndex}
            onSelectProgram={(index) => setSelectedProgramIndex(index)}
            onBackHome={() => setView("home")}
            onOpenStep={(step) => setBookingStep(step)}
            activeStep={bookingStep}
          />
        </section>

        <section className={`landing-view ${view === "contact" ? "is-active" : ""}`} aria-hidden={view !== "contact"}>
          <ContactPage onStartBooking={() => openBooking(1)} />
          <Footer />
        </section>

        <section className={`landing-view ${view === "about" ? "is-active" : ""}`} aria-hidden={view !== "about"}>
          <AboutPage onStartBooking={() => openBooking(1)} />
          <Footer />
        </section>

        <section className={`landing-view ${view === "services" ? "is-active" : ""}`} aria-hidden={view !== "services"}>
          <ServicesPage onStartBooking={() => openBooking(1)} />
        </section>

        <section className={`landing-view ${view === "corporate" ? "is-active" : ""}`} aria-hidden={view !== "corporate"}>
          <CorporateOffersPage selectedProgramIndex={selectedProgramIndex} onSelectProgram={(index) => setSelectedProgramIndex(index)} onBackHome={() => setView("home")} />
        </section>
      </main>
    </div>
  );
}
