"use client";

import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

export interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <ContentLayout header={<Header variant="h1">{title}</Header>}>
      <Container>
        <Box textAlign="center" padding={{ vertical: "xxl" }}>
          <SpaceBetween size="m" alignItems="center">
            <StatusIndicator type="info">Coming soon</StatusIndicator>
            <Box variant="p" color="text-body-secondary">
              {description}
            </Box>
          </SpaceBetween>
        </Box>
      </Container>
    </ContentLayout>
  );
}
