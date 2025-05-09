from django.urls import path
from . import views

urlpatterns = [
    path('api/solicitud-autorizacion/<int:bitacora_id>/<str:campo_id>/', 
         views.SolicitudAutorizacionView.as_view(), 
         name='solicitud-autorizacion-detalle'),
]