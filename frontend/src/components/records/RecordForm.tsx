"use client";

import Button from "@cloudscape-design/components/button";
import Checkbox from "@cloudscape-design/components/checkbox";
import Container from "@cloudscape-design/components/container";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { RecordTypeSelect } from "@/components/records/RecordTypeSelect";
import { RecordValueField } from "@/components/records/RecordValueField";
import { RoutingPolicySelect } from "@/components/records/RoutingPolicySelect";
import { TtlField } from "@/components/records/TtlField";
import { ApiError } from "@/lib/api/client";
import { getRecordTypeOption } from "@/lib/constants/recordTypes";
import type { RoutingPolicy } from "@/lib/constants/routingPolicies";
import { displayFqdn, toFqdn } from "@/lib/format";
import { isValidHostname, validateRecordValues, validateTtl } from "@/lib/validation/records";
import type { RecordType } from "@/lib/types";

export interface RecordFormValues {
  name: string;
  type: RecordType;
  ttl: number | null;
  values: string[];
  routingPolicy: RoutingPolicy;
  setIdentifier: string;
  alias: boolean;
  aliasTarget: string;
}

const ALIAS_ELIGIBLE_TYPES: RecordType[] = ["A", "AAAA", "CNAME"];

export interface RecordFormProps {
  mode: "create" | "edit";
  zoneName: string;
  initialValues: RecordFormValues;
  onSubmit: (values: RecordFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function RecordForm({ mode, zoneName, initialValues, onSubmit, isSubmitting }: RecordFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [name, setName] = useState(initialValues.name);
  const [type, setType] = useState<RecordType>(initialValues.type);
  const [ttl, setTtl] = useState<number | null>(initialValues.ttl);
  const [values, setValues] = useState<string[]>(initialValues.values);
  const [routingPolicy, setRoutingPolicy] = useState<RoutingPolicy>(initialValues.routingPolicy);
  const [setIdentifier, setSetIdentifier] = useState(initialValues.setIdentifier);
  const [alias, setAlias] = useState(initialValues.alias);
  const [aliasTarget, setAliasTarget] = useState(initialValues.aliasTarget);

  const [fieldErrors, setFieldErrors] = useState<{ name?: string; values?: string[]; ttl?: string[] }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const typeOption = getRecordTypeOption(type);
  const zoneSuffix = displayFqdn(zoneName);

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    const valueErrors = alias
      ? isValidHostname(aliasTarget)
        ? []
        : ["A valid alias target is required for alias records."]
      : validateRecordValues(type, values);
    const ttlErrors = validateTtl(alias ? null : ttl, alias);
    if (valueErrors.length > 0) errors.values = valueErrors;
    if (ttlErrors.length > 0) errors.ttl = ttlErrors;
    if (routingPolicy !== "Simple" && !setIdentifier.trim()) {
      errors.name = "A record ID is required for non-Simple routing policies.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const fullName = isEdit ? initialValues.name : toFqdn(name ? `${name}.${zoneSuffix}` : zoneSuffix);

    try {
      await onSubmit({
        name: fullName,
        type,
        ttl: alias ? null : ttl,
        values: alias ? [] : values,
        routingPolicy,
        setIdentifier,
        alias,
        aliasTarget,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.errors) {
          setFieldErrors((prev) => ({ ...prev, values: err.errors }));
        }
      } else {
        throw err;
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Form
        header={
          <Header variant="h1">{isEdit ? "Edit record" : "Quick create record"}</Header>
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => router.back()} formAction="none">
              Cancel
            </Button>
            <Button variant="primary" loading={isSubmitting} formAction="submit">
              {isEdit ? "Save changes" : "Create records"}
            </Button>
          </SpaceBetween>
        }
        errorText={formError}
      >
        <Container>
          <SpaceBetween size="l">
            <FormField label="Record name" errorText={fieldErrors.name}>
              {isEdit ? (
                <Input value={displayFqdn(initialValues.name)} disabled />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      value={name}
                      onChange={(event) => setName(event.detail.value)}
                      placeholder="www"
                    />
                  </div>
                  <span>. {zoneSuffix}</span>
                </div>
              )}
            </FormField>

            <FormField label="Record type">
              <RecordTypeSelect value={type} onChange={setType} disabled={isEdit} />
            </FormField>

            {ALIAS_ELIGIBLE_TYPES.includes(type) && (
              <Checkbox checked={alias} onChange={(event) => setAlias(event.detail.checked)}>
                Alias — route traffic to an AWS resource or another record
              </Checkbox>
            )}

            {alias ? (
              <FormField
                label="Alias target"
                description="The DNS name of the AWS resource this alias points to."
                errorText={fieldErrors.values?.join(" ")}
              >
                <Input
                  value={aliasTarget}
                  onChange={(event) => setAliasTarget(event.detail.value)}
                  placeholder="my-load-balancer.us-east-1.elb.amazonaws.com"
                />
              </FormField>
            ) : (
              <FormField
                label="Value"
                description={typeOption?.valueHint}
                errorText={fieldErrors.values?.join(" ")}
              >
                <RecordValueField
                  values={values}
                  onChange={setValues}
                  singleLine={type === "CNAME"}
                />
              </FormField>
            )}

            <FormField label="TTL (seconds)" errorText={fieldErrors.ttl?.join(" ")}>
              <TtlField value={ttl} onChange={setTtl} disabled={alias} />
            </FormField>

            <FormField label="Routing policy">
              <RoutingPolicySelect value={routingPolicy} onChange={setRoutingPolicy} />
            </FormField>

            {routingPolicy !== "Simple" && (
              <FormField
                label="Record ID"
                description="A unique identifier that differentiates records with the same name and type."
              >
                <Input
                  value={setIdentifier}
                  onChange={(event) => setSetIdentifier(event.detail.value)}
                />
              </FormField>
            )}
          </SpaceBetween>
        </Container>
      </Form>
    </form>
  );
}
