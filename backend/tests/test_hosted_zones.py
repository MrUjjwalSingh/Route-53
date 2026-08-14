def _create_zone(client, name="example.com", zone_type="Public", comment=None):
    return client.post(
        "/api/hosted-zones",
        json={"name": name, "type": zone_type, "comment": comment},
    )


def test_create_zone_auto_creates_ns_and_soa(authed_client):
    response = _create_zone(authed_client)
    assert response.status_code == 201
    body = response.json()
    zone = body["zone"]
    assert zone["name"] == "example.com."
    assert zone["record_count"] == 2
    assert len(zone["name_servers"]) == 4
    assert body["change"]["status"] == "PENDING"

    records = authed_client.get(f"/api/hosted-zones/{zone['id']}/records").json()["items"]
    types = sorted(r["type"] for r in records)
    assert types == ["NS", "SOA"]
    ns_record = next(r for r in records if r["type"] == "NS")
    assert len(ns_record["values"]) == 4
    assert ns_record["is_system"] is True


def test_duplicate_zone_rejected(authed_client):
    first = _create_zone(authed_client)
    assert first.status_code == 201
    second = _create_zone(authed_client)
    assert second.status_code == 400
    assert second.json()["error"]["code"] == "HostedZoneAlreadyExists"


def test_delete_zone_guard_then_success(authed_client):
    zone = _create_zone(authed_client).json()["zone"]
    zone_id = zone["id"]

    create_record = authed_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={"name": "www.example.com.", "type": "A", "ttl": 300, "values": ["192.0.2.1"]},
    )
    assert create_record.status_code == 201

    delete_response = authed_client.delete(f"/api/hosted-zones/{zone_id}")
    assert delete_response.status_code == 400
    assert delete_response.json()["error"]["code"] == "HostedZoneNotEmpty"

    record_id = create_record.json()["record"]["id"]
    delete_record = authed_client.delete(f"/api/hosted-zones/{zone_id}/records/{record_id}")
    assert delete_record.status_code == 204

    delete_response_2 = authed_client.delete(f"/api/hosted-zones/{zone_id}")
    assert delete_response_2.status_code == 204


def test_system_record_cannot_be_deleted(authed_client):
    zone = _create_zone(authed_client).json()["zone"]
    records = authed_client.get(f"/api/hosted-zones/{zone['id']}/records").json()["items"]
    ns_record = next(r for r in records if r["type"] == "NS")

    response = authed_client.delete(f"/api/hosted-zones/{zone['id']}/records/{ns_record['id']}")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "InvalidChangeBatch"


def test_zone_not_found_returns_404(authed_client):
    response = authed_client.get("/api/hosted-zones/ZDOESNOTEXIST123")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NoSuchHostedZone"


def test_update_zone_comment(authed_client):
    zone = _create_zone(authed_client).json()["zone"]
    response = authed_client.patch(
        f"/api/hosted-zones/{zone['id']}", json={"comment": "Updated comment"}
    )
    assert response.status_code == 200
    assert response.json()["comment"] == "Updated comment"


def test_update_zone_rename_cascades_records(authed_client):
    zone = _create_zone(authed_client).json()["zone"]
    zone_id = zone["id"]
    authed_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={"name": "www.example.com.", "type": "A", "ttl": 300, "values": ["192.0.2.1"]},
    )

    response = authed_client.patch(f"/api/hosted-zones/{zone_id}", json={"name": "renamed.com"})
    assert response.status_code == 200
    assert response.json()["name"] == "renamed.com."

    records = authed_client.get(f"/api/hosted-zones/{zone_id}/records").json()["items"]
    names = sorted(r["name"] for r in records)
    assert names == ["renamed.com.", "renamed.com.", "www.renamed.com."]


def test_list_zones_search_and_pagination(authed_client):
    _create_zone(authed_client, name="alpha.com")
    _create_zone(authed_client, name="beta.com")
    _create_zone(authed_client, name="gamma.com")

    all_zones = authed_client.get("/api/hosted-zones?page_size=2&page=1").json()
    assert all_zones["total"] == 3
    assert len(all_zones["items"]) == 2
    assert all_zones["total_pages"] == 2

    search = authed_client.get("/api/hosted-zones?search=beta").json()
    assert search["total"] == 1
    assert search["items"][0]["name"] == "beta.com."
