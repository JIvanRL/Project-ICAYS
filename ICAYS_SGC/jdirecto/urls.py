from django.urls import path
from . import views

app_name = 'jdirecto'

urlpatterns = [
    path('inicio/', views.inicioJD, name='inicioJefeD'),
    path('pendientes/', views.lista_bitacoras_pendientes, name='lista_bitacoras_pendientes'),
    path('revisadas/', views.lista_bitacoras_revisadas, name='lista_bitacoras_revisadas'),
    # Ver bitácora - URL simplificada para coincidir con la función DetallesBita
    path('ver/<int:bitacora_id>/', views.ver_bitacora, name='ver_bitacora'),
    path('bitacoraRevisada/<int:bitacora_id>/', views.ver_bitacora_revisada, name='bitacora_revisada'),
     # URL existente (mantener para compatibilidad)
    # URL para contar bitácoras por estado (sin usuario específico)
    path('contar-bitacoras/<str:estado>/', views.contar_bitacoras, name='contar_bitacoras'),
    
    # URL para contar bitácoras por estado y usuario
    path('contar-bitacoras/<str:estado>/<int:usuario_id>/', views.contar_bitacoras, name='contar_bitacoras_usuario'),
    # URL modificada para no requerir el parámetro nuevo_estado
    path('cambia_estado_bitacora/<int:bitacora_id>/', views.cambiar_estado, name='cambia_estado_bitacora'),
    # Nueva ruta para la API de usuarios
    path('api/usuarios/', views.api_usuarios, name='api_usuarios'),
    # Agregar estas URLs al urlpatterns
    path('guardar_campos_observaciones/', views.guardar_campos_observaciones, name='guardar_campos_observaciones'),
    path('obtener_campos_observaciones/<int:bitacora_id>/', views.obtener_campos_observaciones, name='obtener_campos_observaciones'),
     # Agregar esta URL para eliminar observaciones
    path('eliminar_campo_observacion/', views.eliminar_campo_observacion, name='eliminar_campo_observacion'),

]
