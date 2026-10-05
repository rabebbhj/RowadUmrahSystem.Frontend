import type { AuthUser } from "../../../api/auth";
import { LoadingGrid, PackageTripCard, StatePanel, WorkflowHeader, formatDisplayDate } from "../../../components/Travelers/TravelerWorkflowUi";
import { TravelerWorkflowShell } from "../../../components/Travelers/TravelerWorkflowShell";
import { useDatePackages } from "../../../hooks/useDatePackages";

type DatePackagesPageProps = {
  user: AuthUser;
  activePath: string;
  dateId: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function DatePackagesPage({ user, activePath, dateId, onNavigate, onLogout }: DatePackagesPageProps) {
  const decodedDate = decodeURIComponent(dateId);
  const { items, loading, error, retry } = useDatePackages(decodedDate, onLogout);

  return (
    <TravelerWorkflowShell user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout}>
      <section className="tw-page">
        <WorkflowHeader
          title={`الرحلات المتاحة بتاريخ ${formatDisplayDate(decodedDate)}`}
          subtitle="اختر إحدى الباقات للاطلاع على المسافرين المسجلين في هذه الرحلة."
          actions={<button type="button" className="tw-btn tw-btn-outline" onClick={() => onNavigate("/travelers")}>العودة إلى التواريخ</button>}
        />

        {loading && <LoadingGrid count={2} />}
        {error && <StatePanel tone="danger" message={error} onRetry={retry} />}
        {!loading && !error && items.length === 0 && <StatePanel message="لا توجد باقات متاحة لهذا التاريخ" />}

        {!loading && !error && items.length > 0 && (
          <div className="tw-package-grid">
            {items.map((item) => (
              <PackageTripCard
                key={item.id}
                item={item}
                onOpen={() => onNavigate(`/travelers/date/${encodeURIComponent(decodedDate)}/package/${encodeURIComponent(item.id)}`)}
              />
            ))}
          </div>
        )}
      </section>
    </TravelerWorkflowShell>
  );
}
