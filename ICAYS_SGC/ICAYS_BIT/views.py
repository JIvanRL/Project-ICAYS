from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate
from login.views import role_required
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import reverse
from django.db import transaction
from django.http import JsonResponse
from .models import bita_cbap, Bitcoras_Cbap
from .forms import (
    DilucionesEmpleadasForm, DirectODilucionForm, DilucionForm,
    ControlCalidadForm, VerificacionBalanzaForm, DatosCampoCbapForm,
    ClaveMuestraCbapForm, ResultadoCbapForm
)
import logging
logger = logging.getLogger(__name__)


@login_required
def registrar_bitacora(request):
    logger.info(f"Iniciando registro de bitácora para usuario {request.user}")
    if request.method == 'POST':
        accion = request.POST.get('accion')  # Obtén la acción desde el formulario

        # Validar contraseña solo si la acción es "enviar"
        if accion == 'enviar':
            password = request.POST.get('password')
            user = authenticate(request, username=request.user.username, password=password)
            if user is None or not user.is_active:
                return JsonResponse({'success': False, 'message': "Contraseña incorrecta"}, status=403)

        try:
            with transaction.atomic():
                # === 1. CREAR DATOS CAMPO Y VERIFICACIÓN DE BALANZA ===
                datos_campo_data = {
                    'fecha_siembra_dc': request.POST.get('fecha_siembra'),
                    'hora_siembra_dc': request.POST.get('hora_siembra'),
                    'hora_incubacion_dc': request.POST.get('hora_incubacion'),
                    'procedimiento_dc': request.POST.get('procedimiento'),
                    'equipo_incubacion_dc': request.POST.get('equipo_incubacion'),
                }
                datos_campo_form = DatosCampoCbapForm(datos_campo_data)
                if not datos_campo_form.is_valid():
                    return JsonResponse({
                        'success': False,
                        'error': f"Error en formulario Datos de Campo: {datos_campo_form.errors.as_json()}"
                    }, status=400)
                datos_campo = datos_campo_form.save()

                # === 2. CREAR BITA_CBAP ===
                bita_cbap_instance = bita_cbap(
                    id_dc_cbap=datos_campo,
                    firma_user=request.user,
                    nombre_cbap=request.POST.get('nombre_cbap'),
                    pagina_cbap=request.POST.get('pagina_cbap'),
                    letra_analista_cbap=request.POST.get('letra_analista_cbap'),
                    mes_muestra_cbap=request.POST.get('mes_muestra_cbap'),
                    pagina_muestra_cbap=request.POST.get('pagina_muestra_cbap'),
                    pagina_fosfato_cbap=request.POST.get('pagina_fosfato_cbap'),
                    numero_fosfato_cbap=request.POST.get('numero_fosfato_cbap'),
                    pagina_agar_cbap=request.POST.get('pagina_agar_cbap'),
                    numero_agar_cbap=request.POST.get('numero_agar_cbap'),
                    fecha_lectura_cbap=request.POST.get('fecha_lectura_cbap'),
                    hora_lectura_cbap=request.POST.get('hora_lectura_cbap'),
                    observaciones_cbap=request.POST.get('observaciones_cbap'),
                )
                bita_cbap_instance.save()

                num_filas = int(request.POST.get('num_filas', 0))  # Número de filas dinámicas
                for i in range(num_filas):
                    # Verificar si la fila tiene datos antes de procesarla
                    if request.POST.get(f'clave_c_m_{i}') or request.POST.get(f'cantidad_c_m_{i}') or request.POST.get(f'dE_1_{i}') or request.POST.get(f'dE_2_{i}') or request.POST.get(f'dE_3_{i}') or request.POST.get(f'dE_4_{i}') or request.POST.get(f'placa_dD_{i}') or request.POST.get(f'placa_dD2_{i}') or request.POST.get(f'promedio_dD_{i}') or request.POST.get(f'placa_d_{i}') or request.POST.get(f'placa_d2_{i}') or request.POST.get(f'promedio_d_{i}') or request.POST.get(f'placa_d_2_{i}') or request.POST.get(f'placa_d2_2_{i}') or request.POST.get(f'promedio_d_2_{i}') or request.POST.get(f'resultado_r_{i}') or request.POST.get(f'ufC_placa_r_{i}') or request.POST.get(f'diferencia_r_{i}'):
                        # Procesar cada fila
                        clave_c_m = float(request.POST.get(f'clave_c_m_{i}', '0'))
                        cantidad_c_m = float(request.POST.get(f'cantidad_c_m_{i}', '0'))
                        dE_1 = float(request.POST.get(f'dE_1_{i}', '0'))  # Convertir a float
                        dE_2 = float(request.POST.get(f'dE_2_{i}', '0'))
                        dE_3 = float(request.POST.get(f'dE_3_{i}', '0'))
                        dE_4 = float(request.POST.get(f'dE_4_{i}', '0'))
                        placa_dD = float(request.POST.get(f'placa_dD_{i}', '0'))
                        placa_dD2 = float(request.POST.get(f'placa_dD2_{i}', '0'))
                        promedio_dD = float(request.POST.get(f'promedio_dD_{i}', '0'))
                        placa_d = float(request.POST.get(f'placa_d_{i}', '0'))
                        placa_d2 = float(request.POST.get(f'placa_d2_{i}', '0'))
                        promedio_d = float(request.POST.get(f'promedio_d_{i}', '0'))
                        placa_d_2 = float(request.POST.get(f'placa_d_2_{i}', '0'))
                        placa_d2_2 = float(request.POST.get(f'placa_d2_2_{i}', '0'))
                        promedio_d_2 = float(request.POST.get(f'promedio_d_2_{i}', '0'))
                        resultado_r = float(request.POST.get(f'resultado_r_{i}', '0'))
                        ufC_placa_r = float(request.POST.get(f'ufC_placa_r_{i}', '0'))
                        diferencia_r = float(request.POST.get(f'diferencia_r_{i}', '0'))

                        # === 4.1. CREAR CLAVE MUESTRA ===
                        clave_muestra_data = {
                            'clave_c_m': clave_c_m,
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
                    control_calidad_data = {
                        'nombre_laf': request.POST.get(f'nombre_laf_{i}'),
                        'fecha_1cc': request.POST.get(f'fecha_1cc_{i}'),
                        'page_1cc': request.POST.get(f'page_1cc_{i}'),
                        'id_cbap_cc': bita_cbap_instance,
                    }
                    control_calidad_form = ControlCalidadForm(control_calidad_data)
                    if not control_calidad_form.is_valid():
                        return JsonResponse({
                            'success': False,
                            'error': f"Error en formulario Control de Calidad {i}: {control_calidad_form.errors.as_json()}"
                        }, status=400)
                    control_calidad = control_calidad_form.save(commit=False)
                    control_calidad.id_cbap_cc = bita_cbap_instance
                    control_calidad.save()

                # === 6. CREAR VERIFICACIÓN DE BALANZA ===
                for i in range(1, 3):
                    veri_balanza_data = {
                        'hora_vb': request.POST.get(f'hora_vb_{i}'),
                        'actividad_vb': request.POST.get(f'actividad_vb_{i}'),
                        'ajuste_vb': request.POST.get(f'ajuste_vb_{i}'),
                        'valor_nominal_vb': request.POST.get(f'valor_nominal_vb_{i}'),
                        'valor_convencional_vb': request.POST.get(f'valor_convencional_vb_{i}'),
                        'valo_masa_vb': request.POST.get(f'valo_masa_vb_{i}'),
                        'diferecnia_vb': request.POST.get(f'diferecnia_vb_{i}'),
                        'incertidumbre_vb': request.POST.get(f'incertidumbre_vb_{i}'),
                        'emt_vb': request.POST.get(f'emt_vb_{i}'),
                        'aceptacion_vb': request.POST.get(f'aceptacion_vb_{i}'),
                        'valor_pesado_muestra_vb': request.POST.get(f'valor_pesado_muestra_vb_{i}'),
                        'id_cbap_vb': bita_cbap_instance,
                    }
                    veri_balanza_form = VerificacionBalanzaForm(veri_balanza_data)
                    if not veri_balanza_form.is_valid():
                        return JsonResponse({
                            'success': False,
                            'error': f"Error en formulario Verificación Balanza {i}: {veri_balanza_form.errors.as_json()}"
                        }, status=400)
                    veri_balanza = veri_balanza_form.save(commit=False)
                    veri_balanza.id_cbap_vb = bita_cbap_instance
                    veri_balanza.save()

                # Establecer el estado de la bitácora
                bita_cbap_instance.estado = 'guardada' if accion == 'guardar' else 'enviada'
                bita_cbap_instance.save()

                # Si la acción es guardar, crear registro en Bitcoras_Cbap
                if accion == 'guardar':
                    Bitcoras_Cbap.objects.create(
                        name_user_cbap=request.user,
                        nombre_bita_cbap=bita_cbap_instance
                    )

                return JsonResponse({
                    'success': True,
                    'message': f"Bitácora {'guardada' if accion == 'guardar' else 'enviada'} correctamente",
                    'redirect_url': reverse('microalimentos:registrar_bitacora') if accion == 'guardar' else reverse('datalles_bitacora')
                })

        except Exception as e:
            # Error en el servidor
            return JsonResponse({
                'success': False,
                'error': f"Error al {'enviar' if accion == 'enviar' else 'guardar'} la bitácora: {str(e)}"
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
        }
        return render(request, 'registerBita.html', context)


from django.shortcuts import render
from .models import Bitcoras_Cbap

@login_required
@role_required('Analista')
def ListaBita(request):
    bitacoras = Bitcoras_Cbap.objects.select_related('nombre_bita_cbap').all().order_by('-fecha_bita_cbap')
    return render(request, 'lista_bitacoras.html', {
        'bitacoras': bitacoras
    })
@login_required
@role_required('Analista')
def ver_bitacora(request, bitacora_id):
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
        }

        return render(request, 'detalles_bitacoras.html', context)
    
    except bita_cbap.DoesNotExist:
        messages.error(request, 'La bitácora no existe.')
        return redirect('microalimentos:lista_bitacoras')

def contar_bitacoras(request):
    cantidad = Bitcoras_Cbap.objects.filter(
        name_user_cbap=request.user,
        nombre_bita_cbap__estado='guardada'
    ).count()
    
    return JsonResponse({'cantidad': cantidad})


@login_required
@role_required('Analista')
def vistaAnalista(request):
    # Obtener el conteo de bitácoras guardadas para el usuario actual
    cantidad_bitacoras = Bitcoras_Cbap.objects.filter(
        name_user_cbap=request.user,
        nombre_bita_cbap__estado='guardada'
    ).count()

    return render(request, 'microbiologyll.html', {
        'cantidad_bitacoras': cantidad_bitacoras
    })

@login_required
@role_required('Analista')
def bitacoras(request):
  return render(request, 'typeBitacoras.html')

@login_required
@role_required('Analista')
def analiticas(request):
  return render(request, 'VistaAnaliticas.html')

@login_required
@role_required('Analista')
def paginasNo(request):
  return render(request, 'trabajando.html')

@login_required
@role_required('Analista')
def cuentademohosylevaduras(request):
  return render(request, 'FP133.html')

def registerNewBita(request):
  return render(request, 'registerBita.html')
  