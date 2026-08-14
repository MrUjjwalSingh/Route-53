"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: "2rem",
      }}
    >
      <Box textAlign="center">
        <SpaceBetween size="m">
          <Box variant="h1">Page not found</Box>
          <Box variant="p" color="text-body-secondary">
            The page you are looking for doesn&apos;t exist or has been moved.
          </Box>
          <Button variant="primary" onClick={() => router.push("/dashboard")}>
            Go to dashboard
          </Button>
        </SpaceBetween>
      </Box>
    </div>
  );
}
