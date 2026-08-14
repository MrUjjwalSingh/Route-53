"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table from "@cloudscape-design/components/table";

interface DomainTransfer {
  domain: string;
  direction: string;
  status: string;
  started: string;
}

export default function TransfersPage() {
  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Transfer domain names into or out of Route 53."
        >
          Transfers
        </Header>
      }
    >
      <Table<DomainTransfer>
        columnDefinitions={[
          { id: "domain", header: "Domain name", cell: (i) => i.domain },
          { id: "direction", header: "Direction", cell: (i) => i.direction },
          { id: "status", header: "Status", cell: (i) => i.status },
          { id: "started", header: "Transfer started", cell: (i) => i.started },
        ]}
        items={[]}
        trackBy="domain"
        selectionType="single"
        onSelectionChange={() => {}}
        selectedItems={[]}
        variant="full-page"
        header={<Header variant="h2" counter="(0)">Transfers</Header>}
        empty={
          <Box textAlign="center" padding="l">
            <SpaceBetween size="s">
              <Box><b>No transfers in progress</b></Box>
              <Box color="text-body-secondary">
                You don&apos;t have any domain transfers in progress.
              </Box>
              <Button variant="primary" onClick={() => {}}>Transfer domain to Route 53</Button>
            </SpaceBetween>
          </Box>
        }
      />
    </ContentLayout>
  );
}
