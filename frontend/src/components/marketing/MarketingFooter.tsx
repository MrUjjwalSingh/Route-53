"use client";

import { colorBorderDividerDefault } from "@cloudscape-design/design-tokens";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

export function MarketingFooter() {
  return (
    <footer
      style={{
        borderTop: `1px solid ${colorBorderDividerDefault}`,
        padding: "2.5rem 2rem",
        marginTop: "1rem",
      }}
    >
      <SpaceBetween size="m">
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Button variant="primary" href="/login">
            Sign in to console
          </Button>
        </div>
        <Box variant="small" color="text-body-secondary">
          This is an unofficial, portfolio-only clone of the AWS Route 53
          console. Not affiliated with or endorsed by Amazon Web Services,
          Inc.
        </Box>
      </SpaceBetween>
    </footer>
  );
}
