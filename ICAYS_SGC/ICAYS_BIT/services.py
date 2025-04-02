# ICAYS_SGC/ICAYS_BIT/services.py
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from django.db import transaction
from .models import Notification
from pywebpush import webpush, WebPushException
from django.conf import settings
class NotificationService:
    @staticmethod
    def create_notification(recipient, message, related_ejemplo=None, url=None):
        """
        Crear una notificación y enviarla por todos los canales disponibles
        
        Args:
            recipient: Usuario destinatario
            message: Mensaje de la notificación
            related_ejemplo: Objeto ejemplosFormulas relacionado (opcional)
            url: URL a la que dirigir al hacer clic en la notificación (opcional)
        """
        with transaction.atomic():
            # 1. Guardar la notificación en la base de datos
            notification = Notification.objects.create(
                recipient=recipient,
                message=message,
                related_ejemplo=related_ejemplo
            )
            
            # 2. Preparar datos para la notificación
            notification_data = {
                'notification_id': notification.id_notification,
                'message': notification.message,
                'created_at': notification.created_at.isoformat(),
                'is_read': notification.is_read
            }
            
            if related_ejemplo:
                notification_data['ejemplo_id'] = related_ejemplo.id_ejemplos
                notification_data['clave_muestra_ejemplo'] = related_ejemplo.clave_muestra_ejemplo
            
            if url:
                notification_data['url'] = url
            
            # 3. Intentar enviar por WebSocket (para usuarios activos)
            websocket_sent = NotificationService.send_websocket_notification(notification, notification_data)
            
            # 4. Intentar enviar por Push Notification (para usuarios inactivos)
            push_sent = NotificationService.send_push_notification(
                recipient, 
                "Nueva notificación ICAYS", 
                message, 
                url, 
                notification_data
            )
            
            # Imprimir información de depuración
            print(f"Notificación creada: ID={notification.id_notification}, Mensaje={message}")
            print(f"WebSocket enviado: {websocket_sent}")
            print(f"Push enviado: {push_sent}")
            
            return {
                'notification': notification,
                'websocket_sent': websocket_sent,
                'push_sent': push_sent
            }
    
    @staticmethod
    def send_websocket_notification(notification, notification_data=None):
        """
        Enviar una notificación por WebSocket
        """
        try:
            channel_layer = get_channel_layer()
            
            if notification_data is None:
                # Si no se proporcionan datos, construirlos desde la notificación
                notification_data = {
                    'type': 'notification_message',
                    'notification_id': notification.id_notification,
                    'message': notification.message,
                    'created_at': notification.created_at.isoformat(),
                    'is_read': notification.is_read
                }
                
                if notification.related_ejemplo:
                    notification_data['ejemplo_id'] = notification.related_ejemplo.id_ejemplos
            else:
                # Asegurarse de que tenga el tipo correcto
                notification_data['type'] = 'notification_message'
            
            # Imprimir información de depuración
            print(f"Enviando notificación por WebSocket: {notification_data}")
            print(f"Grupo de notificación: notifications_{notification.recipient.id}")
            
            # Enviar notificación al grupo específico del usuario
            async_to_sync(channel_layer.group_send)(
                f'notifications_{notification.recipient.id}',
                notification_data
            )
            
            return True
        except Exception as e:
            print(f"Error al enviar notificación por WebSocket: {str(e)}")
            return False
    
    @staticmethod
    def send_push_notification(recipient, title, body, url=None, data=None):
        """
        Enviar una notificación push al usuario
        """
        try:
            # Importar la función aquí para evitar importaciones circulares
            from .push_views import send_push_notification as push_sender
            
            print(f"Enviando notificación push: Título={title}, Mensaje={body}")
            print(f"Destinatario: {recipient.username} (ID: {recipient.id})")
            
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
            print(f"Resultado push: {result}")
            print(f"Push enviado exitosamente: {success}")
            
            return success
        except Exception as e:
            print(f"Error al enviar notificación push: {str(e)}")
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
            print(f"Notificación marcada como leída: ID={notification_id}, Usuario={user.username}")
            return True
        except Notification.DoesNotExist:
            print(f"Error: Notificación no encontrada: ID={notification_id}, Usuario={user.username}")
            return False
    
    @staticmethod
    def mark_all_as_read(user):
        """
        Marcar todas las notificaciones de un usuario como leídas
        """
        count = Notification.objects.filter(recipient=user, is_read=False).update(is_read=True)
        print(f"Todas las notificaciones marcadas como leídas para {user.username}: {count} actualizadas")
        return count
class PushNotificationService:
    @staticmethod
    def send_push_notification(user, title, message, url=None, icon=None):
        """
        Enviar una notificación push a un usuario
        """
        from .models import PushSubscription
        
        # Obtener todas las suscripciones del usuario
        subscriptions = PushSubscription.objects.filter(user=user)
        
        if not subscriptions:
            return False
        
        # Preparar datos de la notificación
        payload = {
            'title': title,
            'body': message,
            'icon': icon or '/static/img/logo.png',
            'badge': '/static/img/badge.png',
            'requireInteraction': True
        }
        
        if url:
            payload['data'] = {'url': url}
        
        # Convertir a JSON
        payload_json = json.dumps(payload)
        
        # Enviar notificación a todas las suscripciones del usuario
        success_count = 0
        for subscription in subscriptions:
            try:
                webpush(
                    subscription_info={
                        'endpoint': subscription.endpoint,
                        'keys': {
                            'p256dh': subscription.p256dh,
                            'auth': subscription.auth
                        }
                    },
                    data=payload_json,
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={
                        'sub': f'mailto:{settings.VAPID_ADMIN_EMAIL}'
                    }
                )
                success_count += 1
            except WebPushException as e:
                print(f"Error al enviar notificación push: {e}")
                # Si la suscripción ya no es válida, eliminarla
                if e.response and e.response.status_code == 410:
                    subscription.delete()
        
        return success_count > 0
    
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
        print(f"Error al enviar notificación por WebSocket: {e}")
    
    return {
        'notification': notification,
        'push_result': push_result
    }