import type {
  Conversation,
  KnowledgeEntry,
  AssistantRules,
  Availability,
  Booking,
} from "./assistant-types";

// ============================================================
// Seed data for the AI receptionist demo, for both clients.
// Deleted once the Express/Neon backend owns this.
// ============================================================

export const KNOWLEDGE: KnowledgeEntry[] = [
  // ---- Rozalix (web studio) ----
  {
    id: "kb_rzx_pricing",
    clientId: "rozalix-landing",
    topic: "Pricing",
    keywords: ["price", "pricing", "cost", "how much", "budget", "rates", "quote"],
    answer:
      "Our website projects start at ₱15,000 for a Launch site, ₱25,000 for Business, and ₱35,000 for Growth. E-commerce starts at ₱60,000, and custom builds are ₱120,000+. The exact quote depends on scope — happy to put together a tailored one.",
  },
  {
    id: "kb_rzx_timeline",
    clientId: "rozalix-landing",
    topic: "Timeline",
    keywords: ["how long", "timeline", "turnaround", "when", "fast", "deadline"],
    answer:
      "A typical Launch site takes 1–2 weeks, and larger builds 3–6 weeks depending on content and revisions. If you have a hard deadline, let us know and we'll tell you honestly if it's doable.",
  },
  {
    id: "kb_rzx_services",
    clientId: "rozalix-landing",
    topic: "Services",
    keywords: ["services", "what do you do", "offer", "build", "design", "web app"],
    answer:
      "We design and build websites and web apps — marketing sites, e-commerce, redesigns, and custom dashboards. Every site comes with a CRM + CMS dashboard so you own your leads and content.",
  },
  // ---- Petal & Stem (florist) ----
  {
    id: "kb_ps_pricing",
    clientId: "petal-and-stem",
    topic: "Pricing",
    keywords: ["price", "pricing", "cost", "how much", "budget", "package"],
    answer:
      "Wedding florals start at ₱45,000 for full styling; centerpieces and event arrangements are quoted per event. Final pricing depends on your guest count, venue, and bloom choices.",
  },
  {
    id: "kb_ps_delivery",
    clientId: "petal-and-stem",
    topic: "Delivery & setup",
    keywords: ["delivery", "setup", "venue", "deliver", "install"],
    answer:
      "We deliver and set up on-site across Metro Manila and Tagaytay. Delivery is included for events over ₱20,000; smaller orders have a delivery fee based on distance.",
  },
  {
    id: "kb_ps_booking",
    clientId: "petal-and-stem",
    topic: "Booking & deposit",
    keywords: ["book", "reserve", "deposit", "secure", "date", "available"],
    answer:
      "A signed agreement and 50% deposit confirm your event date. We hold dates for 5 days while you decide. Final guest counts are due 14 days before the event.",
  },
];

export const RULES: AssistantRules[] = [
  {
    clientId: "rozalix-landing",
    agentName: "Rio",
    agentIcon: "🤖",
    greeting:
      "Hi! 👋 Thanks for visiting Rozalix. I can answer questions about our websites and pricing, or book you a quick call with the team. What are you working on?",
    persona:
      "Friendly, sharp, and helpful — like a knowledgeable studio rep. Concise. Never pushy.",
    businessHours: "Mon–Fri, 9 AM – 6 PM",
    neverDo: [
      "Never quote a price that isn't in the knowledge base.",
      "Never promise a delivery date without the team confirming.",
      "Never ask for payment details in chat.",
    ],
    escalateKeywords: ["human", "agent", "real person", "call me now", "complaint", "refund"],
    maxAiMessages: 12,
  },
  {
    clientId: "petal-and-stem",
    agentName: "Posy",
    agentIcon: "🌸",
    greeting:
      "Hello! 🌸 Welcome to Petal & Stem. I can help with event florals, pricing, and availability — or book you a styling consultation. Tell me about your event!",
    persona:
      "Warm, elegant, and reassuring. Speaks to brides and event planners. Concise.",
    businessHours: "Tue–Sun, 10 AM – 7 PM",
    neverDo: [
      "Never quote a final price without the team confirming the scope.",
      "Never guarantee a date is available — booking needs a deposit.",
      "Never ask for payment details in chat.",
    ],
    escalateKeywords: ["human", "agent", "real person", "call me now", "complaint", "refund"],
    maxAiMessages: 12,
  },
];

export const AVAILABILITY: Availability[] = [
  {
    clientId: "rozalix-landing",
    durationMins: 20,
    days: {
      1: ["09:00", "11:00", "14:00"], // Mon
      2: ["10:00", "15:00"], // Tue
      3: ["09:00", "11:00", "16:00"], // Wed
      4: ["10:00", "14:00"], // Thu
      5: ["09:00", "11:00"], // Fri
    },
  },
  {
    clientId: "petal-and-stem",
    durationMins: 30,
    days: {
      2: ["10:00", "13:00"], // Tue
      3: ["11:00", "15:00"], // Wed
      4: ["10:00", "14:00", "16:00"], // Thu
      5: ["11:00", "15:00"], // Fri
      6: ["10:00", "12:00"], // Sat
    },
  },
];

// A couple of seeded conversations so the inbox isn't empty on first load.
const CURATED_CONVERSATIONS: Conversation[] = [
  {
    id: "cv_5001",
    clientId: "rozalix-landing",
    channel: "web",
    customerName: "Paolo",
    customerPhone: "+639176665544",
    status: "booked",
    assignee: "ai",
    stage: "booked",
    offeredSlots: [],
    createdAt: "2026-06-14T01:05:00.000Z",
    updatedAt: "2026-06-14T01:11:00.000Z",
    messages: [
      { id: "m1", role: "ai", text: "Hi! 👋 Thanks for visiting Rozalix. What are you working on?", createdAt: "2026-06-14T01:05:00.000Z" },
      { id: "m2", role: "customer", text: "Need a new site for my coffee shop, how much?", createdAt: "2026-06-14T01:06:00.000Z" },
      { id: "m3", role: "ai", text: "A Launch site starts at ₱15,000 and Business at ₱25,000 — for a coffee shop with online ordering you'd likely be in the E-commerce range from ₱60,000. Want me to book a quick call to scope it?", createdAt: "2026-06-14T01:07:00.000Z" },
      { id: "m4", role: "customer", text: "Sure, I'm Paolo 09176665544", createdAt: "2026-06-14T01:08:00.000Z" },
      { id: "m5", role: "ai", text: "Thanks Paolo! I have Wed 9:00 AM or 11:00 AM open — which works?", createdAt: "2026-06-14T01:09:00.000Z" },
      { id: "m6", role: "customer", text: "Wed 11am", createdAt: "2026-06-14T01:10:00.000Z" },
      { id: "m7", role: "ai", text: "Booked! 🎉 The team will call you Wednesday at 11:00 AM. Talk soon!", createdAt: "2026-06-14T01:11:00.000Z" },
    ],
  },
  {
    id: "cv_5002",
    clientId: "rozalix-landing",
    channel: "web",
    customerName: "",
    customerPhone: "",
    status: "escalated",
    assignee: "owner",
    stage: "escalated",
    offeredSlots: [],
    createdAt: "2026-06-14T06:40:00.000Z",
    updatedAt: "2026-06-14T06:43:00.000Z",
    messages: [
      { id: "m1", role: "ai", text: "Hi! 👋 Thanks for visiting Rozalix. What are you working on?", createdAt: "2026-06-14T06:40:00.000Z" },
      { id: "m2", role: "customer", text: "I paid for a site last month and haven't heard back, this is unacceptable", createdAt: "2026-06-14T06:41:00.000Z" },
      { id: "m3", role: "ai", text: "I'm really sorry about that — let me get the Rozalix team to reach out to you personally right away. Could I grab the best number to reach you?", createdAt: "2026-06-14T06:42:00.000Z" },
    ],
  },
];

// ============================================================
// Bulk synthetic conversations so the inbox has enough threads to
// paginate. Deterministic (index-driven, fixed base date).
// ============================================================

const CONV_NAMES = [
  "Aria", "Ben", "Carlo", "Dana", "Elias", "Faye", "Gio", "Hannah", "Ivan",
  "Jenna", "Kyle", "Lara", "Migs", "Nina", "Owen", "Pia", "Rico", "Sam",
  "Tania", "Vince", "Wendy", "Yna", "Bella", "Caleb",
];
const CONV_OPENERS = [
  "Hi, how much for a basic website?",
  "Do you build online stores?",
  "Can you redesign an existing site?",
  "I need a landing page fast — possible?",
  "What's your turnaround time?",
  "Looking for a web app for bookings.",
];
const CONV_STATUS: Conversation["status"][] = [
  "active", "booked", "active", "escalated", "closed", "active", "booked",
];

const CONV_BASE_MS = Date.parse("2026-06-13T18:00:00.000Z");

function makeConversations(clientId: string, greeting: string, count: number): Conversation[] {
  return Array.from({ length: count }, (_, i) => {
    const name = CONV_NAMES[i % CONV_NAMES.length];
    const status = CONV_STATUS[i % CONV_STATUS.length];
    const hasPhone = status !== "active" || i % 2 === 0;
    const phone = hasPhone
      ? `+639${String(190000000 + i).padStart(9, "0")}`
      : "";
    const t0 = CONV_BASE_MS - i * 5.5 * 3600_000;
    const at = (off: number) => new Date(t0 + off * 60_000).toISOString();
    const messages = [
      { id: `m${i}a`, role: "ai" as const, text: greeting, createdAt: at(0) },
      { id: `m${i}b`, role: "customer" as const, text: CONV_OPENERS[i % CONV_OPENERS.length], createdAt: at(1) },
      { id: `m${i}c`, role: "ai" as const, text: "Happy to help! Could I get your name and number so we can set up a quick call?", createdAt: at(2) },
    ];
    if (hasPhone) {
      messages.push({ id: `m${i}d`, role: "customer" as const, text: `${name}, ${phone}`, createdAt: at(3) });
    }
    return {
      id: `cv_g${5100 + i}`,
      clientId,
      channel: "web" as const,
      customerName: hasPhone ? name : "",
      customerPhone: phone,
      status,
      assignee: "ai" as const,
      stage: status === "booked" ? "booked" : status === "escalated" ? "escalated" : "discovery",
      offeredSlots: [],
      messages,
      createdAt: at(0),
      updatedAt: at(messages.length),
    };
  });
}

export const CONVERSATIONS: Conversation[] = [
  ...CURATED_CONVERSATIONS,
  ...makeConversations(
    "rozalix-landing",
    "Hi! 👋 Thanks for visiting Rozalix. What are you working on?",
    28,
  ),
  ...makeConversations(
    "petal-and-stem",
    "Hello! 🌸 Welcome to Petal & Stem. Tell me about your event!",
    14,
  ),
];

export const BOOKINGS: Booking[] = [
  {
    id: "bk_9001",
    clientId: "rozalix-landing",
    conversationId: "cv_5001",
    customerName: "Paolo",
    customerPhone: "+639176665544",
    slotISO: "2026-06-17T03:00:00.000Z", // Wed 11:00 AM PHT
    summary: "Coffee shop owner — wants a site with online ordering (E-commerce range).",
    status: "confirmed",
    createdAt: "2026-06-14T01:11:00.000Z",
  },
];
