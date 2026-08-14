from sqlalchemy.orm import Session as OrmSession

from app.database import Base, SessionLocal, engine
from app.models import DnsRecord, HostedZone, User
from app.services.auth_service import hash_password
from app.services.id_generator import new_nameservers

DEMO_EMAIL = "demo@route53clone.dev"
DEMO_PASSWORD = "Passw0rd!"


def _system_records(zone: HostedZone) -> list[DnsRecord]:
    nameservers = new_nameservers()
    return [
        DnsRecord(
            zone_id=zone.id,
            name=zone.name,
            type="NS",
            ttl=172800,
            values=nameservers,
            is_system=True,
        ),
        DnsRecord(
            zone_id=zone.id,
            name=zone.name,
            type="SOA",
            ttl=900,
            values=[
                f"{nameservers[0]} awsdns-hostmaster.amazon.com. "
                "1 7200 900 1209600 86400"
            ],
            is_system=True,
        ),
    ]


def _extra_records(zone: HostedZone) -> list[DnsRecord]:
    apex = zone.name
    return [
        DnsRecord(zone_id=zone.id, name=apex, type="A", ttl=300, values=["192.0.2.1"]),
        DnsRecord(
            zone_id=zone.id, name=apex, type="AAAA", ttl=300, values=["2001:db8::1"]
        ),
        DnsRecord(
            zone_id=zone.id, name=f"www.{apex}", type="CNAME", ttl=300, values=[apex]
        ),
        DnsRecord(
            zone_id=zone.id,
            name=apex,
            type="MX",
            ttl=3600,
            values=["10 mail1.example-mail.com", "20 mail2.example-mail.com"],
        ),
        DnsRecord(
            zone_id=zone.id,
            name=apex,
            type="TXT",
            ttl=300,
            values=['"v=spf1 include:_spf.example.com ~all"'],
        ),
        DnsRecord(
            zone_id=zone.id,
            name=f"api.{apex}",
            type="A",
            ttl=60,
            values=["192.0.2.10", "192.0.2.11", "192.0.2.12"],
        ),
        DnsRecord(
            zone_id=zone.id,
            name=f"ftp.{apex}",
            type="CNAME",
            ttl=300,
            values=[f"api.{apex}"],
        ),
        DnsRecord(
            zone_id=zone.id,
            name=apex,
            type="CAA",
            ttl=300,
            values=['0 issue "letsencrypt.org"'],
        ),
        DnsRecord(
            zone_id=zone.id,
            name=f"_sip._tcp.{apex}",
            type="SRV",
            ttl=300,
            values=["1 10 5269 xmpp-server." + apex],
        ),
        DnsRecord(
            zone_id=zone.id,
            name=f"mail.{apex}",
            type="A",
            ttl=300,
            values=["192.0.2.20"],
        ),
    ]


def seed(db: OrmSession) -> None:
    user = db.query(User).filter_by(email=DEMO_EMAIL).one_or_none()
    if user is None:
        user = User(
            email=DEMO_EMAIL,
            name="Demo User",
            password_hash=hash_password(DEMO_PASSWORD),
            aws_account_id="123456789012",
        )
        db.add(user)
        db.flush()

    zone_specs = [
        ("example.com.", "Public", True),
        ("my-startup.io.", "Public", True),
        ("internal-corp.net.", "Private", False),
    ]

    for name, zone_type, with_extra_records in zone_specs:
        existing = (
            db.query(HostedZone)
            .filter_by(owner_user_id=user.id, name=name, type=zone_type)
            .one_or_none()
        )
        if existing is not None:
            continue

        zone = HostedZone(name=name, type=zone_type, owner_user_id=user.id, comment=None)
        db.add(zone)
        db.flush()

        for record in _system_records(zone):
            db.add(record)

        if with_extra_records:
            for record in _extra_records(zone):
                db.add(record)
        else:
            # smaller private zone: just a few extra records
            for record in _extra_records(zone)[:3]:
                db.add(record)

    db.commit()


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
        zone_count = db.query(HostedZone).count()
        record_count = db.query(DnsRecord).count()
        print(f"Seed complete: {zone_count} hosted zones, {record_count} records.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
