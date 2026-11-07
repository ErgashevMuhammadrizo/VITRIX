"""Live Next proxy -> Django smoke on an ISOLATED test deployment.
Set VITRIX_SMOKE_OUTBOX only for Django's filebased email test backend.
Never run this fixture-creating mode against production.
"""

import http.cookiejar, json, os, re, sys, uuid, urllib.error, urllib.request
from email import policy
from email.parser import BytesParser
from pathlib import Path

origin = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080"
jar = http.cookiejar.CookieJar()
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def request(path, data=None, language="en", method=None):
    token = (
        json.load(client.open(origin + "/api/v1/auth/csrf/"))["csrfToken"]
        if data is not None
        else None
    )
    headers = {"Accept-Language": language, "Content-Type": "application/json"}
    if token:
        headers["X-CSRFToken"] = token
    req = urllib.request.Request(
        origin + "/api/v1/" + path,
        data=json.dumps(data).encode() if data is not None else None,
        headers=headers,
        method=method,
    )
    try:
        r = client.open(req, timeout=20)
    except urllib.error.HTTPError as e:
        r = e
    return r.status, json.load(r)


assert request("health/")[0] == 200
assert request("plans/")[0] == 401
assert request(
    "auth/login/", {"username": "nonexistent-smoke", "password": "bad"}, "en"
) == (401, {"detail": "Incorrect username or password."})
assert request(
    "auth/login/", {"username": "nonexistent-smoke", "password": "bad"}, "ru"
) == (401, {"detail": "Неверный логин или пароль."})
if os.environ.get("VITRIX_SMOKE_OUTBOX"):
    outbox = Path(os.environ["VITRIX_SMOKE_OUTBOX"])
    name = "smoke_" + uuid.uuid4().hex[:12]
    email = name + "@example.test"
    assert (
        request("auth/request-code/", {"email": email, "purpose": "register"})[0] == 200
    )
    messages = []
    for file in outbox.glob("*"):
        message = BytesParser(policy=policy.default).parsebytes(file.read_bytes())
        if message["To"] == email:
            messages.append(message)
    assert messages, "No test email created"
    message = messages[-1]
    assert "verification code" in message["Subject"]
    body = message.get_payload(decode=True).decode()
    code = re.search(r"verification code: (\d{6})", body).group(1)
    status, data = request(
        "auth/register/",
        {
            "firstName": "Smoke",
            "lastName": "Test",
            "phone": "+998901234567",
            "email": email,
            "username": name,
            "password": "Isolated-smoke-test987!",
            "terms": True,
            "code": code,
        },
    )
    assert status == 201, (status, data)
    status, workspace = request("workspace/")
    assert status == 200
    business = workspace["businesses"][0]
    assert business["planId"] == "starter"

    def save(record, revision):
        return request(
            "workspace/",
            {
                "changes": [
                    {
                        "entity": "businesses",
                        "op": "upsert",
                        "revision": revision,
                        "record": {"id": business["id"], **record},
                    }
                ]
            },
            method="PATCH",
        )

    status, result = save({"name": "Smoke Catalog A"}, business["revision"])
    assert status == 200
    assert save({"name": "Stale B"}, business["revision"])[0] == 409
    business = request("workspace/")[1]["businesses"][0]
    assert business["name"] == "Smoke Catalog A"
    from PIL import Image
    import io, base64

    buffer = io.BytesIO()
    Image.new("RGB", (8, 8), "white").save(buffer, format="PNG")
    product = {
        "id": uuid.uuid4().hex,
        "businessId": business["id"],
        "name": "Smoke Product",
        "image": "data:image/png;base64,"
        + base64.b64encode(buffer.getvalue()).decode(),
        "slug": "smoke-product",
        "price": 49000,
        "status": "published",
    }
    status, result = request(
        "workspace/",
        {"changes": [{"entity": "products", "op": "upsert", "record": product}]},
        method="PATCH",
    )
    assert status == 200 and "acknowledged" in result
    uploaded = result["acknowledged"][0]["record"]["image"]
    media_response = client.open(origin + uploaded)
    assert (
        media_response.status == 200
        and "immutable" in media_response.headers["Cache-Control"]
    )
    assert media_response.headers["Content-Type"].startswith("image/webp")
    assert request("collections/products/?pageSize=8")[1]["pagination"]["total"] == 1
    public = request("public/businesses/" + business["slug"] + "/")[1]
    assert len(public["products"]) == 1 and "ownerId" not in public["business"]
    assert (
        request(
            "public/businesses/" + business["slug"] + "/events/", {"kind": "visit"}
        )[0]
        == 200
    )
    assert (
        request("businesses/" + business["id"] + "/analytics/")[1]["totals"]["visit"]
        == 1
    )
    html = (
        client.open(origin + "/" + business["slug"] + "/p/smoke-product?lang=en")
        .read()
        .decode()
    )
    assert "Smoke Product" in html and 'hreflang="ru"' in html.lower()
    assert client.open(origin + "/sitemap.xml").status == 200
print(
    "PASS: live Next -> Django health, language, CSRF, OTP email/register, plans, revisions, catalogue pagination, public DTO, analytics, product URL and sitemap"
)
