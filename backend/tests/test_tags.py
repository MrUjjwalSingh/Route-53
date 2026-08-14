import pytest


@pytest.fixture()
def zone(authed_client):
    response = authed_client.post(
        "/api/hosted-zones", json={"name": "example.com", "type": "Public", "comment": None}
    )
    return response.json()["zone"]


def test_tags_empty_by_default(authed_client, zone):
    response = authed_client.get(f"/api/hosted-zones/{zone['id']}/tags")
    assert response.status_code == 200
    assert response.json() == []


def test_set_and_get_tags(authed_client, zone):
    response = authed_client.put(
        f"/api/hosted-zones/{zone['id']}/tags",
        json={"tags": [{"key": "env", "value": "prod"}, {"key": "team", "value": "platform"}]},
    )
    assert response.status_code == 200
    assert {(t["key"], t["value"]) for t in response.json()} == {
        ("env", "prod"),
        ("team", "platform"),
    }

    get_response = authed_client.get(f"/api/hosted-zones/{zone['id']}/tags")
    assert len(get_response.json()) == 2


def test_set_tags_replaces_existing(authed_client, zone):
    authed_client.put(
        f"/api/hosted-zones/{zone['id']}/tags", json={"tags": [{"key": "env", "value": "prod"}]}
    )
    response = authed_client.put(
        f"/api/hosted-zones/{zone['id']}/tags", json={"tags": [{"key": "team", "value": "core"}]}
    )
    assert response.status_code == 200
    tags = response.json()
    assert len(tags) == 1
    assert tags[0]["key"] == "team"
