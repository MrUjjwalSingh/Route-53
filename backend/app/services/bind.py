from app.models import DnsRecord, HostedZone


def export_zone_json(zone: HostedZone, records: list[DnsRecord]) -> dict:
    return {
        "hostedZone": {
            "id": zone.id,
            "name": zone.name,
            "type": zone.type,
            "comment": zone.comment,
        },
        "resourceRecordSets": [
            {
                "name": record.name,
                "type": record.type,
                "ttl": record.ttl,
                "values": record.values,
                "routingPolicy": record.routing_policy,
                "setIdentifier": record.set_identifier,
            }
            for record in records
        ],
    }


def export_zone_bind(zone: HostedZone, records: list[DnsRecord]) -> str:
    lines = [
        f"; Zone file for {zone.name}",
        f"$ORIGIN {zone.name}",
        "",
    ]
    for record in records:
        ttl = record.ttl if record.ttl is not None else 300
        for value in record.values:
            lines.append(f"{record.name}\t{ttl}\tIN\t{record.type}\t{value}")
    return "\n".join(lines) + "\n"
