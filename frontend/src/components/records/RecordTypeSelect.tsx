"use client";

import Select from "@cloudscape-design/components/select";

import { RECORD_TYPE_OPTIONS } from "@/lib/constants/recordTypes";
import type { RecordType } from "@/lib/types";

export interface RecordTypeSelectProps {
  value: RecordType;
  onChange: (value: RecordType) => void;
  disabled?: boolean;
}

export function RecordTypeSelect({ value, onChange, disabled }: RecordTypeSelectProps) {
  const options = RECORD_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    description: option.description,
  }));

  return (
    <Select
      selectedOption={options.find((option) => option.value === value) ?? null}
      options={options}
      disabled={disabled}
      onChange={(event) => onChange(event.detail.selectedOption.value as RecordType)}
    />
  );
}
