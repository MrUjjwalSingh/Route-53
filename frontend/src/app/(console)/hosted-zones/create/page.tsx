"use client";

import ContentLayout from "@cloudscape-design/components/content-layout";
import { useRouter } from "next/navigation";

import { HostedZoneForm, type HostedZoneFormValues } from "@/components/hosted-zones/HostedZoneForm";
import { displayFqdn } from "@/lib/format";
import { useCreateZone } from "@/lib/hooks/useZones";
import { useNotifications } from "@/lib/hooks/useNotifications";

export default function CreateHostedZonePage() {
  const router = useRouter();
  const createZone = useCreateZone();
  const { push } = useNotifications();

  const handleSubmit = async (values: HostedZoneFormValues) => {
    const result = await createZone.mutateAsync({
      name: values.name,
      type: values.type,
      comment: values.comment || null,
      tags: values.tags.filter((tag) => tag.key.trim() !== ""),
    });
    push({
      type: "success",
      content: `Hosted zone ${displayFqdn(result.zone.name)} was created successfully.`,
    });
    router.push(`/hosted-zones/${result.zone.id}`);
  };

  return (
    <ContentLayout>
      <HostedZoneForm
        mode="create"
        initialValues={{ name: "", type: "Public", comment: "", tags: [] }}
        onSubmit={handleSubmit}
        isSubmitting={createZone.isPending}
      />
    </ContentLayout>
  );
}
