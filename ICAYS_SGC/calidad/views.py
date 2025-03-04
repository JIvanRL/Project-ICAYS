from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from login.views import role_required
from ICAYS_BIT.models import CustomUser, Rol, Area
from django.db.models import Q
from django.contrib import messages

@login_required
@role_required('Calidad')
def calidad(request):
  return render(request, 'inicioCalidad.html')

@login_required
@role_required('Calidad')
def AdminUsers(request):
  if request.method == 'POST':
        accion = request.POST.get('accion')
        usuarioSelect = request.POST.getlist('datos')

        if not usuarioSelect:
            return redirect('calidadApp:adminUsuarios')
        
        elif accion == 'editar':
          if len(usuarioSelect) != 1:
                return redirect('calidadApp:adminUsuarios')
          usuarioId = usuarioSelect[0]
          return redirect('calidadApp:editarUser', usuarioId=usuarioId)  # Redirigir a la vista de edición
        
        elif accion == 'eliminar':
          CustomUser.objects.filter(id_user__in=usuarioSelect).delete()
          return redirect('calidadApp:adminUsuarios')

  else:
    query = request.GET.get('q')

      # Filtra los usuarios si hay un término de búsqueda
    if query:
      usuarios = CustomUser.objects.filter(
          Q(first_name__icontains=query) |  # Busca en first_name
          Q(last_name__icontains=query) |   # Busca en last_name
          Q(email__icontains=query) |      # Busca en correo
          Q(username__icontains=query)       # Busca en usuario
          )
    else:
    # Si no hay término de búsqueda, muestra todos los usuarios
      usuarios = CustomUser.objects.all()

    usuarios = usuarios.select_related('rol_user').only('first_name', 
                                                                'last_name', 'email', 'username', 'password', 'rol_user__name_rol')
    

    return render(request, 'adminUsers.html', {'usuarios': usuarios, 'query': query})

  

# def JuntarDosCampos(request):
#     # Crea un campo virtual "nombre_completo"
#     usuarios = Usuario.objects.annotate(
#         nombre_completo=Concat(
#             F('first_name'), Value(' '), F('last_name')  # Combina first_name y last_name
#         )
#     ).select_related('rol').only(
#         'first_name', 'last_name', 'correo', 'usuario', 'rol__nombre'
#     )    
#     return render(request, 'adminUsers.html', {'usuarios': usuarios})

@login_required
@role_required('Calidad')
def CrearUser(request):
  if request.method == 'POST':
  # Obtén los datos del formulario
    first_name = request.POST.get('nombreON')
    last_name = request.POST.get('apellidosON')
    correo = request.POST.get('emailON')
    usuario = request.POST.get('userON')
    contraseña = request.POST.get('passwON')
    rol_id = request.POST.get('rolON')
    areas_id = request.POST.get('areasON')

    # Valida que todos los campos estén presentes
    if not all([first_name, last_name, correo, usuario, contraseña, rol_id, areas_id]):
      messages.error(request, 'Todos los campos son obligatorios.')
      return redirect('calidadApp:crearUsuario')
    
    primer_nombre  = first_name.split()[0] 
    primer_apellido = last_name.split()[0]

    firma = f"{primer_nombre} {primer_apellido}"

    try:
    # Obtén el objeto Rol
      rol = Rol.objects.get(id_rol=rol_id)
      area = Area.objects.get(id_area=areas_id)
    except (Rol.DoesNotExist, Area.DoesNotExist) as e:  
      messages.error(request, f'Error: {str(e)}')
      return redirect('calidadApp:crearUsuario')

    # Crea el nuevo usuario
    try:
      CustomUser.objects.create(
      first_name=first_name,
      last_name=last_name,
      area_user= area,
      signature_user=firma,
      rol_user=rol,
      email=correo,
      username=usuario,
      password=contraseña
    )
      messages.success(request, 'Usuario registrado exitosamente.')
      return redirect('calidadApp:adminUsuarios')
    except Exception as e:
      messages.error(request, f'Error al registrar el usuario: {str(e)}')
      return redirect('calidadApp:crearUsuario')
  else:
  # Si es una solicitud GET, muestra el formulario
    roles = Rol.objects.all()  # Obtén todos los roles para el select
    areas = Area.objects.all() 
    return render(request, 'crear.html', {'roles': roles, 'areas': areas})

@login_required
@role_required('Calidad')
def EditarUsers(request, usuarioId):

  usuario = get_object_or_404(CustomUser, id_user=usuarioId)
  roles = Rol.objects.all()
  areas = Area.objects.all()

  if request.method == 'POST':        
        # Actualizar los datos del usuario
    usuario.first_name = request.POST.get('nombreON')
    usuario.last_name = request.POST.get('apellidosON')
    usuario.email = request.POST.get('emailON')
    usuario.username = request.POST.get('userON')
    usuario.password = request.POST.get('passwON')
    rol_id = request.POST.get('rolON')
    areas_id = request.POST.get('areasON')

    primer_nombre  = usuario.first_name.split()[0] 
    primer_apellido = usuario.last_name.split()[0]

    firma = f"{primer_nombre} {primer_apellido}"
    usuario.signature_user = firma
    # Actualizar el rol del usuario
    if rol_id:
      rol = Rol.objects.get(id_rol=rol_id)
      usuario.rol_user = rol

    if areas_id:
      area = Area.objects.get(id_area=areas_id)
      usuario.area_user = area
        
        # Guardar los cambios
    usuario.save()
        
    return redirect('calidadApp:adminUsuarios')  # Redirigir a la lista de usuarios

    # Mostrar el formulario de edición
  else:
    return render(request, 'editar.html', {'usuario': usuario, 'roles': roles, 'areas': areas})