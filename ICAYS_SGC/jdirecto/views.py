from django.utils import timezone  # Importación correcta para timezone.now()
import logging  # Importación correcta de logging
from django.contrib import messages  # Importación correcta de messages
from django.contrib.auth import authenticate
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from login.views import role_required
from ICAYS_BIT.models import Bitcoras_Cbap, CustomUser, bita_cbap, tableBlanco
from django.shortcuts import render
from functools import wraps
logger = logging.getLogger(__name__)  # Configurar el logger correctamente
@login_required
@role_required('Jefe de Laboratorio')
def inicioJD(request):
  return render(request, 'inicioJD.html')

@login_required
@role_required('Jefe de Laboratorio')
def lista_bitacoras_pendientes(request):
    # Obtener el nombre completo del jefe de laboratorio actual
    nombre_completo = f"{request.user.first_name} {request.user.last_name}"
    
    # Filtrar bitácoras donde el nombre_user_destino coincide con el nombre del jefe actual
    # y el estado de la bitácora es 'enviada'
    bitacoras = Bitcoras_Cbap.objects.select_related('nombre_bita_cbap').filter(
        nombre_user_destino=nombre_completo,
        estado='enviada'
    ).order_by('-fecha_bita_cbap')
    
    return render(request, 'lista_bitacoras_pendientes.html', {
        'bitacoras': bitacoras,
        'tipo': 'pendiente'
    })
@login_required
@role_required('Jefe de Laboratorio')
def lista_bitacoras_revisadas(request):
    # Obtener el nombre completo del jefe de laboratorio actual
    nombre_completo = f"{request.user.first_name} {request.user.last_name}"
    
    # Filtrar bitácoras donde el nombre_user_destino coincide con el nombre del jefe actual
    # y el estado de la bitácora es 'enviada'
    bitacoras = Bitcoras_Cbap.objects.select_related('nombre_bita_cbap').filter(
        nombre_user_destino=nombre_completo,
        estado='revisada'
    ).order_by('-fecha_bita_cbap')
    
    return render(request, 'lista_bitacoras_autorizar.html', {
        'bitacoras': bitacoras,
        'tipo': 'revisar'
    })
@login_required
def ver_bitacora(request, bitacora_id):
    """
    Vista para que un jefe directo vea los detalles de una bitácora.
    """
    # Verificar si el usuario tiene el rol de Jefe o Jefe Directo
    # Usar rol_user en lugar de roles
    user_rol = request.user.rol_user.name_rol if hasattr(request.user, 'rol_user') and request.user.rol_user else None
    
    if user_rol not in ['Jefe', 'Jefe de Laboratorio']:
        logger.warning(f"Usuario {request.user} intentó acceder a ver_bitacora sin el rol adecuado. Rol: {user_rol}")
        messages.error(request, "No tienes permiso para acceder a esta página. Se requiere el rol de Jefe o Jefe Directo.")
        return HttpResponse("Acceso denegado: No tienes el rol adecuado.", status=403)
    
    try:
        logger.debug(f"Usuario {request.user} con rol {user_rol} intentando ver bitácora {bitacora_id}")
        
        # Obtener el nombre completo del jefe actual
        nombre_completo = f"{request.user.first_name} {request.user.last_name}"
        
        # Verificar que la bitácora esté asignada al jefe actual
        try:
            bitacora_registro = Bitcoras_Cbap.objects.get(
                nombre_bita_cbap__id_cbap=bitacora_id, 
                nombre_user_destino=nombre_completo  # Comparar con el nombre completo
            )
        except Bitcoras_Cbap.DoesNotExist:
            logger.warning(f"Usuario {request.user} intentó acceder a la bitácora {bitacora_id} que no le está asignada")
            messages.error(request, 'No tienes permiso para ver esta bitácora.')
            return HttpResponse("Acceso denegado: Esta bitácora no está asignada a tu usuario.", status=403)
        
        # Obtener la bitácora completa con todos sus datos relacionados
        try:
            bitacora = bita_cbap.objects.select_related(
                'id_dc_cbap',
                'firma_user'
            ).prefetch_related(
                'dilucion_empleadas',
                'dilucion_directa',
                'dilucion',
                'control_calidades',
                'ClaveMuestra',
                'verificaciones_balanza',
                'resultado'
            ).get(id_cbap=bitacora_id)
        except bita_cbap.DoesNotExist:
            logger.warning(f"Bitácora {bitacora_id} no existe")
            messages.error(request, 'La bitácora no existe.')
            return HttpResponse("Error: La bitácora no existe.", status=404)

        # Obtener el registro de blanco para esta bitácora
        try:
            blanco = tableBlanco.objects.get(nombre_bita_cbap=bitacora)
            logger.debug(f"Blanco encontrado para bitácora {bitacora_id}: ID={blanco.id_blanco}")
        except tableBlanco.DoesNotExist:
            logger.debug(f"No se encontró registro de blanco para la bitácora {bitacora_id}")
            blanco = None

        filas_datos = []
        
        # Obtener todos los registros relacionados con la bitácora
        clave_muestras = bitacora.ClaveMuestra.all()
        diluciones_empleadas = bitacora.dilucion_empleadas.all()
        diluciones_directas = bitacora.dilucion_directa.all()
        diluciones = bitacora.dilucion.all()
        resultados = bitacora.resultado.all()

        # Iterar sobre los registros y agregarlos a filas_datos
        for i in range(max(len(clave_muestras), len(diluciones_empleadas), len(diluciones_directas), len(diluciones), len(resultados))):
            fila = {
                'index': i,
                'clave_muestra': clave_muestras[i] if i < len(clave_muestras) else None,
                'diluciones': diluciones_empleadas[i] if i < len(diluciones_empleadas) else None,
                'directa': diluciones_directas[i] if i < len(diluciones_directas) else None,
                'dilucion': diluciones[i] if i < len(diluciones) else None,
                'resultado': resultados[i] if i < len(resultados) else None
            }
            filas_datos.append(fila)

        context = {
            'bitacora': bitacora,
            'filas_datos': filas_datos,
            'datos_campo': bitacora.id_dc_cbap,
            'usuario': bitacora.firma_user,
            'controles_calidad': bitacora.control_calidades.all(),
            'verificaciones_balanza': bitacora.verificaciones_balanza.all(),
            'registro': bitacora_registro,  # Incluir el registro de Bitcoras_Cbap
            'blanco': blanco,  # Añadir el blanco al contexto
        }

        logger.debug(f"Renderizando vista de bitácora {bitacora_id} para usuario {request.user}")
        return render(request, 'revision_bitacora.html', context)
    
    except Exception as e:
        logger.error(f"Error al mostrar bitácora {bitacora_id}: {str(e)}")
        messages.error(request, f"Error al mostrar la bitácora: {str(e)}")
        return HttpResponse(f"Error: {str(e)}", status=500)
    
@login_required
def ver_bitacora_revisada(request, bitacora_id):
    """
    Vista para que un jefe directo vea los detalles de una bitácora revisada.
    """
    # Verificar si el usuario tiene el rol de Jefe o Jefe Directo
    user_rol = request.user.rol_user.name_rol if hasattr(request.user, 'rol_user') and request.user.rol_user else None
    
    if user_rol not in ['Jefe', 'Jefe de Laboratorio']:
        logger.warning(f"Usuario {request.user} intentó acceder a ver_bitacora_revisada sin el rol adecuado. Rol: {user_rol}")
        messages.error(request, "No tienes permiso para acceder a esta página. Se requiere el rol de Jefe o Jefe Directo.")
        return HttpResponse("Acceso denegado: No tienes el rol adecuado.", status=403)
    
    try:
        logger.debug(f"Usuario {request.user} con rol {user_rol} intentando ver bitácora revisada {bitacora_id}")
        
        # Obtener el nombre completo del jefe actual
        nombre_completo = f"{request.user.first_name} {request.user.last_name}"
        
        # Verificar que la bitácora esté asignada al jefe actual
        try:
            # Obtener el registro de Bitcoras_Cbap correspondiente
            bitacora_cbap = Bitcoras_Cbap.objects.get(
                nombre_bita_cbap__id_cbap=bitacora_id, 
                nombre_user_destino=nombre_completo  # Comparar con el nombre completo
            )
            
            # Imprimir información de depuración
            logger.debug(f"Bitacora_cbap encontrada: ID={bitacora_cbap.id_bita_cbap}, Estado={bitacora_cbap.estado}")
            if bitacora_cbap.firma_revisor:
                logger.debug(f"Firma revisor: {bitacora_cbap.firma_revisor.first_name} {bitacora_cbap.firma_revisor.last_name}")
            else:
                logger.debug("No hay firma_revisor en esta bitácora")
                
        except Bitcoras_Cbap.DoesNotExist:
            logger.warning(f"Usuario {request.user} intentó acceder a la bitácora {bitacora_id} que no le está asignada")
            messages.error(request, 'No tienes permiso para ver esta bitácora.')
            return HttpResponse("Acceso denegado: Esta bitácora no está asignada a tu usuario.", status=403)
        
        # Obtener la bitácora completa con todos sus datos relacionados
        try:
            bitacora = bita_cbap.objects.select_related(
                'id_dc_cbap',
                'firma_user'
            ).prefetch_related(
                'dilucion_empleadas',
                'dilucion_directa',
                'dilucion',
                'control_calidades',
                'ClaveMuestra',
                'verificaciones_balanza',
                'resultado'
            ).get(id_cbap=bitacora_id)
        except bita_cbap.DoesNotExist:
            logger.warning(f"Bitácora {bitacora_id} no existe")
            messages.error(request, 'La bitácora no existe.')
            return HttpResponse("Error: La bitácora no existe.", status=404)

        # Obtener el registro de blanco para esta bitácora
        try:
            blanco = tableBlanco.objects.get(nombre_bita_cbap=bitacora)
            logger.debug(f"Blanco encontrado para bitácora {bitacora_id}: ID={blanco.id_blanco}")
        except tableBlanco.DoesNotExist:
            logger.debug(f"No se encontró registro de blanco para la bitácora {bitacora_id}")
            blanco = None

        filas_datos = []
        
        # Obtener todos los registros relacionados con la bitácora
        clave_muestras = bitacora.ClaveMuestra.all()
        diluciones_empleadas = bitacora.dilucion_empleadas.all()
        diluciones_directas = bitacora.dilucion_directa.all()
        diluciones = bitacora.dilucion.all()
        resultados = bitacora.resultado.all()

        # Iterar sobre los registros y agregarlos a filas_datos
        for i in range(max(len(clave_muestras), len(diluciones_empleadas), len(diluciones_directas), len(diluciones), len(resultados))):
            fila = {
                'index': i,
                'clave_muestra': clave_muestras[i] if i < len(clave_muestras) else None,
                'diluciones': diluciones_empleadas[i] if i < len(diluciones_empleadas) else None,
                'directa': diluciones_directas[i] if i < len(diluciones_directas) else None,
                'dilucion': diluciones[i] if i < len(diluciones) else None,
                'resultado': resultados[i] if i < len(resultados) else None
            }
            filas_datos.append(fila)

        context = {
            'bitacora': bitacora,
            'filas_datos': filas_datos,
            'datos_campo': bitacora.id_dc_cbap,
            'usuario': bitacora.firma_user,
            'controles_calidad': bitacora.control_calidades.all(),
            'verificaciones_balanza': bitacora.verificaciones_balanza.all(),
            'bitacora_cbap': bitacora_cbap,  # Pasar bitacora_cbap con el nombre correcto
            'registro': bitacora_cbap,  # Mantener registro para compatibilidad
            'blanco': blanco,  # Añadir el blanco al contexto
            'debug': True  # Habilitar depuración en la plantilla
        }

        logger.debug(f"Renderizando vista de bitácora revisada {bitacora_id} para usuario {request.user}")
        return render(request, 'autorizar_bitacora.html', context)
    
    except Exception as e:
        logger.error(f"Error al mostrar bitácora revisada {bitacora_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        messages.error(request, f"Error al mostrar la bitácora: {str(e)}")
        return HttpResponse(f"Error: {str(e)}", status=500)
    
@login_required
def contar_bitacoras(request, estado, usuario_id=None):
    """
    Vista para contar bitácoras por estado y opcionalmente por usuario.
    Args:
        estado: Estado de las bitácoras a contar ('enviada', 'revisada', 'autorizada', 'rechazada')
        usuario_id: ID del usuario (opcional)
    """
    try:
        # Validar que el estado sea válido
        if estado not in ['enviada', 'revisada', 'autorizada', 'rechazada',]:
            logger.warning(f"Estado no válido: {estado}")
            return JsonResponse({'error': 'Estado no válido'}, status=400)
        
        # Determinar el usuario para el filtro
        if usuario_id:
            try:
                usuario = CustomUser.objects.get(id_user=usuario_id)
                logger.debug(f"Contando bitácoras para usuario específico: {usuario.username} (ID: {usuario_id})")
            except CustomUser.DoesNotExist:
                logger.warning(f"Usuario con ID {usuario_id} no existe")
                return JsonResponse({'error': f"Usuario con ID {usuario_id} no existe"}, status=404)
        else:
            usuario = request.user
            logger.debug(f"Contando bitácoras para el usuario actual: {usuario.username}")
        
        # Obtener el nombre completo del usuario
        nombre_completo = f"{usuario.first_name} {usuario.last_name}"
        
        # Construir el filtro según el estado
        if estado == 'enviada':
            # Para bitácoras enviadas, el usuario es el destinatario
            filtro = {
                'estado': estado,
                'nombre_user_destino': nombre_completo
            }
            logger.debug(f"Filtrando bitácoras enviadas para destinatario: {nombre_completo}")
        elif estado == 'revisada':
            # Para bitácoras revisadas, también filtrar por nombre_user_destino
            # ya que queremos contar las bitácoras que se enviaron a este usuario y están revisadas
            filtro = {
                'estado': estado,
                'nombre_user_destino': nombre_completo
            }
            logger.debug(f"Filtrando bitácoras revisadas para destinatario: {nombre_completo}")
        elif estado == 'autorizada':
            # Para bitácoras autorizadas, el usuario es quien las autorizó
            filtro = {
                'estado': estado,
                'nombre_user_destino': nombre_completo
            }
            logger.debug(f"Filtrando bitácoras autorizadas por revisor: {nombre_completo}")
        else:
            # Para otros estados (aprobada, rechazada), el usuario es quien las revisó
            filtro = {
                'estado': estado,
                'firma_revisor': usuario
            }
            logger.debug(f"Filtrando bitácoras {estado} por revisor: {usuario.username}")
        
        # Contar bitácoras que cumplen con los filtros
        bitacoras = Bitcoras_Cbap.objects.filter(**filtro)
        cantidad = bitacoras.count()
        
        # Información detallada para depuración
        logger.debug(f"Filtro aplicado: {filtro}")
        logger.debug(f"Cantidad de bitácoras con estado {estado}: {cantidad}")
        
        # Si es estado 'revisada' y cantidad es 0, mostrar más información
        if estado == 'revisada' and cantidad == 0:
            # Verificar si hay bitácoras revisadas sin nombre_user_destino
            revisadas_sin_destino = Bitcoras_Cbap.objects.filter(estado='revisada', nombre_user_destino='').count()
            logger.debug(f"Bitácoras revisadas sin nombre_user_destino: {revisadas_sin_destino}")
            
            # Verificar si hay bitácoras revisadas con otro destinatario
            revisadas_otros = Bitcoras_Cbap.objects.filter(estado='revisada').exclude(nombre_user_destino=nombre_completo).count()
            logger.debug(f"Bitácoras revisadas para otros destinatarios: {revisadas_otros}")
            
            # Verificar todas las bitácoras revisadas
            todas_revisadas = Bitcoras_Cbap.objects.filter(estado='revisada').count()
            logger.debug(f"Total de bitácoras revisadas en el sistema: {todas_revisadas}")
            
            # Incluir esta información en la respuesta
            return JsonResponse({
                'cantidad': cantidad,
                'debug_info': {
                    'revisadas_sin_destino': revisadas_sin_destino,
                    'revisadas_otros': revisadas_otros,
                    'todas_revisadas': todas_revisadas
                }
            })
        
        return JsonResponse({'cantidad': cantidad})
    except Exception as e:
        logger.error(f"Error contando bitácoras: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)
@login_required
def cambiar_estado(request, bitacora_id):
    """
    Vista para cambiar el estado de una bitácora.
    Args:
        bitacora_id: ID de la bitácora principal (bita_cbap)
    """
    if request.method != 'POST':
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)
        messages.error(request, "Método no permitido")
        return redirect('jdirecto:lista_bitacoras_pendientes')
    
    # Obtener la acción del POST (enviar, revisar, autorizar, rechazar)
    accion = request.POST.get('accion')
    if not accion:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': 'Debe especificar una acción'}, status=400)
        messages.error(request, "Debe especificar una acción")
        return redirect('jdirecto:lista_bitacoras_pendientes')
    
    # Verificar la contraseña del usuario
    password = request.POST.get('password')
    if not password:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': 'Debe proporcionar su contraseña'}, status=400)
        messages.error(request, "Debe proporcionar su contraseña")
        return redirect('jdirecto:lista_bitacoras_pendientes')
    
    # Validar contraseña usando authenticate
    user = authenticate(request, username=request.user.username, password=password)
    if user is None or not user.is_active:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': 'Contraseña incorrecta'}, status=403)
        messages.error(request, "Contraseña incorrecta")
        return redirect('jdirecto:lista_bitacoras_pendientes')
    
    try:
        # Obtener la bitácora principal
        bitacora_principal = get_object_or_404(bita_cbap, id_cbap=bitacora_id)
        
        # Determinar el estado actual y el nuevo estado según la acción
        if accion == 'revisar':
            # Cambiar de enviada a revisada
            estado_actual = 'enviada'
            nuevo_estado = 'revisada'
            bitacora_actual = Bitcoras_Cbap.objects.filter(
                nombre_bita_cbap=bitacora_principal,
                estado=estado_actual
            ).first()
        elif accion == 'autorizar':
            # Cambiar de revisada a autorizada
            estado_actual = 'revisada'
            nuevo_estado = 'autorizada'
            bitacora_actual = Bitcoras_Cbap.objects.filter(
                nombre_bita_cbap=bitacora_principal,
                estado=estado_actual
            ).first()
        elif accion == 'rechazar':
            # Rechazar desde cualquier estado
            estado_actual = request.POST.get('estado_actual', 'enviada')
            nuevo_estado = 'rechazada'
            bitacora_actual = Bitcoras_Cbap.objects.filter(
                nombre_bita_cbap=bitacora_principal,
                estado=estado_actual
            ).first()
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': 'Acción no válida'}, status=400)
            messages.error(request, "Acción no válida")
            return redirect('jdirecto:lista_bitacoras_pendientes')
        
        if not bitacora_actual:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': f'No se encontró una bitácora en estado "{estado_actual}"'}, status=404)
            messages.error(request, f"No se encontró una bitácora en estado '{estado_actual}'")
            return redirect('jdirecto:lista_bitacoras_pendientes')
        
        # Obtener observaciones (opcional)
        observaciones = request.POST.get('observaciones', '')
        
        # Lógica específica según la acción
        if accion == 'revisar':
            # Si estamos cambiando a 'revisada', se requiere un usuario destino
            usuario_destino_id = request.POST.get('usuario_destino')
            
            # Validar que se haya seleccionado un usuario destino
            if not usuario_destino_id:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'error': 'Debe seleccionar un usuario destino'}, status=400)
                messages.error(request, "Debe seleccionar un usuario destino")
                return redirect('jdirecto:ver_bitacora', bitacora_id=bitacora_id)
            
            try:
                # Obtener el usuario destino
                usuario_destino = CustomUser.objects.get(id_user=usuario_destino_id)
                # Actualizar el nombre del usuario destino
                bitacora_actual.nombre_user_destino = f"{usuario_destino.first_name} {usuario_destino.last_name}"
            except CustomUser.DoesNotExist:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'error': 'El usuario destino seleccionado no existe'}, status=400)
                messages.error(request, "El usuario destino seleccionado no existe")
                return redirect('jdirecto:ver_bitacora', bitacora_id=bitacora_id)
        
        elif accion == 'autorizar':
            # Si estamos autorizando, el destinatario será el analista que creó la bitácora
            analista_creador = bitacora_principal.firma_user
            if not analista_creador:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'error': 'No se pudo determinar el analista que creó la bitácora'}, status=400)
                messages.error(request, "No se pudo determinar el analista que creó la bitácora")
                return redirect('jdirecto:ver_bitacora_revisada', bitacora_id=bitacora_id)
            
            # Establecer el nombre del analista creador como destinatario
            bitacora_actual.nombre_user_destino = f"{analista_creador.first_name} {analista_creador.last_name}"
            logger.debug(f"Bitácora autorizada será enviada al analista creador: {bitacora_actual.nombre_user_destino}")
        
        # Lógica específica según la acción
        if accion == 'revisar':
            # Guardar la firma del revisor y la fecha de revisión
            bitacora_actual.firma_revisor = request.user
            bitacora_actual.fecha_revision = timezone.now()
        elif accion == 'autorizar':
            # Guardar la firma del autorizador y la fecha de autorización
            bitacora_actual.firma_autorizador = request.user
            bitacora_actual.fecha_autorizacion = timezone.now()
        
        # Modificar el registro existente
        bitacora_actual.estado = nuevo_estado
        
        if observaciones:
            bitacora_actual.observaciones_cbap_estado = observaciones
            
        bitacora_actual.save()
        
        # Registrar la acción en el log
        logger.info(f"Bitácora {bitacora_principal.id_cbap} cambiada a estado '{nuevo_estado}' por {request.user}")
        
        # Determinar mensaje según el estado
        mensaje = f"Bitácora {nuevo_estado} correctamente"
        
        # Determinar URL de redirección según la acción
        if accion == 'revisar':
            redirect_url = reverse('jdirecto:lista_bitacoras_pendientes')
        elif accion == 'autorizar':
            redirect_url = reverse('jdirecto:lista_bitacoras_revisadas')
        else:
            redirect_url = reverse('jdirecto:lista_bitacoras_pendientes')
        
        # Devolver respuesta según el tipo de solicitud
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': mensaje,
                'redirect_url': redirect_url
            })
        
        messages.success(request, mensaje)
        return redirect(redirect_url)
    
    except Exception as e:
        logger.error(f"Error al cambiar el estado de la bitácora {bitacora_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False, 
                'error': f'Error al cambiar el estado de la bitácora: {str(e)}'
            }, status=500)
        
        messages.error(request, f"Error al cambiar el estado de la bitácora: {str(e)}")
        return redirect('jdirecto:lista_bitacoras_pendientes')

@login_required
def api_usuarios(request):
    try:
        if not request.user.rol_user:
            logger.warning(f"Usuario {request.user} sin rol asignado")
            return JsonResponse({'error': 'Usuario sin rol asignado'}, status=403)
        elif request.user.rol_user.name_rol == 'Jefe de Laboratorio' and request.user.id_user:
            # Para Jefes de Laboratorio, mostrar solo Analistas y otros jefes
            usuarios = CustomUser.objects.filter(
                rol_user__name_rol__in=['Analista de Laboratorio', 'Jefe de Laboratorio']
            )
        else:
            # Para otros roles, mostrar solo Analistas
            usuarios = CustomUser.objects.filter(rol_user__name_rol='Analista de Laboratorio')
        
        # Filtrar usuarios sin rol asignado pero NO excluir al usuario actual
        usuarios = usuarios.exclude(rol_user__isnull=True)
        # Se eliminó la línea: .exclude(id_user=request.user.id_user)
        
        usuarios_data = []
        for usuario in usuarios:
            usuarios_data.append({
                'id': usuario.id_user,
                'nombre': usuario.first_name,
                'apellido': usuario.last_name,
                'area': usuario.area_user.name_area if usuario.area_user else '',
                'rol': usuario.rol_user.name_rol if usuario.rol_user else ''
            })
        
        logger.debug(f"API usuarios: {len(usuarios_data)} usuarios devueltos para {request.user}, incluyendo al usuario actual")
        return JsonResponse(usuarios_data, safe=False)
    except Exception as e:
        logger.error(f"Error en api_usuarios: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
