import { useMemo, useState } from "react";
import type { AuthUser } from "../../../api/auth";
import { TravelDateCard, TravelDateFilters, LoadingGrid, StatePanel, WorkflowHeader } from "../../../components/Travelers/TravelerWorkflowUi";
import { TravelerWorkflowShell } from "../../../components/Travelers/TravelerWorkflowShell";
import { useTravelDates } from "../../../hooks/useTravelDates";

type TravelDatesPageProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function TravelDatesPage({ user, activePath, onNavigate, onLogout }: TravelDatesPageProps) {
  const { items, loading, error, retry } = useTravelDates(onLogout);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");

  const filteredDates = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = !searchValue ||
        item.departureDate.includes(searchValue) ||
        item.id.toLowerCase().includes(searchValue) ||
        item.weekday?.toLowerCase().includes(searchValue);
      const matchesMonth = !month || item.departureDate.startsWith(month);
      const matchesStatus = !status || item.status === status;

      return matchesSearch && matchesMonth && matchesStatus;
    });
  }, [items, month, search, status]);

  return (
    <TravelerWorkflowShell user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout}>
      <section className="tw-page">
        <WorkflowHeader
          title="إدارة المسافرين حسب تاريخ الرحلة"
          subtitle="اختر تاريخ الرحلة أولاً لعرض وإدارة المسافرين والبرامج المتاحة."
          actions={
            <>
              <button type="button" className="tw-btn tw-btn-gold" onClick={() => onNavigate("/trips/create")}>إنشاء رحلة جديدة</button>
              <button type="button" className="tw-btn tw-btn-outline" onClick={() => onNavigate("/trips")}>سجل الرحلات</button>
            </>
          }
        />

        <TravelDateFilters
          search={search}
          month={month}
          status={status}
          dates={items}
          onSearchChange={setSearch}
          onMonthChange={setMonth}
          onStatusChange={setStatus}
          onReset={() => {
            setSearch("");
            setMonth("");
            setStatus("");
          }}
        />

        {loading && <LoadingGrid />}
        {error && <StatePanel tone="danger" message={error} onRetry={retry} />}
        {!loading && !error && filteredDates.length === 0 && <StatePanel message="لا توجد رحلات متاحة حالياً" />}

        {!loading && !error && filteredDates.length > 0 && (
          <div className="tw-date-grid">
            {filteredDates.map((item) => (
              <TravelDateCard
                key={item.id}
                item={item}
                onClick={() => onNavigate(`/travelers/date/${encodeURIComponent(item.id)}`)}
              />
            ))}
          </div>
        )}
      </section>
    </TravelerWorkflowShell>
  );
}
