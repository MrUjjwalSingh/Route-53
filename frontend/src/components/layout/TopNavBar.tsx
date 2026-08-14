"use client";

import { Mode } from "@cloudscape-design/global-styles";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import { useRouter } from "next/navigation";

import { useTheme } from "@/context/ThemeContext";
import { useAccount } from "@/lib/hooks/useAccount";
import { useAuth } from "@/lib/hooks/useAuth";

export function TopNavBar() {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useTheme();
  const { data: account } = useAccount();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div id="app-header" style={{ position: "sticky", top: 0, zIndex: 1000 }}>
      <TopNavigation
        identity={{
          href: "/dashboard",
          title: "AWS",
          logo: {
            src: "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 36"><text x="0" y="28" font-family="Amazon Ember,Arial,sans-serif" font-weight="900" font-size="32" fill="#FF9900" letter-spacing="-1">aws</text><path d="M2 34 Q30 44 58 34" fill="none" stroke="#FF9900" stroke-width="3" stroke-linecap="round"/></svg>`),
            alt: "AWS",
          },
        }}
        visualContext="top-navigation"
        search={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 4,
              height: 32,
              width: "100%",
              maxWidth: 480,
              padding: "0 10px",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, flex: 1 }}>
              Search [Route 53]
            </span>
            <span
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 3,
                padding: "1px 5px",
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              ⌥ S
            </span>
          </div>
        }
        utilities={[
          {
            type: "menu-dropdown",
            text: "Services",
            title: "AWS Services",
            iconName: "menu",
            items: [
              { id: "route53", text: "Route 53" },
              { id: "ec2", text: "EC2" },
              { id: "s3", text: "S3" },
              { id: "cloudfront", text: "CloudFront" },
              { id: "vpc", text: "VPC" },
              { id: "iam", text: "IAM" },
            ],
          },

          {
            type: "button",
            iconName: "notification",
            ariaLabel: "Notifications",
            badge: false,
            disableUtilityCollapse: true,
          },
          {
            type: "menu-dropdown",
            text: account?.default_region ?? "us-east-1",
            title: "Region",
            items: (account?.regions ?? [
              { code: "us-east-1", name: "US East (N. Virginia)" },
              { code: "us-east-2", name: "US East (Ohio)" },
              { code: "us-west-1", name: "US West (N. California)" },
              { code: "us-west-2", name: "US West (Oregon)" },
              { code: "eu-west-1", name: "Europe (Ireland)" },
              { code: "eu-central-1", name: "Europe (Frankfurt)" },
              { code: "ap-southeast-1", name: "Asia Pacific (Singapore)" },
              { code: "ap-northeast-1", name: "Asia Pacific (Tokyo)" },
            ]).map((region) => ({
              id: region.code,
              text: region.name,
            })),
          },
          {
            type: "button",
            text: mode === Mode.Dark ? "Light mode" : "Dark mode",
            iconName: mode === Mode.Dark ? "settings" : "settings",
            onClick: toggleMode,
            ariaLabel: "Toggle color mode",
          },
          {
            type: "menu-dropdown",
            text: "Support",
            title: "Support",
            items: [
              { id: "support-center", text: "Support Center" },
              { id: "documentation", text: "Documentation" },
              { id: "feedback", text: "Send feedback" },
              { id: "knowledge-center", text: "Knowledge Center" },
              { id: "service-quotas", text: "Service Quotas" },
            ],
          },
          {
            type: "menu-dropdown",
            text: user?.email ?? "",
            description: account ? `Account ID: ${account.account_id}` : undefined,
            iconName: "user-profile",
            items: [
              {
                id: "account",
                text: "Account",
                items: [
                  { id: "billing", text: "Billing & Cost Management" },
                  { id: "security", text: "Security credentials" },
                ],
              },
              { id: "preferences", text: "Preferences" },
              { id: "signout", text: "Sign out" },
            ],
            onItemClick: (event) => {
              if (event.detail.id === "signout") {
                void handleSignOut();
              }
            },
          },
        ]}
        i18nStrings={{
          searchIconAriaLabel: "Search",
          searchDismissIconAriaLabel: "Close search",
          overflowMenuTriggerText: "More",
          overflowMenuTitleText: "All",
          overflowMenuBackIconAriaLabel: "Back",
          overflowMenuDismissIconAriaLabel: "Close menu",
        }}
      />
    </div>
  );
}
