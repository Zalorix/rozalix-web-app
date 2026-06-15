"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "./client-context";
import { listLeads } from "./store";
import { listConversations } from "./assistant-store";

export interface NavBadge {
  count: number;
  /** Urgent badges render red (needs action), others are subtle counts. */
  urgent?: boolean;
}

/**
 * Live "needs attention" counts for the sidebar, scoped to the active client.
 * Polls so escalations / new leads surface in near-real-time. Keyed by href.
 */
export function useNavBadges(): Record<string, NavBadge> {
  const { client } = useWorkspace();
  const [badges, setBadges] = useState<Record<string, NavBadge>>({});

  useEffect(() => {
    if (!client) {
      setBadges({});
      return;
    }
    let active = true;
    const load = async () => {
      const [leads, convos] = await Promise.all([
        listLeads(client.id),
        listConversations(client.id),
      ]);
      if (!active) return;
      setBadges({
        "/leads": { count: leads.filter((l) => l.status === "new").length },
        "/conversations": {
          count: convos.filter((c) => c.status === "escalated").length,
          urgent: true,
        },
      });
    };
    load();
    const id = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [client]);

  return badges;
}
