"use client";

import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <Box textAlign="center" color="inherit" padding={{ vertical: "xxl" }}>
      <SpaceBetween size="m" alignItems="center">
        <div>
          <Box variant="strong" color="inherit">
            {title}
          </Box>
          <Box padding={{ top: "xxs" }} variant="p" color="inherit">
            {subtitle}
          </Box>
        </div>
        {action}
      </SpaceBetween>
    </Box>
  );
}
