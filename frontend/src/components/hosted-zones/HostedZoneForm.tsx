"use client";

import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import RadioGroup from "@cloudscape-design/components/radio-group";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Textarea from "@cloudscape-design/components/textarea";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api/client";
import type { TagItem, ZoneType } from "@/lib/types";

export interface HostedZoneFormValues {
  name: string;
  type: ZoneType;
  comment: string;
  tags: TagItem[];
}

export interface HostedZoneFormProps {
  mode: "create" | "edit";
  initialValues: HostedZoneFormValues;
  onSubmit: (values: HostedZoneFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function HostedZoneForm({ mode, initialValues, onSubmit, isSubmitting }: HostedZoneFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialValues.name);
  const [type, setType] = useState<ZoneType>(initialValues.type);
  const [comment, setComment] = useState(initialValues.comment);
  const [tags, setTags] = useState<TagItem[]>(initialValues.tags);
  const [error, setError] = useState<ApiError | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const isEdit = mode === "edit";

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError("Domain name is required.");
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!validateName(name)) return;

    try {
      await onSubmit({ name, type, comment, tags });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err);
        if (err.field === "name") setNameError(err.message);
      } else {
        throw err;
      }
    }
  };

  const addTag = () => setTags([...tags, { key: "", value: "" }]);
  const removeTag = (index: number) => setTags(tags.filter((_, i) => i !== index));
  const updateTag = (index: number, field: "key" | "value", value: string) => {
    setTags(tags.map((tag, i) => (i === index ? { ...tag, [field]: value } : tag)));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Form
        header={
          <Header variant="h1">
            {isEdit ? `Edit hosted zone` : "Create hosted zone"}
          </Header>
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => router.back()} formAction="none">
              Cancel
            </Button>
            <Button variant="primary" loading={isSubmitting} formAction="submit">
              {isEdit ? "Save changes" : "Create hosted zone"}
            </Button>
          </SpaceBetween>
        }
        errorText={error && error.code !== "HostedZoneAlreadyExists" ? error.message : undefined}
      >
        <SpaceBetween size="l">
          {isEdit && (
            <Alert type="warning">
              Renaming a hosted zone rewrites every record in it to use the new domain
              suffix. This deviates from the real Route 53 console, which does not allow
              renaming — it is provided here so the zone can be edited end to end.
            </Alert>
          )}
          <FormField
            label="Domain name"
            description="This is the name of the domain that you want to route traffic for."
            errorText={nameError}
          >
            <Input
              value={name}
              onChange={(event) => setName(event.detail.value)}
              onBlur={() => validateName(name)}
              placeholder="example.com"
            />
          </FormField>

          <FormField
            label={<>Description <i>- optional</i></>}
            description="Optional comment about the hosted zone."
          >
            <Textarea value={comment} onChange={(event) => setComment(event.detail.value)} />
          </FormField>

          <FormField label="Type">
            <RadioGroup
              value={type}
              onChange={(event) => setType(event.detail.value as ZoneType)}
              items={[
                {
                  value: "Public",
                  label: "Public hosted zone",
                  description:
                    "A public hosted zone determines how traffic is routed on the internet.",
                },
                {
                  value: "Private",
                  label: "Private hosted zone",
                  description:
                    "A private hosted zone determines how traffic is routed within an Amazon VPC.",
                },
              ]}
            />
          </FormField>

          <ExpandableSection headerText="Tags">
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
                    formAction="none"
                  />
                </SpaceBetween>
              ))}
              <Button iconName="add-plus" onClick={addTag} formAction="none">
                Add new tag
              </Button>
            </SpaceBetween>
          </ExpandableSection>
        </SpaceBetween>
      </Form>
    </form>
  );
}
