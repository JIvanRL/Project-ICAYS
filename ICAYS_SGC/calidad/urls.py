from django.urls import path
from . import views

app_name = 'calidadApp'

urlpatterns = [
    path('inicio/', views.calidad, name='inicioCalidad'),
    path('AdministracionUsuarios/', views.AdminUsers, name='adminUsuarios'),
    path('NewUser/', views.CrearUser, name='crearUsuario'),
    path('Editar/<int:usuarioId>/', views.EditarUsers, name='editarUser'),
    ]