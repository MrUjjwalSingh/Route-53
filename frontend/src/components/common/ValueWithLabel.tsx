"use client";

import Box from "@cloudscape-design/components/box";
import type { ReactNode } from "react";

export function ValueWithLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Box variant="awsui-key-label">{label}</Box>
      <div>{children}</div>
    </div>
  );
}
