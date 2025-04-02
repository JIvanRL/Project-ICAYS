# ICAYS_SGC/ICAYS_BIT/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
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
        # Imprimir el evento para depuración
        print(f"[WebSocket] Enviando notificación al cliente {self.user_id}: {event}")
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps(event))
    
    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        try:
            notification = Notification.objects.get(id_notification=notification_id)
            notification.is_read = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False