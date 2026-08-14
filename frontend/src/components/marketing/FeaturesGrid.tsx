"use client";

import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Grid from "@cloudscape-design/components/grid";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";

const FEATURES = [
  {
    title: "Hosted zones",
    body: "Search, create, edit, and delete public and private hosted zones with tags.",
  },
  {
    title: "9 record types",
    body: "A, AAAA, CNAME, MX, TXT, NS, SOA, SRV, and CAA, each with server- and client-side validation.",
  },
  {
    title: "Alias records",
    body: "Point a record at a target resource instead of a literal value, with the TTL requirement dropped automatically.",
  },
  {
    title: "Change tracking",
    body: "Every write returns a change with a live status pill that flips from PENDING to INSYNC.",
  },
  {
    title: "Zone export",
    body: "Download a hosted zone's records as JSON or a BIND-formatted zone file.",
  },
  {
    title: "Dark mode",
    body: "A full dark theme toggle in the top nav, built on Cloudscape's global styles.",
  },
];

export function FeaturesGrid() {
  return (
    <div id="features" style={{ padding: "3rem 2rem", background: "rgba(127,127,127,0.05)" }}>
      <SpaceBetween size="l">
        <Header variant="h2">What&apos;s actually built</Header>
        <Grid
          gridDefinition={FEATURES.map(() => ({ colspan: { default: 12, xs: 6, m: 4 } }))}
        >
          {FEATURES.map((feature) => (
            <Container key={feature.title}>
              <SpaceBetween size="xs">
                <Box variant="h3">{feature.title}</Box>
                <Box variant="p" color="text-body-secondary">
                  {feature.body}
                </Box>
              </SpaceBetween>
            </Container>
          ))}
        </Grid>
      </SpaceBetween>
    </div>
  );
}
