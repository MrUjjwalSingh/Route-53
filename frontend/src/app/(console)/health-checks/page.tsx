"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Container from "@cloudscape-design/components/container";
import ContentLayout from "@cloudscape-design/components/content-layout";
import CopyToClipboard from "@cloudscape-design/components/copy-to-clipboard";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import Modal from "@cloudscape-design/components/modal";
import Pagination from "@cloudscape-design/components/pagination";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import Tiles from "@cloudscape-design/components/tiles";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { TableHeaderActions } from "@/components/common/TableHeaderActions";
import { ApiError } from "@/lib/api/client";
import {
  useCreateHealthCheck,
  useDeleteHealthCheck,
  useHealthChecks,
  useUpdateHealthCheck,
} from "@/lib/hooks/useHealthChecks";
import { useNotifications } from "@/lib/hooks/useNotifications";
import type { HealthCheck, HealthCheckMonitorType, HealthCheckProtocol } from "@/lib/types";

const PROTOCOL_OPTIONS = [
  { label: "HTTP", value: "HTTP" },
  { label: "HTTPS", value: "HTTPS" },
  { label: "TCP", value: "TCP" },
];

const INTERVAL_OPTIONS = [
  { label: "30 seconds (standard)", value: "30" },
  { label: "10 seconds (fast)", value: "10" },
];

const THRESHOLD_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  label: String(i + 1),
  value: String(i + 1),
}));

function statusType(status: string): "success" | "error" | "pending" | "in-progress" {
  if (status === "HEALTHY") return "success";
  if (status === "UNHEALTHY") return "error";
  return "pending";
}

function statusLabel(status: string): string {
  if (status === "HEALTHY") return "Healthy";
  if (status === "UNHEALTHY") return "Unhealthy";
  return "Unknown";
}

interface CreateFormState {
  name: string;
  monitorType: HealthCheckMonitorType;
  protocol: { label: string; value: string };
  domainOrIp: "domain" | "ip";
  domainName: string;
  ipAddress: string;
  port: string;
  path: string;
  interval: { label: string; value: string };
  failureThreshold: { label: string; value: string };
  enableSni: boolean;
}

function defaultCreateState(): CreateFormState {
  return {
    name: "",
    monitorType: "endpoint",
    protocol: { label: "HTTPS", value: "HTTPS" },
    domainOrIp: "domain",
    domainName: "",
    ipAddress: "",
    port: "443",
    path: "/",
    interval: { label: "30 seconds (standard)", value: "30" },
    failureThreshold: { label: "3", value: "3" },
    enableSni: true,
  };
}

export default function HealthChecksPage() {
  const { push } = useNotifications();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedItems, setSelectedItems] = useState<HealthCheck[]>([]);
  const [search, setSearch] = useState("");

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // Create/edit form state
  const [form, setForm] = useState<CreateFormState>(defaultCreateState());
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useHealthChecks({ page, page_size: pageSize });
  const createHC = useCreateHealthCheck();
  const deleteHC = useDeleteHealthCheck();
  const editHC = useUpdateHealthCheck(selectedItems[0]?.id ?? "");

  const items = (data?.items ?? []).filter(
    (hc) =>
      !search ||
      (hc.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (hc.domain_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (hc.ip_address ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = data?.total_pages ?? 1;

  function openCreate() {
    setForm(defaultCreateState());
    setFormError(null);
    setShowCreate(true);
  }

  function openEdit() {
    const hc = selectedItems[0];
    if (!hc) return;
    setForm({
      name: hc.name ?? "",
      monitorType: hc.monitor_type,
      protocol: { label: hc.protocol, value: hc.protocol },
      domainOrIp: hc.ip_address ? "ip" : "domain",
      domainName: hc.domain_name ?? "",
      ipAddress: hc.ip_address ?? "",
      port: String(hc.port),
      path: hc.resource_path ?? "/",
      interval: { label: `${hc.request_interval} seconds`, value: String(hc.request_interval) },
      failureThreshold: { label: String(hc.failure_threshold), value: String(hc.failure_threshold) },
      enableSni: hc.enable_sni,
    });
    setFormError(null);
    setShowEdit(true);
  }

  async function handleCreate() {
    setFormError(null);
    if (form.monitorType === "endpoint" && !form.domainName && !form.ipAddress) {
      setFormError("Please specify a domain name or IP address.");
      return;
    }
    try {
      await createHC.mutateAsync({
        name: form.name || undefined,
        monitor_type: form.monitorType,
        protocol: form.protocol.value as HealthCheckProtocol,
        domain_name: form.domainOrIp === "domain" ? form.domainName || undefined : undefined,
        ip_address: form.domainOrIp === "ip" ? form.ipAddress || undefined : undefined,
        port: parseInt(form.port, 10) || 443,
        resource_path: form.protocol.value !== "TCP" ? form.path || "/" : undefined,
        request_interval: parseInt(form.interval.value, 10) || 30,
        failure_threshold: parseInt(form.failureThreshold.value, 10) || 3,
        measure_latency: false,
        inverted: false,
        enable_sni: form.enableSni,
      });
      push({ type: "success", content: "Health check created successfully." });
      setShowCreate(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to create health check.");
    }
  }

  async function handleEdit() {
    setFormError(null);
    try {
      await editHC.mutateAsync({
        name: form.name || undefined,
        protocol: form.protocol.value as HealthCheckProtocol,
        domain_name: form.domainOrIp === "domain" ? form.domainName || undefined : undefined,
        ip_address: form.domainOrIp === "ip" ? form.ipAddress || undefined : undefined,
        port: parseInt(form.port, 10) || 443,
        resource_path: form.protocol.value !== "TCP" ? form.path || "/" : undefined,
        request_interval: parseInt(form.interval.value, 10) || 30,
        failure_threshold: parseInt(form.failureThreshold.value, 10) || 3,
        enable_sni: form.enableSni,
      });
      push({ type: "success", content: "Health check updated successfully." });
      setShowEdit(false);
      setSelectedItems([]);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to update health check.");
    }
  }

  async function handleDelete() {
    const toDelete = selectedItems;
    try {
      await Promise.all(toDelete.map((hc) => deleteHC.mutateAsync(hc.id)));
      push({
        type: "success",
        content: `${toDelete.length} health check${toDelete.length > 1 ? "s" : ""} deleted successfully.`,
      });
      setSelectedItems([]);
      setShowDelete(false);
    } catch (err) {
      push({
        type: "error",
        content: err instanceof ApiError ? err.message : "Failed to delete health check.",
      });
      setShowDelete(false);
    }
  }

  const endpointForm = (
    <SpaceBetween size="l">
      <FormField label="Protocol">
        <Select
          selectedOption={form.protocol}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              protocol: e.detail.selectedOption as { label: string; value: string },
              port: e.detail.selectedOption.value === "HTTP" ? "80" :
                    e.detail.selectedOption.value === "TCP"  ? "80" : "443",
            }))
          }
          options={PROTOCOL_OPTIONS}
        />
      </FormField>

      <FormField label="Specify endpoint by">
        <RadioGroup
          value={form.domainOrIp}
          onChange={(e) => setForm((f) => ({ ...f, domainOrIp: e.detail.value as "domain" | "ip" }))}
          items={[
            { value: "domain", label: "Domain name" },
            { value: "ip", label: "IP address" },
          ]}
        />
      </FormField>

      <FormField
        label={form.domainOrIp === "domain" ? "Domain name" : "IP address"}
        description={
          form.domainOrIp === "domain"
            ? "Enter the fully qualified domain name (FQDN) of the endpoint."
            : "Enter the IPv4 or IPv6 address of the endpoint."
        }
      >
        {form.domainOrIp === "domain" ? (
          <Input
            value={form.domainName}
            onChange={(e) => setForm((f) => ({ ...f, domainName: e.detail.value }))}
            placeholder="example.com"
          />
        ) : (
          <Input
            value={form.ipAddress}
            onChange={(e) => setForm((f) => ({ ...f, ipAddress: e.detail.value }))}
            placeholder="192.0.2.1"
          />
        )}
      </FormField>

      <FormField label="Port">
        <Input
          type="number"
          value={form.port}
          onChange={(e) => setForm((f) => ({ ...f, port: e.detail.value }))}
        />
      </FormField>

      {form.protocol.value !== "TCP" && (
        <FormField
          label="Path"
          description="Specify the path for Route 53 to request when performing health checks."
        >
          <Input
            value={form.path}
            onChange={(e) => setForm((f) => ({ ...f, path: e.detail.value }))}
            placeholder="/"
          />
        </FormField>
      )}

      <FormField label="Request interval" description="How often Route 53 sends a request to the endpoint.">
        <Select
          selectedOption={form.interval}
          onChange={(e) =>
            setForm((f) => ({ ...f, interval: e.detail.selectedOption as { label: string; value: string } }))
          }
          options={INTERVAL_OPTIONS}
        />
      </FormField>

      <FormField label="Failure threshold" description="The number of consecutive health check failures before Route 53 considers the endpoint unhealthy.">
        <Select
          selectedOption={form.failureThreshold}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              failureThreshold: e.detail.selectedOption as { label: string; value: string },
            }))
          }
          options={THRESHOLD_OPTIONS}
        />
      </FormField>
    </SpaceBetween>
  );

  const modalForm = (
    <Form errorText={formError}>
      <SpaceBetween size="l">
        <FormField
          label="Name"
          description="An optional name to identify this health check."
        >
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.detail.value }))}
            placeholder="e.g., my-website-health-check"
          />
        </FormField>

        {!showEdit && (
          <FormField label="What do you want to monitor?">
            <Tiles
              value={form.monitorType}
              onChange={(e) =>
                setForm((f) => ({ ...f, monitorType: e.detail.value as HealthCheckMonitorType }))
              }
              items={[
                {
                  value: "endpoint",
                  label: "Endpoint",
                  description: "Monitor an HTTP, HTTPS, or TCP endpoint.",
                },
                {
                  value: "calculated",
                  label: "Status of other health checks (calculated)",
                  description: "Monitor the health of up to 256 other health checks.",
                },
                {
                  value: "cloudwatch",
                  label: "State of CloudWatch alarm",
                  description: "Monitor a CloudWatch alarm.",
                },
              ]}
            />
          </FormField>
        )}

        {form.monitorType === "endpoint" && endpointForm}

        {form.monitorType === "calculated" && (
          <Box color="text-body-secondary">
            Calculated health checks aggregate the status of other health checks. Configure child health checks from the Health checks table after creation.
          </Box>
        )}

        {form.monitorType === "cloudwatch" && (
          <Box color="text-body-secondary">
            CloudWatch alarm-based health checks are determined by the state of a CloudWatch alarm you specify. Integration with CloudWatch is simulated in this environment.
          </Box>
        )}
      </SpaceBetween>
    </Form>
  );

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Monitor the health of your resources using health checks. Route 53 can use health check status to route traffic away from unhealthy endpoints."
        >
          Health checks
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Table<HealthCheck>
          columnDefinitions={[
            {
              id: "name",
              header: "Name",
              cell: (item) => item.name || <Box color="text-body-secondary">—</Box>,
              sortingField: "name",
            },
            {
              id: "id",
              header: "ID",
              cell: (item) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Box fontSize="body-s" color="text-status-info">{item.id}</Box>
                  <CopyToClipboard
                    copyButtonAriaLabel="Copy ID"
                    copyErrorText="Failed to copy"
                    copySuccessText="Copied"
                    textToCopy={item.id}
                    variant="icon"
                  />
                </SpaceBetween>
              ),
            },
            {
              id: "protocol",
              header: "Protocol",
              cell: (item) => item.protocol,
            },
            {
              id: "domain",
              header: "Domain name / IP",
              cell: (item) => item.domain_name ?? item.ip_address ?? "—",
            },
            {
              id: "port",
              header: "Port",
              cell: (item) => item.port,
            },
            {
              id: "path",
              header: "Path",
              cell: (item) => item.resource_path || "—",
            },
            {
              id: "interval",
              header: "Request interval",
              cell: (item) => `${item.request_interval} seconds`,
            },
            {
              id: "status",
              header: "Status",
              cell: (item) => (
                <StatusIndicator type={statusType(item.status)}>
                  {statusLabel(item.status)}
                </StatusIndicator>
              ),
            },
          ]}
          items={items}
          loading={isLoading}
          loadingText="Loading health checks"
          trackBy="id"
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={(e) => setSelectedItems(e.detail.selectedItems)}
          variant="full-page"
          header={
            <Header
              variant="h1"
              counter={data ? `(${data.total})` : undefined}
              description="Health checks monitor the health of your endpoints."
              actions={
                <TableHeaderActions>
                  <Button
                    disabled={selectedItems.length !== 1}
                    onClick={openEdit}
                  >
                    Edit
                  </Button>
                  <Button
                    disabled={selectedItems.length === 0}
                    onClick={() => setShowDelete(true)}
                  >
                    Delete
                  </Button>
                  <Button variant="primary" onClick={openCreate}>
                    Create health check
                  </Button>
                </TableHeaderActions>
              }
            >
              Health checks
            </Header>
          }
          filter={
            <TextFilter
              filteringText={search}
              filteringPlaceholder="Search health checks"
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
                  { value: 10, label: "10 health checks" },
                  { value: 20, label: "20 health checks" },
                  { value: 50, label: "50 health checks" },
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
                title="Unable to load health checks"
                subtitle="Something went wrong. Please try again."
                action={<Button onClick={() => refetch()}>Retry</Button>}
              />
            ) : search ? (
              <EmptyState
                title="No matches"
                subtitle="No health checks match your search."
                action={<Button onClick={() => setSearch("")}>Clear filter</Button>}
              />
            ) : (
              <EmptyState
                title="No health checks"
                subtitle="You don't have any health checks. Create one to start monitoring your endpoints."
                action={
                  <Button variant="primary" onClick={openCreate}>
                    Create health check
                  </Button>
                }
              />
            )
          }
        />

        {/* Info card */}
        <Container header={<Header variant="h2">About health checks</Header>}>
          <ColumnLayout columns={3} variant="text-grid">
            <SpaceBetween size="s">
              <Box variant="awsui-key-label">Monitor an endpoint</Box>
              <Box variant="p" color="text-body-secondary">
                Route 53 health checkers connect to your endpoint to determine if it&apos;s healthy. Supports HTTP, HTTPS, and TCP protocols.
              </Box>
            </SpaceBetween>
            <SpaceBetween size="s">
              <Box variant="awsui-key-label">Calculated health check</Box>
              <Box variant="p" color="text-body-secondary">
                Route 53 determines health based on the health checks you specify. Configure up to 256 child health checks.
              </Box>
            </SpaceBetween>
            <SpaceBetween size="s">
              <Box variant="awsui-key-label">CloudWatch alarm</Box>
              <Box variant="p" color="text-body-secondary">
                Route 53 determines health based on the state of a CloudWatch alarm. Use for complex monitoring scenarios.
              </Box>
            </SpaceBetween>
          </ColumnLayout>
        </Container>
      </SpaceBetween>

      {/* Create Modal */}
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        size="large"
        header="Create health check"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={createHC.isPending}
                onClick={handleCreate}
              >
                Create health check
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        {modalForm}
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEdit}
        onDismiss={() => setShowEdit(false)}
        size="large"
        header={`Edit health check${selectedItems[0]?.name ? `: ${selectedItems[0].name}` : ""}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={editHC.isPending}
                onClick={handleEdit}
              >
                Save changes
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        {modalForm}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDelete}
        onDismiss={() => setShowDelete(false)}
        size="medium"
        header={`Delete health check${selectedItems.length > 1 ? "s" : ""}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowDelete(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={deleteHC.isPending}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box variant="p">
            Are you sure you want to delete{" "}
            {selectedItems.length === 1 ? (
              <>
                the health check <strong>{selectedItems[0]?.name ?? selectedItems[0]?.id}</strong>
              </>
            ) : (
              <><strong>{selectedItems.length}</strong> health checks</>
            )}
            ? This action cannot be undone.
          </Box>
          {selectedItems.length > 0 && (
            <Box color="text-body-secondary" fontSize="body-s">
              {selectedItems.map((hc) => hc.name ?? hc.id).join(", ")}
            </Box>
          )}
        </SpaceBetween>
      </Modal>
    </ContentLayout>
  );
}
