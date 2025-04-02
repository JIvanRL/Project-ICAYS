"""
URL configuration for ICAYS_SGC project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from ICAYS_BIT.push_views import get_public_key
from ICAYS_BIT.views import service_worker  # Importar directamente la vista del service worker


urlpatterns = [
    path('', include('login.urls')),
    path('microbiologia/', include('ICAYS_BIT.urls')),
    path('admin/', admin.site.urls),
    path('jdirecto/', include('jdirecto.urls')),
    path('calidad/', include('calidad.urls')),

    path('api/push/public-key/', get_public_key, name='get_public_key'),
    # Ruta para el service worker en la raíz del sitio
    path('service-worker.js', service_worker, name='service_worker'),
]
