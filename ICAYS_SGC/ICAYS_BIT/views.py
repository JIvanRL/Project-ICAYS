from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate
from login.views import role_required
from django.shortcuts import get_object_or_404, render, redirect
from django.contrib import messages
from django.urls import reverse
from django.db import transaction
from django.http import JsonResponse
from .models import ClaveMuestraCbap, ControlCalidad, Dilucion, DilucionesEmpleadas, Direct_o_Dilucion, Resultado, VerificacionBalanza, bita_cbap, Bitcoras_Cbap, CustomUser
from .forms import (
    DilucionesEmpleadasForm, DirectODilucionForm, DilucionForm,
    ControlCalidadForm, VerificacionBalanzaForm, DatosCampoCbapForm,
    ClaveMuestraCbapForm, ResultadoCbapForm, tableBlanco, ejemplosFormulas
)
import logging
logger = logging.getLogger(__name__)


@login_required
def registrar_bitacora(request):
    logger.info(f"Iniciando registro de bitácora para usuario {request.user}")
    if request.method == 'POST':
        accion = request.POST.get('accion')  # Obtén la acción desde el formulario
        
        try:
            # Función auxiliar para convertir valores a float o None
            def safe_float(value):
                if value is None or value == '':
                    return None
                try:
                    return float(value)
                except (ValueError, TypeError):
                    return None
            
            # Función auxiliar para manejar fechas y horas
            def safe_date_time(value):
                if value is None or value == '' or value == '---':
                    return None
                return value
            
            with transaction.atomic():
                # === 1. CREAR DATOS CAMPO Y VERIFICACIÓN DE BALANZA ===
                datos_campo_data = {
                    'fecha_siembra_dc': safe_date_time(request.POST.get('fecha_siembra')),
                    'hora_siembra_dc': safe_date_time(request.POST.get('hora_siembra')),
                    'hora_incubacion_dc': safe_date_time(request.POST.get('hora_incubacion')),
                    'procedimiento_dc': request.POST.get('procedimiento'),
                    'equipo_incubacion_dc': request.POST.get('equipo_incubacion'),
                }
                
                # Registrar para depuración
                logger.debug(f"Datos de campo antes de validación: {datos_campo_data}")
                
                datos_campo_form = DatosCampoCbapForm(datos_campo_data)
                if not datos_campo_form.is_valid():
                    logger.error(f"Error en formulario Datos de Campo: {datos_campo_form.errors.as_json()}")
                    return JsonResponse({
                        'success': False,
                        'error': f"Error en formulario Datos de Campo: {datos_campo_form.errors.as_json()}"
                    }, status=400)
                datos_campo = datos_campo_form.save()

                # === 2. CREAR BITA_CBAP ===
                # Procesar fechas y horas para bita_cbap
                fecha_lectura = safe_date_time(request.POST.get('fecha_lectura_cbap'))
                hora_lectura = safe_date_time(request.POST.get('hora_lectura_cbap'))
                mes_muestra_cbap = safe_date_time(request.POST.get('mes_muestra_cbap'))

                # Registrar para depuración
                logger.debug(f"Fecha lectura: {fecha_lectura}, Hora lectura: {hora_lectura}")
                
                bita_cbap_instance = bita_cbap(
                    id_dc_cbap=datos_campo,
                    firma_user=request.user,
                    nombre_cbap=request.POST.get('nombre_cbap'),
                    pagina_cbap=request.POST.get('pagina_cbap'),
                    letra_analista_cbap=request.POST.get('letra_analista_cbap'),
                    mes_muestra_cbap=mes_muestra_cbap,
                    pagina_muestra_cbap=request.POST.get('pagina_muestra_cbap'),
                    pagina_fosfato_cbap=request.POST.get('pagina_fosfato_cbap'),
                    numero_fosfato_cbap=request.POST.get('numero_fosfato_cbap'),
                    pagina_agar_cbap=request.POST.get('pagina_agar_cbap'),
                    numero_agar_cbap=request.POST.get('numero_agar_cbap'),
                    fecha_lectura_cbap=fecha_lectura,
                    hora_lectura_cbap=hora_lectura,
                    observaciones_cbap=request.POST.get('observaciones_cbap'),
                )
                bita_cbap_instance.save()
                logger.info(f"Bitácora CBAP creada con ID: {bita_cbap_instance.id_cbap}")

                # === 3. CREAR REGISTRO DE BLANCO (ÚNICO) ===
                # Obtener datos del blanco (un solo registro)
                cantidad_blanco = request.POST.get('cantidad_blanco')
                placa_blanco = request.POST.get('placa_blanco')
                resultado_blanco = request.POST.get('resultado_blanco')
                
                logger.debug(f"Datos de blanco: cantidad={cantidad_blanco}, placa={placa_blanco}, resultado={resultado_blanco}")
                
                # Crear el registro único de blanco
                try:
                    # Crear directamente el objeto tableBlanco
                    blanco = tableBlanco(
                        cantidad_blanco=cantidad_blanco if cantidad_blanco else '---',
                        placa_blanco=placa_blanco if placa_blanco else '---',
                        resultado_blanco=resultado_blanco,
                        nombre_bita_cbap=bita_cbap_instance
                    )
                    blanco.save()
                    logger.debug(f"Blanco guardado correctamente con ID: {blanco.id_blanco}")
                except Exception as e:
                    logger.error(f"Error al guardar blanco: {str(e)}")
                    return JsonResponse({
                        'success': False,
                        'error': f"Error al guardar blanco: {str(e)}"
                    }, status=400)

                # === 4. PROCESAR FILAS DINÁMICAS ===
                num_filas = int(request.POST.get('num_filas', 0))  # Número de filas dinámicas
                for i in range(num_filas):
                    # Verificar si la fila tiene datos antes de procesarla
                    if  request.POST.get(f'clave_c_m_{i}') or request.POST.get(f'medicion_c_m_{i}')  or request.POST.get(f'cantidad_c_m_{i}') or request.POST.get(f'dE_1_{i}') or request.POST.get(f'dE_2_{i}') or request.POST.get(f'dE_3_{i}') or request.POST.get(f'dE_4_{i}') or request.POST.get(f'placa_dD_{i}') or request.POST.get(f'placa_dD2_{i}') or request.POST.get(f'promedio_dD_{i}') or request.POST.get(f'placa_d_{i}') or request.POST.get(f'placa_d2_{i}') or request.POST.get(f'promedio_d_{i}') or request.POST.get(f'placa_d_2_{i}') or request.POST.get(f'placa_d2_2_{i}') or request.POST.get(f'promedio_d_2_{i}') or request.POST.get(f'resultado_r_{i}') or request.POST.get(f'ufC_placa_r_{i}') or request.POST.get(f'diferencia_r_{i}'):
                        # Procesar cada fila
                        clave_c_m = request.POST.get(f'clave_c_m_{i}', '')
                        medicion_c_m = (request.POST.get(f'medicion_c_m_{i}'))
                        cantidad_c_m = request.POST.get(f'cantidad_c_m_{i}', '')
                      
                        # Usar safe_float para todas las conversiones de string a float
                        # Esto permitirá valores NULL en la base de datos
                        dE_1 = safe_float(request.POST.get(f'dE_1_{i}'))
                        dE_2 = safe_float(request.POST.get(f'dE_2_{i}'))
                        dE_3 = safe_float(request.POST.get(f'dE_3_{i}'))
                        dE_4 = safe_float(request.POST.get(f'dE_4_{i}'))
                        placa_dD = (request.POST.get(f'placa_dD_{i}'))
                        placa_dD2 = (request.POST.get(f'placa_dD2_{i}'))
                        promedio_dD = (request.POST.get(f'promedio_dD_{i}'))
                        placa_d = (request.POST.get(f'placa_d_{i}'))
                        placa_d2 = (request.POST.get(f'placa_d2_{i}'))
                        promedio_d = (request.POST.get(f'promedio_d_{i}'))
                        placa_d_2 = (request.POST.get(f'placa_d_2_{i}'))
                        placa_d2_2 = (request.POST.get(f'placa_d2_2_{i}'))
                        promedio_d_2 = (request.POST.get(f'promedio_d_2_{i}'))
                       
                        # Para estos campos, mantener como string
                        resultado_r = request.POST.get(f'resultado_r_{i}', '')
                        ufC_placa_r = request.POST.get(f'ufC_placa_r_{i}', '')
                        diferencia_r = request.POST.get(f'diferencia_r_{i}', '')

                        # === 4.1. CREAR CLAVE MUESTRA ===
                        clave_muestra_data = {
                            'clave_c_m': clave_c_m,
                            'medicion_c_m': medicion_c_m,
                            'cantidad_c_m': cantidad_c_m,
                            'id_cbap_c_m': bita_cbap_instance,
                        }
                        clave_muestra_form = ClaveMuestraCbapForm(clave_muestra_data)
                        if not clave_muestra_form.is_valid():
                            return JsonResponse({
                                'success': False,
                                'error': f"Error en formulario Clave Muestra {i+1}: {clave_muestra_form.errors.as_json()}"
                            }, status=400)
                        clave_muestra = clave_muestra_form.save(commit=False)
                        clave_muestra.id_cbap_c_m = bita_cbap_instance
                        clave_muestra.save()

                        # === 4.2. CREAR DILUCIONES EMPLEADAS ===
                        diluciones_data = {
                            'dE_1': dE_1,
                            'dE_2': dE_2,
                            'dE_3': dE_3,
                            'dE_4': dE_4,
                            'id_cbap_dE': bita_cbap_instance,
                        }
                        diluciones_form = DilucionesEmpleadasForm(diluciones_data)
                        if not diluciones_form.is_valid():
                            return JsonResponse({
                                'success': False,
                                'error': f"Error en formulario Diluciones Empleadas {i+1}: {diluciones_form.errors.as_json()}"
                            }, status=400)
                        diluciones = diluciones_form.save(commit=False)
                        diluciones.id_cbap_dE = bita_cbap_instance
                        diluciones.save()

                        # === 4.3. CREAR DIRECTO O DILUCIÓN ===
                        direct_o_dilucion_data = {
                            'placa_dD': placa_dD,
                            'placa_dD2': placa_dD2,
                            'promedio_dD': promedio_dD,
                            'id_cbap_dD': bita_cbap_instance,
                        }
                        direct_o_dilucion_form = DirectODilucionForm(direct_o_dilucion_data)
                        if not direct_o_dilucion_form.is_valid():
                            return JsonResponse({
                                'success': False,
                                'error': f"Error en formulario Directo o Dilución {i+1}: {direct_o_dilucion_form.errors.as_json()}"
                            }, status=400)
                        direct_o_dilucion = direct_o_dilucion_form.save(commit=False)
                        direct_o_dilucion.id_cbap_dD = bita_cbap_instance
                        direct_o_dilucion.save()

                        # === 4.4. CREAR DILUCIÓN ===
                        dilucion_data = {
                            'placa_d': placa_d,
                            'placa_d2': placa_d2,
                            'promedio_d': promedio_d,
                            'placa_d_2': placa_d_2,
                            'placa_d2_2': placa_d2_2,
                            'promedio_d_2': promedio_d_2,
                            'id_cbap_d': bita_cbap_instance,
                        }
                        dilucion_form = DilucionForm(dilucion_data)
                        if not dilucion_form.is_valid():
                            return JsonResponse({
                                'success': False,
                                'error': f"Error en formulario Dilución {i+1}: {dilucion_form.errors.as_json()}"
                            }, status=400)
                        dilucion = dilucion_form.save(commit=False)
                        dilucion.id_cbap_d = bita_cbap_instance
                        dilucion.save()

                        # === 4.5. CREAR RESULTADOS ===
                        resultado_data = {
                            'resultado_r': resultado_r,
                            'ufC_placa_r': ufC_placa_r,
                            'diferencia_r': diferencia_r,
                            'id_cbap_r': bita_cbap_instance,
                        }
                        resultado_form = ResultadoCbapForm(resultado_data)
                        if not resultado_form.is_valid():
                            return JsonResponse({
                                'success': False,
                                'error': f"Error en formulario Resultado {i+1}: {resultado_form.errors.as_json()}"
                            }, status=400)
                        resultado = resultado_form.save(commit=False)
                        resultado.id_cbap_r = bita_cbap_instance
                        resultado.save()

                # === 5. CREAR CONTROL DE CALIDAD ===
                for i in range(1, 5):
                    # Procesar fecha para control de calidad
                    fecha_cc = safe_date_time(request.POST.get(f'fecha_1cc_{i}'))
                    
                    # Solo crear el control de calidad si hay datos significativos
                    nombre_laf = request.POST.get(f'nombre_laf_{i}', '')
                    page_1cc = request.POST.get(f'page_1cc_{i}', '')
                    
                    if nombre_laf or fecha_cc or page_1cc:  # Solo procesar si hay al menos un dato
                        control_calidad_data = {
                            'nombre_laf': nombre_laf,
                            'fecha_1cc': fecha_cc,  # Esto será None si está vacío
                            'page_1cc': page_1cc,
                            'id_cbap_cc': bita_cbap_instance,
                        }
                        
                        control_calidad_form = ControlCalidadForm(control_calidad_data)
                        if not control_calidad_form.is_valid():
                            logger.error(f"Error en formulario Control de Calidad {i}: {control_calidad_form.errors.as_json()}")
                            return JsonResponse({
                                'success': False,
                                'error': f"Error en formulario Control de Calidad {i}: {control_calidad_form.errors.as_json()}"
                            }, status=400)
                        
                        control_calidad = control_calidad_form.save(commit=False)
                        control_calidad.id_cbap_cc = bita_cbap_instance
                        control_calidad.save()

                # === 6. CREAR VERIFICACIÓN DE BALANZA ===
                for i in range(1, 3):
                    # Procesar hora para verificación de balanza
                    hora_vb = safe_date_time(request.POST.get(f'hora_vb_{i}'))
                    
                    veri_balanza_data = {
                        'hora_vb': hora_vb,
                        'actividad_vb': request.POST.get(f'actividad_vb_{i}'),
                        'ajuste_vb': safe_float(request.POST.get(f'ajuste_vb_{i}')),
                        'valor_nominal_vb': safe_float(request.POST.get(f'valor_nominal_vb_{i}')),
                        'valor_convencional_vb': safe_float(request.POST.get(f'valor_convencional_vb_{i}')),
                        'valo_masa_vb': safe_float(request.POST.get(f'valo_masa_vb_{i}')),
                        'diferecnia_vb': safe_float(request.POST.get(f'diferecnia_vb_{i}')),
                        'incertidumbre_vb': safe_float(request.POST.get(f'incertidumbre_vb_{i}')),
                        'emt_vb': safe_float(request.POST.get(f'emt_vb_{i}')),
                        'aceptacion_vb': request.POST.get(f'aceptacion_vb_{i}'),
                        'valor_pesado_muestra_vb': request.POST.get(f'valor_pesado_muestra_vb_{i}'),
                        'tomo_verficacion_vb': request.POST.get(f' tomo_verficacion_vb_{i}'),
                        'pagina_verficacion_vb': request.POST.get(f'pagina_verficacion_vb_{i}'),
                        'id_cbap_vb': bita_cbap_instance,
                    }
                    veri_balanza_form = VerificacionBalanzaForm(veri_balanza_data)
                    if not veri_balanza_form.is_valid():
                        logger.error(f"Error en formulario Verificación Balanza {i}: {veri_balanza_form.errors.as_json()}")
                        return JsonResponse({
                            'success': False,
                            'error': f"Error en formulario Verificación Balanza {i}: {veri_balanza_form.errors.as_json()}"
                        }, status=400)
                    veri_balanza = veri_balanza_form.save(commit=False)
                    veri_balanza.id_cbap_vb = bita_cbap_instance
                    veri_balanza.save()
                
                # === 7. CREAR EJEMPLOS DE FÓRMULAS ===

                for i in range(1, 5):
                    # Verificar si el ejemplo tiene datos antes de procesarlo
                    if (request.POST.get(f'dato1_ejemplo_{i}') or 
                        request.POST.get(f'dato2_ejemplo_{i}') or 
                        request.POST.get(f'dato3_ejemplo_{i}') or 
                        request.POST.get(f'resultdo_ejemplo_{i}') or 
                        request.POST.get(f'clave_muestra_ejemplo_{i}')):
                        
                        # Crear el ejemplo de fórmula
                        ejemplo = ejemplosFormulas(
                            dato1_ejemplo=request.POST.get(f'dato1_ejemplo_{i}', ''),
                            dato2_ejemplo=request.POST.get(f'dato2_ejemplo_{i}', ''),
                            dato3_ejemplo=request.POST.get(f'dato3_ejemplo_{i}', ''),
                            resultdo_ejemplo=request.POST.get(f'resultdo_ejemplo_{i}', ''),
                            clave_muestra_ejemplo=request.POST.get(f'clave_muestra_ejemplo_{i}', ''),
                            nombre_bita_cbap=bita_cbap_instance
                        )
                        ejemplo.save()
                        logger.debug(f"Ejemplo de fórmula {i} guardado correctamente con ID: {ejemplo.id_ejemplos}")

                # Establecer el estado de la bitácora según la acción
                if accion == 'guardar':
                     # Crear registro en Bitcoras_Cbap con estado 'guardada'
                    Bitcoras_Cbap.objects.create(
                        name_user_cbap=request.user,  # El usuario actual (analista) es tanto creador como destinatario
                        nombre_bita_cbap=bita_cbap_instance,
                        estado='guardada',
                        nombre_user_destino=f"{request.user.first_name} {request.user.last_name}"  # Guardar como texto
                    )

                    return JsonResponse({
                        'success': True,
                        'message': "Bitácora guardada correctamente",
                        'bitacora_id': bita_cbap_instance.id_cbap,
                        'redirect_url': reverse('microalimentos:registrar_bitacora')
                    })
                
                elif accion == 'enviar':
                   # Obtener datos adicionales para el envío
                    usuario_destino_id = request.POST.get('usuario_destino')
                    password = request.POST.get('password')
                    
                    # Validar contraseña
                    user = authenticate(request, username=request.user.username, password=password)
                    if user is None or not user.is_active:
                        return JsonResponse({
                            'success': False,
                            'message': "Contraseña incorrecta"
                        }, status=403)
                    
                    # Obtener el usuario destino
                    try:
                        usuario_destino = CustomUser.objects.get(id_user=usuario_destino_id)
                    except CustomUser.DoesNotExist:
                        return JsonResponse({
                            'success': False,
                            'error': 'Usuario destino no encontrado'
                        }, status=404)
                    
                    # Crear registro en Bitcoras_Cbap con estado 'enviada'
                    Bitcoras_Cbap.objects.create(
                        name_user_cbap=request.user,  # El usuario actual (analista/creador)
                        nombre_bita_cbap=bita_cbap_instance,
                        estado='enviada',
                        fecha_envio=timezone.now(),
                        nombre_user_destino=f"{usuario_destino.first_name} {usuario_destino.last_name}"  # El nombre del destinatario (jefe)
                    )
                    logger.info(f"Bitácora {bita_cbap_instance.id_cbap} creada y enviada exitosamente a {usuario_destino}")
                    
                    return JsonResponse({
                        'success': True,
                        'message': 'Bitácora creada y enviada correctamente',
                        'redirect_url': reverse('microalimentos:lista_bitacoras')
                    })

        except Exception as e:
            logger.error(f"Error al procesar la bitácora: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return JsonResponse({
                'success': False,
                'error': f"Error al procesar la bitácora: {str(e)}"
            }, status=500)

    else:
        context = {
            'diluciones_form': DilucionesEmpleadasForm(),
            'direct_o_dilucion_form': DirectODilucionForm(),
            'dilucion_form': DilucionForm(),
            'control_calidad_form': ControlCalidadForm(),
            'verif_balanza_form': VerificacionBalanzaForm(),
            'datos_campo_form': DatosCampoCbapForm(),
            'clave_muestra_form': ClaveMuestraCbapForm(),
            'blanco_form': tableBlanco(),  # Formulario para el registro único de blanco
            'ejemplos_formulas_form': ejemplosFormulas(),  # Formulario para ejemplos de fórmulas
        }
        return render(request, 'registerBita.html', context)

from django.shortcuts import render # type: ignore
from .models import Bitcoras_Cbap

@login_required
@role_required('Analista de Laboratorio')
def lista_bitacoras_guardadas(request):
    """Obtener las bitácoras guardadas del analista actual"""
    bitacoras = Bitcoras_Cbap.objects.select_related('nombre_bita_cbap').filter(
        estado='guardada',
        name_user_cbap=request.user  # Filtrar por el usuario creador
    ).order_by('-fecha_bita_cbap')
    
    return render(request, 'lista_bitacoras.html', {
        'bitacoras': bitacoras,
        'tipo': 'guardada'
    })

@login_required
@role_required('Analista de Laboratorio')
def lista_bitacoras_revision(request):
    """Obtener las bitácoras enviadas o revisadas por el analista actual"""
    nombre_completo = f"{request.user.first_name} {request.user.last_name}"
    bitacoras = Bitcoras_Cbap.objects.select_related('nombre_bita_cbap').filter(
        estado__in=['enviada', 'revisada'],  # Filtrar por múltiples estados usando __in
        name_user_cbap=request.user  # Filtrar por el usuario creador (analista)
    ).order_by('-fecha_bita_cbap')
    
    return render(request, 'lista_bitacoras_revision.html', {
        'bitacoras': bitacoras,
        'tipo': 'revision'
    })
from .models import CustomUser

@login_required
def obtener_usuarios_json(request):#Obtener todos los usuarios
    try:
        if not request.user.rol_user:
            logger.warning(f"Usuario {request.user} sin rol asignado")
            return JsonResponse({'error': 'Usuario sin rol asignado'}, status=403)
        elif request.user.rol_user.name_rol == 'Analista de Laboratorio' and request.user.id_user:
            # Para Analistas de Laboratorio, mostrar tanto Analistas como Jefes
            usuarios = CustomUser.objects.filter(
                rol_user__name_rol__in=['Analista de Laboratorio', 'Jefe de Laboratorio']
            )
        else:
            # Para otros roles, mostrar solo Analistas
            usuarios = CustomUser.objects.filter(rol_user__name_rol='Analista de Laboratorio')
        
        # Filtrar usuarios sin rol asignado y excluir al usuario actual
        usuarios = usuarios.exclude(rol_user__isnull=True).exclude(id_user=request.user.id_user)
        
        usuarios_data = []
        for usuario in usuarios:
            usuarios_data.append({
                'id': usuario.id_user,
                'nombre': usuario.first_name,
                'apellido': usuario.last_name,
                'area': usuario.area_user.name_area if usuario.area_user else '',
                'rol': usuario.rol_user.name_rol if usuario.rol_user else ''
            })
        
        logger.debug(f"API usuarios: {len(usuarios_data)} usuarios devueltos para {request.user}")
        return JsonResponse(usuarios_data, safe=False)
    except Exception as e:
        logger.error(f"Error en api_usuarios: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
########################################
#Vista para ver las bitacoras guardadas#
########################################
@login_required
def ver_bitacora(request, bitacora_id):
    try:
        # Obtener la bitácora con todas sus relaciones
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
            'resultado',
            'muestras_blancos',
            'nombre_bita_cbap'  # Este es el related_name correcto para ejemplosFormulas
        ).get(id_cbap=bitacora_id)
        
        # Obtener el registro de blanco para esta bitácora
        try:
            blanco = tableBlanco.objects.get(nombre_bita_cbap=bitacora)
        except tableBlanco.DoesNotExist:
            blanco = None

        # Obtener los ejemplos de fórmulas relacionados con esta bitácora
        ejemplos_formulas = bitacora.nombre_bita_cbap.all()

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
            'blanco': blanco,
            'ejemplos_formulas': ejemplos_formulas,  # Pasar los ejemplos de fórmulas al contexto
        }

        return render(request, 'detalles_bitacoras.html', context)
    
    except bita_cbap.DoesNotExist:
        messages.error(request, 'La bitácora no existe o no tienes permiso para verla.')
        return redirect('microalimentos:lista_bitacoras')
##########################################
#Vista para ver las bitacoras en revisión#
##########################################
@login_required
@role_required('Analista de Laboratorio')
def ver_bitacora_revision(request, bitacora_id):
    try:
        # Obtener la bitácora principal con todas sus relaciones
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
        
        # Obtener el registro de blanco para esta bitácora
        try:
            blanco = tableBlanco.objects.get(nombre_bita_cbap=bitacora)
        except tableBlanco.DoesNotExist:
            blanco = None
        # Obtener los ejemplos de fórmulas relacionados con esta bitácora
        ejemplos_formulas = bitacora.nombre_bita_cbap.all()
        
        # Verificar que el usuario actual sea el creador de la bitácora
        if bitacora.firma_user != request.user:
            messages.error(request, "No tienes permiso para ver esta bitácora")
            return redirect('microalimentos:lista_bitacoras_revision')

        # Obtener el registro de blanco para esta bitácora
        try:
            blanco = tableBlanco.objects.get(nombre_bita_cbap=bitacora)
        except tableBlanco.DoesNotExist:
            blanco = None
        
        # Obtener el registro de Bitcoras_Cbap correspondiente
        registro = Bitcoras_Cbap.objects.filter(
            nombre_bita_cbap=bitacora
        ).order_by('-fecha_bita_cbap').first()
        
        # Registrar información de depuración
        if registro:
            logger.debug(f"Registro encontrado: ID={registro.id_bita_cbap}, Estado={registro.estado}")
        else:
            logger.warning(f"No se encontró registro de Bitcoras_Cbap para la bitácora {bitacora_id}")

        # Asegurarse de que los datos de campo estén disponibles
        datos_campo = bitacora.id_dc_cbap
        
        # Registrar valores para depuración
        logger.debug(f"Datos de bitácora: {bitacora.__dict__}")
        if datos_campo:
            logger.debug(f"Datos de campo: {datos_campo.__dict__}")
        
        # Obtener todos los registros relacionados con la bitácora
        clave_muestras = list(bitacora.ClaveMuestra.all())
        diluciones_empleadas = list(bitacora.dilucion_empleadas.all())
        diluciones_directas = list(bitacora.dilucion_directa.all())
        diluciones = list(bitacora.dilucion.all())
        resultados = list(bitacora.resultado.all())
        
        # Determinar el número máximo de filas
        max_filas = max(
            len(clave_muestras),
            len(diluciones_empleadas),
            len(diluciones_directas),
            len(diluciones),
            len(resultados),
            1  # Asegurar al menos una fila
        )
        
        # Crear filas_datos con todos los registros
        filas_datos = []
        for i in range(max_filas):
            fila = {
                'index': i,
                'clave_muestra': clave_muestras[i] if i < len(clave_muestras) else None,
                'diluciones': diluciones_empleadas[i] if i < len(diluciones_empleadas) else None,
                'directa': diluciones_directas[i] if i < len(diluciones_directas) else None,
                'dilucion': diluciones[i] if i < len(diluciones) else None,
                'resultado': resultados[i] if i < len(resultados) else None
            }
            filas_datos.append(fila)

        # Obtener controles de calidad y verificaciones de balanza
        controles_calidad = list(bitacora.control_calidades.all())
        verificaciones_balanza = list(bitacora.verificaciones_balanza.all())
        
        # Asegurarse de que hay 4 controles de calidad (completar con None si faltan)
        while len(controles_calidad) < 4:
            controles_calidad.append(None)
            
        # Asegurarse de que hay 2 verificaciones de balanza (completar con None si faltan)
        while len(verificaciones_balanza) < 2:
            verificaciones_balanza.append(None)

        # Manejar valores de fechas y horas almacenados como texto
        fecha_siembra = datos_campo.fecha_siembra_dc if datos_campo else ""
        hora_siembra = datos_campo.hora_siembra_dc if datos_campo else ""
        hora_incubacion = datos_campo.hora_incubacion_dc if datos_campo else ""
        
        # Limpiar valores predeterminados o nulos
        if fecha_siembra == "---" or fecha_siembra is None:
            fecha_siembra = ""
        if hora_siembra == "---" or hora_siembra is None:
            hora_siembra = ""
        if hora_incubacion == "---" or hora_incubacion is None:
            hora_incubacion = ""
            
        # Manejar valores de fecha y hora de lectura
        fecha_lectura_cbap = bitacora.fecha_lectura_cbap or ""
        hora_lectura_cbap = bitacora.hora_lectura_cbap or ""
        
        if fecha_lectura_cbap == "---" or fecha_lectura_cbap is None:
            fecha_lectura_cbap = ""
        if hora_lectura_cbap == "---" or hora_lectura_cbap is None:
            hora_lectura_cbap = ""
        
        # Otros campos de datos_campo
        procedimiento = datos_campo.procedimiento_dc if datos_campo and datos_campo.procedimiento_dc else ""
        equipo_incubacion = datos_campo.equipo_incubacion_dc if datos_campo and datos_campo.equipo_incubacion_dc else ""
        
        # Otros campos de bitácora
        nombre_cbap = bitacora.nombre_cbap or ""
        pagina_cbap = bitacora.pagina_cbap or 0
        letra_analista_cbap = bitacora.letra_analista_cbap or ""
        mes_muestra_cbap = bitacora.mes_muestra_cbap or ""
        pagina_muestra_cbap = bitacora.pagina_muestra_cbap or ""
        pagina_fosfato_cbap = bitacora.pagina_fosfato_cbap or ""
        numero_fosfato_cbap = bitacora.numero_fosfato_cbap or ""
        pagina_agar_cbap = bitacora.pagina_agar_cbap or ""
        numero_agar_cbap = bitacora.numero_agar_cbap or ""
        observaciones_cbap = bitacora.observaciones_cbap or ""
        
        # Registrar valores para depuración
        logger.debug(f"Valores procesados: fecha_siembra={fecha_siembra}, hora_siembra={hora_siembra}, "
                    f"hora_incubacion={hora_incubacion}, fecha_lectura={fecha_lectura_cbap}, "
                    f"hora_lectura={hora_lectura_cbap}")

        context = {
            'bitacora': bitacora,
            'filas_datos': filas_datos,
            'datos_campo': datos_campo,
            'usuario': bitacora.firma_user,
            'controles_calidad': controles_calidad,
            'verificaciones_balanza': verificaciones_balanza,
            'registro': registro,
            'blanco': blanco,  # Añadir el blanco al contexto
            # Agregar valores procesados al contexto
            'fecha_siembra': fecha_siembra,
            'hora_siembra': hora_siembra,
            'hora_incubacion': hora_incubacion,
            'procedimiento': procedimiento,
            'equipo_incubacion': equipo_incubacion,
            'nombre_cbap': nombre_cbap,
            'pagina_cbap': pagina_cbap,
            'letra_analista_cbap': letra_analista_cbap,
            'mes_muestra_cbap': mes_muestra_cbap,
            'pagina_muestra_cbap': pagina_muestra_cbap,
            'pagina_fosfato_cbap': pagina_fosfato_cbap,
            'numero_fosfato_cbap': numero_fosfato_cbap,
            'pagina_agar_cbap': pagina_agar_cbap,
            'numero_agar_cbap': numero_agar_cbap,
            'fecha_lectura_cbap': fecha_lectura_cbap,
            'hora_lectura_cbap': hora_lectura_cbap,
            'observaciones_cbap': observaciones_cbap,
            'ejemplos_formulas': ejemplos_formulas,  # Pasar los ejemplos de fórmulas al contexto
            'debug': True  # Habilitar depuración en la plantilla
        }

        return render(request, 'bitacora_para_revisar.html', context)
    
    except bita_cbap.DoesNotExist:
        messages.error(request, 'La bitácora no existe.')
        return redirect('microalimentos:lista_bitacoras_revision')
    except Exception as e:
        logger.error(f"Error al ver bitácora en revisión: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        messages.error(request, f"Error al cargar la bitácora: {str(e)}")
        return redirect('microalimentos:lista_bitacoras_revision')
@login_required
@role_required('Analista de Laboratorio')
def ver_bitacora_autorizada(request, bitacora_id):
    try:
        # Obtener parámetros de la URL anterior (referer)
        referer = request.META.get('HTTP_REFERER', '')
        año = None
        mes = None
        
        # Intentar extraer año y mes del referer si viene de una URL de período específico
        import re
        match = re.search(r'/historial/(\d+)/(\d+)/', referer)
        if match:
            año = int(match.group(1))
            mes = int(match.group(2))
        
        # Obtener la bitácora principal
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
        ).get(id_cbap=bitacora_id, firma_user=request.user)

        # Obtener el registro de blanco para esta bitácora
        try:
            blanco = tableBlanco.objects.get(nombre_bita_cbap=bitacora)
        except tableBlanco.DoesNotExist:
            blanco = None

        # Obtener los ejemplos de fórmulas relacionados con esta bitácora
        ejemplos_formulas = bitacora.nombre_bita_cbap.all()
        # Obtener el registro de Bitcoras_Cbap correspondiente
        # Intentamos obtener el registro más reciente
        registro = Bitcoras_Cbap.objects.select_related(
            'firma_revisor',
            'firma_autorizador'
        ).filter(
            nombre_bita_cbap=bitacora
        ).order_by('-fecha_bita_cbap').first()
        
        # Si no se pudo extraer año y mes del referer, intentar obtenerlos de la fecha de autorización
        if (año is None or mes is None) and registro and registro.fecha_autorizacion:
            año = registro.fecha_autorizacion.year
            mes = registro.fecha_autorizacion.month
        
        # Registrar información de depuración
        if registro:
            print(f"Registro encontrado: ID={registro.id_bita_cbap}, Estado={registro.estado}")
            if registro.firma_revisor:
                print(f"Firma revisor: {registro.firma_revisor.first_name} {registro.firma_revisor.last_name}")
            if hasattr(registro, 'firma_autorizador') and registro.firma_autorizador:
                print(f"Firma autorizador: {registro.firma_autorizador.first_name} {registro.firma_autorizador.last_name}")
        else:
            print(f"No se encontró registro de Bitcoras_Cbap para la bitácora {bitacora_id}")

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

        # Preparar información de firmas
        firma_revisor = None
        firma_autorizador = None
        fecha_revision = None
        fecha_autorizacion = None
        
        if registro:
            firma_revisor = registro.firma_revisor
            firma_autorizador = registro.firma_autorizador
            fecha_revision = registro.fecha_revision
            fecha_autorizacion = registro.fecha_autorizacion

        # Nombres de los meses para mostrar en la plantilla
        nombres_meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        
        context = {
            'bitacora': bitacora,
            'filas_datos': filas_datos,
            'datos_campo': bitacora.id_dc_cbap,
            'usuario': bitacora.firma_user,
            'controles_calidad': bitacora.control_calidades.all(),
            'verificaciones_balanza': bitacora.verificaciones_balanza.all(),
            'registro': registro,  # Añadir el registro de Bitcoras_Cbap al contexto
            'firma_revisor': firma_revisor,  # Añadir explícitamente la firma del revisor
            'firma_autorizador': firma_autorizador,  # Añadir explícitamente la firma del autorizador
            'fecha_revision': fecha_revision,  # Añadir la fecha de revisión
            'fecha_autorizacion': fecha_autorizacion,  # Añadir la fecha de autorización
            'año': año,  # Añadir el año al contexto
            'mes': mes,  # Añadir el mes al contexto
            'nombre_mes': nombres_meses[mes-1] if mes and mes >= 1 and mes <= 12 else '',  # Nombre del mes
            'blanco': blanco,  # Añadir el blanco al contexto
            'ejemplos_formulas': ejemplos_formulas,  # Pasar los ejemplos de fórmulas al contexto
            'debug': True  # Habilitar depuración en la plantilla
        }

        return render(request, 'bitacoras_autorizadas.html', context)
    
    except bita_cbap.DoesNotExist:
        messages.error(request, 'La bitácora no existe.')
        return redirect('microalimentos:historial_bitacoras_por_anio')
#################################
#Vista para aprobar una bitácora#
#################################
@login_required
def contar_bitacoras(request, estado, usuario_id=None):
    """
    Vista para contar bitácoras por estado y usuario.
    Args:
        estado: string ('guardada', 'enviada', 'revisada', 'rechazada')
        usuario_id: ID del usuario (opcional)
    """
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            logger = logging.getLogger(__name__)
            logger.debug(f"Contando bitácoras con estado: {estado}, usuario_id: {usuario_id}")
            
            # Determinar qué usuario usar para el filtro
            if usuario_id:
                # Si se proporciona un ID de usuario, usar ese ID
                try:
                    usuario_filtro_id = int(usuario_id)
                    logger.debug(f"Filtrando por usuario_id específico: {usuario_filtro_id}")
                except (ValueError, TypeError):
                    logger.error(f"ID de usuario inválido: {usuario_id}")
                    return JsonResponse({
                        'error': f"ID de usuario inválido: {usuario_id}"
                    }, status=400)
            else:
                # Si no se proporciona ID, usar el usuario actual
                usuario_filtro_id = request.user.id_user
                logger.debug(f"Filtrando por usuario actual: {request.user.username} (ID: {usuario_filtro_id})")
            
            # Determinar el rol del usuario
            es_jefe = hasattr(request.user, 'rol_user') and request.user.rol_user.name_rol == 'Jefe de Laboratorio'
            
            logger.debug(f"Rol del usuario: {'Jefe' if es_jefe else 'Otro'}")
            
            # Filtrar según el rol y el estado
            if es_jefe:
                # Para jefes, contar bitácoras donde son destinatarios
                # Obtener el nombre completo del jefe
                jefe = CustomUser.objects.get(id_user=usuario_filtro_id)
                nombre_jefe = f"{jefe.first_name} {jefe.last_name}"
                
                cantidad = Bitcoras_Cbap.objects.filter(
                    estado=estado,
                    nombre_user_destino=nombre_jefe  # Filtrar por el nombre del jefe en nombre_user_destino
                ).count()
                logger.debug(f"Contando bitácoras para jefe {nombre_jefe} con estado {estado}: {cantidad}")
            else:
                # Para analistas, contar bitácoras donde son creadores
                cantidad = Bitcoras_Cbap.objects.filter(
                    estado=estado,
                    name_user_cbap_id=usuario_filtro_id  # Filtrar por el ID del analista en name_user_cbap
                ).count()
                logger.debug(f"Contando bitácoras para analista {usuario_filtro_id} con estado {estado}: {cantidad}")
            
            return JsonResponse({'cantidad': cantidad})
        
        except Exception as e:
            logger.error(f"Error contando bitácoras: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Solicitud no válida'}, status=400)

@login_required
@role_required('Analista de Laboratorio')
def vistaAnalista(request):
    # Obtener el conteo de bitácoras guardadas para el usuario actual
    cantidad_bitacoras = Bitcoras_Cbap.objects.filter(
        name_user_cbap=request.user,
        estado='guardada'
    ).count()

    return render(request, 'microbiologyll.html', {
        'cantidad_bitacoras': cantidad_bitacoras
    })

@login_required
@role_required('Analista de Laboratorio')
def bitacoras(request):
  return render(request, 'typeBitacoras.html')

@login_required
@role_required('Analista de Laboratorio')
def analiticas(request):
  return render(request, 'VistaAnaliticas.html')
#Vista para la página de cuentas de mohos y levaduras
@login_required
@role_required('Analista de Laboratorio')
def paginasNo(request):
  return render(request, 'trabajando.html')
#Vista para la página de cuentas de mohos y levaduras
@login_required
@role_required('Analista de Laboratorio')
def cuentademohosylevaduras(request):
  return render(request, 'FP133.html')
#Vista para registrar una nueva bitácora
def registerNewBita(request):
  return render(request, 'registerBita.html')
#####################################################################################
#Vista para obtener el siguiente número de página disponible para una nueva bitácora#
#####################################################################################
@login_required
def obtener_siguiente_numero_pagina(request):
    """
    Vista para obtener el siguiente número de página disponible para una nueva bitácora.
    """
    try:
        # Verificar si es una solicitud AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        print(f"Headers recibidos: {dict(request.headers)}")
        print(f"Es solicitud AJAX: {is_ajax}")
        
        # Verificar el referer (de dónde viene la solicitud)
        referer = request.META.get('HTTP_REFERER', '')
        print(f"Referer: {referer}")
        
        # Verificar si la solicitud proviene de la página de registro
        is_register_page = (# Verificar si la URL contiene la página de registro
            '/microbiologia/FP131/' in referer or # Cambiar a la URL correcta
            '/microbiologia/FP131' in referer or# Cambiar a la URL correcta
            '/registrar_bitacora' in referer
        )
        print(f"¿Es página de registro?: {is_register_page}")
        
        # Para depuración, permitir todas las solicitudes temporalmente
        # Comentar esta línea cuando todo funcione correctamente
        is_register_page = True
        
        # Solo proporcionar el siguiente número si la solicitud proviene de la página de registro
        if is_register_page:
            from .models import bita_cbap
            from django.db.models import Max
            
            # Usar Max para obtener el valor máximo del campo pagina_cbap
            max_pagina = bita_cbap.objects.aggregate(Max('pagina_cbap'))
            max_pagina_value = max_pagina.get('pagina_cbap__max')
            
            siguiente_numero = 1  # Valor por defecto si no hay bitácoras
            
            if max_pagina_value:
                try:
                    # Intentar convertir a entero y sumar 1
                    siguiente_numero = int(max_pagina_value) + 1
                    print(f"Último número de página encontrado: {max_pagina_value}, siguiente: {siguiente_numero}")
                except (ValueError, TypeError):
                    # Si no es un número válido, usar el valor por defecto
                    siguiente_numero = 1
                    print(f"Error al convertir {max_pagina_value} a entero, usando valor por defecto: 1")
            else:
                print("No se encontró ningún valor máximo, usando valor por defecto: 1")
                    
            return JsonResponse({'siguiente_numero': siguiente_numero})
        else:
            # Si no proviene de la página de registro, devolver un error
            return JsonResponse({
                'error': 'Esta función solo está disponible desde la página de registro de bitácora',
                'detalle': 'Acceso no autorizado desde otra página'
            }, status=403)
    # Capturar cualquier excepción y devolver un error
    except Exception as e:
        import traceback
        print(f"Error en obtener_siguiente_numero_pagina: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'error': str(e),
            'detalle': 'Error al procesar la solicitud. Revise los logs del servidor.'
        }, status=500)
#############################################
#Vista para modificar una bitácora existente#
#############################################
@login_required
def modificar_bitacora(request, bitacora_id):
    # Obtener la bitácora existente
    bitacora = get_object_or_404(bita_cbap, id_cbap=bitacora_id)
    
    # Verificar que el usuario actual sea el creador de la bitácora
    if bitacora.firma_user != request.user:
        messages.error(request, "No tienes permiso para modificar esta bitácora")
        return redirect('microalimentos:lista_bitacoras_guardadas')
    
    # Verificar que la bitácora esté en estado 'guardada'
    ultimo_registro = Bitcoras_Cbap.objects.filter(
        nombre_bita_cbap=bitacora
    ).order_by('-fecha_bita_cbap').first()
    
    if not ultimo_registro or ultimo_registro.estado != 'guardada':
        messages.error(request, "Solo se pueden modificar bitácoras en estado 'guardada'")
        return redirect('microalimentos:lista_bitacoras_guardadas')
    
    # Obtener el registro de blanco existente para esta bitácora
    try:
        blanco_existente = tableBlanco.objects.get(nombre_bita_cbap=bitacora)
    except tableBlanco.DoesNotExist:
        blanco_existente = None
    
    if request.method == 'POST':
        accion = request.POST.get('accion')  # Obtén la acción desde el formulario
        
        try:
            # Función auxiliar para convertir valores a float o None
            def safe_float(value):
                if value is None or value == '':
                    return None
                try:
                    return float(value)
                except (ValueError, TypeError):
                    return None
            
            # Función auxiliar para manejar fechas y horas
            def safe_date_time(value):
                if value is None or value == '' or value == '---':
                    return None
                return value
            
            with transaction.atomic():
                # === 1. ACTUALIZAR DATOS CAMPO ===
                datos_campo = bitacora.id_dc_cbap
                datos_campo_data = {
                    'fecha_siembra_dc': safe_date_time(request.POST.get('fecha_siembra')),
                    'hora_siembra_dc': safe_date_time(request.POST.get('hora_siembra')),
                    'hora_incubacion_dc': safe_date_time(request.POST.get('hora_incubacion')),
                    'procedimiento_dc': request.POST.get('procedimiento'),
                    'equipo_incubacion_dc': request.POST.get('equipo_incubacion'),
                }
                
                # Registrar para depuración
                logger.debug(f"Datos de campo antes de validación: {datos_campo_data}")
                
                datos_campo_form = DatosCampoCbapForm(datos_campo_data, instance=datos_campo)
                if not datos_campo_form.is_valid():
                    logger.error(f"Error en formulario Datos de Campo: {datos_campo_form.errors.as_json()}")
                    return JsonResponse({
                        'success': False,
                        'error': f"Error en formulario Datos de Campo: {datos_campo_form.errors.as_json()}"
                    }, status=400)
                datos_campo = datos_campo_form.save()

                # === 2. ACTUALIZAR BITA_CBAP ===
                # Procesar fechas y horas para bita_cbap
                fecha_lectura = safe_date_time(request.POST.get('fecha_lectura_cbap'))
                hora_lectura = safe_date_time(request.POST.get('hora_lectura_cbap'))
                
                # Registrar para depuración
                logger.debug(f"Fecha lectura: {fecha_lectura}, Hora lectura: {hora_lectura}")
                
                # Actualizar los campos de la bitácora
                bitacora.nombre_cbap = request.POST.get('nombre_cbap')
                bitacora.pagina_cbap = request.POST.get('pagina_cbap')
                bitacora.letra_analista_cbap = request.POST.get('letra_analista_cbap')
                bitacora.mes_muestra_cbap = request.POST.get('mes_muestra_cbap')
                bitacora.pagina_muestra_cbap = request.POST.get('pagina_muestra_cbap')
                bitacora.pagina_fosfato_cbap = request.POST.get('pagina_fosfato_cbap')
                bitacora.numero_fosfato_cbap = request.POST.get('numero_fosfato_cbap')
                bitacora.pagina_agar_cbap = request.POST.get('pagina_agar_cbap')
                bitacora.numero_agar_cbap = request.POST.get('numero_agar_cbap')
                bitacora.fecha_lectura_cbap = fecha_lectura
                bitacora.hora_lectura_cbap = hora_lectura
                bitacora.observaciones_cbap = request.POST.get('observaciones_cbap')
                bitacora.save()

                # === 3. ACTUALIZAR REGISTRO DE BLANCO ===
                # Obtener datos del blanco
                cantidad_blanco = request.POST.get('cantidad_blanco')
                placa_blanco = request.POST.get('placa_blanco')
                resultado_blanco = request.POST.get('resultado_blanco')
                
                # Actualizar o crear el registro de blanco
                try:
                    if blanco_existente:
                        # Actualizar el registro existente
                        blanco_existente.cantidad_blanco = cantidad_blanco if cantidad_blanco else '---'
                        blanco_existente.placa_blanco = placa_blanco if placa_blanco else '---'
                        blanco_existente.resultado_blanco = resultado_blanco
                        blanco_existente.save()
                        logger.debug(f"Blanco actualizado correctamente con ID: {blanco_existente.id_blanco}")
                    else:
                        # Crear un nuevo registro
                        blanco = tableBlanco(
                            cantidad_blanco=cantidad_blanco if cantidad_blanco else '---',
                            placa_blanco=placa_blanco if placa_blanco else '---',
                            resultado_blanco=resultado_blanco,
                            nombre_bita_cbap=bitacora
                        )
                        blanco.save()
                        logger.debug(f"Nuevo blanco creado con ID: {blanco.id_blanco}")
                except Exception as e:
                    logger.error(f"Error al actualizar/crear blanco: {str(e)}")
                    return JsonResponse({
                        'success': False,
                        'error': f"Error al actualizar/crear blanco: {str(e)}"
                    }, status=400)
                
                # === 4. ACTUALIZAR FILAS DINÁMICAS ===
                # Obtener todas las filas existentes
                claves_muestra_existentes = list(ClaveMuestraCbap.objects.filter(id_cbap_c_m=bitacora))
                diluciones_empleadas_existentes = list(DilucionesEmpleadas.objects.filter(id_cbap_dE=bitacora))
                direct_o_dilucion_existentes = list(Direct_o_Dilucion.objects.filter(id_cbap_dD=bitacora))
                dilucion_existentes = list(Dilucion.objects.filter(id_cbap_d=bitacora))
                resultados_existentes = list(Resultado.objects.filter(id_cbap_r=bitacora))
                
                # Procesar las filas del formulario
                num_filas = int(request.POST.get('num_filas', 0))
                filas_procesadas = 0
                
                for i in range(num_filas):
                    # Verificar si la fila tiene datos antes de procesarla
                    if request.POST.get(f'clave_c_m_{i}') or request.POST.get(f'medicion_c_m_{i}') or request.POST.get(f'cantidad_c_m_{i}') or request.POST.get(f'dE_1_{i}') or request.POST.get(f'dE_2_{i}') or request.POST.get(f'dE_3_{i}') or request.POST.get(f'dE_4_{i}') or request.POST.get(f'placa_dD_{i}') or request.POST.get(f'placa_dD2_{i}') or request.POST.get(f'promedio_dD_{i}') or request.POST.get(f'placa_d_{i}') or request.POST.get(f'placa_d2_{i}') or request.POST.get(f'promedio_d_{i}') or request.POST.get(f'placa_d_2_{i}') or request.POST.get(f'placa_d2_2_{i}') or request.POST.get(f'promedio_d_2_{i}') or request.POST.get(f'resultado_r_{i}') or request.POST.get(f'ufC_placa_r_{i}') or request.POST.get(f'diferencia_r_{i}'):
                        # Obtener los datos de la fila
                        clave_c_m = request.POST.get(f'clave_c_m_{i}', '')
                        medicion_c_m = request.POST.get(f'medicion_c_m_{i}', '')
                        cantidad_c_m = request.POST.get(f'cantidad_c_m_{i}', '')
                       
                        
                        # Usar safe_float para todas las conversiones de string a float
                        dE_1 = safe_float(request.POST.get(f'dE_1_{i}'))
                        dE_2 = safe_float(request.POST.get(f'dE_2_{i}'))
                        dE_3 = safe_float(request.POST.get(f'dE_3_{i}'))
                        dE_4 = safe_float(request.POST.get(f'dE_4_{i}'))
                        placa_dD = (request.POST.get(f'placa_dD_{i}'))
                        placa_dD2 = (request.POST.get(f'placa_dD2_{i}'))
                        promedio_dD = (request.POST.get(f'promedio_dD_{i}'))
                        placa_d = (request.POST.get(f'placa_d_{i}'))
                        placa_d2 = (request.POST.get(f'placa_d2_{i}'))
                        promedio_d = (request.POST.get(f'promedio_d_{i}'))
                        placa_d_2 = (request.POST.get(f'placa_d_2_{i}'))
                        placa_d2_2 = (request.POST.get(f'placa_d2_2_{i}'))
                        promedio_d_2 = (request.POST.get(f'promedio_d_2_{i}'))
                       
                        
                        # Para estos campos, mantener como string
                        resultado_r = request.POST.get(f'resultado_r_{i}', '')
                        ufC_placa_r = request.POST.get(f'ufC_placa_r_{i}', '')
                        diferencia_r = request.POST.get(f'diferencia_r_{i}', '')
                        
                        
                        # === 3.1. ACTUALIZAR O CREAR CLAVE MUESTRA ===
                        if filas_procesadas < len(claves_muestra_existentes):
                            # Actualizar registro existente
                            clave_muestra = claves_muestra_existentes[filas_procesadas]
                            clave_muestra.clave_c_m = clave_c_m
                            clave_muestra.medicion_c_m = medicion_c_m
                            clave_muestra.cantidad_c_m = cantidad_c_m
                            
                            clave_muestra.save()
                        else:
                            # Crear nuevo registro
                            ClaveMuestraCbap.objects.create(
                                id_cbap_c_m=bitacora,
                                clave_c_m=clave_c_m,
                                medicion_c_m=medicion_c_m,
                                cantidad_c_m=cantidad_c_m,
                               
                            )
                        
                        # === 3.2. ACTUALIZAR O CREAR DILUCIONES EMPLEADAS ===
                        if filas_procesadas < len(diluciones_empleadas_existentes):
                            # Actualizar registro existente
                            dilucion_empleada = diluciones_empleadas_existentes[filas_procesadas]
                            dilucion_empleada.dE_1 = dE_1
                            dilucion_empleada.dE_2 = dE_2
                            dilucion_empleada.dE_3 = dE_3
                            dilucion_empleada.dE_4 = dE_4
                            dilucion_empleada.save()
                        else:
                            # Crear nuevo registro
                            DilucionesEmpleadas.objects.create(
                                id_cbap_dE=bitacora,
                                dE_1=dE_1,
                                dE_2=dE_2,
                                dE_3=dE_3,
                                dE_4=dE_4
                            )
                        
                        # === 3.3. ACTUALIZAR O CREAR DIRECTO O DILUCIÓN ===
                        if filas_procesadas < len(direct_o_dilucion_existentes):
                            # Actualizar registro existente
                            direct_o_dilucion = direct_o_dilucion_existentes[filas_procesadas]
                            direct_o_dilucion.placa_dD = placa_dD
                            direct_o_dilucion.placa_dD2 = placa_dD2
                            direct_o_dilucion.promedio_dD = promedio_dD
                          
                            direct_o_dilucion.save()
                        else:
                            # Crear nuevo registro
                            Direct_o_Dilucion.objects.create(
                                id_cbap_dD=bitacora,
                                placa_dD=placa_dD,
                                placa_dD2=placa_dD2,
                                promedio_dD=promedio_dD,
                               
                            )
                        
                        # === 3.4. ACTUALIZAR O CREAR DILUCIÓN ===
                        if filas_procesadas < len(dilucion_existentes):
                            # Actualizar registro existente
                            dilucion = dilucion_existentes[filas_procesadas]
                            dilucion.placa_d = placa_d
                            dilucion.placa_d2 = placa_d2
                            dilucion.promedio_d = promedio_d
                            dilucion.placa_d_2 = placa_d_2
                            dilucion.placa_d2_2 = placa_d2_2
                            dilucion.promedio_d_2 = promedio_d_2
                            dilucion.save()
                        else:
                            # Crear nuevo registro
                            Dilucion.objects.create(
                                id_cbap_d=bitacora,
                                placa_d=placa_d,
                                placa_d2=placa_d2,
                                promedio_d=promedio_d,
                                placa_d_2=placa_d_2,
                                placa_d2_2=placa_d2_2,
                                promedio_d_2=promedio_d_2
                            )
                        
                        # === 3.5. ACTUALIZAR O CREAR RESULTADOS ===
                        if filas_procesadas < len(resultados_existentes):
                            # Actualizar registro existente
                            resultado = resultados_existentes[filas_procesadas]
                            resultado.resultado_r = resultado_r
                            resultado.ufC_placa_r = ufC_placa_r
                            resultado.diferencia_r = diferencia_r
                         
                            resultado.save()
                        else:
                            # Crear nuevo registro
                            Resultado.objects.create(
                                id_cbap_r=bitacora,
                                resultado_r=resultado_r,
                                ufC_placa_r=ufC_placa_r,
                                diferencia_r=diferencia_r,
                              
                            )
                        
                        filas_procesadas += 1
                        
                # === 5. ACTUALIZAR CONTROL DE CALIDAD ===
                controles_calidad_existentes = list(ControlCalidad.objects.filter(id_cbap_cc=bitacora))
                for i in range(1, 5):
                    # Procesar fecha para control de calidad
                    fecha_cc = safe_date_time(request.POST.get(f'fecha_1cc_{i}'))
                    
                    control_calidad_data = {
                        'nombre_laf': request.POST.get(f'nombre_laf_{i}', ''),
                        'fecha_1cc': fecha_cc,
                        'page_1cc': request.POST.get(f'page_1cc_{i}', ''),
                    }
                    
                    if i-1 < len(controles_calidad_existentes):
                        # Actualizar registro existente
                        control_calidad = controles_calidad_existentes[i-1]
                        control_calidad.nombre_laf = control_calidad_data['nombre_laf']
                        control_calidad.fecha_1cc = control_calidad_data['fecha_1cc']
                        control_calidad.page_1cc = control_calidad_data['page_1cc']
                        control_calidad.save()
                    else:
                        # Crear nuevo registro
                        ControlCalidad.objects.create(
                            id_cbap_cc=bitacora,
                            nombre_laf=control_calidad_data['nombre_laf'],
                            fecha_1cc=control_calidad_data['fecha_1cc'],
                            page_1cc=control_calidad_data['page_1cc']
                        )

                # === 6. ACTUALIZAR VERIFICACIÓN DE BALANZA ===
                verificaciones_balanza_existentes = list(VerificacionBalanza.objects.filter(id_cbap_vb=bitacora))
                for i in range(1, 3):
                    # Procesar hora para verificación de balanza
                    hora_vb = safe_date_time(request.POST.get(f'hora_vb_{i}'))
                    
                    if i-1 < len(verificaciones_balanza_existentes):
                        # Actualizar registro existente
                        veri_balanza = verificaciones_balanza_existentes[i-1]
                        
                        # Actualizar campos con valores del formulario o mantener los existentes si están vacíos
                        veri_balanza.hora_vb = hora_vb
                        
                        # Para actividad_vb, limitar a 50 caracteres
                        actividad_vb_nuevo = request.POST.get(f'actividad_vb_{i}', '')
                        if actividad_vb_nuevo:
                            veri_balanza.actividad_vb = actividad_vb_nuevo[:50]
                        
                        # Usar safe_float para campos numéricos
                        ajuste_vb = safe_float(request.POST.get(f'ajuste_vb_{i}'))
                        if ajuste_vb is not None:
                            veri_balanza.ajuste_vb = ajuste_vb
                            
                        valor_nominal_vb = safe_float(request.POST.get(f'valor_nominal_vb_{i}'))
                        if valor_nominal_vb is not None:
                            veri_balanza.valor_nominal_vb = valor_nominal_vb
                            
                        valor_convencional_vb = safe_float(request.POST.get(f'valor_convencional_vb_{i}'))
                        if valor_convencional_vb is not None:
                            veri_balanza.valor_convencional_vb = valor_convencional_vb
                            
                        valo_masa_vb = safe_float(request.POST.get(f'valo_masa_vb_{i}'))
                        if valo_masa_vb is not None:
                            veri_balanza.valo_masa_vb = valo_masa_vb
                            
                        diferecnia_vb = safe_float(request.POST.get(f'diferecnia_vb_{i}'))
                        if diferecnia_vb is not None:
                            veri_balanza.diferecnia_vb = diferecnia_vb
                            
                        incertidumbre_vb = safe_float(request.POST.get(f'incertidumbre_vb_{i}'))
                        if incertidumbre_vb is not None:
                            veri_balanza.incertidumbre_vb = incertidumbre_vb
                            
                        emt_vb = safe_float(request.POST.get(f'emt_vb_{i}'))
                        if emt_vb is not None:
                            veri_balanza.emt_vb = emt_vb
                        
                        veri_balanza.aceptacion_vb = request.POST.get(f'aceptacion_vb_{i}', '') or veri_balanza.aceptacion_vb
                        veri_balanza.valor_pesado_muestra_vb = request.POST.get(f'valor_pesado_muestra_vb_{i}', '') or veri_balanza.valor_pesado_muestra_vb
                        veri_balanza.tomo_verficacion_vb = request.POST.get(f'tomo_verficacion_vb_{i}', '') or veri_balanza.tomo_verficacion_vb
                        veri_balanza.pagina_verficacion_vb = request.POST.get(f'pagina_verficacion_vb_{i}', '') or veri_balanza.pagina_verficacion_vb
                        
                        veri_balanza.save()
                    else:
                        # Crear nuevo registro solo si se proporcionan datos
                        if (request.POST.get(f'hora_vb_{i}') or request.POST.get(f'actividad_vb_{i}') or 
                            request.POST.get(f'ajuste_vb_{i}') or request.POST.get(f'valor_nominal_vb_{i}') or 
                            request.POST.get(f'valor_convencional_vb_{i}') or request.POST.get(f'valo_masa_vb_{i}') or 
                            request.POST.get(f'diferecnia_vb_{i}') or request.POST.get(f'incertidumbre_vb_{i}') or 
                            request.POST.get(f'emt_vb_{i}') or request.POST.get(f'aceptacion_vb_{i}') or 
                            request.POST.get(f'valor_pesado_muestra_vb_{i}')):
                            
                            # Para actividad_vb, limitar a 50 caracteres
                            actividad_vb_nuevo = request.POST.get(f'actividad_vb_{i}', '')
                            if len(actividad_vb_nuevo) > 50:
                                actividad_vb_nuevo = actividad_vb_nuevo[:50]
                            
                            # Usar safe_float para campos numéricos
                            VerificacionBalanza.objects.create(
                                id_cbap_vb=bitacora,
                                hora_vb=hora_vb,
                                actividad_vb=actividad_vb_nuevo,
                                ajuste_vb=safe_float(request.POST.get(f'ajuste_vb_{i}')),
                                valor_nominal_vb=safe_float(request.POST.get(f'valor_nominal_vb_{i}')),
                                valor_convencional_vb=safe_float(request.POST.get(f'valor_convencional_vb_{i}')),
                                valo_masa_vb=safe_float(request.POST.get(f'valo_masa_vb_{i}')),
                                diferecnia_vb=safe_float(request.POST.get(f'diferecnia_vb_{i}')),
                                incertidumbre_vb=safe_float(request.POST.get(f'incertidumbre_vb_{i}')),
                                emt_vb=safe_float(request.POST.get(f'emt_vb_{i}')),
                                aceptacion_vb=request.POST.get(f'aceptacion_vb_{i}', ''),
                                valor_pesado_muestra_vb=request.POST.get(f'valor_pesado_muestra_vb_{i}', ''),
                                tomo_verficacion_vb=request.POST.get(f'tomo_verficacion_vb_{i}', ''),
                                pagina_verficacion_vb=request.POST.get(f'pagina_verficacion_vb_{i}', '')
                            )

                # Establecer el estado de la bitácora según la acción
                if accion == 'guardar':
                    # Si la acción es guardar, simplemente actualizamos el registro existente
                    try:
                        bitcora_cbap = Bitcoras_Cbap.objects.get(
                            nombre_bita_cbap=bitacora,
                            estado='guardada'
                        )
                        # Actualizar la fecha
                        bitcora_cbap.fecha_bita_cbap = timezone.now()
                        bitcora_cbap.save()
                        
                        logger.debug(f"Registro actualizado (guardado): {bitcora_cbap.id_bita_cbap}, estado: {bitcora_cbap.estado}")
                    except Bitcoras_Cbap.DoesNotExist:
                        # Si no existe, crear un nuevo registro
                        bitcora_cbap = Bitcoras_Cbap.objects.create(
                            name_user_cbap=request.user,
                            nombre_bita_cbap=bitacora,
                            estado='guardada',
                            nombre_user_destino=f"{request.user.first_name} {request.user.last_name}"
                        )
                        
                        logger.debug(f"Nuevo registro creado (guardado): {bitcora_cbap.id_bita_cbap}, estado: {bitcora_cbap.estado}")

                    return JsonResponse({
                        'success': True,
                        'message': "Bitácora actualizada correctamente",
                        'bitacora_id': bitacora.id_cbap,
                        'redirect_url': reverse('microalimentos:detalles_bitacoras', args=[bitacora.id_cbap])
                    })
                
                elif accion == 'enviar':
                    # Obtener datos adicionales para el envío
                    usuario_destino_id = request.POST.get('usuario_destino')
                    password = request.POST.get('password')
                    
                    # Validar contraseña
                    user = authenticate(request, username=request.user.username, password=password)
                    if user is None or not user.is_active:
                        # Si la contraseña es incorrecta, devolver error y NO continuar con el proceso
                        return JsonResponse({
                            'success': False,
                            'message': "Contraseña incorrecta"
                        }, status=403)
                    
                    # Obtener el usuario destino
                    try:
                        usuario_destino = CustomUser.objects.get(id_user=usuario_destino_id)
                    except CustomUser.DoesNotExist:
                        return JsonResponse({
                            'success': False,
                            'error': 'Usuario destino no encontrado'
                        }, status=404)
                    
                    # Actualizar el registro existente con estado 'guardada' a 'enviada'
                    try:
                        bitcora_cbap = Bitcoras_Cbap.objects.get(
                            nombre_bita_cbap=bitacora,
                            estado='guardada'
                        )
                        # Actualizar a estado 'enviada'
                        bitcora_cbap.estado = 'enviada'
                        bitcora_cbap.fecha_envio = timezone.now()
                        bitcora_cbap.nombre_user_destino = f"{usuario_destino.first_name} {usuario_destino.last_name}"
                        bitcora_cbap.save()
                        
                        logger.debug(f"Registro actualizado (enviado): {bitcora_cbap.id_bita_cbap}, estado: {bitcora_cbap.estado}")
                    except Bitcoras_Cbap.DoesNotExist:
                        # Si no existe, crear un nuevo registro con estado 'enviada'
                        bitcora_cbap = Bitcoras_Cbap.objects.create(
                            name_user_cbap=request.user,
                            nombre_bita_cbap=bitacora,
                            estado='enviada',
                            fecha_envio=timezone.now(),
                            nombre_user_destino=f"{usuario_destino.first_name} {usuario_destino.last_name}"
                        )
                        
                        logger.debug(f"Nuevo registro creado (enviado): {bitcora_cbap.id_bita_cbap}, estado: {bitcora_cbap.estado}")
                    
                    logger.info(f"Bitácora {bitacora.id_cbap} actualizada y enviada exitosamente a {usuario_destino}")
                    return JsonResponse({
                        'success': True,
                        'message': f'Bitácora actualizada y enviada correctamente a {usuario_destino.first_name} {usuario_destino.last_name}',
                        'redirect_url': reverse('microalimentos:lista_bitacoras_revision')
                    })

        except Exception as e:
            logger.error(f"Error al modificar la bitácora: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return JsonResponse({
                'success': False,
                'error': f"Error al modificar la bitácora: {str(e)}"
            }, status=500)

    else:
        # Si la solicitud es GET, cargar los datos existentes para mostrar en el formulario
        try:
            # Obtener datos relacionados
            datos_campo = bitacora.id_dc_cbap
            diluciones_empleadas = DilucionesEmpleadas.objects.filter(id_cbap_dE=bitacora)
            direct_o_dilucion = Direct_o_Dilucion.objects.filter(id_cbap_dD=bitacora)
            dilucion = Dilucion.objects.filter(id_cbap_d=bitacora)
            clave_muestra = ClaveMuestraCbap.objects.filter(id_cbap_c_m=bitacora)
            resultado = Resultado.objects.filter(id_cbap_r=bitacora)
            control_calidad = ControlCalidad.objects.filter(id_cbap_cc=bitacora)
            verificacion_balanza = VerificacionBalanza.objects.filter(id_cbap_vb=bitacora)
            
            # Obtener el registro de blanco existente
            try:
                blanco = tableBlanco.objects.get(nombre_bita_cbap=bitacora)
            except tableBlanco.DoesNotExist:
                blanco = None
            
            # Preparar formularios con datos existentes
            datos_campo_form = DatosCampoCbapForm(instance=datos_campo)
            
            # Obtener jefes de laboratorio para el selector
            jefes = CustomUser.objects.filter(rol_user__name_rol='Jefe de Laboratorio')
            
            context = {
                'bitacora': bitacora,
                'datos_campo_form': datos_campo_form,
                'diluciones_empleadas': diluciones_empleadas,
                'direct_o_dilucion': direct_o_dilucion,
                'dilucion': dilucion,
                'clave_muestra': clave_muestra,
                'resultado': resultado,
                'control_calidad': control_calidad,
                'verificacion_balanza': verificacion_balanza,
                'jefes': jefes,
                'blanco': blanco,  # Añadir el registro de blanco al contexto
                'modo': 'modificar'
            }
            
            return render(request, 'modificar_bitacora.html', context)
            
        except Exception as e:
            logger.error(f"Error al cargar datos para modificar bitácora: {str(e)}")
            messages.error(request, f"Error al cargar datos para modificar bitácora: {str(e)}")
            return redirect('microalimentos:lista_bitacoras_guardadas')

######################################
#Vista para los años de las bitácoras#
######################################
@login_required
@role_required('Analista de Laboratorio')
def historial_bitacoras_por_anio(request):
    """
    Vista para mostrar una lista de años en los que existen bitácoras autorizadas.
    """
    try:
        # Obtener todas las bitácoras autorizadas del analista actual
        bitacoras = Bitcoras_Cbap.objects.filter(
            name_user_cbap=request.user,  # Filtrar por el usuario creador (analista)
            estado='autorizada',          # Filtrar solo bitácoras autorizadas
            fecha_autorizacion__isnull=False  # Asegurarse de que tienen fecha de autorización
        ).values('fecha_autorizacion')
        
        # Crear un conjunto para almacenar años únicos
        anios = set()
        
        # Procesar cada fecha de autorización
        for bitacora in bitacoras:
            fecha = bitacora['fecha_autorizacion']
            if fecha:  # Verificar que la fecha no sea None
                anio = fecha.year
                anios.add(anio)
        
        # Convertir el conjunto a una lista ordenada
        anios_lista = sorted(list(anios), reverse=True)
        
        context = {
            'anios': anios_lista,
            'titulo': 'Historial de Bitácoras por Año',
        }
    
    except Exception as e:
        logger.error(f"Error al listar años con bitácoras autorizadas: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
        # En caso de error, simplemente mostrar una lista vacía
        context = {
            'anios': [],
            'titulo': 'Historial de Bitácoras por Año',
            'error': str(e)
        }
    
    # Siempre renderizar la plantilla, incluso en caso de error
    return render(request, 'lista_anios_bitacoras.html', context)
#######################################
#Vista para los meses de las bitácoras#
#######################################
@login_required
@role_required('Analista de Laboratorio')
def historial_bitacoras_por_mes(request, anio):
    """
    Vista para mostrar una lista de meses en los que existen bitácoras autorizadas para un año específico.
    """
    try:
        # Obtener todas las bitácoras autorizadas del analista actual para el año especificado
        import datetime
        
        fecha_inicio = datetime.datetime(anio, 1, 1, 0, 0, 0)
        fecha_fin = datetime.datetime(anio, 12, 31, 23, 59, 59)
        
        bitacoras = Bitcoras_Cbap.objects.filter(
            fecha_autorizacion__gte=fecha_inicio,
            fecha_autorizacion__lte=fecha_fin,
            name_user_cbap=request.user,  # Filtrar por el usuario creador (analista)
            estado='autorizada',          # Filtrar solo bitácoras autorizadas
            fecha_autorizacion__isnull=False  # Asegurarse de que tienen fecha de autorización
        ).values('fecha_autorizacion')
        
        # Crear un conjunto para almacenar meses únicos
        meses = set()
        
        # Procesar cada fecha de autorización
        for bitacora in bitacoras:
            fecha = bitacora['fecha_autorizacion']
            if fecha:  # Verificar que la fecha no sea None
                mes = fecha.month
                meses.add(mes)
        
        # Convertir el conjunto a una lista ordenada
        meses_lista = sorted(list(meses))
        
        # Nombres de los meses
        nombres_meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        
        # Crear lista de meses con nombres
        meses_con_nombres = [{'numero': mes, 'nombre': nombres_meses[mes-1]} for mes in meses_lista]
        
        context = {
            'anio': anio,
            'meses': meses_con_nombres,
            'titulo': f'Bitácoras Autorizadas del {anio}',
        }
    
    except Exception as e:
        logger.error(f"Error al listar meses del año {anio}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
        # En caso de error, simplemente mostrar una lista vacía
        context = {
            'anio': anio,
            'meses': [],
            'titulo': f'Bitácoras Autorizadas del {anio}',
            'error': str(e)
        }
    
    # Siempre renderizar la plantilla, incluso en caso de error
    return render(request, 'lista_meses_bitacoras.html', context)
@login_required
@role_required('Analista de Laboratorio')
def lista_bitacoras_por_periodo(request, año, mes):
    """
    Vista para listar bitácoras autorizadas de un período específico (año/mes).
    """
    try:
        # Obtener el primer y último día del mes
        import datetime
        import calendar
        
        # Determinar el último día del mes
        ultimo_dia = calendar.monthrange(año, mes)[1]
        
        # Crear fechas de inicio y fin del período
        fecha_inicio = datetime.datetime(año, mes, 1, 0, 0, 0)
        fecha_fin = datetime.datetime(año, mes, ultimo_dia, 23, 59, 59)
        
        # Filtrar bitácoras autorizadas por el período y el analista actual
        bitacoras = Bitcoras_Cbap.objects.select_related(
            'nombre_bita_cbap', 'name_user_cbap'
        ).filter(
            fecha_autorizacion__gte=fecha_inicio,
            fecha_autorizacion__lte=fecha_fin,
            name_user_cbap=request.user,  # Filtrar por el usuario creador (analista)
            estado='autorizada'           # Filtrar solo bitácoras autorizadas
        ).order_by('-fecha_autorizacion')
        
        # Nombres de los meses
        nombres_meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        
        # Preparar el contexto
        context = {
            'bitacoras': bitacoras,
            'año': año,  # Asegurarse de que el año se pase al contexto
            'anio': año,  # También pasar como 'anio' para compatibilidad
            'mes': mes,
            'nombre_mes': nombres_meses[mes - 1],
            'cantidad': bitacoras.count(),
            'tipo': 'autorizada'  # Añadir tipo para diferenciar en la plantilla
        }
        
        return render(request, 'lista_bitacoras_autorizadas.html', context)
    
    except Exception as e:
        logger.error(f"Error al listar bitácoras autorizadas por período {año}/{mes}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        messages.error(request, f"Error al listar bitácoras autorizadas: {str(e)}")
        
        # Intentar renderizar la plantilla con un contexto vacío en lugar de redirigir
        nombres_meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        context = {
            'bitacoras': [],
            'año': año,
            'anio': año,  # También pasar como 'anio' para compatibilidad
            'mes': mes,
            'nombre_mes': nombres_meses[mes - 1] if mes >= 1 and mes <= 12 else '',
            'cantidad': 0,
            'tipo': 'autorizadas',
            'error': str(e)
        }
        return render(request, 'lista_bitacoras_autorizadas.html', context)
