from django.urls import path
from . import views

app_name = 'loginApp'

urlpatterns = [
    path('', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout')
]