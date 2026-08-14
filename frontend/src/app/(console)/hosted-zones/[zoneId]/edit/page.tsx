"use client";

import Box from "@cloudscape-design/components/box";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Spinner from "@cloudscape-design/components/spinner";
import { useParams, useRouter } from "next/navigation";

import { HostedZoneForm, type HostedZoneFormValues } from "@/components/hosted-zones/HostedZoneForm";
import { useBreadcrumbOverride } from "@/context/BreadcrumbContext";
import { displayFqdn } from "@/lib/format";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useSetZoneTags, useZoneTags } from "@/lib/hooks/useTags";
import { useUpdateZone, useZone } from "@/lib/hooks/useZones";

export default function EditHostedZonePage() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const router = useRouter();
  const { data: zone, isLoading: zoneLoading } = useZone(zoneId);
  const { data: tags, isLoading: tagsLoading } = useZoneTags(zoneId);
  const updateZone = useUpdateZone(zoneId);
  const setTags = useSetZoneTags(zoneId);
  const { push } = useNotifications();

  useBreadcrumbOverride(
    zone
      ? [
          { text: "Hosted zones", href: "/hosted-zones" },
          { text: displayFqdn(zone.name), href: `/hosted-zones/${zone.id}` },
          { text: "Edit", href: `/hosted-zones/${zone.id}/edit` },
        ]
      : undefined
  );

  if (zoneLoading || tagsLoading || !zone) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
      </Box>
    );
  }

  const handleSubmit = async (values: HostedZoneFormValues) => {
    const updated = await updateZone.mutateAsync({
      name: values.name !== displayFqdn(zone.name) ? values.name : undefined,
      comment: values.comment,
    });
    await setTags.mutateAsync(values.tags.filter((tag) => tag.key.trim() !== ""));
    push({
      type: "success",
      content: `Hosted zone ${displayFqdn(updated.name)} was updated successfully.`,
    });
    router.push(`/hosted-zones/${updated.id}`);
  };

  return (
    <ContentLayout>
      <HostedZoneForm
        mode="edit"
        initialValues={{
          name: displayFqdn(zone.name),
          type: zone.type,
          comment: zone.comment ?? "",
          tags: tags ?? [],
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateZone.isPending || setTags.isPending}
      />
    </ContentLayout>
  );
}
