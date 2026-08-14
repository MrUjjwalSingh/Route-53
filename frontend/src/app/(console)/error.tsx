"use client";

import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ContentLayout from "@cloudscape-design/components/content-layout";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useEffect } from "react";

export default function ConsoleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ContentLayout>
      <Box padding={{ vertical: "xxl" }}>
        <SpaceBetween size="m" alignItems="center">
          <Alert type="error" header="Something went wrong">
            An unexpected error occurred while rendering this page. You can try
            again, or head back to the dashboard.
          </Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => reset()}>Retry</Button>
            <Button variant="primary" onClick={() => (window.location.href = "/dashboard")}>
              Go to dashboard
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      </Box>
    </ContentLayout>
  );
}
