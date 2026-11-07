import re
from django.conf import settings
from django.http import Http404
from django.views.static import serve


def media(request, path):
    if not re.fullmatch(r"uploads/[a-f0-9]{32}\.(jpg|png|webp)", path):
        raise Http404()
    response = serve(request, path, document_root=settings.MEDIA_ROOT)
    response["X-Content-Type-Options"] = "nosniff"
    response["Content-Security-Policy"] = "default-src 'none'; sandbox"
    return response
