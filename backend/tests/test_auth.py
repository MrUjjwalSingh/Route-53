def test_login_success(client, demo_user):
    response = client.post(
        "/api/auth/login",
        json={"email": "demo@route53clone.dev", "password": "Passw0rd!"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "demo@route53clone.dev"
    assert "session" in response.cookies


def test_login_wrong_password(client, demo_user):
    response = client.post(
        "/api/auth/login",
        json={"email": "demo@route53clone.dev", "password": "wrong"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "NotAuthorized"


def test_me_requires_auth(client):
    response = client.get("/api/hosted-zones")
    assert response.status_code == 401


def test_me_returns_current_user(authed_client):
    response = authed_client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "demo@route53clone.dev"


def test_logout_clears_session(authed_client):
    response = authed_client.post("/api/auth/logout")
    assert response.status_code == 204

    response = authed_client.get("/api/auth/me")
    assert response.status_code == 401


def test_unauthenticated_access_to_zones_rejected(client):
    response = client.get("/api/hosted-zones")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "NotAuthorized"
