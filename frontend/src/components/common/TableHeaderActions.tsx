"use client";

import SpaceBetween from "@cloudscape-design/components/space-between";
import type { ReactNode } from "react";

export function TableHeaderActions({ children }: { children: ReactNode }) {
  return (
    <SpaceBetween direction="horizontal" size="xs">
      {children}
    </SpaceBetween>
  );
}
