"use client";

import Box from "@cloudscape-design/components/box";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Spinner from "@cloudscape-design/components/spinner";
import { useParams, useRouter } from "next/navigation";

import { RecordForm, type RecordFormValues } from "@/components/records/RecordForm";
import { useBreadcrumbOverride } from "@/context/BreadcrumbContext";
import { displayFqdn } from "@/lib/format";
import { useCreateRecord } from "@/lib/hooks/useRecords";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useZone } from "@/lib/hooks/useZones";

export default function CreateRecordPage() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const router = useRouter();
  const { data: zone, isLoading } = useZone(zoneId);
  const createRecord = useCreateRecord(zoneId);
  const { push } = useNotifications();

  useBreadcrumbOverride(
    zone
      ? [
          { text: "Hosted zones", href: "/hosted-zones" },
          { text: displayFqdn(zone.name), href: `/hosted-zones/${zone.id}` },
          { text: "Create record", href: `/hosted-zones/${zone.id}/records/create` },
        ]
      : undefined
  );

  if (isLoading || !zone) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
      </Box>
    );
  }

  const handleSubmit = async (values: RecordFormValues) => {
    const result = await createRecord.mutateAsync({
      name: values.name,
      type: values.type,
      ttl: values.ttl,
      values: values.values,
      routing_policy: values.routingPolicy,
      set_identifier: values.routingPolicy !== "Simple" ? values.setIdentifier : null,
      alias: values.alias,
      alias_target: values.alias ? values.aliasTarget : null,
    });
    push({
      type: "success",
      content: `Record ${displayFqdn(result.record.name)} was created successfully.`,
    });
    router.push(`/hosted-zones/${zoneId}`);
  };

  return (
    <ContentLayout>
      <RecordForm
        mode="create"
        zoneName={zone.name}
        initialValues={{
          name: "",
          type: "A",
          ttl: 300,
          values: [],
          routingPolicy: "Simple",
          setIdentifier: "",
          alias: false,
          aliasTarget: "",
        }}
        onSubmit={handleSubmit}
        isSubmitting={createRecord.isPending}
      />
    </ContentLayout>
  );
}
