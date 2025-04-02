import json
import base64
import os
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.conf import settings

# Importar pywebpush para enviar notificaciones push
try:
    from pywebpush import webpush, WebPushException
    PUSH_ENABLED = True
except ImportError:
    PUSH_ENABLED = False
    print("pywebpush no está instalado. Las notificaciones push no estarán disponibles.")
    print("Instala pywebpush con: pip install pywebpush")

# Claves VAPID para Web Push
# En producción, estas claves deben estar en settings.py y generarse una sola vez
VAPID_PRIVATE_KEY = getattr(settings, 'VAPID_PRIVATE_KEY', None)
VAPID_PUBLIC_KEY = getattr(settings, 'VAPID_PUBLIC_KEY', None)
VAPID_CLAIMS = getattr(settings, 'VAPID_CLAIMS', {
    "sub": "mailto:webmaster@icays.com"
})

# Generar claves VAPID si no existen
def generate_vapid_keys():
    if not PUSH_ENABLED:
        return None, None
    
    try:
        # Método alternativo para generar claves VAPID
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.primitives import serialization
        
        # Generar clave privada
        private_key = ec.generate_private_key(
            curve=ec.SECP256R1()
        )
        
        # Obtener clave pública
        public_key = private_key.public_key()
        
        # Serializar clave privada
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        # Serializar clave pública
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        # Convertir a base64 para uso en Web Push
        private_key_str = base64.urlsafe_b64encode(private_pem).decode('utf-8')
        public_key_str = base64.urlsafe_b64encode(public_pem).decode('utf-8')
        
        return private_key_str, public_key_str
    except Exception as e:
        print(f"Error al generar claves VAPID: {e}")
        return None, None

# Si no hay claves VAPID configuradas, generarlas
if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
    VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY = generate_vapid_keys()
    if VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY:
        print("Claves VAPID generadas. Añade estas claves a tu settings.py:")
        print(f"VAPID_PRIVATE_KEY = '{VAPID_PRIVATE_KEY}'")
        print(f"VAPID_PUBLIC_KEY = '{VAPID_PUBLIC_KEY}'")
    else:
        print("No se pudieron generar las claves VAPID. Las notificaciones push no funcionarán correctamente.")

def get_public_key(request):
    """
    Devuelve la clave pública VAPID para notificaciones push
    """
    if not PUSH_ENABLED or not VAPID_PUBLIC_KEY:
        return JsonResponse({
            'error': 'Las notificaciones push no están configuradas en el servidor'
        }, status=501)
    
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
        
        return JsonResponse({
            'success': True,
            'created': created,
            'message': 'Suscripción guardada correctamente'
        })
    
    except Exception as e:
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
    Envía una notificación push a todas las suscripciones del usuario
    
    Args:
        user: Usuario al que enviar la notificación
        title: Título de la notificación
        body: Cuerpo de la notificación
        url: URL opcional a la que redirigir al hacer clic
        tag: Etiqueta opcional para agrupar notificaciones
        data: Datos adicionales para la notificación
    
    Returns:
        dict: Resultado del envío con éxitos y errores
    """
    if not PUSH_ENABLED or not VAPID_PRIVATE_KEY:
        print("Las notificaciones push no están configuradas")
        return {'success': False, 'error': 'Push notifications not configured'}
    
    # Importar el modelo aquí para evitar importaciones circulares
    from .models import PushSubscription
    
    # Preparar datos de la notificación
    payload = {
        'title': title,
        'body': body,
        'icon': '/static/img/logo.png',
        'tag': tag or 'default',
        'data': data or {}
    }
    
    # Añadir URL si se proporciona
    if url:
        payload['data']['url'] = url
    
    # Convertir payload a JSON
    payload_json = json.dumps(payload)
    
    # Obtener todas las suscripciones del usuario
    subscriptions = PushSubscription.objects.filter(user=user)
    
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
            
            webpush(
                subscription_info=subscription_info,
                data=payload_json,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
            
            results['success'] += 1
        
        except WebPushException as e:
            # Si la suscripción ya no es válida, eliminarla
            if e.response and e.response.status_code in [404, 410]:
                subscription.delete()
            
            results['failed'] += 1
            results['errors'].append(str(e))
        
        except Exception as e:
            results['failed'] += 1
            results['errors'].append(str(e))
    
    return results