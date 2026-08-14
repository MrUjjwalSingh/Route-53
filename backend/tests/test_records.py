import pytest


@pytest.fixture()
def zone(authed_client):
    response = authed_client.post(
        "/api/hosted-zones", json={"name": "example.com", "type": "Public", "comment": None}
    )
    return response.json()["zone"]


def _create_record(authed_client, zone, **overrides):
    payload = {
        "name": "www.example.com.",
        "type": "A",
        "ttl": 300,
        "values": ["192.0.2.1"],
    }
    payload.update(overrides)
    return authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json=payload)


RECORD_TYPE_CASES = [
    ("A", ["192.0.2.1"], ["999.1.1.1"]),
    ("AAAA", ["2001:db8::1"], ["not-an-ip"]),
    ("MX", ["10 mail.example.com."], ["mail.example.com."]),
    ("TXT", ['"v=spf1 ~all"'], ["unquoted text"]),
    ("NS", ["ns1.example.com."], ["not a hostname!!"]),
    ("PTR", ["host.example.com."], ["not a hostname!!"]),
    ("SRV", ["1 10 5269 xmpp.example.com."], ["1 10 xmpp.example.com."]),
    ("CAA", ['0 issue "ca.example.net"'], ['0 badtag "x"']),
]


@pytest.mark.parametrize("record_type,valid_values,invalid_values", RECORD_TYPE_CASES)
def test_record_type_valid_and_invalid(authed_client, zone, record_type, valid_values, invalid_values):
    valid_response = _create_record(
        authed_client,
        zone,
        name=f"test-{record_type.lower()}.example.com.",
        type=record_type,
        ttl=300,
        values=valid_values,
    )
    assert valid_response.status_code == 201, valid_response.text

    invalid_response = _create_record(
        authed_client,
        zone,
        name=f"bad-{record_type.lower()}.example.com.",
        type=record_type,
        ttl=300,
        values=invalid_values,
    )
    assert invalid_response.status_code == 400
    assert invalid_response.json()["error"]["code"] == "InvalidChangeBatch"


def test_cname_apex_rejected(authed_client, zone):
    response = _create_record(
        authed_client, zone, name="example.com.", type="CNAME", values=["target.com."]
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "InvalidChangeBatch"


def test_cname_single_value_required(authed_client, zone):
    response = _create_record(
        authed_client,
        zone,
        name="alias.example.com.",
        type="CNAME",
        values=["one.com.", "two.com."],
    )
    assert response.status_code == 400


def test_cname_coexistence_rejected(authed_client, zone):
    a_response = _create_record(authed_client, zone, name="dup.example.com.", type="A")
    assert a_response.status_code == 201

    cname_response = _create_record(
        authed_client, zone, name="dup.example.com.", type="CNAME", values=["target.com."]
    )
    assert cname_response.status_code == 400
    assert cname_response.json()["error"]["code"] == "InvalidChangeBatch"


def test_duplicate_rrset_rejected(authed_client, zone):
    first = _create_record(authed_client, zone)
    assert first.status_code == 201
    second = _create_record(authed_client, zone)
    assert second.status_code == 400
    assert second.json()["error"]["code"] == "RRSetAlreadyExists"


def test_record_name_must_be_within_zone(authed_client, zone):
    response = _create_record(authed_client, zone, name="www.other-domain.com.")
    assert response.status_code == 400


def test_get_single_record(authed_client, zone):
    created = _create_record(authed_client, zone).json()["record"]
    response = authed_client.get(f"/api/hosted-zones/{zone['id']}/records/{created['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_record_not_found(authed_client, zone):
    response = authed_client.get(f"/api/hosted-zones/{zone['id']}/records/doesnotexist")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NoSuchRecord"


def test_alias_record_requires_no_ttl_and_uses_alias_target(authed_client, zone):
    response = _create_record(
        authed_client,
        zone,
        name="alias.example.com.",
        type="A",
        ttl=None,
        values=[],
        alias=True,
        alias_target="target-lb.us-east-1.elb.amazonaws.com.",
    )
    assert response.status_code == 201, response.text
    record = response.json()["record"]
    assert record["ttl"] is None
    assert record["values"] == ["target-lb.us-east-1.elb.amazonaws.com."]


def test_alias_record_requires_valid_target(authed_client, zone):
    response = _create_record(
        authed_client,
        zone,
        name="alias.example.com.",
        type="A",
        ttl=None,
        values=[],
        alias=True,
        alias_target="",
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "InvalidChangeBatch"


def test_update_record_ttl(authed_client, zone):
    created = _create_record(authed_client, zone).json()["record"]
    response = authed_client.patch(
        f"/api/hosted-zones/{zone['id']}/records/{created['id']}", json={"ttl": 600}
    )
    assert response.status_code == 200
    assert response.json()["record"]["ttl"] == 600


def test_multi_value_record(authed_client, zone):
    response = _create_record(
        authed_client,
        zone,
        name="multi.example.com.",
        type="A",
        values=["192.0.2.1", "192.0.2.2", "192.0.2.3"],
    )
    assert response.status_code == 201
    assert len(response.json()["record"]["values"]) == 3


def test_list_records_search_and_type_filter(authed_client, zone):
    _create_record(authed_client, zone, name="one.example.com.", type="A")
    _create_record(authed_client, zone, name="two.example.com.", type="A")
    _create_record(
        authed_client, zone, name="txt.example.com.", type="TXT", values=['"hello"']
    )

    by_type = authed_client.get(f"/api/hosted-zones/{zone['id']}/records?type=TXT").json()
    assert by_type["total"] == 1

    by_search = authed_client.get(f"/api/hosted-zones/{zone['id']}/records?search=one").json()
    assert by_search["total"] == 1
