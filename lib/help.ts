export type HelpTopic = {
  slug: string;
  title: string;
  group: "Buying" | "Selling" | "Company" | "Policies";
  summary: string;
  body: string[];
};

/** Deliberately plain language. The word "escrow" appears nowhere buyer-facing. */
export const HELP_TOPICS: HelpTopic[] = [
  {
    slug: "how-it-works",
    title: "How Finstore Market works",
    group: "Buying",
    summary: "What happens between paying and getting your item.",
    body: [
      "You pay for your order and we hold the money. The store does not have it yet.",
      "The store confirms the order and hands the item to a rider. You can follow every step from your order page.",
      "When the item reaches you, check it. If it is what you ordered, tap Confirm receipt and the store is paid.",
      "If nothing is wrong and you forget to confirm, the order confirms itself 48 hours after delivery.",
      "If something is wrong, raise an issue from the order page. Your money stays held while it is resolved.",
    ],
  },
  {
    slug: "delivery",
    title: "Delivery and delivery costs",
    group: "Buying",
    summary: "How delivery is priced and why an order can arrive in parts.",
    body: [
      "Delivery is quoted per store, not per order. If you buy from two stores, you pay two delivery charges and get two deliveries.",
      "Items from the same store ship together, and a second item from that store usually adds very little.",
      "Cost depends on the size and weight of what you bought and how far it travels. You see the exact amount before you pay.",
      "The delivery date shown on the product page is for the area in your Deliver-to setting. Change that and the date updates.",
    ],
  },
  {
    slug: "returns",
    title: "Returns and refunds",
    group: "Buying",
    summary: "Seven days to return, and who pays for the return trip.",
    body: [
      "You have 7 days from delivery to request a return from your order page.",
      "If the item was not as described, damaged, or the wrong thing was sent, the store pays for the return delivery.",
      "If you simply changed your mind, you pay for the return delivery.",
      "Refunds go back the way you paid, usually within 3 working days of the item getting back to the store.",
    ],
  },
  {
    slug: "payments",
    title: "Ways to pay",
    group: "Buying",
    summary: "Card, bank transfer, USSD and wallet.",
    body: [
      "You can pay by debit card, bank transfer to a one-time account number, USSD, or from your Finstore wallet balance.",
      "Pay on delivery is not available yet.",
      "If you have grant credit — from the SMEDAN programme, for example — it is applied automatically at checkout. You never type a code to use money that is already yours.",
    ],
  },
  {
    slug: "report",
    title: "Report a listing",
    group: "Policies",
    summary: "Counterfeits, wrong prices and anything that looks off.",
    body: [
      "Use the Report this listing link at the bottom of any product page.",
      "We review reports within one working day. Listings that break our rules are removed and repeat offenders lose their Market access.",
    ],
  },
  {
    slug: "sell-on-finstore",
    title: "Sell on Finstore",
    group: "Selling",
    summary: "Open a free store, then apply to list on Market.",
    body: [
      "Any Finstore merchant can open a store for free and start selling through their own link.",
      "Market is the shared shopfront. To list here you need a verified business and a completed KYC check.",
      "There are no listing fees at launch. You are paid after each buyer confirms delivery, per sub-order.",
    ],
  },
  {
    slug: "fees",
    title: "Merchant fees",
    group: "Selling",
    summary: "What Finstore takes and when.",
    body: [
      "No listing fee and no monthly fee at launch.",
      "A commission is deducted per completed sub-order at the point the buyer confirms delivery.",
      "Delivery is charged to the buyer and paid to the delivery partner — it does not pass through your balance.",
    ],
  },
  {
    slug: "join-market",
    title: "Join Market",
    group: "Selling",
    summary: "The eligibility gate for listing on Market.",
    body: [
      "You need a verified store, KYC tier 2 or above, and at least one product with real in-store photos.",
      "Stock levels must be accurate. Cancelling because you did not have the item is the fastest way to lose Market access.",
    ],
  },
  {
    slug: "merchant-help",
    title: "Merchant help",
    group: "Selling",
    summary: "Where merchants get support.",
    body: ["Merchant support runs on WhatsApp during business hours, and by email at any time."],
  },
  { slug: "about", title: "About Finstore", group: "Company", summary: "Who we are.", body: ["Finstore is a Nigerian commerce platform for small businesses. Market is our shared shopfront."] },
  { slug: "careers", title: "Careers", group: "Company", summary: "Open roles.", body: ["We hire across engineering, operations and merchant success. Roles are posted here as they open."] },
  { slug: "press", title: "Press", group: "Company", summary: "Media enquiries.", body: ["For press enquiries, contact press@finstore.africa."] },
  { slug: "blog", title: "Blog", group: "Company", summary: "Notes from the team.", body: ["Product updates and merchant stories."] },
  { slug: "contact", title: "Contact us", group: "Company", summary: "How to reach support.", body: ["WhatsApp support is the fastest route. Email support@finstore.africa for anything that needs a paper trail."] },
  { slug: "whatsapp", title: "WhatsApp support", group: "Company", summary: "Chat with a human.", body: ["Message our support line and quote your order number. We reply within business hours."] },
  { slug: "terms", title: "Terms of use", group: "Policies", summary: "The rules of using Market.", body: ["Full terms are published here. Using Market means you accept them."] },
  { slug: "privacy", title: "Privacy", group: "Policies", summary: "What we collect and why.", body: ["We collect what we need to deliver your order and nothing more. Your phone number is shared with the rider on delivery day."] },
];

export function helpTopic(slug: string): HelpTopic | undefined {
  return HELP_TOPICS.find((topic) => topic.slug === slug);
}
