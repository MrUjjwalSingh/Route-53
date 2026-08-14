"use client";

import {
  colorBackgroundContainerContent,
  colorBorderDividerDefault,
} from "@cloudscape-design/design-tokens";

import Button from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";

import { useAuth } from "@/lib/hooks/useAuth";

const SECTION_LINKS = [
  { href: "#overview", label: "Overview" },
  { href: "#benefits", label: "Benefits" },
  { href: "#features", label: "Features" },
  { href: "#faqs", label: "FAQs" },
];

export function MarketingNav() {
  const { user, isLoading } = useAuth();

  return (
    <>
      <div
        style={{
          background: "#0f1b2a",
          color: "#fff",
          padding: "0.75rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Box variant="span" fontWeight="bold" fontSize="heading-m">
            aws
          </Box>
          <Box variant="span" color="text-status-inactive" fontSize="body-s">
            |
          </Box>
          <Box variant="span" fontSize="body-m">
            Route 53 (clone)
          </Box>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {!isLoading && user ? (
            <>
              <Box variant="span" fontSize="body-s" color="text-status-inactive">
                Signed in as {user.name}
              </Box>
              <Button href="/dashboard" variant="primary">
                Go to console
              </Button>
            </>
          ) : (
            <>
              <Button href="/login">Sign in to console</Button>
              <Button href="/login" variant="primary">
                Try the demo
              </Button>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: colorBackgroundContainerContent,
          borderBottom: `1px solid ${colorBorderDividerDefault}`,
          padding: "0.9rem 2rem",
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          flexWrap: "wrap",
        }}
      >
        <Box variant="strong" fontSize="body-m">
          Amazon Route 53
        </Box>
        <nav style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          {SECTION_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                color: "inherit",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
