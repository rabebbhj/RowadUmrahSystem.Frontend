import { useMemo, useState } from "react";
import type { AuthUser } from "../../../api/auth";
import { archiveTrip, updateTripStatus, type TripStatus } from "../../../api/trips";
import {
  LoadingGrid,
  StatePanel,
  TravelerFilters,
  TravelerSummaryCards,
  TravelersTable,
  Icon,
  formatDisplayDate
} from "../../../components/Travelers/TravelerWorkflowUi";
import { TravelerWorkflowShell } from "../../../components/Travelers/TravelerWorkflowShell";
import { useDatePackages } from "../../../hooks/useDatePackages";
import { usePackageTravelers } from "../../../hooks/usePackageTravelers";

type PackageTravelersPageProps = {
  user: AuthUser;
  activePath: string;
  dateId: string;
  packageId: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function PackageTravelersPage({ user, activePath, dateId, packageId, onNavigate, onLogout }: PackageTravelersPageProps) {
  const decodedDate = decodeURIComponent(dateId);
  const decodedPackageId = decodeURIComponent(packageId);
  const packagesState = useDatePackages(decodedDate, onLogout);
  const travelersState = usePackageTravelers(decodedDate, decodedPackageId, onLogout);
  const selectedPackage = packagesState.items.find((item) => item.id === decodedPackageId);
  const [search, setSearch] = useState("");
  const [nationality, setNationality] = useState("");
  const [status, setStatus] = useState("");
  const [busyTripId, setBusyTripId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filteredTravelers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return travelersState.items.filter((traveler) => {
      const matchesSearch = !searchValue ||
        traveler.fullName.toLowerCase().includes(searchValue) ||
        traveler.passportNumber.toLowerCase().includes(searchValue) ||
        traveler.phone?.toLowerCase().includes(searchValue);
      const matchesNationality = !nationality || traveler.nationality === nationality;
      const matchesStatus = !status || traveler.status === status;

      return matchesSearch && matchesNationality && matchesStatus;
    });
  }, [nationality, search, status, travelersState.items]);

  const packageLabel = selectedPackage ? `باقة ${selectedPackage.durationDays} أيام` : "الباقة المحددة";

  async function handleStatusChange(tripId: number, nextStatus: TripStatus) {
    setBusyTripId(tripId);
    setActionMessage(null);

    try {
      await updateTripStatus(tripId, nextStatus);
      setActionMessage(nextStatus === "confirmed" ? "تم تأكيد المسافر." : "تم تحديث حالة المسافر.");
      travelersState.retry();
      packagesState.retry();
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setActionMessage(error instanceof Error ? error.message : "تعذر تحديث حالة المسافر.");
    } finally {
      setBusyTripId((current) => (current === tripId ? null : current));
    }
  }

  async function handleArchiveTrip(tripId: number) {
    if (!window.confirm("هل تريد أرشفة هذا المسافر من هذه الرحلة؟")) {
      return;
    }

    setBusyTripId(tripId);
    setActionMessage(null);

    try {
      await archiveTrip(tripId);
      setActionMessage("تمت أرشفة المسافر من الرحلة.");
      travelersState.retry();
      packagesState.retry();
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        return;
      }

      setActionMessage(error instanceof Error ? error.message : "تعذرت أرشفة المسافر.");
    } finally {
      setBusyTripId((current) => (current === tripId ? null : current));
    }
  }

  return (
    <TravelerWorkflowShell user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout}>
      <section className="tw-page">
        <header className="tw-page-header">
          <div className="tw-page-title tw-page-title--single">
            <span className="tw-breadcrumb-title"><Icon name="users" /> المسافرون / {formatDisplayDate(decodedDate)} / {packageLabel}</span>
            <p>عرض وإدارة مسافري الرحلة المحددة.</p>
          </div>
          <div className="tw-header-actions">
            <button type="button" className="tw-btn tw-btn-outline" onClick={() => onNavigate(`/travelers/date/${encodeURIComponent(decodedDate)}`)}>العودة إلى الباقات</button>
            {user.permissions?.canCreateTravelers && <button type="button" className="tw-btn tw-btn-gold" onClick={() => onNavigate("/travelers/create")}>+ إضافة مسافر</button>}
          </div>
        </header>

        <TravelerSummaryCards date={decodedDate} packageItem={selectedPackage} travelers={travelersState.items} />

        {actionMessage && <div className="tw-inline-message">{actionMessage}</div>}

        <TravelerFilters
          search={search}
          nationality={nationality}
          status={status}
          travelers={travelersState.items}
          onSearchChange={setSearch}
          onNationalityChange={setNationality}
          onStatusChange={setStatus}
          onReset={() => {
            setSearch("");
            setNationality("");
            setStatus("");
          }}
        />

        {(travelersState.loading || packagesState.loading) && <LoadingGrid count={4} />}
        {(travelersState.error || packagesState.error) && (
          <StatePanel tone="danger" message={travelersState.error || packagesState.error || "تعذر تحميل البيانات، يرجى المحاولة مرة أخرى."} onRetry={() => {
            travelersState.retry();
            packagesState.retry();
          }} />
        )}
        {!travelersState.loading && !packagesState.loading && !travelersState.error && !packagesState.error && filteredTravelers.length === 0 && (
          <StatePanel message="لا يوجد مسافرون مسجلون في هذه الباقة" />
        )}
        {!travelersState.loading && !packagesState.loading && !travelersState.error && !packagesState.error && filteredTravelers.length > 0 && (
          <TravelersTable
            user={user}
            travelers={filteredTravelers}
            busyTripId={busyTripId}
            onNavigate={onNavigate}
            onStatusChange={(tripId, nextStatus) => void handleStatusChange(tripId, nextStatus)}
            onArchiveTrip={(tripId) => void handleArchiveTrip(tripId)}
          />
        )}
      </section>
    </TravelerWorkflowShell>
  );
}
