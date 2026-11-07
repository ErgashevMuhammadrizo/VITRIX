"""Delete only this request's staged uploads when its database write rolls back."""

from contextvars import ContextVar
from functools import wraps
from django.core.files.storage import default_storage

staged = ContextVar("vitrix_uploads", default=None)


def staged_uploads(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        paths = []
        token = staged.set(paths)
        try:
            response = fn(*args, **kwargs)
            if response.status_code >= 400:
                for path in paths:
                    default_storage.delete(path)
            return response
        except Exception:
            for path in paths:
                default_storage.delete(path)
            raise
        finally:
            staged.reset(token)

    return wrapped
