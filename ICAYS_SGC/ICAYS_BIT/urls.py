from django.urls import path, include
from . import views

app_name = 'microalimentos'

urlpatterns = [
    # Rutas específicas primero
    path('detallesBita/<int:bitacora_id>/', views.ver_bitacora, name='detalles_bitacoras'),
    path('api/contar-bitacoras/', views.contar_bitacoras, name='contar_bitacoras'),
    # Rutas generales después
    path('inicio/', views.vistaAnalista, name='inicioAnalistas'),
    path('FP131/', views.registerNewBita, name='registerBita'),
    path('inicio/bitacoras/', views.bitacoras, name='tipoBitacoras'),
    path('bitacorasAnaliticas/', views.analiticas, name='BitacorasAnaliticas'),
    path('mantenimiento/', views.paginasNo, name='paginando'),
    path('FP133/', views.cuentademohosylevaduras, name='FP-133'),
    path('listaBita/', views.ListaBita, name='lista_bitacoras'),
    path('registrar_bitacora/', views.registrar_bitacora, name='registrar_bitacora'),
    # Rutas incluidas al final
    
]
