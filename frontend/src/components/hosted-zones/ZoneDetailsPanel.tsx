"use client";

import Box from "@cloudscape-design/components/box";

import ColumnLayout from "@cloudscape-design/components/column-layout";
import Container from "@cloudscape-design/components/container";
import CopyToClipboard from "@cloudscape-design/components/copy-to-clipboard";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

import { ValueWithLabel } from "@/components/common/ValueWithLabel";
import { displayFqdn, formatZoneType } from "@/lib/format";
import type { HostedZoneDetail } from "@/lib/types";

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return isoString;
  }
}

export function ZoneDetailsPanel({ zone }: { zone: HostedZoneDetail }) {
  const nsString = zone.name_servers.join("\n");

  return (
    <SpaceBetween size="l">
      {/* Primary details */}
      <Container header={<Header variant="h2">Hosted zone details</Header>}>
        <ColumnLayout columns={3} variant="text-grid">
          <ValueWithLabel label="Hosted zone name">
            <SpaceBetween direction="horizontal" size="xs">
              <Box>{displayFqdn(zone.name)}</Box>
              <CopyToClipboard
                copyButtonAriaLabel="Copy zone name"
                copyErrorText="Failed to copy"
                copySuccessText="Copied"
                textToCopy={displayFqdn(zone.name)}
                variant="icon"
              />
            </SpaceBetween>
          </ValueWithLabel>

          <ValueWithLabel label="Type">
            <StatusIndicator
              type={zone.type === "Public" ? "success" : "info"}
            >
              {formatZoneType(zone.type)}
            </StatusIndicator>
          </ValueWithLabel>

          <ValueWithLabel label="Record count">
            {zone.record_count}
          </ValueWithLabel>

          <ValueWithLabel label="Hosted zone ID">
            <SpaceBetween direction="horizontal" size="xs">
              <Box fontWeight="bold">{zone.id}</Box>
              <CopyToClipboard
                copyButtonAriaLabel="Copy zone ID"
                copyErrorText="Failed to copy"
                copySuccessText="Copied"
                textToCopy={zone.id}
                variant="icon"
              />
            </SpaceBetween>
          </ValueWithLabel>

          <ValueWithLabel label="Created">
            {formatDate(zone.created_at)}
          </ValueWithLabel>

          <ValueWithLabel label="Description">
            {zone.comment || (
              <Box color="text-body-secondary">—</Box>
            )}
          </ValueWithLabel>
        </ColumnLayout>
      </Container>

      {/* Nameservers panel */}
      <Container
        header={
          <Header
            variant="h2"
            description="Update these name servers at your domain registrar to route traffic through Route 53."
            actions={
              <CopyToClipboard
                copyButtonText="Copy all"
                copyButtonAriaLabel="Copy all name servers"
                copyErrorText="Failed to copy"
                copySuccessText="Copied!"
                textToCopy={nsString}
              />
            }
          >
            Name servers
          </Header>
        }
      >
        <SpaceBetween size="xs">
          {zone.name_servers.length > 0 ? (
            zone.name_servers.map((ns, i) => (
              <div
                key={ns}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "var(--color-background-container-header, #f8f8f8)",
                  borderRadius: 4,
                  border: "1px solid var(--color-border-divider-default, #e9ebed)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Box
                    color="text-body-secondary"
                    fontSize="body-s"
                    fontWeight="bold"
                  >
                    {i + 1}
                  </Box>
                  <Box fontWeight="normal">{ns}</Box>
                </div>
                <CopyToClipboard
                  copyButtonAriaLabel={`Copy ${ns}`}
                  copyErrorText="Failed to copy"
                  copySuccessText="Copied"
                  textToCopy={ns}
                  variant="icon"
                />
              </div>
            ))
          ) : (
            <Box color="text-body-secondary">No name servers assigned.</Box>
          )}
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}
