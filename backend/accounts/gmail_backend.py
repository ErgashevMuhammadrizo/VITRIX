"""Django email backend for the owner's Gmail account over HTTPS (no SMTP)."""

import base64
import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from django.core.mail.backends.base import BaseEmailBackend


def post(url, data, headers, stage):
    request = Request(url, data=data, headers=headers, method="POST")
    try:
        with urlopen(request, timeout=8) as response:
            return json.load(response)
    except HTTPError as exc:
        raise OSError(f"Gmail {stage}: HTTP {exc.code}") from None
    except (URLError, TimeoutError, ValueError):
        raise OSError(f"Gmail {stage}: connection or response error") from None


class GmailAPIBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        messages = [m for m in (email_messages or []) if m.recipients()]
        if not messages:
            return 0
        sent = 0
        try:
            values = {}
            for name in (
                "GMAIL_CLIENT_ID",
                "GMAIL_CLIENT_SECRET",
                "GMAIL_REFRESH_TOKEN",
            ):
                value = os.environ.get(name, "").strip()
                if not value:
                    raise OSError(f"Missing variable: {name}")
                values[name] = value
            result = post(
                "https://oauth2.googleapis.com/token",
                urlencode(
                    {
                        "client_id": values["GMAIL_CLIENT_ID"],
                        "client_secret": values["GMAIL_CLIENT_SECRET"],
                        "refresh_token": values["GMAIL_REFRESH_TOKEN"],
                        "grant_type": "refresh_token",
                    }
                ).encode(),
                {"Content-Type": "application/x-www-form-urlencoded"},
                "OAuth",
            )
            token = result.get("access_token")
            if not token:
                raise OSError("Gmail OAuth: access token missing")
            for message in messages:
                if message.bcc:
                    raise OSError("Gmail backend: BCC is not supported")
                raw = base64.urlsafe_b64encode(message.message().as_bytes()).decode(
                    "ascii"
                )
                result = post(
                    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                    json.dumps({"raw": raw}).encode(),
                    {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token,
                    },
                    "send",
                )
                if not result.get("id"):
                    raise OSError("Gmail send: message ID missing")
                sent += 1
        except OSError:
            if not self.fail_silently:
                raise
        return sent
