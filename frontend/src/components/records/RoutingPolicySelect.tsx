"use client";

import Select from "@cloudscape-design/components/select";

import { ROUTING_POLICIES, type RoutingPolicy } from "@/lib/constants/routingPolicies";

const OPTIONS = ROUTING_POLICIES.map((policy) => ({ value: policy, label: policy }));

export interface RoutingPolicySelectProps {
  value: RoutingPolicy;
  onChange: (value: RoutingPolicy) => void;
}

export function RoutingPolicySelect({ value, onChange }: RoutingPolicySelectProps) {
  return (
    <Select
      selectedOption={OPTIONS.find((option) => option.value === value) ?? OPTIONS[0]}
      options={OPTIONS}
      onChange={(event) => onChange(event.detail.selectedOption.value as RoutingPolicy)}
    />
  );
}
