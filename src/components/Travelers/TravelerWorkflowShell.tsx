import type { ReactNode } from "react";
import type { AuthUser } from "../../api/auth";
import { SignedInSidebar } from "../Layout/SignedInSidebar";

type TravelerWorkflowShellProps = {
  user: AuthUser;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: ReactNode;
};

export function TravelerWorkflowShell({ user, activePath, onNavigate, onLogout, children }: TravelerWorkflowShellProps) {
  return (
    <div className="app-shell travelers-workflow-shell">
      <SignedInSidebar user={user} activePath={activePath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-panel travelers-workflow-main">{children}</main>
    </div>
  );
}

