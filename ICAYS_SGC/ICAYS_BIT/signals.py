# ICAYS_SGC/ICAYS_BIT/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.urls import reverse
from django.utils import timezone
from .models import ejemplosFormulas, CustomUser, Bitcoras_Cbap, bita_cbap
from .services import NotificationService

@receiver(post_save, sender=ejemplosFormulas)
def create_ejemplo_notification(sender, instance, created, **kwargs):
    """
    Crear notificaciones cuando una nueva ejemplosFormulas instancia es creada o actualizada
    """
    # Get the related bita_cbap user if available
    if instance.nombre_bita_cbap and instance.nombre_bita_cbap.firma_user:
        user = instance.nombre_bita_cbap.firma_user
        
        if created:
            message = f"Nuevo ejemplo creado: {instance.clave_muestra_ejemplo}"
        else:
            message = f"Ejemplo actualizado: {instance.clave_muestra_ejemplo}"
        
        try:
            # Usar el nombre correcto de la URL según urls.py
            url = reverse('microalimentos:detalles_bitacoras', args=[instance.nombre_bita_cbap.id_cbap])
            
            # Crear notificación para el usuario
            NotificationService.create_notification(
                recipient=user,
                message=message,
                related_ejemplo=instance,
                url=url
            )
            
            # Opcionalmente, notificar administradores u otros usuarios relevantes
            admin_users = CustomUser.objects.filter(is_staff=True)
            for admin in admin_users:
                if admin != user:  # No notificar al mismo usuario dos veces
                    admin_message = f"{user.username} ha {'creado' if created else 'actualizado'} el ejemplo {instance.clave_muestra_ejemplo}"
                    NotificationService.create_notification(
                        recipient=admin,
                        message=admin_message,
                        related_ejemplo=instance,
                        url=url
                    )
        except Exception as e:
            # Si hay un error al generar la URL, crear notificación sin URL
            print(f"Error al generar URL para notificación: {str(e)}")
            NotificationService.create_notification(
                recipient=user,
                message=message,
                related_ejemplo=instance
            )

@receiver(pre_save, sender=Bitcoras_Cbap)
def detect_bitacora_state_change(sender, instance, **kwargs):
    """
    Detectar cambios en el estado de las bitácoras y enviar notificaciones
    """
    # Si es una nueva bitácora, no hay cambio de estado previo
    if instance.pk is None:
        return
    
    # Obtener el estado anterior
    try:
        previous = Bitcoras_Cbap.objects.get(pk=instance.pk)
        previous_state = previous.estado
    except Bitcoras_Cbap.DoesNotExist:
        return
    
    # Si el estado no ha cambiado, no hacer nada
    if previous_state == instance.estado:
        return
    
    # Determinar el mensaje basado en el cambio de estado
    state_messages = {
        'enviada': f"La bitácora {instance.nombre_bita_cbap.nombre_cbap if instance.nombre_bita_cbap else 'sin nombre'} ha sido enviada para revisión",
        'revisada': f"La bitácora {instance.nombre_bita_cbap.nombre_cbap if instance.nombre_bita_cbap else 'sin nombre'} ha sido revisada",
        'autorizada': f"La bitácora {instance.nombre_bita_cbap.nombre_cbap if instance.nombre_bita_cbap else 'sin nombre'} ha sido autorizada",
        'rechazada': f"La bitácora {instance.nombre_bita_cbap.nombre_cbap if instance.nombre_bita_cbap else 'sin nombre'} ha sido rechazada"
    }
    
    # Si el nuevo estado está en nuestro diccionario, enviar notificación
    if instance.estado in state_messages:
        message = state_messages[instance.estado]
        
        # Determinar los destinatarios de la notificación
        recipients = []
        
        # El creador de la bitácora siempre recibe notificación
        if instance.name_user_cbap:
            recipients.append(instance.name_user_cbap)
        
        # Si la bitácora está asociada a un usuario específico, notificarle también
        if instance.nombre_bita_cbap and instance.nombre_bita_cbap.firma_user:
            if instance.nombre_bita_cbap.firma_user not in recipients:
                recipients.append(instance.nombre_bita_cbap.firma_user)
        
        # Si hay un revisor, notificarle
        if instance.firma_revisor and instance.firma_revisor not in recipients:
            recipients.append(instance.firma_revisor)
        
        # Si hay un autorizador, notificarle
        if instance.firma_autorizador and instance.firma_autorizador not in recipients:
            recipients.append(instance.firma_autorizador)
        
        # Crear URL para la notificación
        if instance.nombre_bita_cbap:
            try:
                # Determinar la URL adecuada según el estado
                if instance.estado == 'autorizada' or instance.estado == 'rechazada':
                    url = reverse('microalimentos:ver_bitacora_autorizada', args=[instance.nombre_bita_cbap.id_cbap])
                elif instance.estado == 'revisada':
                    url = reverse('microalimentos:ver_bitacora_revision', args=[instance.nombre_bita_cbap.id_cbap])
                else:
                    url = reverse('microalimentos:detalles_bitacoras', args=[instance.nombre_bita_cbap.id_cbap])
                
                # Enviar notificación a todos los destinatarios
                for recipient in recipients:
                    NotificationService.create_notification(
                        recipient=recipient,
                        message=message,
                        url=url
                    )
            except Exception as e:
                # Si hay un error al generar la URL, crear notificación sin URL
                print(f"Error al generar URL para notificación de cambio de estado: {str(e)}")
                for recipient in recipients:
                    NotificationService.create_notification(
                        recipient=recipient,
                        message=message
                    )
# Signal para actualizar fechas automáticamente cuando cambia el estado
@receiver(pre_save, sender=Bitcoras_Cbap)
def update_state_dates(sender, instance, **kwargs):
    """
    Actualizar automáticamente las fechas cuando cambia el estado de la bitácora
    """
    # Si es una nueva bitácora, no hay cambio de estado previo
    if instance.pk is None:
        return
    
    # Obtener el estado anterior
    try:
        previous = Bitcoras_Cbap.objects.get(pk=instance.pk)
        previous_state = previous.estado
    except Bitcoras_Cbap.DoesNotExist:
        return
    
    # Si el estado no ha cambiado, no hacer nada
    if previous_state == instance.estado:
        return
    
    # Actualizar fechas según el nuevo estado
    now = timezone.now()
    
    if instance.estado == 'enviada' and not instance.fecha_envio:
        instance.fecha_envio = now
    
    elif instance.estado == 'revisada' and not instance.fecha_revision:
        instance.fecha_revision = now
    
    elif instance.estado == 'autorizada' and not instance.fecha_autorizacion:
        instance.fecha_autorizacion = now
