from django.urls import path
from . import views

urlpatterns = [
    path("auth/csrf/", views.csrf),
    path("auth/me/", views.me),
    path("auth/login/", views.sign_in),
    path("auth/logout/", views.sign_out),
    path("auth/request-code/", views.request_code),
    path("auth/register/", views.register),
    path("auth/reset-password/", views.reset_password),
    path("auth/profile/", views.profile),
    path("admin/users/", views.users),
    path("admin/users/<int:user_id>/", views.user_detail),
]

from . import workspace as data

urlpatterns += [
    path("workspace/", data.workspace),
    path("plans/", data.plans),
    path("public/businesses/<slug:slug>/", data.public_business),
    path("public/businesses/<slug:slug>/events/", data.track_event),
    path("subscriptions/request/", data.subscription_request),
    path("admin/subscriptions/<str:request_id>/review/", data.review_subscription),
]
urlpatterns += [path("public/config/", data.public_config)]

urlpatterns += [
    path("health/", views.health),
    path("subscriptions/telegram/", data.telegram_subscription),
    path(
        "admin/businesses/<str:business_id>/subscription/", data.activate_subscription
    ),
]
