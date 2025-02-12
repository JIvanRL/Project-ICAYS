from django.urls import path
from . import views

urlpatterns = [
    path('ICAYS_BIT/', views.app, name='ICAYS_BIT'),
    path('areas/microbiologyll/', views.microbiologyll, name='microbiologyll'),
    path('microbiologyll/registerBita/', views.registerNewBita, name='registerBita'),
]