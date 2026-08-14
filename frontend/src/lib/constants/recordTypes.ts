import type { RecordType } from "@/lib/types";

export interface RecordTypeOption {
  value: RecordType;
  label: string;
  description: string;
  valueHint: string;
}

export const RECORD_TYPE_OPTIONS: RecordTypeOption[] = [
  {
    value: "A",
    label: "A",
    description: "Routes traffic to an IPv4 address and some AWS resources",
    valueHint: "Enter multiple values on separate lines. e.g. 192.0.2.1",
  },
  {
    value: "AAAA",
    label: "AAAA",
    description: "Routes traffic to an IPv6 address and some AWS resources",
    valueHint: "e.g. 2001:0db8:85a3::8a2e:0370:7334",
  },
  {
    value: "CNAME",
    label: "CNAME",
    description: "Routes traffic to another domain name and to some AWS resources",
    valueHint: "e.g. example.com (only one value allowed)",
  },
  {
    value: "MX",
    label: "MX",
    description: "Specifies mail servers",
    valueHint: "e.g. 10 mailserver.example.com",
  },
  {
    value: "TXT",
    label: "TXT",
    description: "Used to verify email senders and for application-specific values",
    valueHint: 'e.g. "v=spf1 include:_spf.example.com ~all"',
  },
  {
    value: "NS",
    label: "NS",
    description: "Name servers for a hosted zone",
    valueHint: "e.g. ns-2048.awsdns-64.com",
  },
  {
    value: "PTR",
    label: "PTR",
    description: "Maps an IP address to a domain name",
    valueHint: "e.g. host.example.com",
  },
  {
    value: "SRV",
    label: "SRV",
    description: "Application-specific values that identify servers",
    valueHint: "e.g. 1 10 5269 xmpp-server.example.com",
  },
  {
    value: "CAA",
    label: "CAA",
    description: "Restricts CAs that can create SSL/TLS certificates for the domain",
    valueHint: 'e.g. 0 issue "ca.example.net"',
  },
];

export const CREATABLE_RECORD_TYPES = RECORD_TYPE_OPTIONS; // SOA is system-only, never user-creatable

export function getRecordTypeOption(type: string): RecordTypeOption | undefined {
  return RECORD_TYPE_OPTIONS.find((option) => option.value === type);
}
