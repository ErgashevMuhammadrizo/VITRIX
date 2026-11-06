import json, re
from unittest.mock import patch
from datetime import timedelta
from django.test import TestCase, Client, override_settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.management import call_command
from django.utils import timezone
from .models import EmailCode, AccountProfile

User = get_user_model()


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AuthTests(TestCase):
    def post(self, path, data, client=None):
        return (client or self.client).post(
            "/api/v1/" + path, json.dumps(data), content_type="application/json"
        )

    def request_code(self, email="new@example.com", purpose="register"):
        r = self.post("auth/request-code/", {"email": email, "purpose": purpose})
        self.assertEqual(r.status_code, 200)
        return re.search(r"\b\d{6}\b", mail.outbox[-1].body).group()

    def registration(self, code, **patches):
        v = {
            "firstName": "Ali",
            "lastName": "Valiyev",
            "username": "ali_test",
            "email": "new@example.com",
            "phone": "+998901234567",
            "password": "Example-secret987!",
            "terms": True,
            "code": code,
        }
        v.update(patches)
        return self.post("auth/register/", v)

    def test_no_seed_accounts(self):
        self.assertEqual(User.objects.count(), 0)

    def test_code_required_and_not_returned_in_api(self):
        r = self.post("auth/request-code/", {"email": "new@example.com"})
        self.assertEqual(r.status_code, 200)
        self.assertNotIn("code", r.json())
        self.assertNotIn(
            re.search(r"\b\d{6}\b", mail.outbox[-1].body).group(), r.content.decode()
        )
        self.assertEqual(self.registration("000000").status_code, 400)
        self.assertEqual(User.objects.count(), 0)

    def test_registration_hashes_password_and_opens_session(self):
        code = self.request_code()
        r = self.registration(code)
        self.assertEqual(r.status_code, 201)
        self.assertNotIn("password", r.json()["user"])
        u = User.objects.get()
        self.assertNotEqual(u.password, "Example-secret987!")
        self.assertTrue(u.check_password("Example-secret987!"))
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 200)
        self.assertEqual(EmailCode.objects.count(), 0)
        self.assertEqual(AccountProfile.objects.count(), 1)

    def test_expired_code_and_replay_rejected(self):
        code = self.request_code()
        EmailCode.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.registration(code).status_code, 400)
        EmailCode.objects.update(expires_at=timezone.now() + timedelta(minutes=5))
        self.assertEqual(self.registration(code).status_code, 201)
        self.assertEqual(self.registration(code, username="other").status_code, 400)

    def test_attempt_limit_and_resend_cooldown(self):
        code = self.request_code()
        wrong = "000000" if code != "000000" else "111111"
        for _ in range(5):
            self.assertEqual(self.registration(wrong).status_code, 400)
        self.assertEqual(self.registration(code).status_code, 400)
        self.assertEqual(
            self.post("auth/request-code/", {"email": "new@example.com"}).status_code,
            429,
        )

    def test_createsuperuser_logs_in_to_admin_role(self):
        call_command(
            "createsuperuser",
            username="owner",
            email="owner@example.com",
            interactive=False,
            verbosity=0,
        )
        u = User.objects.get(username="owner")
        u.set_password("Owner-secret987!")
        u.save()
        r = self.post(
            "auth/login/",
            {"username": "owner", "password": "Owner-secret987!", "remember": True},
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["user"]["role"], "admin")
        self.assertEqual(self.client.get("/api/v1/admin/users/").status_code, 200)

    def test_local_demo_credentials_do_not_work(self):
        for username in ["admin", "user", "baker"]:
            self.assertEqual(
                self.post(
                    "auth/login/", {"username": username, "password": "123"}
                ).status_code,
                401,
            )

    def test_user_cannot_escalate_privileges(self):
        code = self.request_code()
        r = self.registration(code, role="admin", is_superuser=True)
        self.assertEqual(r.json()["user"]["role"], "user")
        self.assertEqual(self.client.get("/api/v1/admin/users/").status_code, 403)

    def test_login_by_email_logout_and_deactivated_account(self):
        self.registration(self.request_code())
        self.post("auth/logout/", {})
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 401)
        r = self.post(
            "auth/login/",
            {"username": "NEW@EXAMPLE.COM", "password": "Example-secret987!"},
        )
        self.assertEqual(r.status_code, 200)
        u = User.objects.get()
        u.is_active = False
        u.save()
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 401)

    def test_password_reset_requires_code(self):
        self.registration(self.request_code())
        code = self.request_code(purpose="reset")
        r = self.post(
            "auth/reset-password/",
            {
                "email": "new@example.com",
                "code": code,
                "password": "Changed-secret987!",
            },
        )
        self.assertEqual(r.status_code, 200)
        self.assertTrue(User.objects.get().check_password("Changed-secret987!"))

    def test_csrf_enforced(self):
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(
            self.post("auth/login/", {"username": "anything"}, client).status_code, 403
        )
        r = client.get("/api/v1/auth/csrf/")
        self.assertIn("csrfToken", r.json())

    def test_smtp_failure_is_not_fake_success(self):
        with patch("accounts.views.send_mail", side_effect=RuntimeError("mail failed")):
            self.assertEqual(
                self.post(
                    "auth/request-code/", {"email": "new@example.com"}
                ).status_code,
                503,
            )
        self.assertEqual(EmailCode.objects.count(), 0)

    def test_admin_changes_user_status_on_server(self):
        admin = User.objects.create_superuser(
            "owner", "owner@example.com", "Owner-secret987!"
        )
        user = User.objects.create_user("ordinary", email="ordinary@example.com")
        self.client.force_login(admin)
        r = self.client.patch(
            f"/api/v1/admin/users/{user.pk}/",
            json.dumps({"active": False}),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        user.refresh_from_db()
        self.assertFalse(user.is_active)
        self.assertEqual(
            self.client.delete(f"/api/v1/admin/users/{admin.pk}/").status_code, 400
        )
