import { useMemo, type FormEvent } from "react";
import type { AuthUser } from "../../api/auth";
import type { TravelerListItem } from "../../api/travelers";
import { formatDateTime } from "../../utils/dates";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type DashboardPanelProps = {
  user: AuthUser;
  activePath: string;
  searchInput: string;
  searchTerm: string;
  loading: boolean;
  error: string | null;
  travelers: TravelerListItem[];
  onNavigate: (path: string) => void;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResetSearch: () => void;
  onLogout: () => void;
};

export function DashboardPanel({
  user,
  activePath,
  searchInput,
  searchTerm,
  loading,
  error,
  travelers,
  onNavigate,
  onSearchInputChange,
  onSearchSubmit,
  onResetSearch,
  onLogout
}: DashboardPanelProps) {
  const stats = useMemo(() => {
    const total = travelers.length;
    const blocked = travelers.filter((item) => item.isBlocked).length;
    const deleted = travelers.filter((item) => item.isDeleted).length;

    return { total, blocked, deleted };
  }, [travelers]);

  return (
    <div className="app-shell">
      <SignedInSidebar
        user={user}
        activePath={activePath}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="main-panel">
        <header className="hero">
          <div>
            <span className="eyebrow">Dashboard React</span>
            <h2>Travelers</h2>
            <p>
              This is the first screen migrated to React. The backend still owns
              the database, Identity and business rules.
            </p>
          </div>

          <form className="search-bar" onSubmit={onSearchSubmit}>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              placeholder="Search by name, passport or phone"
            />
            <button type="submit">Search</button>
            <button type="button" className="ghost" onClick={onResetSearch}>
              Reset
            </button>
          </form>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <span>Total</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="stat-card">
            <span>Blocked</span>
            <strong>{stats.blocked}</strong>
          </article>
          <article className="stat-card">
            <span>Deleted</span>
            <strong>{stats.deleted}</strong>
          </article>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <h3>API results</h3>
            <span>{searchTerm ? `Filter: ${searchTerm}` : "All travelers"}</span>
          </div>

          {loading && <div className="state-box">Loading...</div>}

          {!loading && error && <div className="state-box error">{error}</div>}

          {!loading && !error && travelers.length === 0 && (
            <div className="state-box">No travelers found.</div>
          )}

          {!loading && !error && travelers.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Passport</th>
                    <th>Nationality</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Umrah</th>
                    <th>Trips</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {travelers.map((traveler) => (
                    <tr key={traveler.id}>
                      <td>
                        <strong>{traveler.fullName}</strong>
                      </td>
                      <td>{traveler.passportNumber}</td>
                      <td>{traveler.nationality}</td>
                      <td>{traveler.phoneNumber}</td>
                      <td>
                        <span className={traveler.isBlocked ? "pill danger" : "pill success"}>
                          {traveler.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td>{traveler.umrahCount}</td>
                      <td>{traveler.tripCount}</td>
                      <td>{formatDateTime(traveler.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="content-card mini-grid">
          <div>
            <h3>Migration scope</h3>
            <ul>
              <li>Login page</li>
              <li>Travelers page</li>
              <li>Trips page</li>
              <li>Users page</li>
            </ul>
          </div>

          <div>
            <h3>Backend routes</h3>
            <pre>/api/auth/me
/api/auth/login
/api/auth/logout
/api/travelers</pre>
          </div>
        </section>
      </main>
    </div>
  );
}
