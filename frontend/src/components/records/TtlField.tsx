"use client";

import Input from "@cloudscape-design/components/input";
import SegmentedControl from "@cloudscape-design/components/segmented-control";
import SpaceBetween from "@cloudscape-design/components/space-between";

const QUICK_SELECT = [
  { id: "60", text: "1m" },
  { id: "300", text: "5m" },
  { id: "900", text: "15m" },
  { id: "3600", text: "1h" },
  { id: "86400", text: "1d" },
];

export interface TtlFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

export function TtlField({ value, onChange, disabled }: TtlFieldProps) {
  const selectedId = QUICK_SELECT.find((opt) => Number(opt.id) === value)?.id ?? null;

  return (
    <SpaceBetween size="xs">
      <Input
        type="number"
        value={value === null ? "" : String(value)}
        disabled={disabled}
        onChange={(event) => {
          const raw = event.detail.value;
          onChange(raw === "" ? null : Number(raw));
        }}
      />
      <SegmentedControl
        selectedId={selectedId}
        options={QUICK_SELECT}
        onChange={(event) => onChange(Number(event.detail.selectedId))}
      />
    </SpaceBetween>
  );
}
