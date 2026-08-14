"use client";

import BreadcrumbGroup, {
  BreadcrumbGroupProps,
} from "@cloudscape-design/components/breadcrumb-group";
import { usePathname, useRouter } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "hosted-zones": "Hosted zones",
  "health-checks": "Health checks",
  "traffic-policies": "Traffic policies",
  resolver: "Resolver",
  profiles: "Profiles",
  create: "Create",
  edit: "Edit",
  records: "Records",
};

function humanize(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment;
}

export interface BreadcrumbsProps {
  /** Overrides the auto-derived trail past "Route 53", e.g. to show a zone name
   * instead of its opaque id. */
  items?: BreadcrumbGroupProps.Item[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const trail: BreadcrumbGroupProps.Item[] = items ?? [
    ...pathname
      .split("/")
      .filter(Boolean)
      .reduce<{ href: string; items: BreadcrumbGroupProps.Item[] }>(
        (acc, segment) => {
          const href = `${acc.href}/${segment}`;
          acc.items.push({ text: humanize(segment), href });
          acc.href = href;
          return acc;
        },
        { href: "", items: [] }
      ).items,
  ];

  return (
    <BreadcrumbGroup
      items={[{ text: "Route 53", href: "/dashboard" }, ...trail]}
      onFollow={(event) => {
        event.preventDefault();
        router.push(event.detail.href);
      }}
    />
  );
}
