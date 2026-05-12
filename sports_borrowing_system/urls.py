"""
URL configuration for sports_borrowing_system project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.conf import settings

STATIC_ROOT = str(settings.BASE_DIR / 'static')


def serve_static(request, path, **kwargs):
    return serve(request, path, document_root=STATIC_ROOT, **kwargs)


def serve_js(request, path, **kwargs):
    return serve(request, f'js/{path}', document_root=STATIC_ROOT, **kwargs)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', lambda r: serve_static(r, 'login.html')),
    re_path(r'^(?P<path>login\.html|register\.html|dashboard\.html|equipment\.html|transactions\.html|admin\.html)$',
            serve_static),
    re_path(r'^js/(?P<path>.*)$', serve_js),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
