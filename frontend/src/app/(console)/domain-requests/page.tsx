"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table from "@cloudscape-design/components/table";

interface DomainRequest {
  domain: string;
  type: string;
  status: string;
  submitted: string;
}

export default function DomainRequestsPage() {
  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="View pending domain registration and transfer requests."
        >
          Requests
        </Header>
      }
    >
      <Table<DomainRequest>
        columnDefinitions={[
          { id: "domain", header: "Domain name", cell: (i) => i.domain },
          { id: "type", header: "Request type", cell: (i) => i.type },
          { id: "status", header: "Status", cell: (i) => i.status },
          { id: "submitted", header: "Submitted", cell: (i) => i.submitted },
        ]}
        items={[]}
        trackBy="domain"
        selectionType="single"
        onSelectionChange={() => {}}
        selectedItems={[]}
        variant="full-page"
        header={<Header variant="h2" counter="(0)">Pending requests</Header>}
        empty={
          <Box textAlign="center" padding="l">
            <SpaceBetween size="s">
              <Box><b>No pending requests</b></Box>
              <Box color="text-body-secondary">
                You don&apos;t have any pending domain registration or transfer requests.
              </Box>
              <Button variant="primary" onClick={() => {}}>Register domain</Button>
            </SpaceBetween>
          </Box>
        }
      />
    </ContentLayout>
  );
}
