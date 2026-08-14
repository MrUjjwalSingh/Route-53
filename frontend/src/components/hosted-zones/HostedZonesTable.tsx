"use client";

import Button from "@cloudscape-design/components/button";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import CopyToClipboard from "@cloudscape-design/components/copy-to-clipboard";
import Header from "@cloudscape-design/components/header";
import Link from "@cloudscape-design/components/link";
import Pagination from "@cloudscape-design/components/pagination";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import SplitPanel from "@cloudscape-design/components/split-panel";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import Box from "@cloudscape-design/components/box";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { TableHeaderActions } from "@/components/common/TableHeaderActions";
import { DeleteZoneModal } from "@/components/hosted-zones/DeleteZoneModal";
import { displayFqdn, formatZoneType } from "@/lib/format";
import { useZones } from "@/lib/hooks/useZones";
import type { HostedZone } from "@/lib/types";

const TYPE_OPTIONS = [
  { label: "Any type", value: "" },
  { label: "Public hosted zone", value: "Public" },
  { label: "Private hosted zone", value: "Private" },
];

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: "10 hosted zones" },
  { value: 20, label: "20 hosted zones" },
  { value: 50, label: "50 hosted zones" },
];

function ZoneSidePanel({ zone }: { zone: HostedZone }) {
  return (
    <SpaceBetween size="l">
      <ColumnLayout columns={1} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">Hosted zone name</Box>
          <SpaceBetween direction="horizontal" size="xs">
            <Link href={`/hosted-zones/${zone.id}`}>{displayFqdn(zone.name)}</Link>
          </SpaceBetween>
        </div>
        <div>
          <Box variant="awsui-key-label">Hosted zone ID</Box>
          <SpaceBetween direction="horizontal" size="xs">
            <Box fontSize="body-s" fontWeight="bold">{zone.id}</Box>
            <CopyToClipboard
              copyButtonAriaLabel="Copy zone ID"
              copyErrorText="Failed to copy"
              copySuccessText="Copied"
              textToCopy={zone.id}
              variant="icon"
            />
          </SpaceBetween>
        </div>
        <div>
          <Box variant="awsui-key-label">Type</Box>
          <StatusIndicator type={zone.type === "Public" ? "success" : "info"}>
            {formatZoneType(zone.type)}
          </StatusIndicator>
        </div>
        <div>
          <Box variant="awsui-key-label">Record count</Box>
          <Box>{zone.record_count}</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Description</Box>
          <Box color="text-body-secondary">{zone.comment || "—"}</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Created by</Box>
          <Box>{zone.created_by}</Box>
        </div>
      </ColumnLayout>
    </SpaceBetween>
  );
}

export function HostedZonesTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("page_size") ?? "10");
  const sort = searchParams.get("sort") ?? "name";
  const order = (searchParams.get("order") ?? "asc") as "asc" | "desc";

  const [selectedItems, setSelectedItems] = useState<HostedZone[]>([]);
  const [zoneToDelete, setZoneToDelete] = useState<HostedZone | null>(null);
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useZones({
    search: search || undefined,
    type: type || undefined,
    sort,
    order,
    page,
    page_size: pageSize,
  });

  function updateParams(updates: Record<string, string | number | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    router.push(`/hosted-zones?${next.toString()}`);
  }

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;
  const hasFilters = !!search || !!type;
  const selectedZone = selectedItems[0] ?? null;

  const handleSelectionChange = (selected: HostedZone[]) => {
    setSelectedItems(selected);
    if (selected.length === 1) {
      setSplitPanelOpen(true);
    } else {
      setSplitPanelOpen(false);
    }
  };

  const table = (
    <>
      <Table<HostedZone>
        columnDefinitions={[
          {
            id: "name",
            header: "Hosted zone name",
            sortingField: "name",
            cell: (item) => (
              <Link href={`/hosted-zones/${item.id}`}>{displayFqdn(item.name)}</Link>
            ),
          },
          {
            id: "type",
            header: "Type",
            sortingField: "type",
            cell: (item) => (
              <StatusIndicator type={item.type === "Public" ? "success" : "info"}>
                {formatZoneType(item.type)}
              </StatusIndicator>
            ),
          },
          {
            id: "record_count",
            header: "Record count",
            cell: (item) => item.record_count,
          },
          {
            id: "comment",
            header: "Description",
            cell: (item) => item.comment || "—",
          },
          {
            id: "id",
            header: "Hosted zone ID",
            cell: (item) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Box fontSize="body-s">{item.id}</Box>
                <CopyToClipboard
                  copyButtonAriaLabel="Copy"
                  copyErrorText="Failed to copy"
                  copySuccessText="Copied"
                  textToCopy={item.id}
                  variant="icon"
                />
              </SpaceBetween>
            ),
          },
          {
            id: "created_by",
            header: "Created by",
            cell: (item) => item.created_by,
          },
        ]}
        items={items}
        loading={isLoading}
        loadingText="Loading hosted zones"
        trackBy="id"
        selectionType="single"
        selectedItems={selectedItems}
        onSelectionChange={(event) =>
          handleSelectionChange(event.detail.selectedItems)
        }
        sortingColumn={{ sortingField: sort }}
        sortingDescending={order === "desc"}
        onSortingChange={(event) => {
          updateParams({
            sort: event.detail.sortingColumn.sortingField,
            order: event.detail.isDescending ? "desc" : "asc",
          });
        }}
        variant="full-page"
        header={
          <Header
            variant="h1"
            counter={data ? `(${data.total})` : undefined}
            description="Manage your public and private hosted zones."
            actions={
              <TableHeaderActions>
                <Button
                  disabled={selectedItems.length !== 1}
                  onClick={() =>
                    router.push(`/hosted-zones/${selectedItems[0]?.id}`)
                  }
                >
                  View details
                </Button>
                <Button
                  disabled={selectedItems.length !== 1}
                  onClick={() =>
                    router.push(`/hosted-zones/${selectedItems[0]?.id}/edit`)
                  }
                >
                  Edit
                </Button>
                <Button
                  disabled={selectedItems.length !== 1}
                  onClick={() => setZoneToDelete(selectedItems[0])}
                >
                  Delete
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push("/hosted-zones/create")}
                >
                  Create hosted zone
                </Button>
              </TableHeaderActions>
            }
          >
            Hosted zones
          </Header>
        }
        filter={
          <SpaceBetween direction="horizontal" size="xs">
            <div style={{ minWidth: 320 }}>
              <TextFilter
                filteringText={search}
                filteringPlaceholder="Find hosted zones"
                onChange={(event) =>
                  updateParams({ search: event.detail.filteringText, page: 1 })
                }
              />
            </div>
            <Select
              selectedOption={
                TYPE_OPTIONS.find((option) => option.value === type) ??
                TYPE_OPTIONS[0]
              }
              options={TYPE_OPTIONS}
              onChange={(event) =>
                updateParams({
                  type: event.detail.selectedOption.value,
                  page: 1,
                })
              }
            />
          </SpaceBetween>
        }
        pagination={
          <Pagination
            currentPageIndex={page}
            pagesCount={totalPages}
            onChange={(event) =>
              updateParams({ page: event.detail.currentPageIndex })
            }
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
              options: PAGE_SIZE_OPTIONS,
            }}
            onConfirm={(event) =>
              updateParams({ page_size: event.detail.pageSize, page: 1 })
            }
          />
        }
        empty={
          isError ? (
            <EmptyState
              title="Unable to load hosted zones"
              subtitle="Something went wrong. Please try again."
              action={<Button onClick={() => refetch()}>Retry</Button>}
            />
          ) : hasFilters ? (
            <EmptyState
              title="No matches"
              subtitle="We can't find a match."
              action={
                <Button
                  onClick={() =>
                    updateParams({
                      search: undefined,
                      type: undefined,
                      page: 1,
                    })
                  }
                >
                  Clear filter
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No hosted zones"
              subtitle="You haven't created any hosted zones yet. Create one to start routing traffic for your domain."
              action={
                <Button
                  variant="primary"
                  onClick={() => router.push("/hosted-zones/create")}
                >
                  Create hosted zone
                </Button>
              }
            />
          )
        }
      />
      <DeleteZoneModal
        zone={zoneToDelete}
        onDismiss={() => setZoneToDelete(null)}
        onDeleted={() => setSelectedItems([])}
      />
    </>
  );

  return (
    <>
      {table}
      {splitPanelOpen && selectedZone && (
        <SplitPanel
          header={`Zone: ${displayFqdn(selectedZone.name)}`}
          i18nStrings={{
            preferencesTitle: "Preferences",
            preferencesPositionLabel: "Split panel position",
            preferencesPositionDescription:
              "Choose the default split panel position for the service.",
            preferencesPositionSide: "Side",
            preferencesPositionBottom: "Bottom",
            preferencesConfirm: "Confirm",
            preferencesCancel: "Cancel",
            closeButtonAriaLabel: "Close panel",
            openButtonAriaLabel: "Open panel",
            resizeHandleAriaLabel: "Slider",
          }}
        >
          <ZoneSidePanel zone={selectedZone} />
        </SplitPanel>
      )}
    </>
  );
}
