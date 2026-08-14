"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table from "@cloudscape-design/components/table";

interface ResolverEndpoint {
  name: string;
  id: string;
  vpc: string;
  status: string;
}

export default function ResolverInboundPage() {
  return (
    <ContentLayout header={<Header variant="h1">Inbound endpoints</Header>}>
      <Table<ResolverEndpoint>
        columnDefinitions={[
          { id: "name", header: "Endpoint name", cell: (i) => i.name },
          { id: "id", header: "ID", cell: (i) => i.id },
          { id: "vpc", header: "VPC", cell: (i) => i.vpc },
          { id: "status", header: "Status", cell: (i) => i.status },
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
            actions={<Button variant="primary">Create inbound endpoint</Button>}
          >
            Inbound endpoints
          </Header>
        }
        empty={
          <Box textAlign="center" padding="l">
            <SpaceBetween size="s">
              <Box><b>No inbound endpoints</b></Box>
              <Box color="text-body-secondary">Create an inbound endpoint to allow DNS queries from your network to Route 53 Resolver.</Box>
              <Button variant="primary">Create inbound endpoint</Button>
            </SpaceBetween>
          </Box>
        }
      />
    </ContentLayout>
  );
}
