import random
import string
import uuid

_UPPER_ALNUM = string.ascii_uppercase + string.digits


def _random_upper_alnum(length: int) -> str:
    return "".join(random.choices(_UPPER_ALNUM, k=length))


def new_zone_id() -> str:
    """Route 53-shaped hosted zone id, e.g. Z1PA6795UKMFR9."""
    return "Z" + _random_upper_alnum(20)


def new_change_id() -> str:
    """Route 53-shaped change id, e.g. C2682N5HXP0BZ4."""
    return "C" + _random_upper_alnum(14)


def new_record_id() -> str:
    return uuid.uuid4().hex


def new_caller_reference() -> str:
    return str(uuid.uuid4())


def new_nameservers() -> list[str]:
    """Four stable-looking authoritative nameservers, AWS's naming pattern."""
    tlds = ("com", "net", "org", "co.uk")
    return [
        f"ns-{random.randint(0, 2047):04d}.awsdns-{random.randint(0, 63):02d}.{tld}"
        for tld in tlds
    ]
