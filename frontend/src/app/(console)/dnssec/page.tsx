"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import Container from "@cloudscape-design/components/container";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import Link from "@cloudscape-design/components/link";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { displayFqdn } from "@/lib/format";
import { useZones } from "@/lib/hooks/useZones";
import type { HostedZone } from "@/lib/types";

export default function DnssecPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedItems, setSelectedItems] = useState<HostedZone[]>([]);

  const { data, isLoading, isError, refetch } = useZones({
    search: search || undefined,
    page,
    page_size: pageSize,
  });

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="DNSSEC signing protects against DNS spoofing attacks by cryptographically signing your hosted zones."
        >
          DNSSEC signing
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Table<HostedZone>
          columnDefinitions={[
            {
              id: "name",
              header: "Hosted zone",
              cell: (item) => (
                <Link href={`/hosted-zones/${item.id}`}>{displayFqdn(item.name)}</Link>
              ),
              sortingField: "name",
            },
            {
              id: "type",
              header: "Type",
              cell: (item) => item.type,
            },
            {
              id: "dnssec_status",
              header: "DNSSEC signing status",
              cell: () => (
                <StatusIndicator type="stopped">Disabled</StatusIndicator>
              ),
            },
            {
              id: "key_signing_keys",
              header: "Key-signing keys (KSKs)",
              cell: () => "0",
            },
            {
              id: "last_modified",
              header: "Last modified",
              cell: (item) =>
                new Date(item.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
            },
          ]}
          items={items}
          loading={isLoading}
          loadingText="Loading hosted zones"
          trackBy="id"
          selectionType="single"
          selectedItems={selectedItems}
          onSelectionChange={(e) => setSelectedItems(e.detail.selectedItems)}
          variant="full-page"
          header={
            <Header
              variant="h1"
              counter={data ? `(${data.total})` : undefined}
              description="View and manage DNSSEC signing status for your hosted zones."
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button disabled={selectedItems.length !== 1}>
                    Enable DNSSEC signing
                  </Button>
                </SpaceBetween>
              }
            >
              Hosted zones
            </Header>
          }
          filter={
            <TextFilter
              filteringText={search}
              filteringPlaceholder="Search hosted zones"
              onChange={(e) => {
                setSearch(e.detail.filteringText);
                setPage(1);
              }}
            />
          }
          pagination={
            <Pagination
              currentPageIndex={page}
              pagesCount={totalPages}
              onChange={(e) => setPage(e.detail.currentPageIndex)}
            />
          }
          preferences={
            <CollectionPreferences
              title="Preferences"
              confirmLabel="Confirm"
              cancelLabel="Cancel"
              preferences={{ pageSize }}
              pageSizePreference={{
                title: "Page size",
                options: [
                  { value: 10, label: "10 zones" },
                  { value: 20, label: "20 zones" },
                  { value: 50, label: "50 zones" },
                ],
              }}
              onConfirm={(e) => {
                setPageSize(e.detail.pageSize ?? 10);
                setPage(1);
              }}
            />
          }
          empty={
            isError ? (
              <EmptyState
                title="Unable to load hosted zones"
                subtitle="Something went wrong. Please try again."
                action={<Button onClick={() => refetch()}>Retry</Button>}
              />
            ) : (
              <EmptyState
                title="No hosted zones"
                subtitle="Create a hosted zone to manage DNSSEC signing."
                action={
                  <Button variant="primary" href="/hosted-zones/create">
                    Create hosted zone
                  </Button>
                }
              />
            )
          }
        />

        <Container
          header={<Header variant="h2">About DNSSEC signing</Header>}
        >
          <SpaceBetween size="s">
            <Box variant="p">
              DNSSEC (Domain Name System Security Extensions) adds a layer of security to the DNS lookup process. When you enable DNSSEC signing for a hosted zone, Route 53 cryptographically signs each record in the zone, allowing resolvers to verify that responses haven&apos;t been tampered with.
            </Box>
            <Box variant="p">
              <strong>How it works:</strong> Route 53 creates a key-signing key (KSK) to sign the DNSKEY record, and zone-signing keys (ZSKs) to sign all other records. You need to add a DS record to your parent zone to complete the chain of trust.
            </Box>
            <Link
              href="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-configuring-dnssec.html"
              external
            >
              Learn more about DNSSEC signing
            </Link>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
}
