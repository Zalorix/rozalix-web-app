"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { listClients } from "@/lib/store";
import { WorkspaceProvider } from "@/lib/client-context";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Spinner } from "@/components/ui/EmptyState";
import type { Client } from "@/lib/types";

const ACTIVE_KEY = "rzx.activeClient";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auth guard — bounce to login once we know there's no session.
  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  // Load the clients this user can open, and resolve the active one.
  useEffect(() => {
    if (!user) return;
    listClients().then((list) => {
      setClients(list);
      const stored = window.localStorage.getItem(ACTIVE_KEY);
      const valid = stored && list.some((c) => c.id === stored) ? stored : null;
      setActiveId(valid ?? user.clientId);
    });
  }, [user]);

  function setActiveClientId(id: string) {
    setActiveId(id);
    window.localStorage.setItem(ACTIVE_KEY, id);
  }

  async function refreshClients() {
    setClients(await listClients());
  }

  const client = clients.find((c) => c.id === activeId) ?? null;

  const workspace = useMemo(
    () => ({ client, clients, setActiveClientId, refreshClients }),
    [client, clients],
  );

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <WorkspaceProvider value={workspace}>
      {/* Fixed-viewport shell: the window never scrolls — each page scrolls
          its own content (or just its table). */}
      <div className="flex h-dvh overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden h-dvh lg:block">
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-[var(--color-ink-900)]/40"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute inset-y-0 left-0">
              <Sidebar onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar client={client} onMenu={() => setDrawerOpen(true)} />
          <main className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
              {children}
            </div>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
