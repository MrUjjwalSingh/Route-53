"use client";

import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ContentLayout from "@cloudscape-design/components/content-layout";

import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Spinner from "@cloudscape-design/components/spinner";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { DeleteZoneModal } from "@/components/hosted-zones/DeleteZoneModal";
import { ZoneDetailsPanel } from "@/components/hosted-zones/ZoneDetailsPanel";
import { ZoneTabs } from "@/components/hosted-zones/ZoneTabs";
import { RecordsTable } from "@/components/records/RecordsTable";
import { useBreadcrumbOverride } from "@/context/BreadcrumbContext";
import { displayFqdn } from "@/lib/format";
import { useZone } from "@/lib/hooks/useZones";

export default function HostedZoneDetailPage() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const router = useRouter();
  const { data: zone, isLoading, isError } = useZone(zoneId);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useBreadcrumbOverride(
    zone
      ? [
          { text: "Hosted zones", href: "/hosted-zones" },
          { text: displayFqdn(zone.name), href: `/hosted-zones/${zone.id}` },
        ]
      : undefined
  );

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
      </Box>
    );
  }

  if (isError || !zone) {
    return (
      <ContentLayout>
        <Alert type="error" header="Hosted zone not found">
          The hosted zone you are looking for doesn&apos;t exist or you don&apos;t have
          access to it.{" "}
          <Button variant="inline-link" onClick={() => router.push("/hosted-zones")}>
            Back to hosted zones
          </Button>
        </Alert>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description={
            <SpaceBetween direction="horizontal" size="s">
              <StatusIndicator type={zone.type === "Public" ? "success" : "info"}>
                {zone.type === "Public" ? "Public hosted zone" : "Private hosted zone"}
              </StatusIndicator>
              <Box color="text-body-secondary">
                {zone.record_count} record{zone.record_count !== 1 ? "s" : ""}
              </Box>
            </SpaceBetween>
          }
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => router.push("/hosted-zones")}
                iconName="arrow-left"
              >
                Hosted zones
              </Button>
              <Button onClick={() => setShowDeleteModal(true)}>
                Delete zone
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push(`/hosted-zones/${zone.id}/edit`)}
              >
                Edit zone
              </Button>
            </SpaceBetween>
          }
        >
          {displayFqdn(zone.name)}
        </Header>
      }
    >
      <SpaceBetween size="l">
        <ZoneDetailsPanel zone={zone} />
        <ZoneTabs zoneId={zone.id} recordsSlot={<RecordsTable zoneId={zone.id} />} />
      </SpaceBetween>

      <DeleteZoneModal
        zone={showDeleteModal ? zone : null}
        onDismiss={() => setShowDeleteModal(false)}
        onDeleted={() => router.push("/hosted-zones")}
      />
    </ContentLayout>
  );
}
