"use client";

import SideNavigation, {
  SideNavigationProps,
} from "@cloudscape-design/components/side-navigation";
import { usePathname, useRouter } from "next/navigation";

import { NAVIGATION_ITEMS, type NavItem } from "@/lib/constants/navigation";

function toCloudscapeItems(items: NavItem[]): SideNavigationProps.Item[] {
  return items.map((item) => {
    if (item.type === "divider") {
      return { type: "divider" };
    }
    if (item.type === "section-group") {
      return {
        type: "section-group",
        title: item.title,
        items: item.items.map((leaf) => ({
          type: "link",
          text: leaf.text,
          href: leaf.href,
        })),
      };
    }
    return { type: "link", text: item.text, href: item.href };
  });
}

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Match the full path for leaf nav items (e.g. /resolver/inbound), fall back to first segment
  const activeHref = pathname ?? "/";

  return (
    <SideNavigation
      header={{ text: "Route 53", href: "/dashboard" }}
      activeHref={activeHref}
      items={toCloudscapeItems(NAVIGATION_ITEMS)}
      onFollow={(event) => {
        if (!event.detail.external) {
          event.preventDefault();
          router.push(event.detail.href);
        }
      }}
    />
  );
}
