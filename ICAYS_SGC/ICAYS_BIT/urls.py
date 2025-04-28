from django.urls import path
from . import views, push_views

app_name = 'microalimentos'

urlpatterns = [
    # Rutas específicas primero
    path('inicio/', views.vistaAnalista, name='inicioAnalistas'),
    path('FP131/', views.registerNewBita, name='registerBita'),
    path('inicio/bitacoras/', views.bitacoras, name='tipoBitacoras'),
    path('bitacorasAnaliticas/', views.analiticas, name='BitacorasAnaliticas'),
    path('mantenimiento/', views.paginasNo, name='paginando'),
    path('FP133/', views.cuentademohosylevaduras, name='FP-133'),
    #listado de bitacoras
    path('listaBita/', views.lista_bitacoras_guardadas, name='lista_bitacoras'),
    #listado de bitacoras en revision
    path('listaBitaRevision/', views.lista_bitacoras_revision, name='lista_bitacoras_revision'),
    #listado de bitacoras en revision
    path('listaBitaRechazada/', views.lista_bitacoras_rechazadas, name='lista_bitacoras_rechazadas'),
    #listado de bitacoras autorizadas
    path('historial/<int:año>/<int:mes>/', views.lista_bitacoras_por_periodo, name='lista_bitacoras_por_periodo'),
    #Registrar bitacora
    path('registrar_bitacora/', views.registrar_bitacora, name='registrar_bitacora'),
    path('api/usuarios/', views.obtener_usuarios_json, name='obtener_usuarios_json'),
    path('detallesBita/<int:bitacora_id>/', views.ver_bitacora, name='detalles_bitacoras'),
    path('detallesBitaRevision/<int:bitacora_id>/', views.ver_bitacora_revision, name='ver_bitacora_revision'),
    path('detallesBitaRechazada/<int:bitacora_id>/', views.ver_bitacora_rechazada, name='ver_bitacora_rechazada'),
    path('obtener_campos_observaciones/<int:bitacora_id>/', views.obtener_campos_observaciones, name='obtener_campos_observaciones'),
    path('detallesBitaAutorizada/<int:bitacora_id>/', views.ver_bitacora_autorizada, name='ver_bitacora_autorizada'),
   # URL existente (mantener para compatibilidad)
    path('contar-bitacoras/<str:estado>/', views.contar_bitacoras, name='contar_bitacoras'),
    # Nueva URL con parámetro de usuario
    path('contar-bitacoras/<str:estado>/<int:usuario_id>/', views.contar_bitacoras, name='contar_bitacoras_usuario'),
    path('obtener-siguiente-numero-pagina/', views.obtener_siguiente_numero_pagina, name='obtener_siguiente_numero_pagina'),
     # URL para modificar una bitácora existente
    path('modificar_bitacora/<int:bitacora_id>/', views.modificar_bitacora, name='modificar_bitacora'),
    path('modificar_bitacora_rechazada/<int:bitacora_id>/', views.modificar_bitacora_rechazada, name='modificar_bitacora_rechazada'),
    # Vista para historial de bitácoras por año
    path('historial-anios/', views.historial_bitacoras_por_anio, name='historial_bitacoras_por_anio'),
     # Vista para historial de bitácoras por mes
    path('historial-meses/<int:anio>/', views.historial_bitacoras_por_mes, name='historial_bitacoras_por_mes'),
    # Endpoints de notificaciones
    path('api/notifications/', views.get_notifications, name='get_notifications'),
    path('api/notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('api/notifications/mark-all-read/', views.mark_all_read, name='mark_all_read'),
    path('api/push/public-key/', push_views.get_public_key, name='get_public_key'),
    path('api/push/subscribe/', push_views.subscribe, name='push_subscribe'),
    path('api/push/unsubscribe/', push_views.unsubscribe, name='push_unsubscribe'),
    path('guardar_campos_corregidos/', views.guardar_campos_corregidos, name='guardar_campos_corregidos'),
    # Endpoints para autorizaciones
    path('api/solicitar-autorizacion/', views.solicitar_autorizacion_api, name='solicitar_autorizacion_api'),
    
]

