from django.urls import path
from . import views

app_name = 'microalimentos'

urlpatterns = [
    # URL para la página de inicio de sesión
    #path('', login_view, name='login'),
    # URL para la vista de microbiología
    path('inicio/', views.vistaAnalista, name='inicioAnalistas'),
    path('FP131/', views.registerNewBita, name='FP-131'),
    path('inicio/bitacoras/', views.bitacoras, name='tipoBitacoras'),
    path('bitacorasAnaliticas/', views.analiticas, name='BitacorasAnaliticas'),
    path('mantenimiento/', views.paginasNo, name='paginando'),
    path('FP133/', views.cuentademohosylevaduras, name='FP-133'),
]