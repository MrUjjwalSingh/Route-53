"use client";

import Box from "@cloudscape-design/components/box";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Grid from "@cloudscape-design/components/grid";
import SpaceBetween from "@cloudscape-design/components/space-between";

const BENEFITS = [
  {
    title: "Route end users reliably",
    body: "Hosted zones hold your DNS record sets, with auto-created NS and SOA records so every new zone is immediately resolvable.",
  },
  {
    title: "Set up routing in minutes",
    body: "Create a hosted zone and add A, AAAA, CNAME, MX, TXT, and six other record types through one guided form with per-type validation.",
  },
  {
    title: "Advanced traffic routing",
    body: "Weighted, latency, and failover routing policies let a record set hold multiple values tagged with a set identifier.",
  },
  {
    title: "Track every change",
    body: "Every mutation returns a change record that moves from PENDING to INSYNC, polled live in the console — the same status model as the real service.",
  },
  {
    title: "Guarded deletes",
    body: "A hosted zone can't be deleted while it still holds records beyond its system NS/SOA pair, preventing orphaned DNS state.",
  },
  {
    title: "Export what you build",
    body: "Download any hosted zone as JSON or a BIND-style zone file straight from the zone detail page.",
  },
];

export function BenefitsSection() {
  return (
    <div id="benefits" style={{ padding: "3rem 2rem" }}>
      <Grid gridDefinition={[{ colspan: { default: 12, xs: 5 } }, { colspan: { default: 12, xs: 7 } }]}>
        <div>
          <Box variant="h2" fontWeight="bold" padding={{ bottom: "s" }}>
            Benefits of this Route 53 clone
          </Box>
          <Box variant="p" color="text-body-secondary">
            Every item below maps to something actually implemented in this
            project, not marketing copy for a hypothetical feature.
          </Box>
        </div>

        <SpaceBetween size="xs">
          {BENEFITS.map((benefit, i) => (
            <ExpandableSection
              key={benefit.title}
              headerText={benefit.title}
              defaultExpanded={i === 0}
            >
              {benefit.body}
            </ExpandableSection>
          ))}
        </SpaceBetween>
      </Grid>
    </div>
  );
}
