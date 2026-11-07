import base64
import json
from email import policy
from email.parser import BytesParser
from unittest.mock import patch
from django.core.mail import EmailMessage
from django.test import SimpleTestCase
from .gmail_backend import GmailAPIBackend


class GmailBackendTests(SimpleTestCase):
    credentials = {
        "GMAIL_CLIENT_ID": "test-client",
        "GMAIL_CLIENT_SECRET": "test-secret",
        "GMAIL_REFRESH_TOKEN": "test-refresh",
    }

    @patch.dict("os.environ", credentials)
    @patch("accounts.gmail_backend.post")
    def test_refresh_and_mime_delivery(self, post):
        post.side_effect = [{"access_token": "test-access"}, {"id": "sent-message"}]
        message = EmailMessage(
            "VITRIX — sinov",
            "Tasdiqlash kodi: 123456",
            "sender@example.com",
            ["recipient@example.com"],
        )
        self.assertEqual(GmailAPIBackend().send_messages([message]), 1)
        url, payload, headers, stage = post.call_args.args
        self.assertEqual(
            url, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
        )
        self.assertEqual(headers["Authorization"], "Bearer test-access")
        mime = BytesParser(policy=policy.default).parsebytes(
            base64.urlsafe_b64decode(json.loads(payload)["raw"])
        )
        self.assertEqual(mime["To"], "recipient@example.com")
        self.assertIn("123456", mime.get_content())

    @patch.dict("os.environ", credentials)
    @patch("accounts.gmail_backend.post", side_effect=OSError("Gmail OAuth: HTTP 400"))
    def test_failure_never_returns_success(self, post):
        message = EmailMessage(
            "Test", "Body", "sender@example.com", ["recipient@example.com"]
        )
        with self.assertRaises(OSError):
            GmailAPIBackend().send_messages([message])
        self.assertEqual(
            GmailAPIBackend(fail_silently=True).send_messages([message]), 0
        )

    @patch.dict("os.environ", {}, clear=True)
    def test_missing_credentials_and_empty_mail(self):
        self.assertEqual(GmailAPIBackend().send_messages([]), 0)
        with self.assertRaisesRegex(OSError, "GMAIL_CLIENT_ID"):
            GmailAPIBackend().send_messages(
                [EmailMessage("Test", "Body", to=["recipient@example.com"])]
            )
