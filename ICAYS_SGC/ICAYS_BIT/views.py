from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate
from login.views import role_required
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import reverse
from django.db import transaction
from django.http import JsonResponse
from .forms import (
    DilucionesEmpleadasForm, DirectODilucionForm, DilucionForm,
    ControlCalidadForm, VerificacionBalanzaForm, DatosCampoCbapForm,
    ClaveMuestraCbapForm, ResultadoCbapForm
)

from django.db import transaction
from .models import bita_cbap, Bitcoras_Cbap
@login_required
@role_required('Analista')
def registrar_bitacora(request):
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
                    return JsonResponse({'success': False, 'error': f"Error en formulario Datos de Campo: {datos_campo_form.errors.as_json()}"}, status=400)
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
                

                # === 3. PROCESAR FILAS DINÁMICAS ===
                claves_c_m = request.POST.getlist('clave_c_m[]')
                cantidades_c_m = request.POST.getlist('cantidad_c_m[]')
                de_1_list = request.POST.getlist('dE_1[]')
                de_2_list = request.POST.getlist('dE_2[]')
                de_3_list = request.POST.getlist('dE_3[]')
                de_4_list = request.POST.getlist('dE_4[]')
                placa_dD_list = request.POST.getlist('placa_dD[]')
                placa_dD2_list = request.POST.getlist('placa_dD2[]')
                promedio_dD_list = request.POST.getlist('promedio_dD[]')
                placa_d_list = request.POST.getlist('placa_d[]')
                placa_d2_list = request.POST.getlist('placa_d2[]')
                promedio_d_list = request.POST.getlist('promedio_d[]')
                placa_d_2_list = request.POST.getlist('placa_d_2[]')
                placa_d2_2_list = request.POST.getlist('placa_d2_2[]')
                promedio_d_2_list = request.POST.getlist('promedio_d_2[]')
                resultado_r_list = request.POST.getlist('resultado_r[]')
                ufC_placa_r_list = request.POST.getlist('ufC_placa_r[]')
                diferencia_r_list = request.POST.getlist('diferencia_r[]')

                # === 5. PROCESAR CADA FILA ===
                # === 4.1. CREAR CLAVE MUESTRA ===
                clave_muestra_list = []
                for i in range(len(claves_c_m)):
                    clave_muestra_data = {
                        'clave_c_m': claves_c_m[i],
                        'cantidad_c_m': cantidades_c_m[i],
                        'id_cbap_c_m': bita_cbap_instance,
                    }
                    clave_muestra_form = ClaveMuestraCbapForm(clave_muestra_data)
                    if not clave_muestra_form.is_valid():
                        return JsonResponse({'success': False, 'error': f"Error en formulario Clave Muestra {i+1}: {clave_muestra_form.errors.as_json()}"}, status=400)
                    clave_muestra = clave_muestra_form.save(commit=False)
                    clave_muestra_list.append(clave_muestra)

                # Guardar los registros de Clave Muestra
                for clave_muestra in clave_muestra_list:
                    clave_muestra.id_cbap_c_m = bita_cbap_instance
                    clave_muestra.save()

                # === 5.2. CREAR DILUCIONES EMPLEADAS ===
                diluciones_list = []
                for i in range(len(de_1_list)):
                    diluciones_data = {
                        'dE_1': de_1_list[i],
                        'dE_2': de_2_list[i] if i < len(de_2_list) else False,
                        'dE_3': de_3_list[i] if i < len(de_3_list) else False,
                        'dE_4': de_4_list[i] if i < len(de_4_list) else False,
                        'id_cbap_dE': bita_cbap_instance,
                    }
                    diluciones_form = DilucionesEmpleadasForm(diluciones_data)
                    if not diluciones_form.is_valid():
                        return JsonResponse({'success': False, 'error': f"Error en formulario Diluciones Empleadas {i+1}: {diluciones_form.errors.as_json()}"}, status=400)
                    diluciones = diluciones_form.save(commit=False)
                    diluciones_list.append(diluciones)

                # Guardar los registros de DilucionesEmpleadas
                for diluciones in diluciones_list:
                    diluciones.id_cbap_dE = bita_cbap_instance
                    diluciones.save()

                # === 6.3. CREAR DIRECT O DILUCIÓN ===
                direct_o_dilucion_list = []
                for i in range(len(placa_dD_list)):
                    direct_o_dilucion_data = {
                        'placa_dD': placa_dD_list[i],
                        'placa_dD2': placa_dD2_list[i] if i < len(placa_dD2_list) else '',
                        'promedio_dD': promedio_dD_list[i] if i < len(promedio_dD_list) else '',
                        'id_cbap_dD': bita_cbap_instance,
                    }
                    direct_o_dilucion_form = DirectODilucionForm(direct_o_dilucion_data)
                    if not direct_o_dilucion_form.is_valid():
                        return JsonResponse({'success': False, 'error': f"Error en formulario Directo o Dilución {i+1}: {direct_o_dilucion_form.errors.as_json()}"}, status=400)
                    direct_o_dilucion = direct_o_dilucion_form.save(commit=False)
                    direct_o_dilucion_list.append(direct_o_dilucion)

                # Guardar los registros de Direct O Dilucion
                for direct_o_dilucion in direct_o_dilucion_list:
                    direct_o_dilucion.id_cbap_dD = bita_cbap_instance
                    direct_o_dilucion.save()

                # === 7. CREAR DILUCIÓN ===
                dilucion_list = []
                for i in range(len(placa_d_list)):
                    dilucion_data = {
                        'placa_d': placa_d_list[i],
                        'placa_d2': placa_d2_list[i] if i < len(placa_d2_list) else '',
                        'promedio_d': promedio_d_list[i] if i < len(promedio_d_list) else '',
                        'placa_d_2': placa_d_2_list[i] if i < len(placa_d_2_list) else '',
                        'placa_d2_2': placa_d2_2_list[i] if i < len(placa_d2_2_list) else '',
                        'promedio_d_2': promedio_d_2_list[i] if i < len(promedio_d_2_list) else '',
                        'id_cbap_d': bita_cbap_instance,
                    }
                    dilucion_form = DilucionForm(dilucion_data)
                    if not dilucion_form.is_valid():
                        return JsonResponse({'success': False, 'error': f"Error en formulario Dilución {i+1}: {dilucion_form.errors.as_json()}"}, status=400)
                    dilucion = dilucion_form.save(commit=False)
                    dilucion_list.append(dilucion)

                # Guardar los registros de Dilucion
                for dilucion in dilucion_list:
                    dilucion.id_cbap_d = bita_cbap_instance
                    dilucion.save()

                # === 8. CREAR CONTROL DE CALIDAD ===
                calidad_list = []
                for i in range(1, 5):
                    control_calidad_data = {
                        'nombre_laf': request.POST.get(f'nombre_laf_{i}'),
                        'fecha_1cc': request.POST.get(f'fecha_1cc_{i}'),
                        'page_1cc': request.POST.get(f'page_1cc_{i}'),
                        'id_cbap_cc': bita_cbap_instance,
                    }
                    control_calidad_form = ControlCalidadForm(control_calidad_data)
                    if not control_calidad_form.is_valid():
                        return JsonResponse({'success': False, 'error': f"Error en formulario Control de Calidad {i}: {control_calidad_form.errors.as_json()}"}, status=400)
                    control_calidad = control_calidad_form.save(commit=False)
                    calidad_list.append(control_calidad)
                
                # Guardar los registros de ControlCalidad
                for control_calidad in calidad_list:
                    control_calidad.id_cbap_cc = bita_cbap_instance
                    control_calidad.save()
                # === 9. CREAR VERIFICACIÓN DE BALANZA ===
                veri_balanza_list = []
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
                        return JsonResponse({'success': False, 'error': f"Error en formulario Verificación Balanza {i}: {veri_balanza_form.errors.as_json()}"}, status=400)
                    veri_balanza = veri_balanza_form.save(commit=False)
                    veri_balanza_list.append(veri_balanza)
                    #Guardar los registros de verificacion de balanza
                for veri_balanza in veri_balanza_list:
                    veri_balanza.id_cbap_vb = bita_cbap_instance
                    veri_balanza.save()
                # === 10. CREAR RESULTADOS ===
                resultado_list = []
                for i in range(len(resultado_r_list)):
                    resultado_data = {
                        'resultado_r': resultado_r_list[i],
                        'ufC_placa_r': ufC_placa_r_list[i],
                        'diferencia_r': diferencia_r_list[i],
                        'id_cbap_r': bita_cbap_instance,
                    }
                    resultado_form = ResultadoCbapForm(resultado_data)
                    if not resultado_form.is_valid():
                        return JsonResponse({'success': False, 'error': f"Error en formulario Resultado {i+1}: {resultado_form.errors.as_json()}"}, status=400)
                    resultado = resultado_form.save(commit=False)
                    resultado_list.append(resultado)

                # Guardar los registros de Resultados
                for resultado in resultado_list:
                    resultado.id_cbap_r = bita_cbap_instance
                    resultado.save()
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

                # Éxito
                #return JsonResponse({'success': True, 'message': f"Bitácora {'enviada' if accion == 'enviar' else 'guardada'} correctamente."})

        except Exception as e:
            # Error en el servidor
            return JsonResponse({'success': False, 'error': f"Error al {'enviar' if accion == 'enviar' else 'guardar'} la bitácora: "}, status=500)

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
        # Obtener la bitácora con todas sus relaciones usando select_related y prefetch_related
        bitacora = bita_cbap.objects.select_related(
            'id_dc_cbap',          # DatosCampoCbap
            'firma_user'          # CustomUser         
        ).prefetch_related(
            'dilucion_empleadas',  # DilucionesEmpleadas
            'dilucion_directa',    # Direct_o_Dilucion
            'dilucion',            # Dilucion
            'control_calidades',    # ControlCalidad
            'ClaveMuestra',        # ClaveMuestraCbap
            'verificaciones_balanza',    # VerificacionBalanza
            'resultado'            # Resultado
        ).get(id_cbap=bitacora_id)

        context = {
            'bitacora': bitacora,
            # Puedes acceder directamente a las relaciones
            'diluciones_empleadas': bitacora.dilucion_empleadas.all(),
            'diluciones_directas': bitacora.dilucion_directa.all(),
            'diluciones': bitacora.dilucion.all(),
            'controles_calidad': bitacora.control_calidades.all(),
            'verificaciones_balanza': bitacora.verificaciones_balanza.all(),
            'claves_muestra': bitacora.ClaveMuestra.all(),
            'resultados': bitacora.resultado.all(),
            # Datos de las relaciones one-to-one o foreign key
            'datos_campo': bitacora.id_dc_cbap,
            'usuario': bitacora.firma_user
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
  