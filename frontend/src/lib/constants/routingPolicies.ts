export const ROUTING_POLICIES = [
  "Simple",
  "Weighted",
  "Geolocation",
  "Latency",
  "Failover",
  "Multivalue answer",
] as const;

export type RoutingPolicy = (typeof ROUTING_POLICIES)[number];
