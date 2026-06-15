"use client";

import { useState } from "react";
import {
  Globe,
  Mail,
  Code2,
  RotateCcw,
  Copy,
  Check,
  Table2,
  MessageSquare,
  ImagePlus,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/client-context";
import { resetStore, updateClient } from "@/lib/store";
import { readAvatar } from "@/lib/image";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { InstallButton } from "@/components/pwa/InstallButton";

export default function SettingsPage() {
  const { user } = useAuth();
  const { client, refreshClients } = useWorkspace();

  async function onLogoUpload(file: File) {
    if (!client) return;
    const logo = await readAvatar(file, 96);
    await updateClient(client.id, { logo });
    await refreshClients();
  }

  async function removeLogo() {
    if (!client) return;
    await updateClient(client.id, { logo: "" });
    await refreshClients();
  }
  const [copied, setCopied] = useState(false);
  const [widgetCopied, setWidgetCopied] = useState(false);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://app.rozalix.com";
  const widgetSnippet = `<script
  src="${origin}/embed.js"
  data-rozalix-key="${client?.id ?? "your-client-id"}"
  async
></script>`;

  async function copyWidget() {
    await navigator.clipboard.writeText(widgetSnippet);
    setWidgetCopied(true);
    setTimeout(() => setWidgetCopied(false), 1800);
  }

  const snippet = `// Wire your contact form to the Rozalix CRM (future API)
await fetch("https://api.rozalix.com/v1/leads", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Client-Id": "${client?.id ?? "your-client-id"}",
  },
  body: JSON.stringify(formValues),
});`;

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function reset() {
    if (
      window.confirm(
        "Reset demo data? This restores the seeded leads and content.",
      )
    ) {
      resetStore();
      window.location.href = "/dashboard";
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Account */}
      <Card>
        <CardHeader title="Account" />
        <div className="flex items-center gap-4 px-5 py-5">
          <Avatar
            size="lg"
            initials={(user?.name ?? "?")
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          />
          <div>
            <div className="font-semibold">{user?.name}</div>
            <div className="text-sm text-[var(--color-slate-500)]">
              {user?.email}
            </div>
          </div>
          <span className="ml-auto rounded-[var(--radius-pill)] bg-[var(--color-slate-100)] px-3 py-1 text-[12px] font-semibold text-[var(--color-slate-500)] capitalize">
            {user?.role}
          </span>
        </div>
      </Card>

      {/* Brand logo */}
      <Card>
        <CardHeader title="Brand logo" />
        <div className="flex flex-wrap items-center gap-4 px-5 py-5">
          <Avatar
            size="lg"
            initials={client?.initials ?? "··"}
            accent={client?.accent}
            image={client?.logo}
          />
          <p className="min-w-[180px] flex-1 text-sm text-[var(--color-slate-500)]">
            Your account avatar in the dashboard. A square image works best;
            otherwise we show your initials.
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-slate-200)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-slate-700)] transition-colors hover:border-[var(--color-slate-300)] hover:bg-[var(--color-slate-50)]">
            <ImagePlus className="size-4" /> Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onLogoUpload(file);
                e.target.value = "";
              }}
            />
          </label>
          {client?.logo && (
            <Button variant="secondary" onClick={removeLogo}>
              Remove
            </Button>
          )}
        </div>
      </Card>

      {/* Website */}
      <Card>
        <CardHeader title="Website" />
        <div className="divide-y divide-[var(--color-slate-100)]">
          <Row icon={<Globe className="size-[18px]" />} label="Domain">
            <a
              href={`https://${client?.domain}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--color-indigo)] hover:underline"
            >
              {client?.domain}
            </a>
          </Row>
          <Row icon={<Mail className="size-[18px]" />} label="Lead notifications">
            <span className="font-medium">{user?.email}</span>
          </Row>
        </div>
      </Card>

      {/* Contact form fields — the schema that drives the whole CRM */}
      <Card>
        <CardHeader
          title="Contact form fields"
          action={
            <span className="text-[13px] text-[var(--color-slate-400)]">
              {client?.formSchema.length ?? 0} custom + 4 core
            </span>
          }
        />
        <div className="px-5 py-4">
          <p className="mb-4 text-sm text-[var(--color-slate-500)]">
            These are the fields your website&apos;s form collects. Core fields
            are always captured; custom fields are specific to your site and
            drive your leads table and filters.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Name", "Email", "Phone", "Message"].map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-slate-100)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-slate-600)]"
              >
                {f}
                <span className="text-[11px] text-[var(--color-slate-400)]">
                  core
                </span>
              </span>
            ))}
            {client?.formSchema.map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-indigo-50)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-indigo-deeper)]"
              >
                {f.label}
                <span className="text-[11px] opacity-60">{f.type}</span>
                {f.inTable && (
                  <Table2 className="size-3.5 opacity-60" aria-label="Shown in table" />
                )}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Install the chat widget */}
      <Card>
        <CardHeader
          title="Install the chat widget"
          action={
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-indigo)]">
              <MessageSquare className="size-4" /> Live
            </span>
          }
        />
        <div className="space-y-4 px-5 py-5">
          <p className="text-sm text-[var(--color-slate-500)]">
            Paste this snippet just before <code>&lt;/body&gt;</code> on any page
            of your website. The AI receptionist appears as a chat bubble, and
            every conversation flows into your dashboard.
          </p>
          <div className="relative">
            <pre className="scroll-slim overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-ink-900)] px-4 py-4 font-[var(--font-mono)] text-[12.5px] leading-relaxed text-[#E2E8F0]">
              <code>{widgetSnippet}</code>
            </pre>
            <button
              onClick={copyWidget}
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-white/10 px-2.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/20"
            >
              {widgetCopied ? (
                <>
                  <Check className="size-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copy
                </>
              )}
            </button>
          </div>
          <p className="flex items-start gap-2 text-[13px] text-[var(--color-slate-400)]">
            <Code2 className="mt-0.5 size-4 shrink-0" />
            Works on any site — no framework needed. Configure the agent&apos;s
            name, icon, knowledge, and availability under{" "}
            <span className="font-medium text-[var(--color-slate-500)]">
              Assistant
            </span>
            .
          </p>
        </div>
      </Card>

      {/* Install the dashboard as an app */}
      <Card>
        <CardHeader title="Install this dashboard" />
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <p className="min-w-[200px] flex-1 text-sm text-[var(--color-slate-500)]">
            Add Rozalix to your phone&apos;s home screen to open it full-screen
            like an app — and (soon) get push alerts when a new lead or chat
            comes in.
          </p>
          <InstallButton />
        </div>
      </Card>

      {/* Integration */}
      <Card>
        <CardHeader
          title="Connect your contact form"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-warning-soft)] px-2.5 py-1 text-[12px] font-semibold text-[#B45309]">
              Coming soon
            </span>
          }
        />
        <div className="space-y-4 px-5 py-5">
          <p className="text-sm text-[var(--color-slate-500)]">
            Once the Rozalix API is live, your website&apos;s contact form will
            POST submissions straight into Leads. Here&apos;s the call your site
            will make:
          </p>
          <div className="relative">
            <pre className="scroll-slim overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-ink-900)] px-4 py-4 font-[var(--font-mono)] text-[12.5px] leading-relaxed text-[#E2E8F0]">
              <code>{snippet}</code>
            </pre>
            <button
              onClick={copy}
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-white/10 px-2.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/20"
            >
              {copied ? (
                <>
                  <Check className="size-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copy
                </>
              )}
            </button>
          </div>
          <p className="flex items-start gap-2 text-[13px] text-[var(--color-slate-400)]">
            <Code2 className="mt-0.5 size-4 shrink-0" />
            Lead fields already match your live form, so this is a drop-in once
            the backend ships.
          </p>
        </div>
      </Card>

      {/* Danger / demo */}
      <Card>
        <CardHeader title="Demo data" />
        <div className="flex items-center justify-between gap-4 px-5 py-5">
          <p className="text-sm text-[var(--color-slate-500)]">
            Restore the seeded leads and content to their original state.
          </p>
          <Button variant="secondary" onClick={reset}>
            <RotateCcw className="size-4" /> Reset
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 text-sm">
      <span className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-slate-100)] text-[var(--color-slate-400)]">
        {icon}
      </span>
      <span className="w-40 shrink-0 text-[var(--color-slate-500)]">
        {label}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}
