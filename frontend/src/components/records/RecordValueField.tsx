"use client";

import Textarea from "@cloudscape-design/components/textarea";

export interface RecordValueFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
  singleLine?: boolean;
  disabled?: boolean;
}

export function RecordValueField({ values, onChange, singleLine, disabled }: RecordValueFieldProps) {
  const text = values.join("\n");

  return (
    <Textarea
      value={text}
      disabled={disabled}
      rows={singleLine ? 1 : 4}
      onChange={(event) => {
        const raw = event.detail.value;
        const lines = singleLine
          ? [raw]
          : raw.split("\n").map((line) => line.trim()).filter((line) => line !== "");
        onChange(lines);
      }}
    />
  );
}
