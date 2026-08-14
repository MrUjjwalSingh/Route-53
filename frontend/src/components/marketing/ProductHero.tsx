"use client";

import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

const API_DOCS_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api"
).replace(/\/api\/?$/, "/docs");

export function ProductHero() {
  return (
    <div id="overview" style={{ padding: "2.5rem 2rem 1rem", maxWidth: "900px" }}>
      <div style={{ marginBottom: "1rem" }}>
        <BreadcrumbGroup
          items={[
            { text: "Products", href: "#" },
            { text: "Networking and Content Delivery", href: "#" },
            { text: "Amazon Route 53", href: "#overview" },
          ]}
          onFollow={(event) => event.preventDefault()}
        />
      </div>

      <SpaceBetween size="m">
        <Box variant="h1" fontWeight="bold">
          Amazon Route 53 — DNS service
        </Box>
        <Box variant="p" fontSize="heading-s" color="text-body-secondary">
          A reliable and cost-effective way to route end users to Internet
          applications — this build is a functional clone of the Route 53
          console for portfolio and learning purposes, not the real AWS
          service.
        </Box>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Button variant="primary" href="/login">
            Get started with Route 53
          </Button>
          <Button href={API_DOCS_URL} target="_blank">
            View API docs
          </Button>
        </div>
      </SpaceBetween>
    </div>
  );
}
