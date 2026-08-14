export function displayFqdn(name: string): string {
  return name.endsWith(".") ? name.slice(0, -1) : name;
}

export function toFqdn(name: string): string {
  const trimmed = name.trim().toLowerCase();
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

export function formatZoneType(type: string): string {
  return type === "Public" ? "Public hosted zone" : "Private hosted zone";
}

export function formatRecordCount(count: number): string {
  return `(${count})`;
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString.endsWith("Z") ? isoString : `${isoString}Z`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
