from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from .models import Notification, PushSubscription
from pywebpush import webpush, WebPushException
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    NOTIFICATION_TYPES = {
        'BITACORA': 'bitacora',
        'REVISION': 'revision',
        'AUTORIZACION': 'autorizacion',
        'RECHAZO': 'rechazo',
        'SISTEMA': 'sistema'
    }

    @staticmethod
    def create_notification(recipient, message, notification_type='sistema', related_bitacora=None, related_ejemplo=None, url=None, priority=0):
        """
        Crear y enviar notificación mejorada
        """
        try:
            with transaction.atomic():
                # Crear notificación
                notification = Notification.objects.create(
                    recipient=recipient,
                    message=message,
                    type=notification_type,
                    related_bitacora=related_bitacora,
                    related_ejemplo=related_ejemplo,
                    url=url,
                    priority=priority
                )

                # Preparar datos
                notification_data = notification.get_notification_data()
                
                # Enviar por diferentes canales
                results = {
                    'websocket': NotificationService.send_websocket_notification(notification, notification_data),
                    'push': NotificationService.send_push_notification(
                        recipient=recipient,
                        title=f"ICAYS - {notification_type.capitalize()}",
                        body=message,
                        url=url,
                        data=notification_data
                    )
                }

                logger.info(f"Notificación enviada: {notification.id_notification} - Resultados: {results}")
                return notification, results

        except Exception as e:
            logger.error(f"Error al crear notificación: {str(e)}")
            raise

    @staticmethod
    def send_websocket_notification(notification, data):
        """
        Enviar notificación por WebSocket con manejo de errores mejorado
        """
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                raise ValueError("Channel layer no disponible")

            group_name = f'notifications_{notification.recipient.id_user}'
            
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'notification.message',
                    'notification': data,
                    'timestamp': notification.created_at.isoformat()
                }
            )
            return True

        except Exception as e:
            logger.error(f"Error WebSocket para notificación {notification.id_notification}: {str(e)}")
            return False

    @staticmethod
    def send_push_notification(recipient, title, body, url=None, data=None):
        """
        Enviar una notificación push al usuario
        """
        try:
            # Importar la función aquí para evitar importaciones circulares
            from .push_views import send_push_notification as push_sender
            
            logger.info(f"Enviando notificación push: Título={title}, Mensaje={body}")
            logger.info(f"Destinatario: {recipient.username} (ID: {recipient.id})")
            
            # Enviar la notificación push
            result = push_sender(
                user=recipient,
                title=title,
                body=body,
                url=url,
                tag='notification',
                data=data
            )
            
            success = result.get('success', 0) > 0
            logger.info(f"Resultado push: {result}")
            logger.info(f"Push enviado exitosamente: {success}")
            
            return success
        except Exception as e:
            logger.error(f"Error al enviar notificación push: {str(e)}")
            return False
    
    @staticmethod
    def mark_as_read(notification_id, user):
        """
        Marcar una notificación como leída
        """
        try:
            notification = Notification.objects.get(id_notification=notification_id, recipient=user)
            notification.is_read = True
            notification.save()
            logger.info(f"Notificación marcada como leída: ID={notification_id}, Usuario={user.username}")
            return True
        except Notification.DoesNotExist:
            logger.error(f"Error: Notificación no encontrada: ID={notification_id}, Usuario={user.username}")
            return False
    
    @staticmethod
    def mark_all_as_read(user):
        """
        Marcar todas las notificaciones de un usuario como leídas
        """
        count = Notification.objects.filter(recipient=user, is_read=False).update(is_read=True)
        logger.info(f"Todas las notificaciones marcadas como leídas para {user.username}: {count} actualizadas")
        return count

class PushNotificationService:
    @staticmethod
    def send_push_notification(subscription_info, payload, ttl=None):
        """
        Método mejorado para enviar notificaciones push
        """
        try:
            response = webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    'sub': f'mailto:{settings.VAPID_ADMIN_EMAIL}',
                    'exp': int(time.time()) + 12 * 60 * 60  # 12 horas
                },
                ttl=ttl or 24 * 60 * 60  # 24 horas por defecto
            )
            return True, response
            
        except WebPushException as e:
            logger.error(f"Error Push Notification: {str(e)}")
            if e.response and e.response.status_code == 410:
                # Eliminar suscripción expirada
                PushSubscription.objects.filter(
                    endpoint=subscription_info['endpoint']
                ).delete()
            return False, str(e)

from .push_views import send_push_notification

def notify_user(user, message, related_ejemplo=None, url=None):
    """
    Envía una notificación a un usuario por todos los canales disponibles
    """
    # 1. Crear notificación en la base de datos
    from .models import Notification
    notification = Notification.objects.create(
        recipient=user,
        message=message,
        related_ejemplo=related_ejemplo
    )
    
    # 2. Enviar notificación push si está configurado
    push_result = send_push_notification(
        user=user,
        title="ICAYS Notificación",
        body=message,
        url=url
    )
    
    # 3. Enviar notificación por WebSocket si está configurado
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if channel_layer:
            notification_data = {
                'type': 'notification_message',
                'notification_id': notification.id_notification,
                'message': notification.message,
                'created_at': notification.created_at.isoformat(),
                'is_read': notification.is_read
            }
            
            if related_ejemplo:
                notification_data['ejemplo_id'] = related_ejemplo.id_ejemplos
            
            if url:
                notification_data['url'] = url
            
            # Enviar al grupo del usuario
            async_to_sync(channel_layer.group_send)(
                f'notifications_{user.id}',
                notification_data
            )
    except Exception as e:
        logger.error(f"Error al enviar notificación por WebSocket: {e}")
    
    return {
        'notification': notification,
        'push_result': push_result
    }