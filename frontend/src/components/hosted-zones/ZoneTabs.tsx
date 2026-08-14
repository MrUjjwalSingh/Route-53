"use client";

import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Tabs from "@cloudscape-design/components/tabs";
import type { ReactNode } from "react";

import { ZoneTagsTab } from "@/components/hosted-zones/ZoneTagsTab";

export interface ZoneTabsProps {
  zoneId: string;
  recordsSlot?: ReactNode;
}

export function ZoneTabs({ zoneId, recordsSlot }: ZoneTabsProps) {
  return (
    <Tabs
      tabs={[
        {
          id: "records",
          label: "Records",
          content: recordsSlot ?? (
            <Container>
              <Box textAlign="center" padding="l">
                Records management is added in the next phase.
              </Box>
            </Container>
          ),
        },
        {
          id: "dnssec",
          label: "DNSSEC signing",
          content: (
            <Container>
              <Box textAlign="center" padding={{ vertical: "xxl" }}>
                <StatusIndicator type="info">Coming soon</StatusIndicator>
                <Box padding={{ top: "xs" }} color="text-body-secondary">
                  DNSSEC signing configuration is not yet available in this preview.
                </Box>
              </Box>
            </Container>
          ),
        },
        {
          id: "tags",
          label: "Hosted zone tags",
          content: <ZoneTagsTab zoneId={zoneId} />,
        },
      ]}
    />
  );
}
