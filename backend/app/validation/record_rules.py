"""Pure, framework-agnostic per-type DNS record value validation.

No I/O, no database access. Every function returns a list of human-readable
error strings; an empty list means the values are valid. This module is
mirrored on the frontend (lib/validation/records.ts) so users get instant
field-level feedback, but this module is the authority.
"""

import ipaddress
import re

MAX_TTL = 2147483647

_HOSTNAME_RE = re.compile(
    r"^(?=.{1,253}\.?$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)"
    r"(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\.?$"
)

VALID_ROUTING_POLICIES = {
    "Simple",
    "Weighted",
    "Geolocation",
    "Latency",
    "Failover",
    "Multivalue answer",
}


def is_valid_hostname(value: str) -> bool:
    return bool(_HOSTNAME_RE.match(value))


def validate_ttl(ttl: int | None, alias: bool) -> list[str]:
    if alias:
        if ttl is not None:
            return ["TTL must not be set for alias records."]
        return []
    if ttl is None:
        return ["TTL is required."]
    if not (0 <= ttl <= MAX_TTL):
        return [f"TTL must be between 0 and {MAX_TTL}."]
    return []


def _validate_a(values: list[str]) -> list[str]:
    errors = []
    for v in values:
        try:
            ipaddress.IPv4Address(v)
        except ValueError:
            errors.append(f"'{v}' is not a valid IPv4 address.")
    return errors


def _validate_aaaa(values: list[str]) -> list[str]:
    errors = []
    for v in values:
        try:
            ipaddress.IPv6Address(v)
        except ValueError:
            errors.append(f"'{v}' is not a valid IPv6 address.")
    return errors


def _validate_cname(values: list[str]) -> list[str]:
    errors = []
    if len(values) != 1:
        errors.append("A CNAME record must have exactly one value.")
        return errors
    if not is_valid_hostname(values[0]):
        errors.append(f"'{values[0]}' is not a valid hostname.")
    return errors


def _validate_txt(values: list[str]) -> list[str]:
    errors = []
    for v in values:
        if not (v.startswith('"') and v.endswith('"') and len(v) >= 2):
            errors.append(f"'{v}' must be wrapped in double quotes, e.g. \"text\".")
            continue
        inner = v[1:-1]
        if len(inner) > 255:
            errors.append(f"'{v}' exceeds the 255 character limit for a quoted string.")
    return errors


def _validate_mx(values: list[str]) -> list[str]:
    errors = []
    for v in values:
        parts = v.split()
        if len(parts) != 2:
            errors.append(f"'{v}' must be in the form '<priority> <hostname>'.")
            continue
        priority, host = parts
        if not (priority.isdigit() and 0 <= int(priority) <= 65535):
            errors.append(f"'{v}' has an invalid priority (must be 0-65535).")
        if not is_valid_hostname(host):
            errors.append(f"'{v}' has an invalid hostname.")
    return errors


def _validate_ns(values: list[str]) -> list[str]:
    errors = []
    for v in values:
        if not is_valid_hostname(v):
            errors.append(f"'{v}' is not a valid hostname.")
    return errors


def _validate_ptr(values: list[str]) -> list[str]:
    errors = []
    for v in values:
        if not is_valid_hostname(v):
            errors.append(f"'{v}' is not a valid hostname.")
    return errors


def _validate_srv(values: list[str]) -> list[str]:
    errors = []
    for v in values:
        parts = v.split()
        if len(parts) != 4:
            errors.append(
                f"'{v}' must be in the form '<priority> <weight> <port> <target>'."
            )
            continue
        priority, weight, port, target = parts
        for label, num in (("priority", priority), ("weight", weight), ("port", port)):
            if not (num.isdigit() and 0 <= int(num) <= 65535):
                errors.append(f"'{v}' has an invalid {label} (must be 0-65535).")
        if not is_valid_hostname(target):
            errors.append(f"'{v}' has an invalid target hostname.")
    return errors


_CAA_RE = re.compile(r'^(\d{1,3})\s+(issue|issuewild|iodef)\s+"([^"]*)"$')


def _validate_caa(values: list[str]) -> list[str]:
    errors = []
    for v in values:
        match = _CAA_RE.match(v)
        if not match:
            errors.append(
                f"'{v}' must be in the form '<flags> <issue|issuewild|iodef> \"<value>\"'."
            )
            continue
        flags = int(match.group(1))
        if not (0 <= flags <= 255):
            errors.append(f"'{v}' has an invalid flags value (must be 0-255).")
    return errors


def _validate_soa(values: list[str]) -> list[str]:
    errors = []
    for v in values:
        if len(v.split()) != 7:
            errors.append(
                f"'{v}' must have 7 fields: "
                "<primary-ns> <hostmaster-email> <serial> <refresh> <retry> <expire> <min-ttl>."
            )
    return errors


_VALIDATORS = {
    "A": _validate_a,
    "AAAA": _validate_aaaa,
    "CNAME": _validate_cname,
    "TXT": _validate_txt,
    "MX": _validate_mx,
    "NS": _validate_ns,
    "PTR": _validate_ptr,
    "SRV": _validate_srv,
    "CAA": _validate_caa,
    "SOA": _validate_soa,
}

SUPPORTED_RECORD_TYPES = tuple(_VALIDATORS.keys())


def validate_record_values(record_type: str, values: list[str]) -> list[str]:
    validator = _VALIDATORS.get(record_type)
    if validator is None:
        return [f"Unsupported record type: '{record_type}'."]
    if not values:
        return ["At least one value is required."]
    return validator(values)
