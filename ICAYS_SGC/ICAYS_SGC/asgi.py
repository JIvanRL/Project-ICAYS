"""
ASGI config for ICAYS_SGC project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import ICAYS_BIT.routing  # Asegúrate de que este módulo exista

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ICAYS_SGC.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            ICAYS_BIT.routing.websocket_urlpatterns
        )
    ),
})