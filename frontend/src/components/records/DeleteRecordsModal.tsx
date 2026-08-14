"use client";

import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useState } from "react";

import { deleteRecord } from "@/lib/api/records";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useQueryClient } from "@tanstack/react-query";
import type { DnsRecord } from "@/lib/types";

export interface DeleteRecordsModalProps {
  zoneId: string;
  records: DnsRecord[];
  onDismiss: () => void;
  onDeleted?: () => void;
}

export function DeleteRecordsModal({ zoneId, records, onDismiss, onDeleted }: DeleteRecordsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { push } = useNotifications();
  const queryClient = useQueryClient();

  if (records.length === 0) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    const results = await Promise.allSettled(
      records.map((record) => deleteRecord(zoneId, record.id))
    );
    setIsDeleting(false);

    const failures = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.length - failures;

    queryClient.invalidateQueries({ queryKey: ["records", zoneId] });
    queryClient.invalidateQueries({ queryKey: ["zones", zoneId] });
    queryClient.invalidateQueries({ queryKey: ["zones"] });

    if (succeeded > 0) {
      push({
        type: failures > 0 ? "warning" : "success",
        content:
          failures > 0
            ? `${succeeded} record(s) deleted, ${failures} failed.`
            : `${succeeded} record(s) deleted successfully.`,
      });
    } else {
      push({ type: "error", content: "Unable to delete the selected records." });
    }

    onDismiss();
    onDeleted?.();
  };

  return (
    <Modal
      visible={records.length > 0}
      onDismiss={onDismiss}
      header={`Delete ${records.length} record${records.length > 1 ? "s" : ""}?`}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDelete} loading={isDeleting}>
              Delete
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <Alert type="warning">This action cannot be undone.</Alert>
        <ul>
          {records.map((record) => (
            <li key={record.id}>
              {record.name} ({record.type})
            </li>
          ))}
        </ul>
      </SpaceBetween>
    </Modal>
  );
}
