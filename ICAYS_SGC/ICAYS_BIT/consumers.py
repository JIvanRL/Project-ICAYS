# ICAYS_SGC/ICAYS_BIT/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from .models import Notification

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Verificar autenticación
        if not self.scope.get('user') or self.scope['user'].is_anonymous:
            await self.close()
            return
            
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        
        # Verificar que el usuario solo pueda conectarse a su propio canal
        if str(self.scope['user'].id_user) != str(self.user_id):
            await self.close()
            return
            
        self.notification_group_name = f'notifications_{self.user_id}'
        
        print(f"[WebSocket] Conectando usuario {self.user_id} al grupo {self.notification_group_name}")
        
        # Join notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Enviar mensaje de conexión exitosa para depuración
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Conectado al servidor de notificaciones'
        }))
        
        print(f"[WebSocket] Usuario {self.user_id} conectado exitosamente")
    
    async def disconnect(self, close_code):
        print(f"[WebSocket] Desconectando usuario {self.user_id} del grupo {self.notification_group_name}")
        
        # Leave notification group
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )
        
        print(f"[WebSocket] Usuario {self.user_id} desconectado")
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        print(f"[WebSocket] Mensaje recibido de usuario {self.user_id}: {text_data}")
        
        data = json.loads(text_data)
        message_type = data.get('type', '')
        
        if message_type == 'mark_read':
            notification_id = data.get('notification_id')
            success = await self.mark_notification_as_read(notification_id)
            
            # Send confirmation back to WebSocket
            await self.send(text_data=json.dumps({
                'type': 'notification_marked_read',
                'notification_id': notification_id,
                'success': success
            }))
            
            print(f"[WebSocket] Notificación {notification_id} marcada como leída: {success}")
    
    # Receive message from notification group
    async def notification_message(self, event):
        """Maneja los mensajes recibidos del grupo de notificaciones"""
        print(f"[WebSocket] Recibiendo mensaje del grupo: {event}")
        message_type = event.get('type', '')
        
        if message_type == 'send_notification':
            await self.send_notification(event)
        else:
            # Para otros tipos de mensajes, enviar directamente
            await self.send(text_data=json.dumps(event))
    
    async def send_notification(self, event):
        """
        Maneja específicamente el envío de notificaciones al cliente
        """
        try:
            notification_data = {
                'type': 'notification',
                'notification': {
                    'id': event.get('notification_id'),
                    'message': event.get('message'),
                    'created_at': event.get('created_at'),
                    'url': event.get('url', None),
                    'extra_data': event.get('extra_data', {}),
                    'notification_type': event.get('notification_type', 'info')  # Añadir tipo de notificación
                }
            }
            
            print(f"[WebSocket] Enviando notificación: {notification_data}")
            await self.send(text_data=json.dumps(notification_data))
            
        except Exception as e:
            print(f"[WebSocket] Error al enviar notificación: {str(e)}")
            # Enviar mensaje de error al cliente
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Error al procesar la notificación',
                'error_code': 'NOTIFICATION_SEND_ERROR'
            }))
    
    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        try:
            notification = Notification.objects.select_for_update().get(
                id_notification=notification_id,
                user_id=self.user_id  # Asegurar que la notificación pertenece al usuario
            )
            notification.is_read = True
            notification.save()
            return True
        except ObjectDoesNotExist:
            return False