from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from functools import wraps

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect_user_based_on_role(user)
        else:
            messages.error(request, 'Usuario o contraseña incorrectos.')
    return render(request, 'accounts/login.html')

def redirect_user_based_on_role(user):
    # Primero, verifica si el usuario tiene un rol asignado
    if hasattr(user, 'rol_user') and user.rol_user is not None:
        if user.rol_user.name_rol == 'Analista':
            return redirect('microbiologyll')
        elif user.rol_user.name_rol == 'Jefe Directo':
            return redirect('microbiologyll')
        else:
            # Si tiene un rol no reconocido, redirígelo a login
            return redirect('login')
    else:
        # Si no tiene rol asignado, también redirígelo a login
        messages.error(user.request, 'El usuario no tiene un rol asignado. Contacte al administrador.')
        return redirect('login')

def role_required(role):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if request.user.rol_user.name_rol == role:
                return view_func(request, *args, **kwargs)
            else:
                raise PermissionDenied
        return wrapper
    return decorator

@login_required
@role_required('Analista')
def vistaAnalista(request):
  return render(request, 'areas/microbiologyll/microbiologyll.html')
@login_required
def registerNewBita(request):
  return render(request, 'areas/microbiologyll/views/registerBita.html')
#Cerrar sesion
def logout_view(request):
    logout(request)
    messages.success(request, 'Has cerrado sesión correctamente.')
    return redirect('login')
  