/**
 * Client-side mirror of backend/app/validation/record_rules.py — gives instant
 * field-level feedback. The backend remains the authority; on a 400 the caller
 * maps error.field back onto the matching form field.
 */

const MAX_TTL = 2147483647;

const HOSTNAME_RE =
  /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\.?$/;

const IPV4_RE =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

function isValidIPv4(value: string): boolean {
  return IPV4_RE.test(value);
}

function isValidIPv6(value: string): boolean {
  // Pragmatic check: hex groups separated by colons, optional "::" compression.
  if (!value.includes(":")) return false;
  if ((value.match(/::/g) || []).length > 1) return false;
  const parts = value.split(":");
  if (parts.length < 3 || parts.length > 8) return false;
  return parts.every((part) => part === "" || /^[0-9a-fA-F]{1,4}$/.test(part));
}

export function isValidHostname(value: string): boolean {
  return HOSTNAME_RE.test(value) && value.length <= 253;
}

export function validateTtl(ttl: number | null, alias: boolean): string[] {
  if (alias) {
    return ttl !== null ? ["TTL must not be set for alias records."] : [];
  }
  if (ttl === null || Number.isNaN(ttl)) return ["TTL is required."];
  if (ttl < 0 || ttl > MAX_TTL) return [`TTL must be between 0 and ${MAX_TTL}.`];
  return [];
}

function validateA(values: string[]): string[] {
  return values.filter((v) => !isValidIPv4(v)).map((v) => `'${v}' is not a valid IPv4 address.`);
}

function validateAAAA(values: string[]): string[] {
  return values
    .filter((v) => !isValidIPv6(v))
    .map((v) => `'${v}' is not a valid IPv6 address.`);
}

function validateCname(values: string[]): string[] {
  if (values.length !== 1) return ["A CNAME record must have exactly one value."];
  return isValidHostname(values[0]) ? [] : [`'${values[0]}' is not a valid hostname.`];
}

function validateTxt(values: string[]): string[] {
  const errors: string[] = [];
  for (const v of values) {
    if (!(v.startsWith('"') && v.endsWith('"') && v.length >= 2)) {
      errors.push(`'${v}' must be wrapped in double quotes, e.g. "text".`);
      continue;
    }
    const inner = v.slice(1, -1);
    if (inner.length > 255) {
      errors.push(`'${v}' exceeds the 255 character limit for a quoted string.`);
    }
  }
  return errors;
}

function validateMx(values: string[]): string[] {
  const errors: string[] = [];
  for (const v of values) {
    const parts = v.trim().split(/\s+/);
    if (parts.length !== 2) {
      errors.push(`'${v}' must be in the form '<priority> <hostname>'.`);
      continue;
    }
    const [priority, host] = parts;
    if (!/^\d+$/.test(priority) || Number(priority) > 65535) {
      errors.push(`'${v}' has an invalid priority (must be 0-65535).`);
    }
    if (!isValidHostname(host)) {
      errors.push(`'${v}' has an invalid hostname.`);
    }
  }
  return errors;
}

function validateNsOrPtr(values: string[]): string[] {
  return values
    .filter((v) => !isValidHostname(v))
    .map((v) => `'${v}' is not a valid hostname.`);
}

function validateSrv(values: string[]): string[] {
  const errors: string[] = [];
  for (const v of values) {
    const parts = v.trim().split(/\s+/);
    if (parts.length !== 4) {
      errors.push(`'${v}' must be in the form '<priority> <weight> <port> <target>'.`);
      continue;
    }
    const [priority, weight, port, target] = parts;
    for (const [label, num] of [
      ["priority", priority],
      ["weight", weight],
      ["port", port],
    ] as const) {
      if (!/^\d+$/.test(num) || Number(num) > 65535) {
        errors.push(`'${v}' has an invalid ${label} (must be 0-65535).`);
      }
    }
    if (!isValidHostname(target)) {
      errors.push(`'${v}' has an invalid target hostname.`);
    }
  }
  return errors;
}

const CAA_RE = /^(\d{1,3})\s+(issue|issuewild|iodef)\s+"([^"]*)"$/;

function validateCaa(values: string[]): string[] {
  const errors: string[] = [];
  for (const v of values) {
    const match = CAA_RE.exec(v);
    if (!match) {
      errors.push(`'${v}' must be in the form '<flags> <issue|issuewild|iodef> "<value>"'.`);
      continue;
    }
    const flags = Number(match[1]);
    if (flags < 0 || flags > 255) {
      errors.push(`'${v}' has an invalid flags value (must be 0-255).`);
    }
  }
  return errors;
}

const VALIDATORS: Record<string, (values: string[]) => string[]> = {
  A: validateA,
  AAAA: validateAAAA,
  CNAME: validateCname,
  TXT: validateTxt,
  MX: validateMx,
  NS: validateNsOrPtr,
  PTR: validateNsOrPtr,
  SRV: validateSrv,
  CAA: validateCaa,
};

export function validateRecordValues(recordType: string, values: string[]): string[] {
  const validator = VALIDATORS[recordType];
  if (!validator) return [`Unsupported record type: '${recordType}'.`];
  if (values.length === 0) return ["At least one value is required."];
  return validator(values);
}
