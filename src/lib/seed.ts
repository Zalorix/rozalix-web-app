import type { Client, User, Lead, ContentPage } from "./types";

// ============================================================
// Seed data for the static demo.
//
// Two clients with DIFFERENT contact forms prove the CRM is generic:
//   • Rozalix (web studio)      → projectType, budget, company
//   • Petal & Stem (florist)    → eventType, eventDate, guestCount, venue
//
// Same Lead type, same components — only each client's `formSchema`
// differs. When the Express/Neon backend lands, this file is deleted
// and the store reads from the API instead.
// ============================================================

export const CLIENTS: Client[] = [
  {
    id: "rozalix-landing",
    name: "Rozalix",
    domain: "rozalix.com",
    initials: "RX",
    accent: "#4F46E5",
    formSchema: [
      {
        key: "projectType",
        label: "Project type",
        type: "select",
        options: ["New website", "Web app", "Redesign", "Other"],
        inTable: true,
        filterable: true,
      },
      {
        key: "budget",
        label: "Budget range",
        type: "select",
        options: [
          "Not sure yet",
          "Launch — from ₱15,000",
          "Business — from ₱25,000",
          "Growth — from ₱35,000",
          "E-commerce — from ₱60,000",
          "Custom — ₱120,000+",
        ],
        inTable: true,
      },
      { key: "company", label: "Company", type: "text" },
    ],
  },
  {
    id: "petal-and-stem",
    name: "Petal & Stem",
    domain: "petalandstem.ph",
    initials: "PS",
    accent: "#DB2777",
    formSchema: [
      {
        key: "eventType",
        label: "Event type",
        type: "select",
        options: ["Wedding", "Corporate", "Birthday", "Funeral", "Other"],
        inTable: true,
        filterable: true,
      },
      { key: "eventDate", label: "Event date", type: "date", inTable: true },
      { key: "guestCount", label: "Guest count", type: "number", inTable: true },
      { key: "venue", label: "Venue", type: "text" },
    ],
  },
];

export const USERS: User[] = [
  {
    id: "u_rozalix_owner",
    clientId: "rozalix-landing",
    name: "Dorben Rozal",
    email: "demo@rozalix.com",
    role: "owner",
  },
];

/** Demo credentials shown on the login screen. */
export const DEMO_LOGIN = { email: "demo@rozalix.com", password: "rozalix" };

const CURATED_LEADS: Lead[] = [
  // ---- Rozalix (web studio) ----
  {
    id: "ld_1042",
    clientId: "rozalix-landing",
    firstName: "Marites",
    lastName: "Bautista",
    email: "marites@brewandbloom.ph",
    phone: "+639171234567",
    message:
      "We're opening a second branch and need an online store for our beans and merch. Hoping to launch before the holidays.",
    fields: {
      projectType: "New website",
      budget: "E-commerce — from ₱60,000",
      company: "Brew & Bloom Café",
    },
    status: "new",
    createdAt: "2026-06-14T02:14:00.000Z",
    notes: "",
  },
  {
    id: "ld_1041",
    clientId: "rozalix-landing",
    firstName: "Andre",
    lastName: "Villanueva",
    email: "andre.v@northpoint.com",
    phone: "+639189988776",
    message:
      "Our current site looks dated and doesn't convert. We'd like a redesign that feels premium and builds trust with enterprise clients.",
    fields: {
      projectType: "Redesign",
      budget: "Growth — from ₱35,000",
      company: "Northpoint Advisory",
    },
    status: "contacted",
    createdAt: "2026-06-12T08:40:00.000Z",
    notes: "Sent intro deck + pricing. Follow up Monday.",
  },
  {
    id: "ld_1040",
    clientId: "rozalix-landing",
    firstName: "Joy",
    lastName: "Santos",
    email: "",
    phone: "+639172223344",
    message:
      "Looking for a partner to build a budgeting web app MVP. Need someone who can handle both design and front-end.",
    fields: {
      projectType: "Web app",
      budget: "Custom — ₱120,000+",
      company: "Sapling Finance",
    },
    status: "qualified",
    createdAt: "2026-06-10T11:05:00.000Z",
    notes: "Scope call done. Drafting proposal — likely 8-10 week build.",
  },
  {
    id: "ld_1039",
    clientId: "rozalix-landing",
    firstName: "Marcus",
    lastName: "Lim",
    email: "marcus@stockflow.io",
    phone: "+639163334455",
    message:
      "We need a marketing site + dashboard refresh for our inventory SaaS. Big fan of your StockFlow case study.",
    fields: {
      projectType: "Web app",
      budget: "Custom — ₱120,000+",
      company: "StockFlow",
    },
    status: "won",
    createdAt: "2026-06-05T03:22:00.000Z",
    notes: "Signed! Kickoff scheduled. Deposit received.",
  },
  {
    // Matches the booked web-chat conversation (cv_5001) by phone — shows the
    // CRM ↔ conversation linkage out of the box.
    id: "ld_1043",
    clientId: "rozalix-landing",
    firstName: "Paolo",
    lastName: "",
    email: "",
    phone: "+639176665544",
    message:
      "Need a new site for my coffee shop with online ordering. Booked a call to scope it.",
    fields: {
      projectType: "New website",
      budget: "E-commerce — from ₱60,000",
      company: "Bean There Café",
    },
    status: "qualified",
    createdAt: "2026-06-14T01:11:00.000Z",
    notes: "Source: AI web chat. Booked a call.",
  },
  {
    id: "ld_1037",
    clientId: "rozalix-landing",
    firstName: "Kenneth",
    lastName: "Tan",
    email: "ken@oldmillco.com",
    phone: "+639991112233",
    message: "Need a quick landing page for a product launch in 3 weeks. Is that doable?",
    fields: {
      projectType: "Other",
      budget: "Launch — from ₱15,000",
      company: "Old Mill Co.",
    },
    status: "lost",
    createdAt: "2026-05-28T06:10:00.000Z",
    notes: "Timeline too tight + budget mismatch. Politely declined.",
  },

  // ---- Petal & Stem (florist) — completely different fields ----
  {
    id: "ld_2055",
    clientId: "petal-and-stem",
    firstName: "Camille",
    lastName: "Reyes",
    email: "camille.reyes@gmail.com",
    phone: "+639175558822",
    message:
      "Getting married next spring! Dreaming of a garden-style ceremony with lots of white and blush blooms. Can you do full styling?",
    fields: {
      eventType: "Wedding",
      eventDate: "2027-03-20",
      guestCount: 140,
      venue: "Tagaytay Highlands",
    },
    status: "qualified",
    createdAt: "2026-06-13T05:30:00.000Z",
    notes: "Sent mood board. Loves peonies + ranunculus.",
  },
  {
    id: "ld_2054",
    clientId: "petal-and-stem",
    firstName: "Diego",
    lastName: "Mercado",
    email: "diego@auragroup.ph",
    phone: "+639170012345",
    message:
      "We need centerpieces and a stage installation for our annual gala. Brand colors are navy and gold.",
    fields: {
      eventType: "Corporate",
      eventDate: "2026-08-15",
      guestCount: 300,
      venue: "Marriott Grand Ballroom",
    },
    status: "new",
    createdAt: "2026-06-11T09:12:00.000Z",
    notes: "",
  },
  {
    id: "ld_2053",
    clientId: "petal-and-stem",
    firstName: "Liza",
    lastName: "Ong",
    email: "liza.ong@outlook.com",
    phone: "+639178887766",
    message:
      "Planning a surprise 60th birthday for my mom. She loves sunflowers and bright, cheerful arrangements.",
    fields: {
      eventType: "Birthday",
      eventDate: "2026-07-04",
      guestCount: 45,
      venue: "Private residence, Alabang",
    },
    status: "won",
    createdAt: "2026-06-08T13:05:00.000Z",
    notes: "Booked! 50% deposit paid. Delivery 8 AM.",
  },
];

// ============================================================
// Bulk synthetic leads so the table has enough rows to paginate.
// Deterministic (index-driven, fixed base date) so the data is stable
// across reloads. Deleted with the rest of seed.ts once the backend lands.
// ============================================================

const FIRST_NAMES = [
  "Aria", "Ben", "Carlo", "Dana", "Elias", "Faye", "Gio", "Hannah", "Ivan",
  "Jenna", "Kyle", "Lara", "Migs", "Nina", "Owen", "Pia", "Rico", "Sam",
  "Tania", "Uri", "Vince", "Wendy", "Xavier", "Yna", "Zach", "Bella", "Caleb",
  "Dom", "Ella", "Franco",
];
const LAST_NAMES = [
  "Cruz", "Reyes", "Santos", "Garcia", "Mendoza", "Torres", "Flores", "Ramos",
  "Aquino", "Castro", "Navarro", "Domingo", "Salazar", "Valdez", "Ocampo",
  "Padilla", "Rivera", "Gallego", "Bautista", "Esguerra",
];
const COMPANIES = [
  "Brightleaf Co.", "Harbor & Co.", "Mango Studio", "Northwind", "Lumen Labs",
  "Cedar & Pine", "Tidal Apps", "Verdant", "Atlas Realty", "Pebble", "",
];
const ROZALIX_MESSAGES = [
  "Looking for a new site for my business — can you share what's possible?",
  "We need a redesign; the current site feels dated and doesn't convert.",
  "Interested in an online store with local payment options.",
  "Want to build a simple booking web app for my clinic.",
  "Need a quick landing page for an upcoming product launch.",
  "Our startup needs a marketing site plus a dashboard refresh.",
];
const VENUES = [
  "Tagaytay Highlands", "Marriott Grand Ballroom", "Blue Leaf Events",
  "The Glass Garden", "Shangri-La BGC", "Private residence, Alabang",
  "Fernwood Gardens", "Manila House",
];
const EVENT_TYPES = ["Wedding", "Corporate", "Birthday", "Funeral", "Other"];
const PETAL_MESSAGES = [
  "Planning my wedding and dreaming of soft, romantic florals.",
  "Need centerpieces and a stage installation for our annual gala.",
  "Organizing a milestone birthday — want bright, cheerful arrangements.",
  "Looking for elegant sympathy flowers for a memorial.",
  "Corporate launch event — branded floral styling needed.",
];
const STATUS_CYCLE: Lead["status"][] = [
  "new", "new", "contacted", "contacted", "qualified", "won", "lost", "new",
];

// Match the Rozalix formSchema options.
const projectTypes = ["New website", "Web app", "Redesign", "Other"];
const budgets = [
  "Not sure yet",
  "Launch — from ₱15,000",
  "Business — from ₱25,000",
  "Growth — from ₱35,000",
  "E-commerce — from ₱60,000",
  "Custom — ₱120,000+",
];

const BASE_MS = Date.parse("2026-06-13T20:00:00.000Z");

function phoneFor(i: number): string {
  return `+639${String(180000000 + i).padStart(9, "0")}`;
}

function makeRozalixLeads(count: number): Lead[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const hasEmail = i % 5 !== 0;
    return {
      id: `ld_g${1100 + i}`,
      clientId: "rozalix-landing",
      firstName: first,
      lastName: last,
      email: hasEmail
        ? `${first}.${last}${i}`.toLowerCase() + "@example.com"
        : "",
      phone: phoneFor(i),
      message: ROZALIX_MESSAGES[i % ROZALIX_MESSAGES.length],
      fields: {
        projectType: projectTypes[i % projectTypes.length],
        budget: budgets[(i * 2) % budgets.length],
        company: COMPANIES[(i * 5) % COMPANIES.length],
      },
      status: STATUS_CYCLE[i % STATUS_CYCLE.length],
      createdAt: new Date(BASE_MS - i * 7.5 * 3600_000).toISOString(),
      notes: "",
    };
  });
}

function makePetalLeads(count: number): Lead[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 5) % LAST_NAMES.length];
    const day = String(((i * 3) % 27) + 1).padStart(2, "0");
    const month = String((i % 6) + 7).padStart(2, "0");
    return {
      id: `ld_pg${2100 + i}`,
      clientId: "petal-and-stem",
      firstName: first,
      lastName: last,
      email: i % 4 !== 0 ? `${first}${i}`.toLowerCase() + "@example.com" : "",
      phone: phoneFor(500 + i),
      message: PETAL_MESSAGES[i % PETAL_MESSAGES.length],
      fields: {
        eventType: EVENT_TYPES[i % EVENT_TYPES.length],
        eventDate: `2026-${month}-${day}`,
        guestCount: 30 + ((i * 17) % 270),
        venue: VENUES[(i * 3) % VENUES.length],
      },
      status: STATUS_CYCLE[(i + 2) % STATUS_CYCLE.length],
      createdAt: new Date(BASE_MS - i * 9 * 3600_000).toISOString(),
      notes: "",
    };
  });
}

export const LEADS: Lead[] = [
  ...CURATED_LEADS,
  ...makeRozalixLeads(44),
  ...makePetalLeads(16),
];

const TERMS_BODY = `_Last updated: June 15, 2026_

## 1. Overview
These Terms of Service govern your use of the websites and services provided by Rozalix ("we", "us"). By engaging our services or using our website, you agree to these terms.

## 2. Services
We design and build websites and web applications. The specific scope, deliverables, and timeline for each project are defined in a separate written proposal or statement of work.

## 3. Pricing & Payment
Project pricing is quoted per engagement. Unless otherwise agreed, a deposit is due before work begins, with the balance due on delivery. Care plans are billed monthly and may be cancelled with 30 days' notice.

## 4. Revisions
Each project includes a defined number of revision rounds as stated in your proposal. Additional revisions are billed at our standard hourly rate.

## 5. Intellectual Property
Upon receipt of full payment, ownership of the final deliverables transfers to you. We retain the right to display the work in our portfolio unless otherwise agreed in writing.

## 6. Warranties & Liability
We deliver our work with reasonable skill and care. To the maximum extent permitted by law, our total liability for any claim is limited to the fees paid for the relevant project.

## 7. Termination
Either party may terminate an engagement with written notice. You remain responsible for fees for work completed up to the termination date.

## 8. Governing Law
These terms are governed by the laws of the Republic of the Philippines.`;

const PRIVACY_BODY = `_Last updated: June 15, 2026_

## 1. Information We Collect
We collect information you provide directly — such as your name, email, phone number, and project details when you submit our contact form — as well as basic analytics about how you use our site.

## 2. How We Use Information
We use your information to respond to enquiries, prepare proposals, deliver our services, and improve our website. We do not sell your personal data.

## 3. Cookies
We use cookies and similar technologies to understand site usage and improve performance. You can disable cookies in your browser settings.

## 4. Sharing
We share information only with service providers who help us operate (such as hosting and analytics), and only as needed to deliver our services.

## 5. Data Retention
We retain enquiry and project records for as long as necessary to provide our services and meet legal obligations.

## 6. Your Rights
You may request access to, correction of, or deletion of your personal data at any time by contacting us.

## 7. Security
We use reasonable technical and organisational measures to protect your information.

## 8. Contact
Questions about this policy can be sent to privacy@rozalix.com.`;

export const CONTENT_PAGES: ContentPage[] = [
  {
    id: "pg_terms",
    clientId: "rozalix-landing",
    slug: "terms",
    title: "Terms of Service",
    body: TERMS_BODY,
    status: "published",
    updatedAt: "2026-06-15T00:00:00.000Z",
  },
  {
    id: "pg_privacy",
    clientId: "rozalix-landing",
    slug: "privacy",
    title: "Privacy Policy",
    body: PRIVACY_BODY,
    status: "published",
    updatedAt: "2026-06-15T00:00:00.000Z",
  },
  {
    id: "pg_ps_terms",
    clientId: "petal-and-stem",
    slug: "terms",
    title: "Terms of Service",
    body: `_Last updated: June 15, 2026_

## 1. Bookings
A signed agreement and 50% deposit confirm your event date. Dates are held for 5 days pending deposit.

## 2. Final Numbers
Final guest counts and arrangement quantities are due 14 days before the event.

## 3. Substitutions
Fresh flowers are seasonal. We reserve the right to substitute blooms of equal value and style when specific varieties are unavailable.

## 4. Cancellations
Deposits are non-refundable. Cancellations within 14 days of the event are charged in full.`,
    status: "published",
    updatedAt: "2026-06-15T00:00:00.000Z",
  },
];
