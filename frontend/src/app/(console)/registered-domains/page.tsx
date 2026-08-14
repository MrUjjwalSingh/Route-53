"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import { useState } from "react";

interface RegisteredDomain {
  name: string;
  status: string;
  expires: string;
  autoRenew: string;
  transfer: string;
}

export default function RegisteredDomainsPage() {
  const [search, setSearch] = useState("");
  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="View and manage domain names registered through Route 53."
          actions={<Button variant="primary">Register domain</Button>}
        >
          Registered domains
        </Header>
      }
    >
      <Table<RegisteredDomain>
        columnDefinitions={[
          { id: "name", header: "Domain name", cell: (i) => i.name },
          { id: "status", header: "Status", cell: (i) => i.status },
          { id: "expires", header: "Expiration date", cell: (i) => i.expires },
          { id: "autoRenew", header: "Auto-renew", cell: (i) => i.autoRenew },
          { id: "transfer", header: "Transfer lock", cell: (i) => i.transfer },
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
                <Button disabled>Renew domain</Button>
                <Button disabled>Transfer domain</Button>
                <Button variant="primary">Register domain</Button>
              </SpaceBetween>
            }
          >
            Registered domains
          </Header>
        }
        filter={
          <TextFilter
            filteringText={search}
            filteringPlaceholder="Search domains"
            onChange={(e) => setSearch(e.detail.filteringText)}
          />
        }
        empty={
          <Box textAlign="center" padding="l">
            <SpaceBetween size="s">
              <Box><b>No registered domains</b></Box>
              <Box color="text-body-secondary">
                You haven&apos;t registered any domains with Route 53. Register a new domain or transfer an existing domain to Route 53.
              </Box>
              <SpaceBetween direction="horizontal" size="xs">
                <Button>Transfer domain</Button>
                <Button variant="primary">Register domain</Button>
              </SpaceBetween>
            </SpaceBetween>
          </Box>
        }
      />
    </ContentLayout>
  );
}
