"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Spinner from "@cloudscape-design/components/spinner";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useSetZoneTags, useZoneTags } from "@/lib/hooks/useTags";
import type { TagItem } from "@/lib/types";

export function ZoneTagsTab({ zoneId }: { zoneId: string }) {
  const { data: savedTags, isLoading } = useZoneTags(zoneId);
  const setTags = useSetZoneTags(zoneId);
  const { push } = useNotifications();

  const [tags, setLocalTags] = useState<TagItem[]>([]);

  useEffect(() => {
    if (savedTags) setLocalTags(savedTags);
  }, [savedTags]);

  const addTag = () => setLocalTags([...tags, { key: "", value: "" }]);
  const removeTag = (index: number) => setLocalTags(tags.filter((_, i) => i !== index));
  const updateTag = (index: number, field: "key" | "value", value: string) => {
    setLocalTags(tags.map((tag, i) => (i === index ? { ...tag, [field]: value } : tag)));
  };

  const handleSave = async () => {
    const cleaned = tags.filter((tag) => tag.key.trim() !== "");
    await setTags.mutateAsync(cleaned);
    setLocalTags(cleaned);
    push({ type: "success", content: "Tags updated successfully." });
  };

  if (isLoading) {
    return (
      <Container>
        <Box textAlign="center" padding="l">
          <Spinner size="large" />
        </Box>
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <Button variant="primary" onClick={handleSave} loading={setTags.isPending}>
              Save changes
            </Button>
          }
        >
          Tags
        </Header>
      }
    >
      {tags.length === 0 ? (
        <EmptyState
          title="No tags associated with the resource"
          subtitle="Add a tag to organize this hosted zone."
          action={<Button onClick={addTag}>Add tag</Button>}
        />
      ) : (
        <SpaceBetween size="s">
          {tags.map((tag, index) => (
            <SpaceBetween key={index} direction="horizontal" size="xs">
              <Input
                placeholder="Key"
                value={tag.key}
                onChange={(event) => updateTag(index, "key", event.detail.value)}
              />
              <Input
                placeholder="Value"
                value={tag.value}
                onChange={(event) => updateTag(index, "value", event.detail.value)}
              />
              <Button
                iconName="close"
                variant="icon"
                ariaLabel={`Remove tag ${tag.key || index + 1}`}
                onClick={() => removeTag(index)}
              />
            </SpaceBetween>
          ))}
          <Button iconName="add-plus" onClick={addTag}>
            Add new tag
          </Button>
        </SpaceBetween>
      )}
    </Container>
  );
}
