"use client";

import { createContext, useContext } from "react";
import type { Client } from "./types";

// ============================================================
// Workspace = the client (tenant) the dashboard is currently viewing,
// plus the set of clients the user is allowed to switch between.
//
// A normal client login sees exactly one client here. A Rozalix
// super-admin (and the demo) sees several and can switch between them —
// each switch just re-scopes every query by the active client id.
// ============================================================

interface Workspace {
  client: Client | null;
  clients: Client[];
  setActiveClientId: (id: string) => void;
  /** Re-fetch clients (e.g. after editing the brand logo in Settings). */
  refreshClients: () => Promise<void>;
}

const WorkspaceContext = createContext<Workspace | null>(null);

export function WorkspaceProvider({
  value,
  children,
}: {
  value: Workspace;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): Workspace {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

/** Convenience: the active client only. */
export function useCurrentClient(): Client | null {
  return useWorkspace().client;
}
