from django.urls import path
from . import views

app_name = 'jdirecto'

urlpatterns = [
    path('inicio/', views.inicioJD, name='inicioJefeD'),
]