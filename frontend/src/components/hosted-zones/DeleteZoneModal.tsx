"use client";

import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Modal from "@cloudscape-design/components/modal";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useState } from "react";

import { ApiError } from "@/lib/api/client";
import { displayFqdn } from "@/lib/format";
import { useDeleteZone } from "@/lib/hooks/useZones";
import { useNotifications } from "@/lib/hooks/useNotifications";
import type { HostedZone } from "@/lib/types";

export interface DeleteZoneModalProps {
  zone: HostedZone | null;
  onDismiss: () => void;
  onDeleted?: () => void;
}

export function DeleteZoneModal({ zone, onDismiss, onDeleted }: DeleteZoneModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const deleteZone = useDeleteZone();
  const { push } = useNotifications();

  if (!zone) return null;

  const zoneName = displayFqdn(zone.name);
  const canDelete = confirmText === zoneName;

  const handleClose = () => {
    setConfirmText("");
    setError(null);
    onDismiss();
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteZone.mutateAsync(zone.id);
      push({ type: "success", content: `Hosted zone ${zoneName} was deleted successfully.` });
      handleClose();
      onDeleted?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err);
      } else {
        throw err;
      }
    }
  };

  return (
    <Modal
      visible={!!zone}
      onDismiss={handleClose}
      header={`Delete ${zoneName}?`}
      closeAriaLabel="Close"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              disabled={!canDelete}
              loading={deleteZone.isPending}
            >
              Delete
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        {error?.code === "HostedZoneNotEmpty" ? (
          <Alert type="error" header="Hosted zone contains records">
            This hosted zone still contains DNS records other than the required NS and
            SOA records. Delete those records first from the zone&apos;s{" "}
            <strong>Records</strong> tab, then try again.
          </Alert>
        ) : error ? (
          <Alert type="error" header="Unable to delete hosted zone">
            {error.message}
          </Alert>
        ) : (
          <Alert type="warning">
            This action cannot be undone. This will permanently delete the hosted zone
            and its DNS records.
          </Alert>
        )}
        <FormField label={`To confirm deletion, type "${zoneName}" below.`}>
          <Input value={confirmText} onChange={(event) => setConfirmText(event.detail.value)} />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
