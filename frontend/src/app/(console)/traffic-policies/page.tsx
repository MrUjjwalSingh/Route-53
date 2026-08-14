"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import ContentLayout from "@cloudscape-design/components/content-layout";

import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import Modal from "@cloudscape-design/components/modal";
import Pagination from "@cloudscape-design/components/pagination";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table from "@cloudscape-design/components/table";
import Tabs from "@cloudscape-design/components/tabs";
import Textarea from "@cloudscape-design/components/textarea";
import TextFilter from "@cloudscape-design/components/text-filter";
import { useState } from "react";

interface TrafficPolicy {
  id: string;
  name: string;
  version: number;
  description: string;
  type: string;
  updatedAt: string;
}

interface PolicyRecord {
  id: string;
  name: string;
  policyName: string;
  type: string;
  dnsName: string;
  hostedZone: string;
  ttl: number;
}

const ROUTING_TYPES = [
  { label: "Failover", value: "Failover" },
  { label: "Geolocation", value: "Geolocation" },
  { label: "Geoproximity", value: "Geoproximity" },
  { label: "Latency", value: "Latency" },
  { label: "Multivalue answer", value: "Multivalue" },
  { label: "Weighted", value: "Weighted" },
];

export default function TrafficPoliciesPage() {
  const [activeTab, setActiveTab] = useState("policies");
  const [policies] = useState<TrafficPolicy[]>([]);
  const [policyRecords] = useState<PolicyRecord[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<TrafficPolicy[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<PolicyRecord[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Create wizard state
  const [policyName, setPolicyName] = useState("");
  const [policyVersion, setPolicyVersion] = useState("1");
  const [policyDescription, setPolicyDescription] = useState("");
  const [policyType, setPolicyType] = useState({ label: "Failover", value: "Failover" });

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Create sophisticated routing configurations that route traffic based on multiple criteria."
        >
          Traffic management
        </Header>
      }
    >
      <Tabs
        activeTabId={activeTab}
        onChange={(e) => setActiveTab(e.detail.activeTabId)}
        tabs={[
          {
            id: "policies",
            label: "Traffic policies",
            content: (
              <SpaceBetween size="l">
                <Table<TrafficPolicy>
                  columnDefinitions={[
                    {
                      id: "name",
                      header: "Policy name",
                      cell: (item) => (
                        <Box color="text-status-info">{item.name}</Box>
                      ),
                      sortingField: "name",
                    },
                    { id: "version", header: "Latest version", cell: (item) => item.version },
                    { id: "type", header: "DNS type", cell: (item) => item.type },
                    {
                      id: "description",
                      header: "Description",
                      cell: (item) => item.description || "—",
                    },
                    {
                      id: "updatedAt",
                      header: "Last modified",
                      cell: (item) => item.updatedAt,
                    },
                  ]}
                  items={policies}
                  loading={false}
                  trackBy="id"
                  selectionType="multi"
                  selectedItems={selectedPolicies}
                  onSelectionChange={(e) =>
                    setSelectedPolicies(e.detail.selectedItems)
                  }
                  variant="full-page"
                  header={
                    <Header
                      variant="h2"
                      counter={`(${policies.length})`}
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button disabled={selectedPolicies.length !== 1}>
                            Edit
                          </Button>
                          <Button disabled={selectedPolicies.length === 0}>
                            Delete
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => setShowCreate(true)}
                          >
                            Create traffic policy
                          </Button>
                        </SpaceBetween>
                      }
                    >
                      Traffic policies
                    </Header>
                  }
                  filter={
                    <TextFilter
                      filteringText={search}
                      filteringPlaceholder="Search traffic policies"
                      onChange={(e) => {
                        setSearch(e.detail.filteringText);
                        setPage(1);
                      }}
                    />
                  }
                  pagination={
                    <Pagination
                      currentPageIndex={page}
                      pagesCount={1}
                      onChange={(e) => setPage(e.detail.currentPageIndex)}
                    />
                  }
                  empty={
                    <Box textAlign="center" padding="l">
                      <SpaceBetween size="s">
                        <Box>
                          <b>No traffic policies</b>
                        </Box>
                        <Box color="text-body-secondary">
                          You don&apos;t have any traffic policies. Create one to get started with advanced routing.
                        </Box>
                        <Button variant="primary" onClick={() => setShowCreate(true)}>
                          Create traffic policy
                        </Button>
                      </SpaceBetween>
                    </Box>
                  }
                />

                <Container
                  header={<Header variant="h2">About traffic policies</Header>}
                >
                  <SpaceBetween size="s">
                    <Box variant="p">
                      A traffic policy is a set of rules that Route 53 follows when responding to requests for a domain name or subdomain. You can use traffic policies to route traffic based on:
                    </Box>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li><Box display="inline"><b>Failover</b> — Route traffic to a backup resource if your primary resource is unhealthy.</Box></li>
                      <li><Box display="inline"><b>Geolocation</b> — Route traffic based on the location of your users.</Box></li>
                      <li><Box display="inline"><b>Geoproximity</b> — Route traffic based on the location of your resources.</Box></li>
                      <li><Box display="inline"><b>Latency</b> — Route traffic to the region that provides the lowest latency.</Box></li>
                      <li><Box display="inline"><b>Weighted</b> — Route a specified percentage of traffic to each resource.</Box></li>
                    </ul>
                  </SpaceBetween>
                </Container>
              </SpaceBetween>
            ),
          },
          {
            id: "records",
            label: "Policy records",
            content: (
              <Table<PolicyRecord>
                columnDefinitions={[
                  {
                    id: "name",
                    header: "DNS name",
                    cell: (item) => item.name,
                    sortingField: "name",
                  },
                  { id: "type", header: "Type", cell: (item) => item.type },
                  {
                    id: "policyName",
                    header: "Traffic policy",
                    cell: (item) => item.policyName,
                  },
                  {
                    id: "hostedZone",
                    header: "Hosted zone",
                    cell: (item) => item.hostedZone,
                  },
                  { id: "ttl", header: "TTL", cell: (item) => item.ttl },
                ]}
                items={policyRecords}
                loading={false}
                trackBy="id"
                selectionType="multi"
                selectedItems={selectedRecords}
                onSelectionChange={(e) =>
                  setSelectedRecords(e.detail.selectedItems)
                }
                variant="full-page"
                header={
                  <Header
                    variant="h2"
                    counter={`(${policyRecords.length})`}
                    actions={
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button disabled={selectedRecords.length === 0}>Delete</Button>
                        <Button variant="primary" disabled={policies.length === 0}>
                          Create policy record
                        </Button>
                      </SpaceBetween>
                    }
                  >
                    Policy records
                  </Header>
                }
                empty={
                  <Box textAlign="center" padding="l">
                    <SpaceBetween size="s">
                      <Box><b>No policy records</b></Box>
                      <Box color="text-body-secondary">
                        Create a traffic policy first, then create a policy record to route traffic using that policy.
                      </Box>
                    </SpaceBetween>
                  </Box>
                }
              />
            ),
          },
        ]}
      />

      {/* Create Traffic Policy Modal */}
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        size="large"
        header="Create traffic policy"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setShowCreate(false)}>
                Next
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <SpaceBetween size="l">
            <FormField
              label="Policy name"
              description="Assign a name to this traffic policy."
              constraintText="Use only alphanumeric characters, hyphens, and underscores."
            >
              <Input
                value={policyName}
                onChange={(e) => setPolicyName(e.detail.value)}
                placeholder="e.g., my-failover-policy"
              />
            </FormField>

            <FormField
              label="Version"
              description="Route 53 automatically assigns a version number when you create a traffic policy. You can also create new versions of an existing policy."
            >
              <Input
                type="number"
                value={policyVersion}
                onChange={(e) => setPolicyVersion(e.detail.value)}
                disabled
              />
            </FormField>

            <FormField
              label="DNS type"
              description="The DNS type of the records that Route 53 will create based on this traffic policy."
            >
              <Select
                selectedOption={policyType}
                onChange={(e) =>
                  setPolicyType(
                    e.detail.selectedOption as { label: string; value: string }
                  )
                }
                options={[
                  { label: "A – Routes traffic to an IPv4 address", value: "A" },
                  { label: "AAAA – Routes traffic to an IPv6 address", value: "AAAA" },
                  { label: "CNAME – Routes traffic to a domain name", value: "CNAME" },
                ]}
              />
            </FormField>

            <FormField
              label="Routing type"
              description="Choose the type of routing for the first endpoint in your policy."
            >
              <Select
                selectedOption={policyType}
                onChange={(e) =>
                  setPolicyType(
                    e.detail.selectedOption as { label: string; value: string }
                  )
                }
                options={ROUTING_TYPES}
              />
            </FormField>

            <FormField
              label="Description"
              description="Enter a comment to describe the traffic policy."
            >
              <Textarea
                value={policyDescription}
                onChange={(e) => setPolicyDescription(e.detail.value)}
                placeholder="Optional description"
                rows={3}
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </ContentLayout>
  );
}
