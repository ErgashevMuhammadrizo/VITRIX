from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/v1/", include("accounts.urls")),
]
admin.site.site_header = "VITRIX boshqaruvi"
admin.site.site_title = "VITRIX Admin"

from django.conf import settings
from django.conf.urls.static import static
from accounts.media import media

urlpatterns += [
    path("media/<path:path>", media)
]
