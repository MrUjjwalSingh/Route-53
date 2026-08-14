"use client";

import StatusIndicator from "@cloudscape-design/components/status-indicator";

import { useChange } from "@/lib/hooks/useChange";

export function ChangeStatusIndicator({ changeId }: { changeId: string }) {
  const { data } = useChange(changeId);
  const status = data?.status ?? "PENDING";

  return status === "INSYNC" ? (
    <StatusIndicator type="success">INSYNC</StatusIndicator>
  ) : (
    <StatusIndicator type="pending">PENDING</StatusIndicator>
  );
}
