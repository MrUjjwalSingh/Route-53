"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table from "@cloudscape-design/components/table";

interface PolicyRecord {
  name: string;
  type: string;
  policy: string;
  hostedZone: string;
  ttl: number;
}

export default function PolicyRecordsPage() {
  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Policy records associate a traffic policy with a DNS record in a hosted zone."
        >
          Policy records
        </Header>
      }
    >
      <Table<PolicyRecord>
        columnDefinitions={[
          { id: "name", header: "DNS name", cell: (i) => i.name },
          { id: "type", header: "Type", cell: (i) => i.type },
          { id: "policy", header: "Traffic policy", cell: (i) => i.policy },
          { id: "hostedZone", header: "Hosted zone", cell: (i) => i.hostedZone },
          { id: "ttl", header: "TTL", cell: (i) => i.ttl },
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
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button disabled>Delete</Button>
                <Button variant="primary">Create policy record</Button>
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
                Create a traffic policy first, then create a policy record.
              </Box>
            </SpaceBetween>
          </Box>
        }
      />
    </ContentLayout>
  );
}
