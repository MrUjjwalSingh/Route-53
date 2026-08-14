"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";
import Tabs from "@cloudscape-design/components/tabs";
import { useState } from "react";

interface ResolverEndpoint {
  name: string;
  id: string;
  status: string;
  vpc: string;
  ipCount: number;
}

interface ResolverRule {
  name: string;
  domain: string;
  type: string;
  endpoint: string;
  target: string;
}

function EmptyEndpoints({
  type,
  onCreate,
}: {
  type: "inbound" | "outbound";
  onCreate: () => void;
}) {
  return (
    <Box textAlign="center" padding="l">
      <SpaceBetween size="s">
        <Box>
          <b>No {type} endpoints</b>
        </Box>
        <Box color="text-body-secondary">
          {type === "inbound"
            ? "Create an inbound endpoint to allow DNS queries from your network to be resolved by Route 53 Resolver."
            : "Create an outbound endpoint to allow Route 53 Resolver to forward DNS queries from your VPCs to your network."}
        </Box>
        <Button variant="primary" onClick={onCreate}>
          Create {type} endpoint
        </Button>
      </SpaceBetween>
    </Box>
  );
}

export default function ResolverPage() {
  const [activeTab, setActiveTab] = useState("vpcs");

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Route 53 Resolver responds recursively to DNS queries from AWS resources for public records, VPC-specific DNS names, and private hosted zones. You can also configure Resolver to respond to queries from on-premises resources."
        >
          Route 53 Resolver
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Tabs
          activeTabId={activeTab}
          onChange={(e) => setActiveTab(e.detail.activeTabId)}
          tabs={[
            {
              id: "vpcs",
              label: "VPCs",
              content: (
                <SpaceBetween size="l">
                  <Container
                    header={
                      <Header
                        variant="h2"
                        description="View and configure DNS resolution settings for your VPCs."
                        actions={<Button>View VPCs in Amazon VPC</Button>}
                      >
                        VPCs
                      </Header>
                    }
                  >
                    <Box color="text-body-secondary" padding="l" textAlign="center">
                      <SpaceBetween size="s">
                        <Box><b>Configure VPC DNS settings</b></Box>
                        <Box>
                          To configure DNS settings for a VPC, go to the Amazon VPC console, select your VPC, and edit the DNS settings. Route 53 Resolver uses these settings to determine how to route DNS queries from your VPC.
                        </Box>
                        <Button>Go to Amazon VPC</Button>
                      </SpaceBetween>
                    </Box>
                  </Container>

                  <Container
                    header={<Header variant="h2">DNS query logging</Header>}
                  >
                    <SpaceBetween size="s">
                      <Box>
                        Log all DNS queries made by resources within the VPC. Logs include the query domain name, record type, response code, and other details.
                      </Box>
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button>Configure query logging</Button>
                      </SpaceBetween>
                    </SpaceBetween>
                  </Container>
                </SpaceBetween>
              ),
            },
            {
              id: "inbound",
              label: "Inbound endpoints",
              content: (
                <Table<ResolverEndpoint>
                  columnDefinitions={[
                    { id: "name", header: "Endpoint name", cell: (i) => i.name },
                    { id: "id", header: "ID", cell: (i) => i.id },
                    {
                      id: "status",
                      header: "Status",
                      cell: (i) => (
                        <StatusIndicator type="success">{i.status}</StatusIndicator>
                      ),
                    },
                    { id: "vpc", header: "VPC", cell: (i) => i.vpc },
                    { id: "ipCount", header: "IP address count", cell: (i) => i.ipCount },
                    { id: "direction", header: "Direction", cell: () => "INBOUND" },
                  ]}
                  items={[]}
                  trackBy="id"
                  selectionType="multi"
                  onSelectionChange={() => {}}
                  selectedItems={[]}
                  variant="full-page"
                  header={
                    <Header
                      variant="h2"
                      counter="(0)"
                      description="Inbound endpoints allow DNS resolvers on your network to forward DNS queries to Route 53 Resolver."
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button disabled>Edit</Button>
                          <Button disabled>Delete</Button>
                          <Button variant="primary">Create inbound endpoint</Button>
                        </SpaceBetween>
                      }
                    >
                      Inbound endpoints
                    </Header>
                  }
                  empty={<EmptyEndpoints type="inbound" onCreate={() => {}} />}
                />
              ),
            },
            {
              id: "outbound",
              label: "Outbound endpoints",
              content: (
                <Table<ResolverEndpoint>
                  columnDefinitions={[
                    { id: "name", header: "Endpoint name", cell: (i) => i.name },
                    { id: "id", header: "ID", cell: (i) => i.id },
                    {
                      id: "status",
                      header: "Status",
                      cell: (i) => (
                        <StatusIndicator type="success">{i.status}</StatusIndicator>
                      ),
                    },
                    { id: "vpc", header: "VPC", cell: (i) => i.vpc },
                    { id: "ipCount", header: "IP address count", cell: (i) => i.ipCount },
                    { id: "direction", header: "Direction", cell: () => "OUTBOUND" },
                  ]}
                  items={[]}
                  trackBy="id"
                  selectionType="multi"
                  onSelectionChange={() => {}}
                  selectedItems={[]}
                  variant="full-page"
                  header={
                    <Header
                      variant="h2"
                      counter="(0)"
                      description="Outbound endpoints allow Route 53 Resolver to forward DNS queries to resolvers on your network."
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button disabled>Edit</Button>
                          <Button disabled>Delete</Button>
                          <Button variant="primary">Create outbound endpoint</Button>
                        </SpaceBetween>
                      }
                    >
                      Outbound endpoints
                    </Header>
                  }
                  empty={<EmptyEndpoints type="outbound" onCreate={() => {}} />}
                />
              ),
            },
            {
              id: "rules",
              label: "Rules",
              content: (
                <Table<ResolverRule>
                  columnDefinitions={[
                    { id: "name", header: "Rule name", cell: (i) => i.name },
                    { id: "domain", header: "Domain name", cell: (i) => i.domain },
                    { id: "type", header: "Rule type", cell: (i) => i.type },
                    { id: "endpoint", header: "Outbound endpoint", cell: (i) => i.endpoint },
                    { id: "target", header: "Target IP", cell: (i) => i.target },
                  ]}
                  items={[]}
                  trackBy="name"
                  selectionType="multi"
                  onSelectionChange={() => {}}
                  selectedItems={[]}
                  variant="full-page"
                  header={
                    <Header
                      variant="h2"
                      counter="(0)"
                      description="Create rules to route DNS queries from your VPCs to your network."
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button disabled>Edit</Button>
                          <Button disabled>Delete</Button>
                          <Button variant="primary">Create rule</Button>
                        </SpaceBetween>
                      }
                    >
                      Rules
                    </Header>
                  }
                  empty={
                    <Box textAlign="center" padding="l">
                      <SpaceBetween size="s">
                        <Box><b>No rules</b></Box>
                        <Box color="text-body-secondary">
                          Create rules to specify which DNS queries Route 53 Resolver should forward to resolvers on your network.
                        </Box>
                        <Button variant="primary">Create rule</Button>
                      </SpaceBetween>
                    </Box>
                  }
                />
              ),
            },
            {
              id: "query-logging",
              label: "Query logging",
              content: (
                <Container
                  header={
                    <Header
                      variant="h2"
                      description="Log DNS queries that originate from your VPCs."
                      actions={
                        <Button variant="primary">Configure query logging</Button>
                      }
                    >
                      Query logging configurations
                    </Header>
                  }
                >
                  <Box textAlign="center" padding="l">
                    <SpaceBetween size="s">
                      <Box><b>No query logging configurations</b></Box>
                      <Box color="text-body-secondary">
                        Query logging lets you log all DNS queries made by resources within your VPC to an Amazon CloudWatch Logs log group, Amazon S3 bucket, or Amazon Data Firehose delivery stream.
                      </Box>
                      <Button variant="primary">Configure query logging</Button>
                    </SpaceBetween>
                  </Box>
                </Container>
              ),
            },
          ]}
        />
      </SpaceBetween>
    </ContentLayout>
  );
}
