"use client";

import Box from "@cloudscape-design/components/box";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Spinner from "@cloudscape-design/components/spinner";
import { useParams, useRouter } from "next/navigation";

import { RecordForm, type RecordFormValues } from "@/components/records/RecordForm";
import { useBreadcrumbOverride } from "@/context/BreadcrumbContext";
import { displayFqdn } from "@/lib/format";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useRecord, useUpdateRecord } from "@/lib/hooks/useRecords";
import { useZone } from "@/lib/hooks/useZones";
import type { RoutingPolicy } from "@/lib/constants/routingPolicies";

export default function EditRecordPage() {
  const { zoneId, recordId } = useParams<{ zoneId: string; recordId: string }>();
  const router = useRouter();
  const { data: zone, isLoading: zoneLoading } = useZone(zoneId);
  const { data: record, isLoading: recordLoading } = useRecord(zoneId, recordId);
  const updateRecord = useUpdateRecord(zoneId, recordId);
  const { push } = useNotifications();

  useBreadcrumbOverride(
    zone && record
      ? [
          { text: "Hosted zones", href: "/hosted-zones" },
          { text: displayFqdn(zone.name), href: `/hosted-zones/${zone.id}` },
          { text: "Edit record", href: `/hosted-zones/${zone.id}/records/${record.id}/edit` },
        ]
      : undefined
  );

  if (zoneLoading || recordLoading || !zone || !record) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
      </Box>
    );
  }

  const handleSubmit = async (values: RecordFormValues) => {
    const result = await updateRecord.mutateAsync({
      ttl: values.ttl,
      values: values.values,
      routing_policy: values.routingPolicy,
      set_identifier: values.routingPolicy !== "Simple" ? values.setIdentifier : null,
      alias: values.alias,
      alias_target: values.alias ? values.aliasTarget : null,
    });
    push({
      type: "success",
      content: `Record ${displayFqdn(result.record.name)} was updated successfully.`,
    });
    router.push(`/hosted-zones/${zoneId}`);
  };

  return (
    <ContentLayout>
      <RecordForm
        mode="edit"
        zoneName={zone.name}
        initialValues={{
          name: record.name,
          type: record.type,
          ttl: record.ttl,
          values: record.values,
          routingPolicy: record.routing_policy as RoutingPolicy,
          setIdentifier: record.set_identifier ?? "",
          alias: record.alias,
          aliasTarget: record.alias_target ?? "",
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateRecord.isPending}
      />
    </ContentLayout>
  );
}
