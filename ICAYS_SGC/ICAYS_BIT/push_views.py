import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.conf import settings

# Obtener claves VAPID de settings.py
VAPID_PRIVATE_KEY = getattr(settings, 'VAPID_PRIVATE_KEY', None)
VAPID_PUBLIC_KEY = getattr(settings, 'VAPID_PUBLIC_KEY', None)
VAPID_CLAIMS = getattr(settings, 'VAPID_CLAIMS', {
    "sub": "mailto:joseivanriveralopez81@gmail.com"
})

# Verificar si pywebpush está instalado
try:
    from pywebpush import webpush, WebPushException
    PUSH_ENABLED = True
    print("pywebpush está instalado. Las notificaciones push están disponibles.")
except ImportError:
    PUSH_ENABLED = False
    print("pywebpush no está instalado. Las notificaciones push no estarán disponibles.")
    print("Instala pywebpush con: pip install pywebpush")

def get_public_key(request):
    """
    Devuelve la clave pública VAPID para notificaciones push
    """
    if not VAPID_PUBLIC_KEY:
        print("Error: VAPID_PUBLIC_KEY no está configurada en settings.py")
        return JsonResponse({
            'error': 'Las notificaciones push no están configuradas en el servidor'
        }, status=501)
    
    print(f"Devolviendo clave pública VAPID: {VAPID_PUBLIC_KEY}")
    return JsonResponse({
        'publicKey': VAPID_PUBLIC_KEY
    })

@login_required
@require_http_methods(["POST"])
def subscribe(request):
    """
    Guarda una nueva suscripción push para el usuario actual
    """
    if not PUSH_ENABLED:
        print("Error: pywebpush no está instalado")
        return JsonResponse({
            'error': 'Las notificaciones push no están configuradas en el servidor'
        }, status=501)
    
    try:
        data = json.loads(request.body)
        subscription_data = data.get('subscription', {})
        
        # Extraer datos de la suscripción
        endpoint = subscription_data.get('endpoint')
        keys = subscription_data.get('keys', {})
        p256dh = keys.get('p256dh')
        auth = keys.get('auth')
        
        if not endpoint or not p256dh or not auth:
            print(f"Error: Datos de suscripción incompletos: {subscription_data}")
            return JsonResponse({
                'error': 'Datos de suscripción incompletos'
            }, status=400)
        
        # Importar el modelo aquí para evitar importaciones circulares
        from .models import PushSubscription
        
        # Guardar o actualizar la suscripción
        subscription, created = PushSubscription.objects.update_or_create(
            user=request.user,
            endpoint=endpoint,
            defaults={
                'p256dh': p256dh,
                'auth': auth
            }
        )
        
        print(f"Suscripción {'creada' if created else 'actualizada'} para {request.user.username}: {endpoint}")
        return JsonResponse({
            'success': True,
            'created': created,
            'message': 'Suscripción guardada correctamente'
        })
    
    except Exception as e:
        print(f"Error al guardar suscripción: {str(e)}")
        return JsonResponse({
            'error': str(e)
        }, status=500)

@login_required
@require_http_methods(["POST"])
def unsubscribe(request):
    """
    Elimina una suscripción push para el usuario actual
    """
    try:
        data = json.loads(request.body)
        subscription_data = data.get('subscription', {})
        
        # Extraer endpoint de la suscripción
        endpoint = subscription_data.get('endpoint')
        
        if not endpoint:
            return JsonResponse({
                'error': 'Endpoint de suscripción no proporcionado'
            }, status=400)
        
        # Importar el modelo aquí para evitar importaciones circulares
        from .models import PushSubscription
        
        # Eliminar la suscripción
        deleted, _ = PushSubscription.objects.filter(
            user=request.user,
            endpoint=endpoint
        ).delete()
        
        return JsonResponse({
            'success': True,
            'deleted': deleted > 0,
            'message': 'Suscripción eliminada correctamente' if deleted > 0 else 'No se encontró la suscripción'
        })
    
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)

def send_push_notification(user, title, body, url=None, tag=None, data=None):
    """
    Envía una notificación push a un usuario
    """
    if not PUSH_ENABLED or not VAPID_PRIVATE_KEY:
        print("Las notificaciones push no están configuradas")
        return {'success': False, 'error': 'Push notifications not configured'}
    
    # Importar el modelo aquí para evitar importaciones circulares
    from .models import PushSubscription
    
    # Obtener todas las suscripciones del usuario
    subscriptions = PushSubscription.objects.filter(user=user)
    
    if not subscriptions:
        print(f"No hay suscripciones para el usuario {user.username}")
        return {'success': False, 'error': 'No subscriptions found'}
    
    # Preparar datos de la notificación
    payload = {
        'title': title,
        'body': body,
        'icon': '/static/img/logo.png',
        'badge': '/static/img/badge.png',
        'tag': tag or 'default',
        'requireInteraction': True,
        'data': data or {}
    }
    
    # Añadir URL si se proporciona
    if url:
        payload['data']['url'] = url
    
    # Convertir payload a JSON
    payload_json = json.dumps(payload)
    
    print(f"Enviando notificación push a {user.username} con payload: {payload}")
    
    # Enviar notificación a cada suscripción del usuario
    results = {
        'total': len(subscriptions),
        'success': 0,
        'failed': 0,
        'errors': []
    }
    
    # Enviar notificación a cada suscripción
    for subscription in subscriptions:
        try:
            subscription_info = {
                'endpoint': subscription.endpoint,
                'keys': {
                    'p256dh': subscription.p256dh,
                    'auth': subscription.auth
                }
            }
            
            print(f"Enviando a endpoint: {subscription.endpoint}")
            
            webpush(
                subscription_info=subscription_info,
                data=payload_json,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
            
            print(f"Notificación enviada correctamente a {subscription.endpoint}")
            results['success'] += 1
        
        except WebPushException as e:
            print(f"Error al enviar notificación push: {e}")
            
            # Si la suscripción ya no es válida, eliminarla
            if e.response and e.response.status_code in [404, 410]:
                print(f"Eliminando suscripción inválida: {subscription.endpoint}")
                subscription.delete()
            
            results['failed'] += 1
            results['errors'].append(str(e))
        
        except Exception as e:
            print(f"Error inesperado al enviar notificación push: {e}")
            results['failed'] += 1
            results['errors'].append(str(e))
    
    print(f"Resultados del envío: {results}")
    return results