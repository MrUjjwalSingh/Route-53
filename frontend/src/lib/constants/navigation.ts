export interface NavLeaf {
  type: "link";
  text: string;
  href: string;
}

export interface NavDivider {
  type: "divider";
}

export interface NavSectionGroup {
  type: "section-group";
  title: string;
  items: NavLeaf[];
}

export type NavItem = NavLeaf | NavDivider | NavSectionGroup;

export const NAVIGATION_ITEMS: NavItem[] = [
  { type: "link", text: "Dashboard", href: "/dashboard" },
  { type: "divider" },
  {
    type: "section-group",
    title: "Domain registration",
    items: [
      { type: "link", text: "Registered domains", href: "/registered-domains" },
      { type: "link", text: "Requests", href: "/domain-requests" },
      { type: "link", text: "Transfers", href: "/transfers" },
    ],
  },
  { type: "divider" },
  {
    type: "section-group",
    title: "DNS management",
    items: [
      { type: "link", text: "Hosted zones", href: "/hosted-zones" },
      { type: "link", text: "DNSSEC signing", href: "/dnssec" },
    ],
  },
  { type: "divider" },
  {
    type: "section-group",
    title: "Monitoring",
    items: [
      { type: "link", text: "Health checks", href: "/health-checks" },
    ],
  },
  { type: "divider" },
  {
    type: "section-group",
    title: "Traffic management",
    items: [
      { type: "link", text: "Traffic policies", href: "/traffic-policies" },
      { type: "link", text: "Policy records", href: "/policy-records" },
    ],
  },
  { type: "divider" },
  {
    type: "section-group",
    title: "Resolver",
    items: [
      { type: "link", text: "VPCs", href: "/resolver" },
      { type: "link", text: "Inbound endpoints", href: "/resolver/inbound" },
      { type: "link", text: "Outbound endpoints", href: "/resolver/outbound" },
      { type: "link", text: "Rules", href: "/resolver/rules" },
      { type: "link", text: "Query logging", href: "/resolver/query-logging" },
    ],
  },
  { type: "divider" },
  {
    type: "section-group",
    title: "Additional settings",
    items: [
      { type: "link", text: "Profiles", href: "/profiles" },
    ],
  },
];
