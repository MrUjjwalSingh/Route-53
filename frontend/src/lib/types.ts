export interface User {
  id: number;
  email: string;
  name: string;
  aws_account_id: string;
}

export interface ChangeInfo {
  id: string;
  status: "PENDING" | "INSYNC";
  submitted_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type ZoneType = "Public" | "Private";

export interface HostedZone {
  id: string;
  name: string;
  type: ZoneType;
  comment: string | null;
  created_by: string;
  record_count: number;
  created_at: string;
}

export interface HostedZoneDetail extends HostedZone {
  caller_reference: string;
  updated_at: string;
  name_servers: string[];
}

export interface ZoneWithChange {
  zone: HostedZoneDetail;
  change: ChangeInfo;
}

export type RecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "TXT"
  | "MX"
  | "NS"
  | "PTR"
  | "SRV"
  | "CAA"
  | "SOA";

export interface DnsRecord {
  id: string;
  zone_id: string;
  name: string;
  type: RecordType;
  ttl: number | null;
  values: string[];
  routing_policy: string;
  set_identifier: string | null;
  weight: number | null;
  alias: boolean;
  alias_target: string | null;
  evaluate_target_health: boolean;
  health_check_id: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecordWithChange {
  record: DnsRecord;
  change: ChangeInfo;
}

export interface TagItem {
  key: string;
  value: string;
}

export interface RegionInfo {
  code: string;
  name: string;
}

export interface AccountInfo {
  account_id: string;
  email: string;
  default_region: string;
  regions: RegionInfo[];
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    field?: string;
    errors?: string[];
  };
}

export type HealthCheckMonitorType = "endpoint" | "calculated" | "cloudwatch";
export type HealthCheckProtocol = "HTTP" | "HTTPS" | "TCP";
export type HealthCheckStatus = "HEALTHY" | "UNHEALTHY" | "UNKNOWN";

export interface HealthCheck {
  id: string;
  name: string | null;
  monitor_type: HealthCheckMonitorType;
  protocol: HealthCheckProtocol;
  domain_name: string | null;
  ip_address: string | null;
  port: number;
  resource_path: string | null;
  search_string: string | null;
  request_interval: number;
  failure_threshold: number;
  measure_latency: boolean;
  inverted: boolean;
  enable_sni: boolean;
  status: HealthCheckStatus;
  created_at: string;
  updated_at: string;
}

export interface HealthCheckCreateInput {
  name?: string;
  monitor_type: HealthCheckMonitorType;
  protocol: HealthCheckProtocol;
  domain_name?: string;
  ip_address?: string;
  port: number;
  resource_path?: string;
  search_string?: string;
  request_interval: number;
  failure_threshold: number;
  measure_latency: boolean;
  inverted: boolean;
  enable_sni: boolean;
}
