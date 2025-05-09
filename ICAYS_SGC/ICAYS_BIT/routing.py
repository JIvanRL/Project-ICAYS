# ICAYS_SGC/ICAYS_BIT/routing.py

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Notificaciones generales - acepta solo IDs numéricos
    re_path(
        r'^ws/notifications/(?P<user_id>\d+)/$',
        consumers.NotificationConsumer.as_asgi(),
        name='notifications'
    ),
    
    # Notificaciones en tiempo real para bitácoras
    re_path(
        r'^ws/notifications/bitacora/(?P<user_id>\d+)/$',
        consumers.NotificationConsumer.as_asgi(),
        name='bitacora_notifications'
    ),
    
    # Notificaciones de sistema
    re_path(
        r'^ws/notifications/system/(?P<user_id>\d+)/$',
        consumers.NotificationConsumer.as_asgi(),
        name='system_notifications'
    ),
]