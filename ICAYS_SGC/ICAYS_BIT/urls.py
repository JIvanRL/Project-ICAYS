from django.urls import path
from .views import login_view, vistaAnalista, registerNewBita

urlpatterns = [
    # URL para la página de inicio de sesión
    path('', login_view, name='login'),
    # URL para la vista de microbiología
    path('areas/microbiologyll/', vistaAnalista, name='microbiologyll'),
     # URL para la vista de registro de bitácora
    path('microbiologyll/registerBita/', registerNewBita, name='registerBita'),
]