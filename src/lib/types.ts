// ============================================================
// Domain types — shared across CRM + CMS.
//
// These mirror the shapes the future Express/Neon API will return,
// so swapping the mock store for real fetches is a drop-in change.
// Every record is scoped by `clientId` for multi-tenant isolation.
// ============================================================

// ---------------------------- Form schema ----------------------------

export type FieldType = "text" | "textarea" | "number" | "select" | "date";

/** A primitive value captured by a contact-form field. */
export type FieldValue = string | number;

/**
 * One client-specific contact-form field. The same definition drives
 * three things, so the form and the CRM never drift:
 *   1. how the field renders on the client's website form,
 *   2. how it's labelled/ordered in the lead drawer,
 *   3. whether it appears as a column / filter in the leads table.
 *
 * Authored when we build the client's site; stored per client.
 */
export interface FieldDef {
  /** Key used inside `Lead.fields`, e.g. "budget". */
  key: string;
  /** Human label, e.g. "Budget range". */
  label: string;
  type: FieldType;
  /** Options for `type: "select"`. */
  options?: string[];
  /** Show as a column in the leads table. */
  inTable?: boolean;
  /** Offer as a filter in the leads table. */
  filterable?: boolean;
}

// ---------------------------- Tenant ----------------------------

/** A Rozalix client = one website we built + their dashboard tenant. */
export interface Client {
  id: string;
  name: string;
  /** Primary domain of their live site (where the contact form lives). */
  domain: string;
  /** Short brand initials for the avatar mark (fallback when no logo). */
  initials: string;
  /** Brand accent (defaults to Rozalix indigo). */
  accent: string;
  /** Brand logo — image URL / data URL shown as the account avatar. */
  logo?: string;
  /** The custom fields this client's contact form collects. */
  formSchema: FieldDef[];
}

/** A dashboard user. In the static demo, each user belongs to one client. */
export interface User {
  id: string;
  clientId: string;
  name: string;
  email: string;
  role: "owner" | "editor";
}

// ---------------------------- CRM ----------------------------

export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
];

/**
 * A lead = one contact-form submission from the client's website.
 *
 * Core fields (name, email, phone, message) are guaranteed for every
 * client, so search, dedupe and "email this lead" always work. Everything
 * client-specific lives in `fields`, described by the client's formSchema.
 * `status` is CRM-owned and never comes from the form.
 */
export interface Lead {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  /** Client-specific answers, keyed by FieldDef.key. */
  fields: Record<string, FieldValue>;
  status: LeadStatus;
  /** ISO timestamp of submission. */
  createdAt: string;
  /** Internal notes added from the dashboard. */
  notes: string;
}

// ---------------------------- CMS ----------------------------

export type ContentStatus = "draft" | "published";

/**
 * An editable content page (Terms, Privacy, etc.). The client's website
 * reads the published `body` for each slug instead of hardcoding JSX.
 */
export interface ContentPage {
  id: string;
  clientId: string;
  /** URL slug on the live site, e.g. "terms", "privacy". */
  slug: string;
  title: string;
  /** Markdown-ish body. Rendered to the live legal page. */
  body: string;
  status: ContentStatus;
  updatedAt: string;
}
