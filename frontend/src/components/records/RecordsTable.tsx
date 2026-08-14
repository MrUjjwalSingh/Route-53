"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import Header from "@cloudscape-design/components/header";
import Pagination from "@cloudscape-design/components/pagination";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeleteRecordsModal } from "@/components/records/DeleteRecordsModal";
import { EmptyState } from "@/components/common/EmptyState";
import { TableHeaderActions } from "@/components/common/TableHeaderActions";
import { RECORD_TYPE_OPTIONS } from "@/lib/constants/recordTypes";
import { displayFqdn } from "@/lib/format";
import { useRecords } from "@/lib/hooks/useRecords";
import type { DnsRecord } from "@/lib/types";

const TYPE_OPTIONS = [
  { label: "Any type", value: "" },
  ...RECORD_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
  { label: "NS", value: "NS" },
  { label: "SOA", value: "SOA" },
];

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: "10 records" },
  { value: 20, label: "20 records" },
  { value: 50, label: "50 records" },
];

const MAX_VISIBLE_VALUES = 3;

export function RecordsTable({ zoneId }: { zoneId: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedItems, setSelectedItems] = useState<DnsRecord[]>([]);
  const [recordsToDelete, setRecordsToDelete] = useState<DnsRecord[]>([]);

  const { data, isLoading, isError, refetch } = useRecords(zoneId, {
    search: search || undefined,
    type: type || undefined,
    page,
    page_size: pageSize,
  });

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;
  const hasFilters = !!search || !!type;

  return (
    <>
      <Table<DnsRecord>
        columnDefinitions={[
          {
            id: "name",
            header: "Record name",
            cell: (item) => displayFqdn(item.name),
          },
          { id: "type", header: "Type", cell: (item) => item.type },
          { id: "routing_policy", header: "Routing policy", cell: (item) => item.routing_policy },
          { id: "alias", header: "Alias", cell: (item) => (item.alias ? "Yes" : "No") },
          {
            id: "values",
            header: "Value/Route traffic to",
            cell: (item) => {
              const shown = item.values.slice(0, MAX_VISIBLE_VALUES);
              const remaining = item.values.length - shown.length;
              return (
                <Box>
                  {shown.map((v) => (
                    <div key={v} style={{ whiteSpace: "pre-line" }}>
                      {v}
                    </div>
                  ))}
                  {remaining > 0 && (
                    <Box color="text-body-secondary">+{remaining} more</Box>
                  )}
                </Box>
              );
            },
          },
          { id: "ttl", header: "TTL (seconds)", cell: (item) => item.ttl ?? "-" },
          {
            id: "evaluate_target_health",
            header: "Evaluate target health",
            cell: (item) => (item.alias ? (item.evaluate_target_health ? "Yes" : "No") : "-"),
          },
          {
            id: "health_check_id",
            header: "Health check ID",
            cell: (item) => item.health_check_id ?? "-",
          },
        ]}
        items={items}
        loading={isLoading}
        loadingText="Loading records"
        trackBy="id"
        selectionType="multi"
        selectedItems={selectedItems}
        onSelectionChange={(event) => setSelectedItems(event.detail.selectedItems)}
        isItemDisabled={(item) => item.is_system}
        ariaLabels={{
          itemSelectionLabel: (_, item) =>
            item.is_system
              ? `${item.type} record cannot be deleted`
              : `Select ${item.name}`,
        }}
        variant="container"
        header={
          <Header
            variant="h2"
            counter={data ? `(${data.total})` : undefined}
            actions={
              <TableHeaderActions>
                <Button
                  disabled={selectedItems.length !== 1}
                  onClick={() =>
                    router.push(`/hosted-zones/${zoneId}/records/${selectedItems[0]?.id}/edit`)
                  }
                >
                  Edit record
                </Button>
                <Button
                  disabled={selectedItems.length === 0}
                  onClick={() => setRecordsToDelete(selectedItems)}
                >
                  Delete record
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push(`/hosted-zones/${zoneId}/records/create`)}
                >
                  Create record
                </Button>
              </TableHeaderActions>
            }
          >
            Records
          </Header>
        }
        filter={
          <SpaceBetween direction="horizontal" size="xs">
            <div style={{ minWidth: 320 }}>
              <TextFilter
                filteringText={search}
                filteringPlaceholder="Filter records by property or value"
                onChange={(event) => {
                  setSearch(event.detail.filteringText);
                  setPage(1);
                }}
              />
            </div>
            <Select
              selectedOption={TYPE_OPTIONS.find((o) => o.value === type) ?? TYPE_OPTIONS[0]}
              options={TYPE_OPTIONS}
              onChange={(event) => {
                setType(event.detail.selectedOption.value ?? "");
                setPage(1);
              }}
            />
          </SpaceBetween>
        }
        pagination={
          <Pagination
            currentPageIndex={page}
            pagesCount={totalPages}
            onChange={(event) => setPage(event.detail.currentPageIndex)}
          />
        }
        preferences={
          <CollectionPreferences
            title="Preferences"
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            preferences={{ pageSize }}
            pageSizePreference={{ title: "Page size", options: PAGE_SIZE_OPTIONS }}
            onConfirm={(event) => {
              setPageSize(event.detail.pageSize ?? 10);
              setPage(1);
            }}
          />
        }
        empty={
          isError ? (
            <EmptyState
              title="Unable to load records"
              subtitle="Something went wrong."
              action={<Button onClick={() => refetch()}>Retry</Button>}
            />
          ) : hasFilters ? (
            <EmptyState
              title="No matches"
              subtitle="We can't find a match."
              action={
                <Button
                  onClick={() => {
                    setSearch("");
                    setType("");
                    setPage(1);
                  }}
                >
                  Clear filter
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No records"
              subtitle="No records to display."
              action={
                <Button
                  variant="primary"
                  onClick={() => router.push(`/hosted-zones/${zoneId}/records/create`)}
                >
                  Create record
                </Button>
              }
            />
          )
        }
      />
      <DeleteRecordsModal
        zoneId={zoneId}
        records={recordsToDelete}
        onDismiss={() => setRecordsToDelete([])}
        onDeleted={() => setSelectedItems([])}
      />
    </>
  );
}
